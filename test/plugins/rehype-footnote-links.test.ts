import { describe, it, expect } from 'vitest';
import { processWithPlugin } from '../helpers.ts';
import { rehypeFootnoteLinks } from '../../src/wechat/plugins/index.ts';

describe('rehypeFootnoteLinks', () => {
    it('should convert external links to footnotes', async () => {
        const md = '[Example](https://example.com)';
        const html = await processWithPlugin(md, rehypeFootnoteLinks);
        // Link text should remain, with a footnote reference
        expect(html).toContain('Example');
        expect(html).toContain('<sup>');
        expect(html).toContain('[1]');
        // Should not have <a> for external links
        expect(html).not.toContain('<a');
    });

    it('should preserve mp.weixin.qq.com links', async () => {
        const md = '[WeChat Article](https://mp.weixin.qq.com/s/abc123)';
        const html = await processWithPlugin(md, rehypeFootnoteLinks);
        expect(html).toContain('<a');
        expect(html).toContain('mp.weixin.qq.com');
        expect(html).not.toContain('<sup>');
    });

    it('should share footnote numbers for duplicate URLs', async () => {
        const md = '[First](https://example.com) and [Second](https://example.com)';
        const html = await processWithPlugin(md, rehypeFootnoteLinks);
        // Both should reference [1]
        const supMatches = html.match(/\[1\]/g);
        expect(supMatches?.length).toBeGreaterThanOrEqual(2);
        // Should not have [2]
        expect(html).not.toContain('[2]');
    });

    it('should strip anchor links but not add footnotes', async () => {
        const md = '[Section](#my-section)';
        const html = await processWithPlugin(md, rehypeFootnoteLinks);
        expect(html).toContain('Section');
        expect(html).not.toContain('<a');
        expect(html).not.toContain('<sup>');
    });

    it('should strip relative links but not add footnotes', async () => {
        const md = '[Page](./other.md)';
        const html = await processWithPlugin(md, rehypeFootnoteLinks);
        expect(html).toContain('Page');
        expect(html).not.toContain('<a');
        expect(html).not.toContain('<sup>');
    });

    it('should strip protocol-relative links and add footnotes', async () => {
        const md = '[CDN](//example.com/lib.js)';
        const html = await processWithPlugin(md, rehypeFootnoteLinks);
        expect(html).not.toContain('<a');
        expect(html).toContain('<sup>');
        expect(html).toContain('//example.com/lib.js');
    });

    it('should append References section at the end', async () => {
        const md = '[Example](https://example.com)\n\nSome text.';
        const html = await processWithPlugin(md, rehypeFootnoteLinks);
        expect(html).toContain('References');
        expect(html).toContain('https://example.com');
        expect(html).toContain('[1]');
    });

    it('should not add References section when no external links', async () => {
        const md = 'Just plain text with no links.';
        const html = await processWithPlugin(md, rehypeFootnoteLinks);
        expect(html).not.toContain('References');
    });

    it('should number different URLs sequentially', async () => {
        const md = '[A](https://a.com) and [B](https://b.com)';
        const html = await processWithPlugin(md, rehypeFootnoteLinks);
        expect(html).toContain('[1]');
        expect(html).toContain('[2]');
        expect(html).toContain('https://a.com');
        expect(html).toContain('https://b.com');
    });
});
