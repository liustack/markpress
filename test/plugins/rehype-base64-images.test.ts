import { describe, it, expect, beforeAll } from 'vitest';
import { processWithPlugin } from '../helpers.ts';
import { rehypeBase64Images } from '../../src/wechat/plugins/index.ts';
import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';

const FIXTURES_DIR = path.resolve(__dirname, '../fixtures/images');

beforeAll(async () => {
    fs.mkdirSync(FIXTURES_DIR, { recursive: true });

    // Generate a small 10x10 red PNG
    await sharp({
        create: { width: 10, height: 10, channels: 3, background: { r: 255, g: 0, b: 0 } },
    })
        .png()
        .toFile(path.join(FIXTURES_DIR, 'small.png'));

    // Generate a small GIF (1x1 pixel)
    await sharp({
        create: { width: 1, height: 1, channels: 3, background: { r: 0, g: 255, b: 0 } },
    })
        .gif()
        .toFile(path.join(FIXTURES_DIR, 'small.gif'));

    // Generate a simple SVG file
    fs.writeFileSync(
        path.join(FIXTURES_DIR, 'icon.svg'),
        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><circle cx="12" cy="12" r="10"/></svg>',
    );

    // Generate a large image (3000x3000 to test compression)
    await sharp({
        create: { width: 3000, height: 3000, channels: 3, background: { r: 128, g: 128, b: 128 } },
    })
        .png({ compressionLevel: 0 }) // uncompressed = large
        .toFile(path.join(FIXTURES_DIR, 'large.png'));
});

describe('rehypeBase64Images', () => {
    it('should convert local PNG to base64 data URI', async () => {
        const md = `![alt](images/small.png)`;
        const html = await processWithPlugin(md, rehypeBase64Images, {
            baseDir: path.resolve(__dirname, '../fixtures'),
        });
        expect(html).toContain('src="data:image/png;base64,');
        expect(html).not.toContain('images/small.png');
    });

    it('should skip data: URIs', async () => {
        const md = `![alt](data:image/png;base64,abc123)`;
        const html = await processWithPlugin(md, rehypeBase64Images, {
            baseDir: FIXTURES_DIR,
        });
        expect(html).toContain('data:image/png;base64,abc123');
    });

    it('should skip http(s) URLs', async () => {
        const md = `![alt](https://example.com/img.png)`;
        const html = await processWithPlugin(md, rehypeBase64Images, {
            baseDir: FIXTURES_DIR,
        });
        expect(html).toContain('https://example.com/img.png');
    });

    it('should compress large images to fit under 2MB', async () => {
        const md = `![alt](images/large.png)`;
        const html = await processWithPlugin(md, rehypeBase64Images, {
            baseDir: path.resolve(__dirname, '../fixtures'),
        });
        // Extract base64 data
        const match = html.match(/src="data:image\/[^;]+;base64,([^"]+)"/);
        expect(match).toBeTruthy();
        const buffer = Buffer.from(match![1], 'base64');
        expect(buffer.length).toBeLessThanOrEqual(2 * 1024 * 1024);
    });

    it('should preserve GIF MIME type', async () => {
        const md = `![alt](images/small.gif)`;
        const html = await processWithPlugin(md, rehypeBase64Images, {
            baseDir: path.resolve(__dirname, '../fixtures'),
        });
        expect(html).toContain('src="data:image/gif;base64,');
    });

    it('should preserve SVG MIME type', async () => {
        const md = `![alt](images/icon.svg)`;
        const html = await processWithPlugin(md, rehypeBase64Images, {
            baseDir: path.resolve(__dirname, '../fixtures'),
        });
        expect(html).toContain('src="data:image/svg+xml;base64,');
    });
});
