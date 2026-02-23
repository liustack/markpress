# markpress

A CLI toolkit for AI agents to convert Markdown into editor-ready HTML:

- **WeChat MP mode**: inline styles, base64 images, syntax highlighting, tag sanitization
- **X Articles mode**: semantic HTML subset, image placeholders, link-preserving plain content

中文说明请见：[README.zh-CN.md](README.zh-CN.md)

## Features

- WeChat MP editor compatible HTML output
- X/Twitter Articles editor compatible HTML output
- All styles inlined (no external CSS or `<style>` tags)
- Local images compressed via sharp and embedded as base64 (≤ 2MB)
- Syntax highlighting with default theme (inline colors)
- Mermaid diagram rendering to PNG (via Playwright, optional)
- External links converted to footnotes with References section
- Tag sanitization (whitelist-based, `div` → `section`, dangerous tags removed)
- GFM support (tables, strikethrough, task lists with ☑/☐)
- Minimalist default style

## Installation

```bash
npm install -g @liustack/markpress
```

Or run with `npx`:

```bash
npx @liustack/markpress [options]
```

Or install as an **Agent Skill** — tell any AI coding tool that supports agent skills (Claude Code, Codex, OpenCode, Cursor, Antigravity, etc.):

```
Install the skill from https://github.com/liustack/markpress
```

Or use the `skills` CLI directly:

```bash
npx skills add https://github.com/liustack/markpress --skill markpress
```

## Usage

```bash
# Convert Markdown to WeChat-ready HTML
markpress -i article.md -o output.html

# Convert Markdown to X/Twitter Articles editor-ready HTML
markpress -i article.md -o output.html --target x
```

Output is JSON:

```json
{
  "input": "/path/to/article.md",
  "output": "/path/to/output.html",
  "size": 12345
}
```

## What It Does

markpress runs your Markdown through a unified (remark + rehype) pipeline that applies 6 transformations in order:

1. **Sanitize tags** — whitelist-based tag filtering, `div` → `section`, checkbox → Unicode ☑/☐, remove `id` and event handlers
2. **Mermaid diagrams** — mermaid code blocks rendered to PNG via Playwright with minimalist theme (optional, requires `mermaid` + `playwright`)
3. **Base64 images** — local images compressed with sharp (PNG/GIF/SVG/JPEG) and embedded as data URIs (≤ 2MB limit)
4. **Code highlighting** — syntax highlighting via highlight.js with whitespace protection (`\n` → `<br>`, spaces → NBSP)
5. **Footnote links** — external links replaced with text + `<sup>[N]</sup>`, References section appended; `mp.weixin.qq.com` links preserved
6. **Inline styles** — minimalist default styles injected per tag, hljs classes converted to inline colors, all `className` removed

The result is a self-contained HTML file that can be directly pasted into the WeChat Official Account editor.

## Options

- `-i, --input <path>` — Input Markdown file path (required)
- `-o, --output <path>` — Output HTML file path (required)
- `-t, --target <target>` — Render target: `wechat` (default) or `x` (`twitter` alias)
- `-c, --copy` — Copy rendered HTML to system clipboard as rich text

## X/Twitter Articles Mode

Use `--target x` (or `--target twitter`) to generate a minimal semantic HTML subset for X Articles editor paste.

- Keeps: `h2`, `p`, `strong/b`, `em/i`, `s/del`, `a`, `blockquote`, `ul/ol/li`, `br`
- Drops unsupported structure/style tags
- Converts every Markdown image into placeholder text (`[Image: ...]`)
- Keeps only `https://` links as real `<a href="...">` anchors
- Converts protocol-relative links (`//...`) to `https://...`
- Downgrades non-HTTPS links (`http:`, `mailto:`, `tel:`, `file:`, relative paths, anchors) to plain text

## AI Agent Skill

- [markpress/SKILL.md](skills/markpress/SKILL.md)

## License

MIT
