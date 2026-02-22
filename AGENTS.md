# Project Overview (for AI Agent)

## Goal
Provide the `mdpress` CLI tool to convert local Markdown files into **WeChat MP-compatible HTML** with inline styles, base64 images, and sanitized tags. The output can be directly pasted into the WeChat Official Accounts editor.

## Technical Approach
- **unified + remark + rehype** as the Markdown processing pipeline
- **remark-parse** for Markdown parsing
- **remark-gfm** for GitHub Flavored Markdown (tables, strikethrough, etc.)
- **remark-rehype** to bridge Markdown AST to HTML AST
- **rehype plugins** for WeChat-specific transformations (inline styles, base64 images, tag sanitization)
- **rehype-stringify** for HTML serialization

## WeChat MP Constraints
- All styles must be **inline** (`style` attribute), no `<style>` or `<link>` tags
- Images must be converted to **base64 data URIs** or uploaded to WeChat CDN
- No `<script>`, `position: fixed`, custom fonts, or external resources
- Limited subset of HTML tags and CSS properties supported

## Code Organization (Domain-driven)

```
src/
├── main.ts             # CLI entry
└── wechat/             # WeChat domain
    ├── renderer.ts     # Main rendering pipeline
    └── plugins.ts      # Rehype plugins for WeChat transformations
```

## CLI Usage

```bash
mdpress -i article.md -o output.html
```

## Operational Docs (`docs/`)

1. Operational docs use front-matter metadata (`summary`, `read_when`).
2. Before creating a new doc, run `pnpm docs:list` to review the existing index.
3. Before coding, check the `read_when` hints and read relevant docs as needed.
4. Existing docs: `commit`, `testing`, `research/wechat-editor-compatibility`.

## .gitignore must include
- `node_modules/`
- `dist/`
- `skills/**/outputs/`
- common logs/cache/system files
