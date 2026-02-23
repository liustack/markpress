import type { Plugin } from 'unified';
import type { Root, Element, ElementContent } from 'hast';
import { visit, SKIP } from 'unist-util-visit';

type LinkType = 'wechat' | 'anchor' | 'external';

/**
 * Classify a link by type.
 * - wechat: mp.weixin.qq.com → preserve as <a>
 * - anchor: # / relative → strip <a> tag, keep text (WeChat doesn't support anchors)
 * - external: http(s) → convert to footnote reference
 */
function classifyLink(href: string): LinkType {
    if (href.startsWith('//')) {
        return 'external';
    }
    if (href.startsWith('#') || href.startsWith('/') || href.startsWith('./') || href.startsWith('../')) {
        return 'anchor';
    }
    try {
        const url = new URL(href);
        if (url.hostname === 'mp.weixin.qq.com' || url.hostname.endsWith('.mp.weixin.qq.com')) {
            return 'wechat';
        }
    } catch {
        return 'anchor';
    }
    return 'external';
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

        // Pass 1: process all <a> tags based on link type
        visit(tree, 'element', (node: Element, index, parent) => {
            if (node.tagName !== 'a' || index === undefined || !parent) return;

            const href = node.properties?.href;
            if (typeof href !== 'string') return;

            const linkType = classifyLink(href);

            // WeChat links: preserve as <a>
            if (linkType === 'wechat') return;

            // Anchor links: strip <a> tag, keep children text only
            if (linkType === 'anchor') {
                parent.children.splice(index, 1, ...node.children);
                return [SKIP, index + node.children.length];
            }

            // External links: convert to footnote reference
            let num = urlMap.get(href);
            if (num === undefined) {
                counter++;
                num = counter;
                urlMap.set(href, num);

                const text = extractText(node);
                footnotes.push({ index: num, url: href, text });
            }

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

        // Pass 2: append footnote list if there are footnotes
        if (footnotes.length > 0) {
            // Build footnote lines separated by <br> inside a single <section>
            const footnoteChildren: ElementContent[] = [];
            for (let i = 0; i < footnotes.length; i++) {
                if (i > 0) {
                    footnoteChildren.push({ type: 'element', tagName: 'br', properties: {}, children: [] });
                }
                const fn = footnotes[i];
                footnoteChildren.push({ type: 'text', value: `[${fn.index}] ${fn.text}: ${fn.url}` });
            }

            const referencesSection: Element = {
                type: 'element',
                tagName: 'section',
                properties: { style: 'color: #86868b; font-size: 13px; line-height: 1.75; margin-top: 2em; word-break: break-all;' },
                children: [
                    {
                        type: 'element',
                        tagName: 'strong',
                        properties: { style: 'color: #86868b;' },
                        children: [{ type: 'text', value: 'References:' }],
                    },
                    { type: 'element', tagName: 'br', properties: {}, children: [] },
                    ...footnoteChildren,
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
