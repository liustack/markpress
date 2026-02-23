import sharp from 'sharp';
import path from 'path';

const dir = path.dirname(new URL(import.meta.url).pathname);

async function main() {
    // 200x200 PNG — 渐变 + 文字
    const pngSvg = Buffer.from(`<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#667eea"/>
                <stop offset="100%" stop-color="#764ba2"/>
            </linearGradient>
        </defs>
        <rect width="200" height="200" fill="url(#g)" rx="16"/>
        <text x="100" y="90" text-anchor="middle" font-size="20" font-weight="600" fill="white" font-family="sans-serif">mdpress</text>
        <text x="100" y="120" text-anchor="middle" font-size="14" fill="rgba(255,255,255,0.8)" font-family="sans-serif">200x200 PNG</text>
    </svg>`);
    await sharp(pngSvg).png().toFile(path.join(dir, 'small.png'));
    console.log('small.png: done');

    // 200x200 GIF — 渐变 + 文字（先渲染为 PNG buffer 再转 GIF，避免 SVG→GIF 颜色量化问题）
    const gifSvg = Buffer.from(`<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="g2" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#f093fb"/>
                <stop offset="100%" stop-color="#f5576c"/>
            </linearGradient>
        </defs>
        <rect width="200" height="200" fill="url(#g2)" rx="16"/>
        <text x="100" y="90" text-anchor="middle" font-size="20" font-weight="600" fill="white" font-family="sans-serif">mdpress</text>
        <text x="100" y="120" text-anchor="middle" font-size="14" fill="rgba(255,255,255,0.8)" font-family="sans-serif">200x200 GIF</text>
    </svg>`);
    const pngBuf = await sharp(gifSvg).png().toBuffer();
    await sharp(pngBuf).gif().toFile(path.join(dir, 'small.gif'));
    console.log('small.gif: done');

    // 800x600 大图 PNG
    const largeSvg = Buffer.from(`<svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#0f2027"/>
                <stop offset="50%" stop-color="#203a43"/>
                <stop offset="100%" stop-color="#2c5364"/>
            </linearGradient>
        </defs>
        <rect width="800" height="600" fill="url(#bg)"/>
        <text x="400" y="270" text-anchor="middle" font-size="48" font-weight="700" fill="white" font-family="sans-serif">mdpress</text>
        <text x="400" y="320" text-anchor="middle" font-size="20" fill="rgba(255,255,255,0.6)" font-family="sans-serif">Markdown → WeChat HTML</text>
        <text x="400" y="370" text-anchor="middle" font-size="14" fill="rgba(255,255,255,0.4)" font-family="sans-serif">800x600 Large Image Test</text>
    </svg>`);
    await sharp(largeSvg).png().toFile(path.join(dir, 'large.png'));
    console.log('large.png: done');

    // 10x10 tiny PNG (for rejection test)
    await sharp({
        create: { width: 10, height: 10, channels: 3, background: { r: 255, g: 255, b: 0 } },
    }).png().toFile(path.join(dir, 'tiny.png'));
    console.log('tiny.png: done');

    // Verify
    for (const name of ['small.png', 'small.gif', 'large.png', 'tiny.png']) {
        const meta = await sharp(path.join(dir, name)).metadata();
        console.log(`  ${name}: ${meta.width}x${meta.height} ${meta.format}`);
    }
}

main().catch(console.error);
