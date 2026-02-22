import type { Plugin } from 'unified';
import type { Root, Element } from 'hast';
import { visit } from 'unist-util-visit';
import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';

const MAX_SIZE = 2 * 1024 * 1024; // 2MB WeChat limit

type SourceType = 'local' | 'remote' | 'data-uri';

function classifySource(src: string): SourceType {
    if (src.startsWith('data:')) return 'data-uri';
    if (src.startsWith('http://') || src.startsWith('https://')) return 'remote';
    return 'local';
}

function detectFormat(ext: string): string {
    const map: Record<string, string> = {
        png: 'image/png',
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        gif: 'image/gif',
        svg: 'image/svg+xml',
        webp: 'image/webp',
        avif: 'image/avif',
        tiff: 'image/tiff',
        tif: 'image/tiff',
    };
    return map[ext] || 'image/png';
}

/**
 * Compress a buffer and return a base64 data URI.
 * SVG: base64-encode directly (no sharp processing).
 * GIF: resize with sharp (animated: true) to stay under maxSize.
 * Others: convert to PNG with compression; fall back to JPEG if needed.
 */
async function compressToDataUri(
    buffer: Buffer,
    mime: string,
    maxSize: number,
    sourcePath: string,
): Promise<string> {
    // SVG: no sharp processing, just base64 encode
    if (mime === 'image/svg+xml') {
        return `data:${mime};base64,${buffer.toString('base64')}`;
    }

    // GIF: preserve animation, resize if too large
    if (mime === 'image/gif') {
        let result = buffer;
        if (result.length > maxSize) {
            let width = 1080;
            while (width >= 100) {
                result = await sharp(buffer, { animated: true })
                    .resize({ width, withoutEnlargement: true })
                    .gif()
                    .toBuffer();
                if (result.length <= maxSize) break;
                width = Math.floor(width * 0.7);
            }
        }
        if (result.length > maxSize) {
            throw new Error(
                `Image exceeds 2MB after compression: ${sourcePath} (${(result.length / 1024 / 1024).toFixed(1)}MB)`,
            );
        }
        return `data:image/gif;base64,${result.toString('base64')}`;
    }

    // Other formats: try PNG first
    const metadata = await sharp(buffer).metadata();
    let width = metadata.width || 1080;
    let result: Buffer;

    // Start with PNG compression
    result = await sharp(buffer)
        .resize({ width: Math.min(width, 1080), withoutEnlargement: true })
        .png({ compressionLevel: 9 })
        .toBuffer();

    if (result.length <= maxSize) {
        return `data:image/png;base64,${result.toString('base64')}`;
    }

    // Shrink progressively
    let currentWidth = Math.min(width, 1080);
    while (currentWidth >= 100) {
        currentWidth = Math.floor(currentWidth * 0.7);
        result = await sharp(buffer)
            .resize({ width: currentWidth, withoutEnlargement: true })
            .png({ compressionLevel: 9 })
            .toBuffer();
        if (result.length <= maxSize) {
            return `data:image/png;base64,${result.toString('base64')}`;
        }
    }

    // Last resort: JPEG (if no alpha channel)
    if (!metadata.hasAlpha) {
        currentWidth = Math.min(width, 1080);
        while (currentWidth >= 100) {
            result = await sharp(buffer)
                .resize({ width: currentWidth, withoutEnlargement: true })
                .jpeg({ quality: 80 })
                .toBuffer();
            if (result.length <= maxSize) {
                return `data:image/jpeg;base64,${result.toString('base64')}`;
            }
            currentWidth = Math.floor(currentWidth * 0.7);
        }
    }

    throw new Error(
        `Image exceeds 2MB after compression: ${sourcePath} (${(result.length / 1024 / 1024).toFixed(1)}MB)`,
    );
}

interface Base64ImagesOptions {
    baseDir: string;
}

/**
 * Rehype plugin: convert local images to compressed base64 data URIs.
 * Skips remote URLs and existing data URIs.
 * Uses sharp for compression with a 2MB limit.
 */
export const rehypeBase64Images: Plugin<[Base64ImagesOptions], Root> = (options) => {
    const { baseDir } = options;

    return async (tree: Root) => {
        const tasks: Array<{ node: Element; imgPath: string; mime: string }> = [];

        visit(tree, 'element', (node: Element) => {
            if (node.tagName !== 'img') return;

            const src = node.properties?.src;
            if (typeof src !== 'string') return;

            const sourceType = classifySource(src);
            if (sourceType !== 'local') return;

            const imgPath = path.resolve(baseDir, src);
            if (!fs.existsSync(imgPath)) return;

            const ext = path.extname(imgPath).slice(1).toLowerCase();
            const mime = detectFormat(ext);

            tasks.push({ node, imgPath, mime });
        });

        await Promise.all(
            tasks.map(async ({ node, imgPath, mime }) => {
                const buffer = fs.readFileSync(imgPath);
                const dataUri = await compressToDataUri(Buffer.from(buffer), mime, MAX_SIZE, imgPath);
                node.properties.src = dataUri;
            }),
        );
    };
};
