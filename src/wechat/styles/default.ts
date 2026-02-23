/**
 * Default style map for WeChat MP editor inline styles.
 * Apple-inspired minimalist design adapted from pagepress default template.
 *
 * Keys: tag names, compound selectors ("pre code"), or hljs class names ("hljs-keyword").
 * Values: CSS property strings to inject as inline styles.
 */

export type StyleMap = Record<string, string>;

export const defaultStyles: StyleMap = {
    // Headings — Apple style: 600 weight, tight letter-spacing
    h1: 'font-size: 24px; font-weight: 600; margin: 0 0 16px; line-height: 1.2; letter-spacing: -0.02em; color: #1d1d1f;',
    h2: 'font-size: 20px; font-weight: 600; margin: 32px 0 12px; line-height: 1.25; color: #1d1d1f;',
    h3: 'font-size: 17px; font-weight: 600; margin: 24px 0 8px; line-height: 1.3; color: #1d1d1f;',
    h4: 'font-size: 15px; font-weight: 600; margin: 20px 0 6px; line-height: 1.4; color: #6e6e73;',
    h5: 'font-size: 14px; font-weight: 600; margin: 16px 0 4px; line-height: 1.4; color: #6e6e73;',
    h6: 'font-size: 13px; font-weight: 600; margin: 16px 0 4px; line-height: 1.4; color: #86868b;',

    // Paragraphs — 15px body, 1.75 line-height (comfortable for Chinese)
    p: 'font-size: 15px; line-height: 1.75; margin: 0 0 1.25em; color: #1d1d1f;',

    // Blockquote — restrained: left border + italic only, no background
    blockquote: 'margin: 1.5em 0; padding: 0 0 0 1em; border-left: 3px solid #d2d2d7; color: #6e6e73; font-style: italic;',

    // Inline code — subtle gray background
    code: 'font-size: 0.875em; font-family: "SF Mono", Menlo, Consolas, monospace; background: #f5f5f7; color: #1d1d1f; padding: 0.15em 0.4em; border-radius: 4px;',
    // Code block — GitHub-style light gray bg, no border
    'pre code': 'display: block; font-size: 13px; font-family: "SF Mono", Menlo, Consolas, monospace; background: #f6f8fa; color: #1d1d1f; padding: 20px 24px; border-radius: 8px; overflow-x: auto; line-height: 1.6;',
    pre: 'margin: 1.5em 0;',

    // Lists
    ul: 'margin: 1em 0; padding-left: 1.5em; font-size: 15px; line-height: 1.75; color: #1d1d1f;',
    ol: 'margin: 1em 0; padding-left: 1.5em; font-size: 15px; line-height: 1.75; color: #1d1d1f;',
    li: 'margin: 0.4em 0;',

    // Table — clean: bottom borders only, no vertical lines
    table: 'width: 100%; margin: 1.5em 0; font-size: 14px; border-collapse: collapse;',
    th: 'padding: 12px 16px; text-align: left; font-weight: 600; color: #1d1d1f; font-size: 14px; border-bottom: 1px solid #d2d2d7;',
    td: 'padding: 12px 16px; border-bottom: 1px solid #e5e5ea; color: #1d1d1f;',

    // Links — WeChat blue
    a: 'color: #576b95; text-decoration: none;',

    // Images
    img: 'max-width: 100%; height: auto; display: block; margin: 1.5em auto; border-radius: 8px;',

    // Horizontal rule
    hr: 'border: none; height: 1px; background: #d2d2d7; margin: 2em 0;',

    // Inline formatting
    strong: 'font-weight: 600; color: #1d1d1f;',
    em: 'font-style: italic;',
    del: 'text-decoration: line-through; color: #86868b;',
    s: 'text-decoration: line-through; color: #86868b;',

    // Superscript / subscript
    sup: 'font-size: 0.75em; vertical-align: super; color: #576b95;',
    sub: 'font-size: 0.75em; vertical-align: sub;',

    // Section / figure
    section: 'margin: 0.5em 0;',
    figcaption: 'font-size: 13px; color: #86868b; text-align: center; margin-top: 8px;',
    figure: 'margin: 1.5em 0; text-align: center;',

    // Mark
    mark: 'background: #fff3b0; padding: 0.1em 0.3em; border-radius: 2px;',

    // hljs — Xcode Light theme (matching light code block background)
    'hljs-keyword': 'color: #9b2393; font-weight: 600;',
    'hljs-string': 'color: #c41a16;',
    'hljs-number': 'color: #1c00cf;',
    'hljs-comment': 'color: #6e6e73; font-style: italic;',
    'hljs-function': 'color: #326d74;',
    'hljs-title': 'color: #326d74;',
    'hljs-built_in': 'color: #5c2699;',
    'hljs-literal': 'color: #1c00cf;',
    'hljs-type': 'color: #5c2699;',
    'hljs-params': 'color: #1d1d1f;',
    'hljs-meta': 'color: #643820;',
    'hljs-attr': 'color: #643820;',
    'hljs-variable': 'color: #326d74;',
    'hljs-selector-tag': 'color: #9b2393;',
    'hljs-selector-class': 'color: #643820;',
    'hljs-regexp': 'color: #c41a16;',
    'hljs-symbol': 'color: #326d74;',
    'hljs-tag': 'color: #9b2393;',
    'hljs-name': 'color: #9b2393;',
    'hljs-attribute': 'color: #643820;',
    'hljs-addition': 'color: #28a745; background: rgba(40, 167, 69, 0.1);',
    'hljs-deletion': 'color: #d73a49; background: rgba(215, 58, 73, 0.1);',
};
