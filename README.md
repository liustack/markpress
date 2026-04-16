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

Requires Node.js 18+.

Install the CLI globally:

```bash
npm install -g @liustack/markpress
```

Then install the Chromium browser used for PDF rendering:

```bash
npx playwright install chromium
```

Or run with `npx`:

```bash
npx @liustack/markpress [options]
```

`markpress` renders PDFs through Playwright + Chromium, so the browser install step is required even if you use `npx`.

Or install as an **Agent Skill** — tell any AI coding tool that supports agent skills (Claude Code, Codex, OpenCode, Cursor, Antigravity, etc.):

```text
Install the skill from liustack/markpress
```

Or use the `skills` CLI directly:

```bash
npx skills add liustack/markpress --skill markpress
```

To check for updates later:

```bash
markpress check-update
markpress self-update
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
