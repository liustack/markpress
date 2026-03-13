# MarkPress

面向 AI Agent 的 PDF 渲染 CLI，可将本地 Markdown 文件输出为高质量 PDF。

## 特性

- 专注 PDF 输出（仅 `markpress`）
- 仅支持本地 Markdown 文件输入（`.md`）
- 内置 Markdown 模板：`default`、`github`、`magazine`
- 支持 Mermaid 代码块渲染
- 基于 Playwright + Chromium 的稳定打印引擎

## 安装

```bash
npm install -g @liustack/markpress
npx playwright install chromium
```

或使用 `npx`：

```bash
npx @liustack/markpress [options]
```

## 用法

```bash
# Markdown 转 PDF
markpress -i document.md -o output.pdf --template default
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

- [markpress/SKILL.md](skills/markpress/SKILL.md)

## License

MIT
