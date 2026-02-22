import { describe, it, expect } from 'vitest';
import { processWithPlugin } from '../helpers.ts';
import { rehypeCodeHighlight } from '../../src/wechat/plugins/index.ts';

describe('rehypeCodeHighlight', () => {
    it('should add hljs class spans for known languages', async () => {
        const md = '```javascript\nconst x = 1;\n```';
        const html = await processWithPlugin(md, rehypeCodeHighlight);
        expect(html).toContain('hljs-');
    });

    it('should replace \\n with <br> in code blocks', async () => {
        const md = '```\nline1\nline2\n```';
        const html = await processWithPlugin(md, rehypeCodeHighlight);
        expect(html).toContain('<br>');
    });

    it('should replace leading spaces with NBSP in code blocks', async () => {
        const md = '```\n  indented\n```';
        const html = await processWithPlugin(md, rehypeCodeHighlight);
        // \u00A0 is non-breaking space
        expect(html).toContain('\u00A0\u00A0indented');
    });

    it('should replace tabs with NBSP pairs in code blocks', async () => {
        const md = '```\n\tindented\n```';
        const html = await processWithPlugin(md, rehypeCodeHighlight);
        expect(html).toContain('\u00A0\u00A0indented');
    });

    it('should not affect inline code', async () => {
        const md = 'Use `const x = 1` in code.';
        const html = await processWithPlugin(md, rehypeCodeHighlight);
        // Inline code should not have <br> or NBSP
        expect(html).toContain('<code>const x = 1</code>');
        expect(html).not.toContain('<br>');
    });

    it('should handle multi-line highlighted code', async () => {
        const md = '```javascript\nfunction foo() {\n  return 1;\n}\n```';
        const html = await processWithPlugin(md, rehypeCodeHighlight);
        expect(html).toContain('<br>');
        expect(html).toContain('hljs-');
    });
});
