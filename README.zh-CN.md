# PagePress

面向 AI Agent 的 PDF 渲染 CLI，可将本地 Markdown 文件输出为高质量 PDF。

## 特性

- 专注 PDF 输出（仅 `pagepress`）
- 仅支持本地 Markdown 文件输入（`.md`）
- 内置 Markdown 模板：`default`、`github`、`magazine`
- 支持 Mermaid 代码块渲染
- 基于 Playwright + Chromium 的稳定打印引擎

## 安装

需要 Node.js 18+。

全局安装 CLI：

```bash
npm install -g @liustack/pagepress
```

然后安装 PDF 渲染所需的 Chromium 浏览器：

```bash
npx playwright install chromium
```

或使用 `npx`：

```bash
npx @liustack/pagepress [options]
```

`pagepress` 基于 Playwright + Chromium 导出 PDF，所以即使使用 `npx`，浏览器安装这一步也仍然需要。

也可以作为 **Agent Skill** 安装，在任何支持 Agent Skill 的 AI 编程工具（Claude Code、Codex、OpenCode、Cursor、Antigravity 等）中输入：

```text
帮我安装这个 skill：liustack/pagepress
```

或使用 `skills` CLI 直接安装：

```bash
npx skills add liustack/pagepress --skill pagepress
```

后续如需检查或升级版本：

```bash
pagepress check-update
pagepress self-update
```

如果 `check-update` 无法连接 registry，会返回 `checked: false`，此时可继续使用本地 CLI。

## 用法

```bash
# Markdown 转 PDF
pagepress -i document.md -o output.pdf --template default
```

## 模板

- `default` - 简洁风格
- `github` - GitHub 风格
- `magazine` - 杂志排版

## 参数

- `-i, --input <path>` 输入 Markdown 路径
- `-o, --output <path>` 输出 PDF 路径
- `-t, --template <name>` Markdown 模板（默认 `default`）
- `--wait-until <state>` `load | domcontentloaded | networkidle`
- `--timeout <ms>` 超时时间（毫秒）
- `--safe` 禁用外部网络请求和 JavaScript 执行

## AI Agent Skill

- [pagepress/SKILL.md](skills/pagepress/SKILL.md)

## License

MIT
