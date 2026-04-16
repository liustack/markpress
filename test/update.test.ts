import { describe, it, expect, vi } from 'vitest';
import {
    checkForUpdate,
    compareVersions,
    createSelfUpdater,
    type CommandRunner,
} from '../src/update.ts';

describe('compareVersions', () => {
    it('returns 0 for equal versions', () => {
        expect(compareVersions('1.1.1', '1.1.1')).toBe(0);
    });

    it('returns -1 when current version is older', () => {
        expect(compareVersions('1.1.1', '1.1.2')).toBe(-1);
    });

    it('returns 1 when current version is newer', () => {
        expect(compareVersions('1.2.0', '1.1.9')).toBe(1);
    });

    it('ignores a leading v prefix', () => {
        expect(compareVersions('v1.1.1', '1.1.2')).toBe(-1);
    });
});

describe('checkForUpdate', () => {
    it('reports when a newer version is available', async () => {
        const run: CommandRunner = vi.fn(async () => '1.1.2\n');

        await expect(checkForUpdate({
            currentVersion: '1.1.1',
            run,
        })).resolves.toEqual({
            packageName: '@liustack/markpress',
            currentVersion: '1.1.1',
            latestVersion: '1.1.2',
            updateAvailable: true,
        });

        expect(run).toHaveBeenCalledWith('npm', ['view', '@liustack/markpress', 'version']);
    });

    it('reports when current version is already latest', async () => {
        const run: CommandRunner = vi.fn(async () => '1.1.1');

        await expect(checkForUpdate({
            currentVersion: '1.1.1',
            run,
        })).resolves.toEqual({
            packageName: '@liustack/markpress',
            currentVersion: '1.1.1',
            latestVersion: '1.1.1',
            updateAvailable: false,
        });
    });
});

describe('createSelfUpdater', () => {
    it('installs the latest package and chromium when an update is available', async () => {
        const run: CommandRunner = vi.fn()
            .mockResolvedValueOnce('1.1.2')
            .mockResolvedValueOnce('')
            .mockResolvedValueOnce('');
        const resolvePlaywrightCli = vi.fn(() => '/mock/playwright/cli.js');

        const selfUpdate = createSelfUpdater(run, resolvePlaywrightCli);

        await expect(selfUpdate({ currentVersion: '1.1.1' })).resolves.toEqual({
            packageName: '@liustack/markpress',
            currentVersion: '1.1.1',
            latestVersion: '1.1.2',
            updateAvailable: true,
            updated: true,
        });

        expect(run).toHaveBeenNthCalledWith(1, 'npm', ['view', '@liustack/markpress', 'version']);
        expect(run).toHaveBeenNthCalledWith(2, 'npm', ['install', '-g', '@liustack/markpress@latest']);
        expect(run).toHaveBeenNthCalledWith(3, process.execPath, ['/mock/playwright/cli.js', 'install', 'chromium']);
    });

    it('does not reinstall when current version is already latest', async () => {
        const run: CommandRunner = vi.fn().mockResolvedValueOnce('1.1.1');
        const resolvePlaywrightCli = vi.fn(() => '/mock/playwright/cli.js');

        const selfUpdate = createSelfUpdater(run, resolvePlaywrightCli);

        await expect(selfUpdate({ currentVersion: '1.1.1' })).resolves.toEqual({
            packageName: '@liustack/markpress',
            currentVersion: '1.1.1',
            latestVersion: '1.1.1',
            updateAvailable: false,
            updated: false,
        });

        expect(run).toHaveBeenCalledTimes(1);
        expect(resolvePlaywrightCli).not.toHaveBeenCalled();
    });
});
