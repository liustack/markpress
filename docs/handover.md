---
summary: 'Project handover: background, architecture decisions, and next steps for mdpress'
read_when:
  - First time working on this project
  - Need to understand project context and decisions
  - Planning next implementation steps
---

# Handover Document

## Project Background

mdpress is part of a personal document rendering toolchain ("press" series):

- **webpress** — HTML → PNG
- **pagepress** — Markdown/HTML → PDF
- **mdpress** — Markdown → WeChat MP-compatible HTML

Each tool is an independent CLI designed for AI agent consumption. They share naming conventions and architectural patterns but do not share code. The relationship is pipeline upstream/downstream, not library dependency.

## Why remark/rehype (not marked)

pagepress uses `marked` for its Markdown parsing, which works fine because its output goes straight to Playwright for rendering — no HTML-level transformation needed.

mdpress is different. Its three core operations are all **HTML AST transformations**:

1. Sanitize unsupported tags
2. Convert local images to base64
3. Inline all CSS styles

Using `marked` would produce an HTML string, requiring a second parse with cheerio/jsdom to do these transformations. The `unified/remark/rehype` pipeline avoids this by keeping everything in AST form throughout:

```
markdown → remark (mdast) → rehype (hast) → transform hast → serialize to HTML
```

## Current State

### What's done

- Project scaffolding (package.json, tsconfig, vite, etc.)
- CLI entry point (`src/main.ts`) with `-i` / `-o` options
- Rendering pipeline (`src/wechat/renderer.ts`) wired up with unified
- Three rehype plugin skeletons (`src/wechat/plugins.ts`):
  - `rehypeSanitizeTags` — skeleton only, needs tag blacklist
  - `rehypeBase64Images` — implemented, converts local images to base64 data URIs
  - `rehypeInlineStyles` — skeleton only, strips `className` but no style injection yet
- TypeScript type check passes
- Vite build passes

### What's NOT done

1. **Inline styles** — need to define a default style map per HTML tag (h1–h6, p, blockquote, code, pre, table, ul/ol/li, a, img, hr, etc.) that produces WeChat-compatible rendering
2. **Tag sanitization** — need to research and define the exact list of tags/attributes WeChat editor strips or breaks on
3. **Code syntax highlighting** — not yet integrated; consider rehype-highlight or shiki
4. **Testing** — no tests yet; vitest is referenced in docs but not configured
5. **README** — not yet created
6. **Agent skill** — no `skills/` SKILL.md yet

## WeChat MP HTML Constraints (for reference)

- Only `style` attributes allowed, no `<style>` or `<link>` tags
- No `<script>` tags
- No `position: fixed/absolute`, no custom fonts
- No external resource loading
- Images: base64 data URIs or WeChat CDN URLs
- Tables, code blocks, and some semantic tags have limited support
- Inline styles on every element is the safest approach

## Architecture

```
src/
├── main.ts             # CLI entry (commander)
└── wechat/             # WeChat domain
    ├── renderer.ts     # unified pipeline orchestration
    └── plugins.ts      # rehype plugins for WeChat transforms
```

The plugin execution order in the pipeline matters:

```
remarkParse → remarkGfm → remarkRehype → rehypeSanitizeTags → rehypeBase64Images → rehypeInlineStyles → rehypeStringify
```

Sanitize first (remove unsupported nodes), then transform remaining nodes (base64, styles).

## Key Dependencies

| Package | Purpose |
|---------|---------|
| `unified` | Pipeline core |
| `remark-parse` | Markdown → mdast |
| `remark-gfm` | GFM support (tables, strikethrough, task lists) |
| `remark-rehype` | mdast → hast bridge |
| `rehype-stringify` | hast → HTML string |
| `unist-util-visit` | AST tree traversal for plugins |
| `commander` | CLI framework |
