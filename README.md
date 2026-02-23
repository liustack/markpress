# mdpress

A CLI toolkit for AI agents to convert Markdown into WeChat MP-ready HTML with inline styles, base64 images, and tag sanitization.

中文说明请见：[README.zh-CN.md](README.zh-CN.md)

## Features

- WeChat MP editor compatible HTML output
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
npm install -g @liustack/mdpress
```

Or run with `npx`:

```bash
npx @liustack/mdpress [options]
```

Or install as an **Agent Skill** — tell any AI coding tool that supports agent skills (Claude Code, Codex, OpenCode, Cursor, Antigravity, etc.):

```
Install the skill from https://github.com/liustack/mdpress
```

Or use the `skills` CLI directly:

```bash
npx skills add https://github.com/liustack/mdpress --skill mdpress
```

## Usage

```bash
# Convert Markdown to WeChat-ready HTML
mdpress -i article.md -o output.html
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

mdpress runs your Markdown through a unified (remark + rehype) pipeline that applies 6 transformations in order:

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

## AI Agent Skill

- [mdpress/SKILL.md](skills/mdpress/SKILL.md)

## License

MIT
