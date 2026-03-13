# Project Overview (for AI Agent)

## Goal
Provide the `markpress` CLI tool to render local Markdown files into polished documents and export them as **PDF**. Remote URLs and HTML input are not supported.

## Technical Approach
- **Playwright + Chromium** as the rendering and export engine
- **PDF**: use the browser print engine (`Page.printToPDF`), with `-webkit-print-color-adjust: exact`
- **Theme design**: emphasize whitespace and breathing room; avoid cramped layout

```bash
cd /path/to/markpress
pnpm install
pnpm exec playwright install chromium
```

> [!NOTE]
> **Mermaid diagrams**: built-in support, no preprocessing needed. The ` ```mermaid ` code block in Markdown will automatically render into SVG graphics.

## Code Organization

```
src/
├── main.ts         # CLI entry
├── renderer.ts     # PDF rendering logic
├── templates.ts    # template definitions
├── fonts.ts        # font injection
└── templates/      # HTML template files
```

## Skills Directory

```
skills/
└── markpress/
    └── SKILL.md
```

The CLI is exposed via `dist/main.js`.

## CLI Usage

```bash
markpress -i document.md -o output.pdf --template default
```

## Operational Docs (`docs/`)

1. Operational docs use front-matter metadata (`summary`, `read_when`).
2. Before creating a new doc, run `pnpm docs:list` to review the existing index.
3. Before coding, check the `read_when` hints and read relevant docs as needed.
4. Existing docs: `commit`, `testing`.

## .gitignore must include
- `node_modules/`
- `dist/`
- `skills/**/outputs/`
- common logs/cache/system files
