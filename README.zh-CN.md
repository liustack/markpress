# markpress

面向 AI Agent 的 Markdown 转换 CLI，可将 Markdown 输出为编辑器可粘贴的 HTML：

- **微信公众号模式**：内联样式、base64 图片、语法高亮、标签清洗
- **X/Twitter Articles 模式**：语义化子集 HTML、图片占位文本、仅保留 HTTPS 链接

## 特性

- 输出微信公众号编辑器兼容的 HTML
- 输出 X/Twitter Articles 编辑器兼容的 HTML
- 所有样式内联（无外部 CSS 或 `<style>` 标签）
- 本地图片经 sharp 压缩后嵌入为 base64（单张 ≤ 2MB）
- 默认极简主题语法高亮（内联色值）
- Mermaid 流程图渲染为 PNG（通过 Playwright，可选）
- 外部链接自动转为脚注，文末附 References
- 基于白名单的标签清洗（`div` → `section`，危险标签移除）
- 支持 GFM（表格、删除线、任务列表 ☑/☐）
- 默认极简风格样式

## 安装

```bash
npm install -g @liustack/markpress
```

或使用 `npx`：

```bash
npx @liustack/markpress [options]
```

也可以作为 **Agent Skill** 安装 — 在任何支持 Agent Skill 的 AI 编程工具（Claude Code、Codex、OpenCode、Cursor、Antigravity 等）中输入：

```
帮我安装这个 skill：https://github.com/liustack/markpress
```

或使用 `skills` CLI 直接安装：

```bash
npx skills add https://github.com/liustack/markpress --skill markpress
```

## 用法

```bash
# 将 Markdown 转换为公众号可用的 HTML
markpress -i article.md -o output.html

# 将 Markdown 转换为 X/Twitter Articles 可粘贴的 HTML
markpress -i article.md -o output.html --target x
```

输出为 JSON 格式：

```json
{
  "input": "/path/to/article.md",
  "output": "/path/to/output.html",
  "size": 12345
}
```

## 处理流程

markpress 使用 unified（remark + rehype）管线，依次执行 6 个转换：

1. **标签清洗** — 基于白名单过滤标签，`div` → `section`，checkbox → Unicode ☑/☐，移除 `id` 和事件处理器
2. **Mermaid 渲染** — mermaid 代码块通过 Playwright 渲染为 PNG（极简风格主题，可选，需安装 `mermaid` + `playwright`）
3. **图片 base64** — 本地图片经 sharp 压缩（PNG/GIF/SVG/JPEG），嵌入为 data URI（≤ 2MB）
4. **代码高亮** — 基于 highlight.js 的语法高亮，配合空白保护（`\n` → `<br>`，空格 → NBSP）
5. **链接脚注** — 外部链接替换为文本 + `<sup>[N]</sup>`，文末追加 References 区域；保留 `mp.weixin.qq.com` 链接
6. **样式内联** — 默认极简风格按标签注入样式，hljs 类名转为内联色值，移除所有 `className`

输出的 HTML 可直接粘贴到微信公众号编辑器中使用。

## 参数

- `-i, --input <path>` — 输入 Markdown 文件路径（必填）
- `-o, --output <path>` — 输出 HTML 文件路径（必填）
- `-t, --target <target>` — 渲染目标：`wechat`（默认）或 `x`（支持别名 `twitter`）
- `-c, --copy` — 将渲染后的 HTML 复制到系统剪贴板（富文本）

## X/Twitter Articles 模式

使用 `--target x`（或 `--target twitter`）生成适配 X Articles 编辑器的极简语义化 HTML。

- 保留：`h2`、`p`、`strong/b`、`em/i`、`s/del`、`a`、`blockquote`、`ul/ol/li`、`br`
- 移除不支持的结构标签与样式属性
- 所有 Markdown 图片转换为占位文本（`[Image: ...]`）
- 仅 `https://` 链接保留为真实 `<a href="...">`
- 协议相对链接（`//...`）会转换为 `https://...`
- 其他链接（`http`、`mailto`、`tel`、`file`、相对路径、锚点）降级为纯文本

## AI Agent Skill

- [markpress/SKILL.md](skills/markpress/SKILL.md)

## License

MIT
