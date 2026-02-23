# Project Overview (for AI Agent)

## Goal
Provide the `markpress` CLI tool to convert local Markdown files into editor-compatible HTML:
- **WeChat MP mode**: inline styles, base64 images, and sanitized tags
- **X/Twitter Articles mode**: minimal semantic HTML subset with image placeholders and preserved links

## Technical Approach
- **unified + remark + rehype** as the Markdown processing pipeline
- **remark-parse** for Markdown parsing
- **remark-gfm** for GitHub Flavored Markdown (tables, strikethrough, etc.)
- **remark-rehype** to bridge Markdown AST to HTML AST
- **rehype-raw** to parse raw HTML in Markdown into proper HAST element nodes
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
├── main.ts                     # CLI entry
└── wechat/                     # WeChat domain
    ├── renderer.ts             # Main rendering pipeline
    ├── clipboard.ts            # System clipboard (HTML rich-text) via @crosscopy/clipboard
    ├── plugins/                # Rehype plugins for WeChat transformations
    │   ├── index.ts            # Re-exports all plugins
    │   ├── rehype-sanitize-tags.ts    # Tag whitelist, div→section, checkbox→Unicode
    │   ├── rehype-mermaid.ts          # Mermaid diagrams → Playwright + PNG base64 (optional)
    │   ├── rehype-base64-images.ts    # Local images → sharp compress → base64
    │   ├── rehype-code-highlight.ts   # Syntax highlighting + whitespace protection
    │   ├── rehype-footnote-links.ts   # External links → footnotes + References
    │   └── rehype-inline-styles.ts    # Default styles + hljs colors → inline style
    └── styles/                 # Style definitions
        └── default.ts          # 默认极简风格样式表 + 默认语法高亮主题
```

## Pipeline Execution Order

```
Markdown → remarkParse → remarkGfm → remarkRehype → rehypeRaw
  → 1. rehypeSanitizeTags     (tag whitelist, div→section, checkbox→Unicode, attribute cleanup)
  → 2. rehypeMermaid          (mermaid code blocks → Playwright render → PNG base64, optional)
  → 3. rehypeBase64Images     (local images → sharp compress → base64 data URI)
  → 4. rehypeCodeHighlight    (syntax highlighting + whitespace protection)
  → 5. rehypeFootnoteLinks    (external links → footnotes, preserve mp.weixin.qq.com)
  → 6. rehypeInlineStyles     (default styles + hljs colors → inline style attr, remove className)
  → rehypeStringify → HTML
```

## Skills Directory

- **markpress** — `skills/markpress/SKILL.md`: Convert Markdown to WeChat MP-ready HTML

## CLI Usage

```bash
markpress -i article.md -o output.html

# X/Twitter Articles mode
markpress -i article.md -o output.html --target x
```

## Clipboard Notes

`clipboard.ts` uses `@crosscopy/clipboard`（native Rust + napi-rs addon）to write HTML directly to system clipboard as `text/html` MIME type.

**Key decisions:**
- Playwright headed browser approach was replaced — headless Chromium does NOT support system clipboard (Playwright Issue #24039)
- `@crosscopy/clipboard` provides `setHtml()` / `getHtml()` for native clipboard read/write without browser
- No Playwright dependency for clipboard; Playwright is only used for mermaid rendering
- Read `docs/clipboard.md` before modifying clipboard behavior

## Style & Font Notes

**Font stack:** WeChat native font stack applied per-element via inline `font-family`:
```
"mp-quote",PingFang SC,system-ui,-apple-system,BlinkMacSystemFont,Helvetica Neue,Hiragino Sans GB,Microsoft YaHei UI,Microsoft YaHei,Arial,sans-serif
```

**Key decisions:**
- Font-family MUST be inline per element (WeChat strips `<style>` tags, no CSS inheritance)
- `default.ts` uses template constants `F` (body font) and `FM` (mono font) to DRY the style map
- Body text: 16px, line-height 1.75 (comfortable for Chinese reading)
- Code: Menlo,Consolas,Monaco,"Courier New",monospace
- Color: `#1d1d1f` body, `#6e6e73` secondary, `#86868b` tertiary (灰色调色板)
- Read `docs/styles.md` before modifying default styles

## Image Compression Notes

`rehype-base64-images` uses sharp for image processing with 2MB per-image limit.

**Key constraints:**
- 2MB is per-image binary limit (base64 encoding adds ~33% overhead on top)
- Compression pipeline: PNG (compressionLevel 6) → shrink progressively → fallback to JPEG
- SVG: rasterized to PNG via sharp (WeChat doesn't support `data:image/svg+xml`)
- GIF: preserved with animation, resized if over 2MB
- Minimum validation: ≥1KB file size, ≥120px dimensions (reject tiny/corrupt images)
- Test fixtures with many large images will produce large HTML — this is expected for base64 inline approach

## Mermaid Plugin Notes

`rehypeMermaid` renders mermaid code blocks to 2x PNG via Playwright Chromium.

**Key constraints:**
- `deviceScaleFactor: 2` + `<img width>` for Retina clarity — do NOT change to 1x (blurry)
- `htmlLabels: true` is required — `false` breaks CJK text wrapping
- sharp SVG→PNG is NOT viable (librsvg doesn't support foreignObject)
- SVG z-ordering: edges may cross subgraph titles — this is a mermaid limitation, accepted
- Read `docs/mermaid.md` before modifying this plugin

## Operational Docs (`docs/`)

This section is mandatory. Treat it as a hard gate before any code/doc change.

1. Operational docs must use front-matter metadata (`summary`, `read_when`).
2. Before creating any new doc, you MUST run `pnpm docs:list` first and check whether an existing doc already covers it.
3. Before writing code, you MUST read all docs whose `read_when` matches the task. Do not start implementation before this step.
4. If a relevant operational doc exists, follow it. Do not override documented workflow by preference.
5. If no suitable doc exists, create one with clear `summary` and `read_when` before or alongside implementation.
6. Existing docs to check first: `commit`, `testing`, `mermaid`, `clipboard`, `styles`, `research/wechat-editor-compatibility`.

Enforcement:
- Skipping `pnpm docs:list` or required doc reading is a process violation.
- "I already know this" is not a valid reason to skip this workflow.

## .gitignore must include
- `node_modules/`
- `dist/`
- `skills/**/outputs/`
- common logs/cache/system files
