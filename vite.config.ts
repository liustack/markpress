import { defineConfig } from 'vite';
import { resolve } from 'path';
import pkg from './package.json' with { type: 'json' };

export default defineConfig({
    define: {
        __APP_VERSION__: JSON.stringify(pkg.version),
    },
    build: {
        lib: {
            entry: resolve(__dirname, 'src/main.ts'),
            formats: ['es'],
            fileName: 'main',
        },
        rollupOptions: {
            external: [
                'commander',
                'unified',
                'remark-parse',
                'remark-gfm',
                'remark-rehype',
                'rehype-raw',
                'rehype-stringify',
                'unist-util-visit',
                'sharp',
                // Node.js built-ins
                'fs',
                'path',
                'url',
                'module',
                'crypto',
                'child_process',
            ],
        },
        target: 'node18',
        outDir: 'dist',
        emptyOutDir: true,
        minify: false,
    },
});
