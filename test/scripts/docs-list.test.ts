import { describe, it, expect } from 'vitest';
import { execSync } from 'node:child_process';
import { resolve } from 'node:path';

describe('docs:list script', () => {
    it('should include nested docs entries under docs/ subdirectories', () => {
        const repoRoot = resolve(__dirname, '../..');
        const output = execSync('node scripts/docs-list.js', {
            cwd: repoRoot,
            encoding: 'utf-8',
        });

        expect(output).toContain('docs/research/wechat-editor-compatibility.md');
    });
});
