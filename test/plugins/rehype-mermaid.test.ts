import { describe, it, expect } from 'vitest';
import { processWithPlugin } from '../helpers.ts';
import { rehypeMermaid } from '../../src/wechat/plugins/index.ts';

describe('rehypeMermaid', () => {
    it('should skip markdown without mermaid blocks (zero overhead)', async () => {
        const html = await processWithPlugin(
            '# Hello\n\n```js\nconsole.log(1)\n```',
            rehypeMermaid,
        );
        expect(html).toContain('<pre>');
        expect(html).toContain('<code');
    });

    it('should render mermaid block to PNG base64 img', async () => {
        const md = '```mermaid\ngraph TD\n    A-->B\n```';
        const html = await processWithPlugin(md, rehypeMermaid);
        expect(html).toContain('<img');
        expect(html).toContain('data:image/png;base64,');
        expect(html).not.toContain('language-mermaid');
    }, 30000);

    it('should render multiple mermaid blocks', async () => {
        const md =
            '```mermaid\ngraph TD\n    A-->B\n```\n\n```mermaid\nsequenceDiagram\n    A->>B: Hello\n```';
        const html = await processWithPlugin(md, rehypeMermaid);
        const imgCount = (html.match(/data:image\/png;base64,/g) || []).length;
        expect(imgCount).toBe(2);
    }, 30000);

    it('should preserve non-mermaid code blocks', async () => {
        const md =
            '```mermaid\ngraph TD\n    A-->B\n```\n\n```javascript\nconst x = 1;\n```';
        const html = await processWithPlugin(md, rehypeMermaid);
        expect(html).toContain('data:image/png;base64,');
        expect(html).toContain('<code');
        expect(html).toContain('const x = 1;');
    }, 30000);
});
