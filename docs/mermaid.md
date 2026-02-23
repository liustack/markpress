---
summary: 'Mermaid rendering: Playwright screenshot approach, Retina quality, SVG post-processing, known limitations'
read_when:
  - Modifying rehype-mermaid plugin
  - Debugging mermaid diagram rendering quality or layout
  - Considering alternative mermaid rendering approaches
---

# Mermaid 渲染技术决策

> 调研日期：2026-02-22

## 最终方案

**Playwright + deviceScaleFactor: 2 + `<img width>` 属性**

1. 在 Playwright Chromium 中注入 mermaid.min.js 渲染 SVG
2. `deviceScaleFactor: 2` 生成 2x 像素密度 PNG（Retina 清晰度）
3. 截图前读取 SVG 的 CSS boundingBox 宽度
4. `<img width="cssWidth">` 让 2x PNG 以 1x CSS 尺寸显示
5. SVG 后处理：圆角、边标签间距、cluster 标签偏移

## 为什么选这个方案

### 为什么不用 deviceScaleFactor: 1

手机屏幕 1 CSS 像素 = 2~3 物理像素。1x PNG 在高密度屏幕上会被拉伸，文字和线条模糊。
2x PNG + `<img width>` 是标准 Retina 图片做法（和 `@2x` 图片同理）。

**实测结果：** 1x 截图"不是很清晰（质量问题），但比例正常"。

### 为什么不用 sharp SVG→PNG

sharp 底层使用 librsvg，**不支持 `<foreignObject>`**。
mermaid 在 `htmlLabels: true`（默认）下使用 foreignObject + HTML 渲染文字标签。

设置 `htmlLabels: false` 可以绕过，但会导致：
- 文字换行失效（所有文字变成单行）
- 富文本格式丢失
- CJK 字符排版异常

### 为什么不通过 mermaid API 控制输出尺寸

mermaid 没有 API 分离"渲染质量"和"输出尺寸"。
官方 mermaid-cli 也是用 Puppeteer 的 deviceScaleFactor（默认 `--scale 1`）。

### 对比 pagepress

pagepress 将 mermaid SVG 直接嵌入 PDF（矢量→矢量），不需要位图转换。
mdpress 必须输出 PNG 位图，因为微信公众号编辑器不支持 SVG。

## SVG 后处理

在 mermaid 渲染完成后、截图前，对 SVG DOM 做以下修改：

| 处理 | 选择器 | 操作 |
|------|--------|------|
| 节点圆角 | `.node rect` | `rx=12, ry=12` |
| Cluster 圆角 | `.cluster rect` | `rx=12, ry=12` |
| 边标签圆角 | `.edgeLabel rect` | `rx=6, ry=6` |
| 边标签背景 | `.labelBkg` | `padding: 2px 8px; border-radius: 6px; background: #f6f8fa` |
| foreignObject 扩展 | `.edgeLabel foreignObject` | 宽高各加 px/py 适应 padding |
| Cluster 标签下移 | `.cluster-label` | y 偏移 +8px |

## SVG z-ordering（已知限制）

### 问题

mermaid SVG 的 DOM 顺序为：`clusters → edgePaths → edgeLabels → nodes`

- **节点在最上层**（正确）：节点矩形和文字不会被边线遮挡
- **边线在 cluster 标题上方**（mermaid 限制）：跨 subgraph 的边线会穿过 subgraph 标题文字

### 尝试过的修复

1. **移动 `.nodes` 到末尾** — 无效，`.nodes` 已经是最后一个子元素
2. **移动 `.cluster-label` 到 `.edgeLabels` 之后** — 能修复标题被遮挡，但会导致其他复杂图表出现新问题（cluster 标签脱离 cluster 背景的上下文）

### 结论

接受 mermaid 默认渲染顺序。边线穿过 subgraph 标题是 mermaid 自身的布局行为，不是 bug。对于需要完美层级关系的场景，建议用户调整 mermaid 图表结构避免跨 subgraph 长连线。

## 主题配置

极简灰色主题，匹配 mdpress 整体设计语言：

- 节点背景：`#f6f8fa`，边框：`#e5e5ea`
- 连线颜色：`#86868b`
- 文字颜色：`#1d1d1f`
- 字体：`-apple-system, BlinkMacSystemFont, "PingFang SC", "Hiragino Sans GB", sans-serif`

Flowchart 配置：`curve: 'basis'`, `htmlLabels: true`, `useMaxWidth: true`

## 依赖

mermaid + playwright 是可选依赖，动态 import。无 mermaid 代码块时零开销。
