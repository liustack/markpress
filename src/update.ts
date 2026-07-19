import { execFile } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { createRequire } from 'module';

export const PACKAGE_NAME = '@liustack/pagepress';

export interface UpdateInfo {
    packageName: string;
    currentVersion: string;
    latestVersion: string | null;
    updateAvailable: boolean;
    checked: boolean;
    error?: string;
}

export interface SelfUpdateResult extends UpdateInfo {
    updated: boolean;
}

export interface CheckForUpdateOptions {
    currentVersion: string;
    packageName?: string;
    run?: CommandRunner;
}

export interface SelfUpdateOptions {
    currentVersion: string;
    packageName?: string;
}

export type CommandRunner = (command: string, args: string[]) => Promise<string>;
export type PlaywrightCliResolver = () => string;

function normalizeVersion(version: string): string {
    const normalized = version.trim().replace(/^v/i, '').split('-')[0];
    if (!normalized) {
        throw new Error(`Invalid version: ${version}`);
    }
    return normalized;
}

function parseVersion(version: string): number[] {
    return normalizeVersion(version).split('.').map((segment) => {
        const value = Number.parseInt(segment, 10);
        if (!Number.isFinite(value)) {
            throw new Error(`Invalid version segment: ${segment}`);
        }
        return value;
    });
}

export function compareVersions(left: string, right: string): number {
    const leftParts = parseVersion(left);
    const rightParts = parseVersion(right);
    const length = Math.max(leftParts.length, rightParts.length);

    for (let index = 0; index < length; index += 1) {
        const leftValue = leftParts[index] ?? 0;
        const rightValue = rightParts[index] ?? 0;

        if (leftValue < rightValue) return -1;
        if (leftValue > rightValue) return 1;
    }

    return 0;
}

export const runCommand: CommandRunner = (command, args) => new Promise((resolve, reject) => {
    execFile(command, args, { encoding: 'utf-8' }, (error, stdout, stderr) => {
        if (error) {
            const message = stderr.trim() || error.message;
            reject(new Error(message));
            return;
        }

        resolve(stdout.trim());
    });
});

export const resolvePlaywrightCliPath: PlaywrightCliResolver = () => {
    const require = createRequire(import.meta.url);
    const playwrightPackagePath = require.resolve('playwright/package.json');
    const playwrightPackage = JSON.parse(fs.readFileSync(playwrightPackagePath, 'utf-8')) as { bin?: Record<string, string> };
    const cliRelativePath = playwrightPackage.bin?.playwright;

    if (!cliRelativePath) {
        throw new Error('Unable to resolve Playwright CLI.');
    }

    return path.resolve(path.dirname(playwrightPackagePath), cliRelativePath);
};

export async function checkForUpdate({
    currentVersion,
    packageName = PACKAGE_NAME,
    run = runCommand,
}: CheckForUpdateOptions): Promise<UpdateInfo> {
    const normalizedCurrentVersion = normalizeVersion(currentVersion);
    try {
        const latestVersion = normalizeVersion(await run('npm', ['view', packageName, 'version']));

        return {
            packageName,
            currentVersion: normalizedCurrentVersion,
            latestVersion,
            updateAvailable: compareVersions(normalizedCurrentVersion, latestVersion) < 0,
            checked: true,
        };
    } catch (error) {
        return {
            packageName,
            currentVersion: normalizedCurrentVersion,
            latestVersion: null,
            updateAvailable: false,
            checked: false,
            error: error instanceof Error ? error.message : String(error),
        };
    }
}

export function createSelfUpdater(
    run: CommandRunner = runCommand,
    resolvePlaywrightCli: PlaywrightCliResolver = resolvePlaywrightCliPath,
) {
    return async ({
        currentVersion,
        packageName = PACKAGE_NAME,
    }: SelfUpdateOptions): Promise<SelfUpdateResult> => {
        const updateInfo = await checkForUpdate({ currentVersion, packageName, run });

        if (!updateInfo.checked) {
            throw new Error(`Unable to check for updates: ${updateInfo.error ?? 'unknown error'}`);
        }

        if (!updateInfo.updateAvailable) {
            return {
                ...updateInfo,
                updated: false,
            };
        }

        await run('npm', ['install', '-g', `${packageName}@latest`]);
        await run(process.execPath, [resolvePlaywrightCli(), 'install', 'chromium']);

        return {
            ...updateInfo,
            updated: true,
        };
    };
}
