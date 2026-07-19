#!/usr/bin/env node

declare const __APP_VERSION__: string;

import { Command } from 'commander';
import { render } from './renderer.ts';
import { checkForUpdate, createSelfUpdater } from './update.ts';

async function runRenderCommand(): Promise<void> {
    const program = new Command();

    program
        .name('pagepress')
        .description('Render local Markdown files to PDF')
        .version(__APP_VERSION__)
        .requiredOption('-i, --input <path>', 'Input Markdown file path')
        .requiredOption('-o, --output <path>', 'Output PDF file path')
        .option('-t, --template <name>', 'PDF template (default, github, magazine)', 'default')
        .option('--wait-until <state>', 'Navigation waitUntil (load, domcontentloaded, networkidle)', 'networkidle')
        .option('--timeout <ms>', 'Navigation timeout in milliseconds', '30000')
        .option('--safe', 'Disable external network requests and JavaScript execution')
        .action(async (options) => {
            const timeout = Number.parseInt(options.timeout, 10);
            if (!Number.isFinite(timeout) || timeout < 0) {
                throw new Error('Invalid --timeout value. Use a non-negative integer in milliseconds.');
            }

            const result = await render({
                input: options.input,
                output: options.output,
                template: options.template,
                waitUntil: options.waitUntil,
                timeout,
                safe: options.safe,
            });
            console.log(JSON.stringify(result, null, 2));
        });

    await program.parseAsync(process.argv);
}

async function runCheckUpdateCommand(): Promise<void> {
    const result = await checkForUpdate({ currentVersion: __APP_VERSION__ });
    console.log(JSON.stringify(result, null, 2));
}

async function runSelfUpdateCommand(): Promise<void> {
    const selfUpdate = createSelfUpdater();
    const result = await selfUpdate({ currentVersion: __APP_VERSION__ });
    console.log(JSON.stringify(result, null, 2));
}

async function main(): Promise<void> {
    const command = process.argv[2];

    if (command === 'check-update') {
        await runCheckUpdateCommand();
        return;
    }

    if (command === 'self-update') {
        await runSelfUpdateCommand();
        return;
    }

    await runRenderCommand();
}

main().catch((error) => {
    console.error('Error:', error instanceof Error ? error.message : error);
    process.exit(1);
});
