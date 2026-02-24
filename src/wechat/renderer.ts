import * as fs from 'fs';
import * as path from 'path';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeRaw from 'rehype-raw';
import rehypeStringify from 'rehype-stringify';
import {
    rehypeSanitizeTags,
    rehypeMermaid,
    rehypeBase64Images,
    rehypeCodeHighlight,
    rehypeFootnoteLinks,
    rehypeInlineStyles,
} from './plugins/index.ts';

export interface RenderOptions {
    input: string;
    output: string;
    copy?: boolean;
}

export interface RenderResult {
    input: string;
    output: string;
    size: number;
    copied?: boolean;
}

export async function render(options: RenderOptions): Promise<RenderResult> {
    const { input, output } = options;

    const inputPath = path.resolve(input);
    if (!fs.existsSync(inputPath)) {
        throw new Error(`Input file not found: ${inputPath}`);
    }

    const ext = path.extname(inputPath).toLowerCase();
    if (ext !== '.md' && ext !== '.markdown') {
        throw new Error(`Unsupported input format: ${ext}. Only .md and .markdown files are supported.`);
    }

    const markdown = fs.readFileSync(inputPath, 'utf-8');
    const inputDir = path.dirname(inputPath);

    const file = await unified()
        .use(remarkParse)
        .use(remarkGfm)
        .use(remarkRehype, { allowDangerousHtml: true })
        .use(rehypeRaw)
        .use(rehypeSanitizeTags)
        .use(rehypeMermaid)
        .use(rehypeBase64Images, { baseDir: inputDir })
        .use(rehypeCodeHighlight)
        .use(rehypeFootnoteLinks)
        .use(rehypeInlineStyles)
        .use(rehypeStringify, { allowDangerousHtml: true })
        .process(markdown);

    const html = String(file);

    const outputPath = path.resolve(output);
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    const fileHtml = `<meta charset="utf-8">\n${html}`;
    fs.writeFileSync(outputPath, fileHtml, 'utf-8');

    let copied = false;
    if (options.copy) {
        const { copyToClipboard } = await import('./clipboard.ts');
        await copyToClipboard(html);
        copied = true;
    }

    return {
        input: inputPath,
        output: outputPath,
        size: Buffer.byteLength(html, 'utf-8'),
        ...(copied ? { copied } : {}),
    };
}
