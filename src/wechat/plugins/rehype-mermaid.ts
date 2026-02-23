import type { Plugin } from 'unified';
import type { Root, Element } from 'hast';
import { visit } from 'unist-util-visit';

interface MermaidOptions {
    /** Device scale factor for PNG quality. Default: 2 */
    scale?: number;
    /** Background color. Default: 'white' */
    backgroundColor?: string;
}

// Apple-style gray theme — borderless, soft fills
const MERMAID_THEME = {
    primaryColor: '#f6f8fa',
    primaryTextColor: '#1d1d1f',
    primaryBorderColor: '#e5e5ea',
    lineColor: '#86868b',
    secondaryColor: '#f6f8fa',
    tertiaryColor: '#ffffff',
    background: '#ffffff',
    mainBkg: '#f6f8fa',
    nodeBorder: '#e5e5ea',
    nodeTextColor: '#1d1d1f',
    clusterBkg: '#f6f8fa',
    clusterBorder: '#e5e5ea',
    titleColor: '#1d1d1f',
    edgeLabelBackground: '#f6f8fa',
    noteBorderColor: '#e5e5ea',
    noteBkgColor: '#f6f8fa',
};

// pagepress flowchart config (spacing, curves, padding)
const FLOWCHART_CONFIG = {
    curve: 'basis',
    nodeSpacing: 40,
    rankSpacing: 50,
    htmlLabels: true,
    useMaxWidth: true,
    subGraphTitleMargin: { top: 15, bottom: 15 },
    padding: 20,
};

function collectMermaidBlocks(tree: Root) {
    const tasks: Array<{ node: Element; parent: Element | Root; index: number; definition: string }> = [];
    visit(tree, 'element', (node: Element, index, parent) => {
        if (node.tagName !== 'pre' || !parent || index === undefined) return;
        const codeChild = node.children.find(
            (c): c is Element => c.type === 'element' && c.tagName === 'code',
        );
        if (!codeChild) return;
        const classes = Array.isArray(codeChild.properties?.className)
            ? codeChild.properties.className
            : [];
        if (!classes.includes('language-mermaid')) return;
        const text = codeChild.children
            .filter((c): c is { type: 'text'; value: string } => c.type === 'text')
            .map((c) => c.value)
            .join('');
        if (text.trim()) {
            tasks.push({ node, parent: parent as Element, index, definition: text.trim() });
        }
    });
    return tasks;
}

/**
 * Rehype plugin: render mermaid code blocks to PNG images via Playwright.
 *
 * Uses the same approach as pagepress: inject mermaid.min.js into a Playwright
 * Chromium page, render with Apple-style theme, post-process SVG (rounded corners),
 * and screenshot to 2x PNG.
 *
 * Dependencies (mermaid + playwright) are optional and loaded dynamically.
 * When no mermaid blocks are detected, there is zero overhead.
 */
export const rehypeMermaid: Plugin<[MermaidOptions?], Root> = (options = {}) => {
    const { scale = 2, backgroundColor = 'white' } = options;

    return async (tree: Root) => {
        // 1. Collect mermaid code blocks
        const tasks = collectMermaidBlocks(tree);
        if (tasks.length === 0) return; // zero-overhead fast path

        // 2. Dynamic import (optional dependencies)
        let chromium: any;
        let mermaidPath: string;
        try {
            const pw = await import('playwright');
            chromium = pw.chromium;
            const { createRequire } = await import('module');
            const req = createRequire(import.meta.url);
            mermaidPath = req.resolve('mermaid/dist/mermaid.min.js');
        } catch {
            throw new Error(
                'Mermaid diagrams detected but required dependencies are missing.\n' +
                    'Run: npm install mermaid playwright && npx playwright install chromium',
            );
        }

        // 3. Launch Chromium with 2x device scale for Retina-quality output
        const browser = await chromium.launch();
        try {
            const context = await browser.newContext({
                deviceScaleFactor: scale,
                viewport: { width: 800, height: 600 },
            });
            const page = await context.newPage();

            // 4. Inject mermaid.js + initialize (matches pagepress renderer.ts:196-281)
            await page.setContent('<html><body></body></html>');
            await page.addScriptTag({ path: mermaidPath });
            await page.evaluate(
                ({
                    theme,
                    flowchart,
                }: {
                    theme: typeof MERMAID_THEME;
                    flowchart: typeof FLOWCHART_CONFIG;
                }) => {
                    (window as any).mermaid.initialize({
                        startOnLoad: false,
                        theme: 'base',
                        themeVariables: {
                            ...theme,
                            fontFamily:
                                '-apple-system, BlinkMacSystemFont, "PingFang SC", "Hiragino Sans GB", sans-serif',
                            fontSize: '14px',
                        },
                        flowchart,
                    });
                },
                { theme: MERMAID_THEME, flowchart: FLOWCHART_CONFIG },
            );

            // 5. Render each diagram → post-process SVG → screenshot to PNG
            for (const task of tasks) {
                // Create container
                await page.evaluate((def: string) => {
                    const container = document.createElement('div');
                    container.className = 'mermaid';
                    container.textContent = def;
                    container.id = 'mermaid-target';
                    document.body.innerHTML = '';
                    document.body.appendChild(container);
                }, task.definition);

                // Render
                await page.evaluate(() => (window as any).mermaid.run());
                await page.waitForSelector('#mermaid-target svg', { timeout: 10000 });
                await page.waitForTimeout(300);

                // SVG post-processing: rounded corners + label spacing
                await page.evaluate(() => {
                    // Node: rounded corners 12px
                    document.querySelectorAll('.node rect').forEach((el) => {
                        el.setAttribute('rx', '12');
                        el.setAttribute('ry', '12');
                    });
                    // Cluster: rounded corners 12px
                    document.querySelectorAll('.cluster rect').forEach((el) => {
                        el.setAttribute('rx', '12');
                        el.setAttribute('ry', '12');
                    });
                    // Edge labels: rounded corners on SVG rect + padding on HTML labelBkg
                    document.querySelectorAll('.edgeLabel rect').forEach((el) => {
                        el.setAttribute('rx', '6');
                        el.setAttribute('ry', '6');
                    });
                    document.querySelectorAll('.labelBkg').forEach((el) => {
                        const div = el as HTMLElement;
                        div.style.padding = '2px 8px';
                        div.style.borderRadius = '6px';
                        div.style.backgroundColor = '#f6f8fa';
                    });
                    // Expand foreignObject to fit padded labels (skip empty ones)
                    document.querySelectorAll('.edgeLabel foreignObject').forEach((fo) => {
                        const w = parseFloat(fo.getAttribute('width') || '0');
                        const h = parseFloat(fo.getAttribute('height') || '0');
                        if (w === 0 || h === 0) return; // skip empty edge labels
                        const px = 20, py = 8;
                        fo.setAttribute('width', String(w + px));
                        fo.setAttribute('height', String(h + py));
                        const label = fo.closest('.edgeLabel');
                        if (label) {
                            const g = label.querySelector('g.label');
                            if (g) {
                                const transform = g.getAttribute('transform');
                                if (transform) {
                                    const match = transform.match(/translate\(([-\d.]+),\s*([-\d.]+)\)/);
                                    if (match) {
                                        const x = parseFloat(match[1]) - px / 2;
                                        const y = parseFloat(match[2]) - py / 2;
                                        g.setAttribute('transform', `translate(${x}, ${y})`);
                                    }
                                }
                            }
                        }
                    });
                    // Cluster label shift down 8px
                    document.querySelectorAll('.cluster-label').forEach((label) => {
                        const transform = label.getAttribute('transform');
                        if (transform) {
                            const match = transform.match(
                                /translate\(([\d.]+),\s*([\d.]+)\)/,
                            );
                            if (match) {
                                const x = parseFloat(match[1]);
                                const y = parseFloat(match[2]) + 8;
                                label.setAttribute(
                                    'transform',
                                    `translate(${x}, ${y})`,
                                );
                            }
                        }
                    });
                });

                // Get SVG CSS dimensions before screenshot
                const svgLocator = page.locator('#mermaid-target svg');
                const cssBox = await svgLocator.boundingBox();
                const cssWidth = cssBox ? Math.ceil(cssBox.width) : undefined;

                // Screenshot to PNG (2x resolution via device scale)
                const pngBuffer = await svgLocator.screenshot({
                    type: 'png',
                    scale: 'device',
                    omitBackground: backgroundColor === 'transparent',
                });
                const base64 = Buffer.from(pngBuffer).toString('base64');

                // 6. Replace <pre> with <img>
                // Set width to SVG's CSS width so 2x PNG displays at correct size
                const parentChildren =
                    (task.parent as any).children || (task.parent as Root).children;
                parentChildren[task.index] = {
                    type: 'element',
                    tagName: 'img',
                    properties: {
                        src: `data:image/png;base64,${base64}`,
                        alt: 'mermaid diagram',
                        ...(cssWidth ? { width: String(cssWidth) } : {}),
                        style: 'max-width: 100%; height: auto; display: block; margin: 1.5em auto;',
                    },
                    children: [],
                } as Element;
            }
        } finally {
            await browser.close();
        }
    };
};
