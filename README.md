# MarkPress

A CLI toolkit for AI agents to render local Markdown files into high-quality PDF documents.

中文说明请见：[README.zh-CN.md](README.zh-CN.md)

## Features

- PDF-only command surface (`markpress`)
- Local Markdown file input only (`.md`)
- Built-in Markdown templates: `default`, `github`, `magazine`
- Built-in Mermaid rendering for Markdown code blocks
- Deterministic output via Playwright + Chromium print engine

## Installation

```bash
npm install -g @liustack/markpress
npx playwright install chromium
```

Or run with `npx`:

```bash
npx @liustack/markpress [options]
```

## Usage

```bash
# Markdown to PDF
markpress -i document.md -o output.pdf --template default
```

## Templates

- `default` - Clean minimalist style
- `github` - GitHub style
- `magazine` - magazine layout

## Options

- `-i, --input <path>` input Markdown file path
- `-o, --output <path>` output PDF file path
- `-t, --template <name>` template for Markdown input (default: `default`)
- `--wait-until <state>` `load | domcontentloaded | networkidle`
- `--timeout <ms>` timeout in milliseconds
- `--safe` disable external network requests and JavaScript execution

## AI Agent Skill

- [markpress/SKILL.md](skills/markpress/SKILL.md)

## License

MIT
