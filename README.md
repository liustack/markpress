# PagePress

A CLI toolkit for AI agents to render local Markdown files into high-quality PDF documents.

中文说明请见：[README.zh-CN.md](README.zh-CN.md)

## Features

- PDF-only command surface (`pagepress`)
- Local Markdown file input only (`.md`)
- Built-in Markdown templates: `default`, `github`, `magazine`
- Built-in Mermaid rendering for Markdown code blocks
- Deterministic output via Playwright + Chromium print engine

## Installation

Requires Node.js 18+.

Install the CLI globally:

```bash
npm install -g @liustack/pagepress
```

Then install the Chromium browser used for PDF rendering:

```bash
npx playwright install chromium
```

Or run with `npx`:

```bash
npx @liustack/pagepress [options]
```

`pagepress` renders PDFs through Playwright + Chromium, so the browser install step is required even if you use `npx`.

Or install as an **Agent Skill** — tell any AI coding tool that supports agent skills (Claude Code, Codex, OpenCode, Cursor, Antigravity, etc.):

```text
Install the skill from liustack/pagepress
```

Or use the `skills` CLI directly:

```bash
npx skills add liustack/pagepress --skill pagepress
```

To check for updates later:

```bash
pagepress check-update
pagepress self-update
```

If `check-update` cannot reach the registry, it returns `checked: false` and you can continue using the local CLI.

## Usage

```bash
# Markdown to PDF
pagepress -i document.md -o output.pdf --template default
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

- [pagepress/SKILL.md](skills/pagepress/SKILL.md)

## License

MIT
