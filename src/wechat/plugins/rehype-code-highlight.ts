import type { Plugin } from 'unified';
import type { Root, Element, Text, ElementContent } from 'hast';
import { visit } from 'unist-util-visit';
import rehypeHighlight from 'rehype-highlight';

function isElement(node: any): node is Element {
    return node && node.type === 'element';
}

function isText(node: any): node is Text {
    return node && node.type === 'text';
}

/**
 * Protect whitespace in code blocks for WeChat MP editor.
 * - Replace \n with <br> elements
 * - Replace \t with two NBSP
 * - Replace leading spaces with NBSP
 */
function protectWhitespace(children: ElementContent[]): ElementContent[] {
    const result: ElementContent[] = [];

    for (const child of children) {
        if (isText(child)) {
            const parts = child.value.split('\n');
            for (let i = 0; i < parts.length; i++) {
                if (i > 0) {
                    result.push({ type: 'element', tagName: 'br', properties: {}, children: [] });
                }
                let text = parts[i];
                // Replace tabs with two NBSP
                text = text.replace(/\t/g, '\u00A0\u00A0');
                // Replace leading spaces with NBSP
                text = text.replace(/^( +)/, (match) => '\u00A0'.repeat(match.length));
                if (text) {
                    result.push({ type: 'text', value: text });
                }
            }
        } else if (isElement(child) && child.tagName === 'span') {
            // Recurse into span elements (hljs generates nested spans)
            result.push({
                ...child,
                children: protectWhitespace(child.children),
            });
        } else {
            result.push(child);
        }
    }

    return result;
}

/**
 * Rehype plugin: syntax highlighting + whitespace protection for code blocks.
 *
 * 1. Applies rehype-highlight for syntax highlighting (detect: false)
 * 2. Traverses <pre><code> structures to protect whitespace
 */
export const rehypeCodeHighlight: Plugin<[], Root> = () => {
    // Create the highlight transformer
    const highlightPlugin = (rehypeHighlight as any)({ detect: false });

    return (tree: Root) => {
        // Step 1: Apply syntax highlighting
        highlightPlugin(tree);

        // Step 2: Protect whitespace in code blocks
        visit(tree, 'element', (node: Element) => {
            if (node.tagName !== 'pre') return;

            // Find the <code> child
            const codeChild = node.children.find(
                (c): c is Element => isElement(c) && c.tagName === 'code',
            );
            if (!codeChild) return;

            // Protect whitespace in the code element's children
            codeChild.children = protectWhitespace(codeChild.children);
        });
    };
};
