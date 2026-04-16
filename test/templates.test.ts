import { chromium, Browser } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getTemplate, pdfTemplates } from '../src/templates.ts';

const templatesDir = path.resolve(__dirname, '../src/templates');
const longCodeSample = '/presetapps/data-query?token=<token>&allowDataQueryTables=orders,users&datasetId=file_1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890';

function escapeHtml(value: string): string {
    return value
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;');
}

describe('templates', () => {
    let browser: Browser;

    beforeAll(async () => {
        browser = await chromium.launch({ headless: true });
    });

    afterAll(async () => {
        await browser.close();
    });

    it('returns all three templates', () => {
        expect(Object.keys(pdfTemplates)).toEqual(['default', 'github', 'magazine']);
    });

    it('getTemplate returns correct template by name', () => {
        const t = getTemplate('default');
        expect(t.name).toBe('default');
        expect(t.file).toBe('default.html');
    });

    it('getTemplate returns github template', () => {
        const t = getTemplate('github');
        expect(t.name).toBe('github');
        expect(t.file).toBe('github.html');
    });

    it('getTemplate returns magazine template', () => {
        const t = getTemplate('magazine');
        expect(t.name).toBe('magazine');
        expect(t.file).toBe('magazine.html');
    });

    it('throws on unknown template name', () => {
        expect(() => getTemplate('nonexistent')).toThrowError(/Unknown PDF template: nonexistent/);
    });

    it('each template has required fields', () => {
        for (const [key, t] of Object.entries(pdfTemplates)) {
            expect(t.name).toBe(key);
            expect(t.description).toBeTruthy();
            expect(t.file).toMatch(/\.html$/);
        }
    });

    it.each(Object.keys(pdfTemplates))('template %s wraps long code blocks for PDF layout', async (name) => {
        const template = getTemplate(name);
        const templateHtml = fs.readFileSync(path.join(templatesDir, template.file), 'utf-8');
        const html = templateHtml
            .replace(/\{\{title\}\}/g, 'Long Code Test')
            .replace(/\{\{styles\}\}/g, '')
            .replace(/\{\{body\}\}/g, `<pre><code>${escapeHtml(longCodeSample)}</code></pre>`);

        const page = await browser.newPage({ viewport: { width: 794, height: 1123 } });
        await page.setContent(html);
        await page.emulateMedia({ media: 'print' });

        const metrics = await page.$eval('pre', (pre) => {
            const code = pre.querySelector('code');
            const preStyle = getComputedStyle(pre);
            const codeStyle = code ? getComputedStyle(code) : null;

            return {
                preScrollWidth: pre.scrollWidth,
                preClientWidth: pre.clientWidth,
                documentScrollWidth: document.documentElement.scrollWidth,
                documentClientWidth: document.documentElement.clientWidth,
                preWhiteSpace: preStyle.whiteSpace,
                preOverflowWrap: preStyle.overflowWrap,
                codeWhiteSpace: codeStyle?.whiteSpace ?? null,
                codeOverflowWrap: codeStyle?.overflowWrap ?? null,
            };
        });

        await page.close();

        expect(metrics.preWhiteSpace).toBe('pre-wrap');
        expect(metrics.preOverflowWrap).toBe('anywhere');
        expect(metrics.codeWhiteSpace).toBe('pre-wrap');
        expect(metrics.codeOverflowWrap).toBe('anywhere');
        expect(metrics.preScrollWidth).toBeLessThanOrEqual(metrics.preClientWidth + 1);
        expect(metrics.documentScrollWidth).toBeLessThanOrEqual(metrics.documentClientWidth + 1);
    });

    it.each(Object.keys(pdfTemplates))('template %s wraps long inline code for PDF layout', async (name) => {
        const template = getTemplate(name);
        const templateHtml = fs.readFileSync(path.join(templatesDir, template.file), 'utf-8');
        const html = templateHtml
            .replace(/\{\{title\}\}/g, 'Inline Code Test')
            .replace(/\{\{styles\}\}/g, '')
            .replace(/\{\{body\}\}/g, `<p>Use <code>${escapeHtml(longCodeSample)}</code> in the iframe URL.</p>`);

        const page = await browser.newPage({ viewport: { width: 794, height: 1123 } });
        await page.setContent(html);
        await page.emulateMedia({ media: 'print' });

        const metrics = await page.$eval('p code', (code) => {
            const style = getComputedStyle(code);

            return {
                documentScrollWidth: document.documentElement.scrollWidth,
                documentClientWidth: document.documentElement.clientWidth,
                whiteSpace: style.whiteSpace,
                overflowWrap: style.overflowWrap,
                wordBreak: style.wordBreak,
            };
        });

        await page.close();

        expect(metrics.whiteSpace).toBe('break-spaces');
        expect(metrics.overflowWrap).toBe('anywhere');
        expect(metrics.wordBreak).toBe('break-word');
        expect(metrics.documentScrollWidth).toBeLessThanOrEqual(metrics.documentClientWidth + 1);
    });
});
