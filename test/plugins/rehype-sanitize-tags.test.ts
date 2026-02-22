import { describe, it, expect } from 'vitest';
import { processWithPlugin } from '../helpers.ts';
import { rehypeSanitizeTags } from '../../src/wechat/plugins.ts';

describe('rehypeSanitizeTags', () => {
    it('should pass through basic paragraph', async () => {
        const html = await processWithPlugin('Hello world', rehypeSanitizeTags);
        expect(html).toContain('Hello world');
    });
});
