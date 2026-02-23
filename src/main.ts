#!/usr/bin/env node

declare const __APP_VERSION__: string;

import { Command } from 'commander';
import { render } from './wechat/renderer.ts';

const program = new Command();

program
    .name('mdpress')
    .description('Convert Markdown into WeChat MP-ready HTML')
    .version(__APP_VERSION__)
    .requiredOption('-i, --input <path>', 'Input Markdown file path')
    .requiredOption('-o, --output <path>', 'Output HTML file path')
    .option('-c, --copy', 'Copy rendered HTML to clipboard via Playwright')
    .action(async (options) => {
        try {
            const result = await render({
                input: options.input,
                output: options.output,
                copy: options.copy,
            });
            console.log(JSON.stringify(result, null, 2));
        } catch (error) {
            console.error('Error:', error instanceof Error ? error.message : error);
            process.exit(1);
        }
    });

program.parse();
