import { describe, it, expect } from 'vitest';
import { copyToClipboard } from '../src/wechat/clipboard.ts';
import { getHtml } from '@crosscopy/clipboard';

describe('clipboard', () => {
    it('should export copyToClipboard function', () => {
        expect(typeof copyToClipboard).toBe('function');
    });

    it('should copy HTML to system clipboard', async () => {
        const html = '<p>Hello <strong>World</strong></p>';
        await copyToClipboard(html);
        const result = await getHtml();
        expect(result).toContain('Hello');
        expect(result).toContain('World');
    });
});
