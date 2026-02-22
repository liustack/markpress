---
name: mdpress
description: "Convert Markdown files into WeChat Official Account (公众号) editor-ready HTML with inline styles, base64 images, syntax highlighting, and footnote links. Use when user mentions 'WeChat', '公众号', 'markdown to wechat', 'mdpress', '微信公众号', 'WeChat article', '公众号文章', 'WeChat HTML', or needs to convert markdown for WeChat MP editor."
---

# mdpress — WeChat MP HTML

CLI tool to convert Markdown into WeChat Official Account (公众号) editor-compatible HTML.

## Installation

```bash
npm install -g @liustack/mdpress@latest
```

> **Version check**: Before converting, run `mdpress --version`. If the command is not found or the version is outdated, re-run the install command above.

## Usage

```bash
mdpress -i article.md -o output.html
```

Output is JSON:

```json
{
  "input": "/absolute/path/to/article.md",
  "output": "/absolute/path/to/output.html",
  "size": 12345
}
```

## Options

- `-i, --input <path>` — Input Markdown file path (required)
- `-o, --output <path>` — Output HTML file path (required)

## WeChat MP Editor Constraints

> [!IMPORTANT]
> The WeChat MP editor has strict limitations. mdpress handles all of these automatically, but the AI agent should understand the constraints to verify output quality.

- **Inline styles only** — no `<style>`, `<link>`, or `<script>` tags; all CSS must be in `style` attributes
- **Base64 images** — local images are compressed (sharp) and converted to base64 data URIs (≤ 2MB per image)
- **Tag whitelist** — only WeChat-supported tags survive; `<div>` → `<section>`, dangerous tags removed entirely
- **Code whitespace** — `\n` → `<br>`, leading spaces → NBSP, tabs → NBSP pairs
- **External links → footnotes** — external `<a>` tags become text + `<sup>[N]</sup>` with a References section; `mp.weixin.qq.com` links are preserved
- **No class attributes** — all `className` removed; hljs syntax highlighting classes converted to inline color styles

For the full compatibility research, see `docs/research/wechat-editor-compatibility.md`.

## Image Handling

| Source | Behavior |
|--------|----------|
| Local file (relative path) | Compressed via sharp → base64 data URI (PNG preferred, ≤ 2MB) |
| `data:` URI | Skipped (already inline) |
| `http://` / `https://` URL | Skipped (future: download support planned) |
| GIF | Preserved as animated GIF, resized if > 2MB |
| SVG | Base64 encoded directly (no sharp processing) |

> [!CAUTION]
> **Images must use relative paths** from the Markdown file location. Absolute paths or URLs to local files won't resolve correctly.

## Mandatory Workflow (AI Agent MUST Follow)

> [!CAUTION]
> **Every Markdown-to-WeChat conversion MUST follow these steps. Do NOT skip or reorder.**

1. **Prepare Markdown** — Write or locate the Markdown file. Ensure all images use **relative paths** from the Markdown file's directory.
2. **Confirm output path** — Decide where the HTML should be saved (the `-o` path).
3. **Run mdpress** — Execute the conversion:
   ```bash
   mdpress -i article.md -o output.html
   ```
4. **Check result** — Verify the JSON output shows a successful result with `size > 0`.
5. **Deliver** — Tell the user the output HTML path. The HTML can be directly pasted into the WeChat MP editor.

## Pipeline Processing Order

mdpress applies these transformations in sequence:

```
Markdown → remarkParse → remarkGfm → remarkRehype → rehypeRaw
  → 1. rehypeSanitizeTags     (tag whitelist, div→section, checkbox→Unicode, attribute cleanup)
  → 2. rehypeBase64Images     (local images → sharp compress → base64 data URI)
  → 3. rehypeCodeHighlight    (syntax highlighting + whitespace protection)
  → 4. rehypeFootnoteLinks    (external links → footnotes, preserve mp.weixin.qq.com)
  → 5. rehypeInlineStyles     (default styles + hljs colors → inline style attr, remove className)
  → rehypeStringify → HTML
```

## Output Verification Checklist

After conversion, the output HTML should have:

- [ ] No `class=` attributes
- [ ] No `<script>`, `<style>`, `<link>`, `<iframe>`, `<input>`, `<div>` tags
- [ ] All visible elements have `style=` attributes
- [ ] External links replaced with footnote references (`<sup>[N]</sup>`)
- [ ] A `References` section at the end (if external links existed)
- [ ] Code blocks use `<br>` for line breaks and NBSP for indentation
- [ ] Local images converted to `data:image/...;base64,...`
- [ ] Task list checkboxes rendered as ☑ / ☐
