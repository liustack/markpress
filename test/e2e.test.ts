import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { render } from '../src/wechat/renderer.ts';
import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';

const FIXTURES_DIR = path.resolve(__dirname, 'fixtures');
const IMAGES_DIR = path.join(FIXTURES_DIR, 'images');
const TMP_DIR = path.resolve(__dirname, '../test-output');

beforeAll(async () => {
    fs.mkdirSync(TMP_DIR, { recursive: true });
    fs.mkdirSync(IMAGES_DIR, { recursive: true });

    // Generate test image if not already present (200x200 with noise, > 2KB)
    const imgPath = path.join(IMAGES_DIR, 'small.png');
    if (!fs.existsSync(imgPath) || fs.statSync(imgPath).size < 2048) {
        const noise = Buffer.alloc(200 * 200 * 3);
        for (let i = 0; i < noise.length; i++) noise[i] = Math.floor(Math.random() * 256);
        await sharp(noise, { raw: { width: 200, height: 200, channels: 3 } })
            .png()
            .toFile(imgPath);
    }
});

afterAll(() => {
    fs.rmSync(TMP_DIR, { recursive: true, force: true });
});

describe('end-to-end', () => {
    let html: string;

    beforeAll(async () => {
        const inputPath = path.join(FIXTURES_DIR, 'sample.md');
        const outputPath = path.join(TMP_DIR, 'sample.html');
        await render({ input: inputPath, output: outputPath });
        html = fs.readFileSync(outputPath, 'utf-8');
    });

    it('should not contain dangerous tags', () => {
        expect(html).not.toContain('<script');
        expect(html).not.toContain('<style>');
        expect(html).not.toContain('<link');
        expect(html).not.toContain('<iframe');
        expect(html).not.toContain('<input');
        expect(html).not.toContain('<div');
    });

    it('should not contain class attributes', () => {
        expect(html).not.toMatch(/\bclass="/);
    });

    it('should have style attributes on major elements', () => {
        // Check that style= appears multiple times (inline styles applied)
        const styleCount = (html.match(/style="/g) || []).length;
        expect(styleCount).toBeGreaterThan(5);
    });

    it('should convert external links to footnotes with References section', () => {
        expect(html).toContain('References');
        expect(html).toContain('https://github.com');
        expect(html).toContain('https://example.com');
        expect(html).toContain('<sup');
    });

    it('should preserve mp.weixin.qq.com links', () => {
        expect(html).toContain('mp.weixin.qq.com');
        expect(html).toMatch(/<a[^>]*mp\.weixin\.qq\.com/);
    });

    it('should have <br> in code blocks (whitespace protection)', () => {
        // Code block with multiple lines should have <br> tags
        expect(html).toContain('<br>');
    });

    it('should convert task list checkboxes to Unicode', () => {
        expect(html).toContain('☑');
        expect(html).toContain('☐');
    });

    it('should convert images to base64 data URIs', () => {
        expect(html).toContain('data:image/');
        expect(html).toContain('base64,');
    });

    it('should convert div to section', () => {
        expect(html).toContain('<section');
        expect(html).not.toContain('<div');
    });

    it('should remove script tags', () => {
        expect(html).not.toMatch(/<script\b/i);
    });

    it('should have syntax highlighting colors in code blocks', () => {
        // Xcode Light theme colors should be present
        expect(html).toContain('#f6f8fa'); // code background
        expect(html).toContain('#9b2393'); // keyword purple
    });

    it('should render mermaid diagrams as PNG images', () => {
        // Mermaid block should be converted to base64 PNG img
        const mermaidImgCount = (html.match(/data:image\/png;base64,/g) || []).length;
        expect(mermaidImgCount).toBeGreaterThanOrEqual(1);
        // No mermaid code block should remain
        expect(html).not.toContain('language-mermaid');
    });
});
