---
summary: 'Clipboard: @crosscopy/clipboard native approach, why not Playwright headless'
read_when:
  - Modifying clipboard copy behavior
  - Debugging clipboard paste issues in WeChat editor
  - Considering alternative clipboard approaches
---

# 剪贴板技术决策

> 调研日期：2026-02-23

## 最终方案

**`@crosscopy/clipboard`** — 原生系统剪贴板 API（Rust + napi-rs）

```typescript
import { setHtml } from '@crosscopy/clipboard';
await setHtml(html); // 直接写入 text/html MIME type
```

## 为什么不用 Playwright 无头模式

Playwright headless Chromium **不支持系统剪贴板**（Issue #24039）。`navigator.clipboard` 在无头模式下不可用，`Cmd+C` 只写入浏览器内部剪贴板，不写入系统剪贴板。

### 之前的方案（已废弃）

Playwright headed 模式，窗口移到屏幕外：

```typescript
// 已废弃 — 需要启动完整浏览器窗口
const browser = await chromium.launch({
    headless: false,
    args: ['--window-position=-32000,-32000'],
});
// ... load HTML → select all → Cmd+C → close browser
```

问题：
- 启动完整 Chromium 实例，约 1-2 秒延迟
- 窗口会短暂闪现（macOS Dock 中可见）
- 依赖 Playwright + Chromium 二进制（~200MB）

### 为什么选择 @crosscopy/clipboard

| 对比项 | Playwright headed | @crosscopy/clipboard |
|--------|------------------|---------------------|
| 速度 | ~1-2s（启动浏览器） | ~10ms（原生调用） |
| 依赖 | playwright + chromium (~200MB) | napi-rs addon (~2MB) |
| 可靠性 | 窗口定位 hack，可能闪现 | 直接系统 API 调用 |
| text/html | 通过 Cmd+C 模拟 | 直接写入 MIME type |
| 跨平台 | macOS/Linux/Windows | macOS/Linux/Windows |

## 注意事项

- `@crosscopy/clipboard` 是 native addon，需要对应平台的预编译二进制
- Playwright 仍然用于 mermaid 图表渲染（独立场景，不涉及剪贴板）
- `getHtml()` 可用于测试验证（写入后读回对比）
