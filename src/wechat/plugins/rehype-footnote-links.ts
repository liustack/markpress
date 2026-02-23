import type { Plugin } from 'unified';
import type { Root, Element, ElementContent } from 'hast';
import { visit, SKIP } from 'unist-util-visit';

/**
 * Check if a link is internal (should be preserved as <a>).
 * Internal: anchor (#), relative (./  ../  /), or mp.weixin.qq.com domain.
 */
function isInternalLink(href: string): boolean {
    if (href.startsWith('//')) {
        return false;
    }
    if (href.startsWith('#') || href.startsWith('/') || href.startsWith('./') || href.startsWith('../')) {
        return true;
    }
    try {
        const url = new URL(href);
        if (url.hostname === 'mp.weixin.qq.com' || url.hostname.endsWith('.mp.weixin.qq.com')) {
            return true;
        }
    } catch {
        // Not a valid URL, treat as internal
        return true;
    }
    return false;
}

/**
 * Rehype plugin: convert external links to footnote references.
 *
 * - External <a> tags → link text + <sup>[N]</sup>
 * - Duplicate URLs share the same footnote number
 * - mp.weixin.qq.com links are preserved as <a>
 * - Anchor and relative links are preserved as <a>
 * - Appends a References section at the end of the document
 */
export const rehypeFootnoteLinks: Plugin<[], Root> = () => {
    return (tree: Root) => {
        const urlMap = new Map<string, number>();
        const footnotes: Array<{ index: number; url: string; text: string }> = [];
        let counter = 0;

        // Pass 1: replace external links with text + sup
        visit(tree, 'element', (node: Element, index, parent) => {
            if (node.tagName !== 'a' || index === undefined || !parent) return;

            const href = node.properties?.href;
            if (typeof href !== 'string') return;

            if (isInternalLink(href)) return;

            // Get or assign footnote number
            let num = urlMap.get(href);
            if (num === undefined) {
                counter++;
                num = counter;
                urlMap.set(href, num);

                // Extract link text for the reference list
                const text = extractText(node);
                footnotes.push({ index: num, url: href, text });
            }

            // Replace <a> with children + <sup>[N]</sup>
            const replacement: ElementContent[] = [
                ...node.children,
                {
                    type: 'element',
                    tagName: 'sup',
                    properties: {},
                    children: [{ type: 'text', value: `[${num}]` }],
                },
            ];

            parent.children.splice(index, 1, ...replacement);
            return [SKIP, index + replacement.length];
        });

        // Pass 2: append References section if there are footnotes
        if (footnotes.length > 0) {
            const referencesSection: Element = {
                type: 'element',
                tagName: 'section',
                properties: {},
                children: [
                    { type: 'element', tagName: 'hr', properties: {}, children: [] },
                    {
                        type: 'element',
                        tagName: 'p',
                        properties: {},
                        children: [
                            {
                                type: 'element',
                                tagName: 'strong',
                                properties: {},
                                children: [{ type: 'text', value: 'References' }],
                            },
                        ],
                    },
                    ...footnotes.map(
                        (fn): Element => ({
                            type: 'element',
                            tagName: 'p',
                            properties: {},
                            children: [
                                { type: 'text', value: `[${fn.index}] ${fn.text}: ${fn.url}` },
                            ],
                        }),
                    ),
                ],
            };

            tree.children.push(referencesSection);
        }
    };
};

/** Recursively extract text content from a node. */
function extractText(node: Element): string {
    let text = '';
    for (const child of node.children) {
        if (child.type === 'text') {
            text += child.value;
        } else if (child.type === 'element') {
            text += extractText(child);
        }
    }
    return text;
}
