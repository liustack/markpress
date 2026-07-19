import { readFile } from 'node:fs/promises';

import { describe, expect, test } from 'vitest';

async function readProjectFile(path: string): Promise<string> {
    return readFile(new URL(`../${path}`, import.meta.url), 'utf8');
}

describe('PagePress branding', () => {
    test('uses the approved public identifiers', async () => {
        const packageJson = JSON.parse(await readProjectFile('package.json'));
        const main = await readProjectFile('src/main.ts');
        const update = await readProjectFile('src/update.ts');
        const skill = await readProjectFile('skills/pagepress/SKILL.md');

        expect(packageJson).toMatchObject({
            name: '@liustack/pagepress',
            bin: { pagepress: './dist/main.js' },
            repository: {
                url: 'git+https://github.com/liustack/pagepress.git',
            },
        });
        expect(main).toContain(".name('pagepress')");
        expect(update).toContain("PACKAGE_NAME = '@liustack/pagepress'");
        expect(skill).toContain('name: pagepress');
        expect(skill).toContain('# PagePress');
    });
});
