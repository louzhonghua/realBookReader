# PDF 仿真翻页书籍阅读器

## 背景

用户需要一个前端应用，支持导入 PDF 文件，并以仿真翻页书籍效果展示内容。效果类似于实体书翻页，包含 3D 翻折动画、书脊阴影、页面弯曲等。

## 技术方案

### 核心技术选型

| 技术 | 选择 | 理由 |
|------|------|------|
| 框架 | Vite + React（已有） | 项目已初始化 |
| PDF 解析 | `pdfjs-dist` | Mozilla 官方 PDF 渲染库，将 PDF 页面渲染为 Canvas/图片 |
| 翻页效果 | `page-flip`（StPageFlip） | 无依赖、支持 Canvas 模式和 HTML 模式、支持移动端、API 简洁 |

### 架构设计

```
PDF文件 → pdfjs-dist 解析 → 每页渲染为图片 → page-flip 接管翻页动画

┌─────────────────────────────────────────┐
│  App                                     │
│  ├── UploadScreen（上传界面）             │
│  │   └── PDF 文件拖拽/选择上传            │
│  └── BookViewer（阅读界面）               │
│      ├── FlipBook（翻页书籍组件）         │
│      │   └── page-flip 引擎               │
│      └── Toolbar（底部工具栏）            │
│          ├── 页码指示器                   │
│          ├── 缩略图预览                   │
│          ├── 缩放控制                     │
│          └── 全屏切换                     │
└─────────────────────────────────────────┘
```

### 工作流程

1. 用户在 `UploadScreen` 拖拽或选择 PDF 文件
2. `pdfjs-dist` 加载 PDF，逐页渲染为高清图片（Canvas → dataURL）
3. 图片传入 `FlipBook` 组件，`page-flip` 引擎接管翻页动画
4. 底部 `Toolbar` 提供导航、缩略图、缩放、全屏等控制

---

## Proposed Changes

### 依赖安装

安装 `pdfjs-dist` 和 `page-flip`：
```bash
npm install pdfjs-dist page-flip
```

---

### 核心组件

#### [NEW] [usePdfRenderer.js](file:///Users/didi/Desktop/myself/realBookReader/src/hooks/usePdfRenderer.js)

PDF 解析 Hook，负责：
- 接收 PDF `File` 对象
- 使用 `pdfjs-dist` 逐页渲染为指定分辨率的图片
- 返回 `{ pages: string[], totalPages: number, loading: boolean, progress: number }`
- 支持渲染进度回调

#### [NEW] [UploadScreen.jsx](file:///Users/didi/Desktop/myself/realBookReader/src/components/UploadScreen.jsx)

上传页面组件：
- 拖拽上传区域（Drag & Drop）
- 点击选择文件按钮
- 文件格式校验（仅允许 `.pdf`）
- 精美的渐变背景和动画效果

#### [NEW] [UploadScreen.css](file:///Users/didi/Desktop/myself/realBookReader/src/components/UploadScreen.css)

上传组件样式。

#### [NEW] [FlipBook.jsx](file:///Users/didi/Desktop/myself/realBookReader/src/components/FlipBook.jsx)

翻页书籍核心组件：
- 集成 `page-flip` 库（`PageFlip` 类）
- 接收页面图片数组，动态创建翻页引擎
- 支持鼠标拖拽翻页和点击翻页
- 暴露 `onFlip` 回调用于同步页码
- 书籍边框模拟（封面、书脊效果）

#### [NEW] [FlipBook.css](file:///Users/didi/Desktop/myself/realBookReader/src/components/FlipBook.css)

翻页组件样式，包括书脊阴影、封面效果。

#### [NEW] [Toolbar.jsx](file:///Users/didi/Desktop/myself/realBookReader/src/components/Toolbar.jsx)

底部工具栏组件：
- 当前页码 / 总页码显示
- 翻页按钮（上一页/下一页）
- 缩略图网格预览（点击跳转到指定页）
- 全屏切换

#### [NEW] [Toolbar.css](file:///Users/didi/Desktop/myself/realBookReader/src/components/Toolbar.css)

工具栏样式。

#### [MODIFY] [App.jsx](file:///Users/didi/Desktop/myself/realBookReader/src/App.jsx)

替换模板代码为书籍阅读器主逻辑：
- 状态管理：当前阶段（上传/加载中/阅读）、PDF 页面数据
- 根据状态渲染 `UploadScreen` 或 `BookViewer`

#### [MODIFY] [App.css](file:///Users/didi/Desktop/myself/realBookReader/src/App.css)

替换模板样式为阅读器全局样式。

#### [MODIFY] [index.css](file:///Users/didi/Desktop/myself/realBookReader/src/index.css)

更新全局基础样式（重置、字体、深色背景）。

#### [MODIFY] [index.html](file:///Users/didi/Desktop/myself/realBookReader/index.html)

更新页面标题和 meta 信息。

---

## 关键实现细节

### PDF 渲染策略
- 使用 `pdfjs-dist` 的 `getDocument()` 加载 PDF
- 对每一页调用 `page.render()` 将内容绘制到离屏 Canvas
- Canvas 转为 `dataURL` 或 `Blob URL` 作为图片源
- 渲染比例默认 2x（高清屏适配），可根据屏幕 DPR 调整

### 翻页引擎配置
- 使用 `page-flip` 的 `PageFlip` 类
- 配置宽高比例适配 PDF 原始比例
- 启用 `showCover: true` 使首页作为封面独立展示
- 配置 `flippingTime` 和 `useMouseEvents` 等交互参数

### 视觉设计
- 深色/浅灰色背景，突出书籍本体
- 书籍有绿色封面边框（参考用户提供的图片风格）
- 书脊中间有阴影渐变
- 页面有轻微的纸张纹理感
- 底部半透明磨砂工具栏

---

## Verification Plan

### 浏览器手动验证

完成开发后，使用 browser subagent 进行以下验证：

1. **打开应用** — 访问 `http://localhost:5173`，确认上传界面正常渲染
2. **上传 PDF** — 选择一个测试 PDF 文件上传，确认加载进度条正常显示
3. **翻页效果** — 确认书籍展示正常，页面可以通过鼠标拖拽翻页
4. **工具栏功能** — 确认页码显示、翻页按钮、缩略图等功能正常
5. **视觉效果** — 确认书脊阴影、封面边框、页面弯曲等视觉效果与参考图相似

### 用户手动验证

请用户使用自己的 PDF 文件进行测试，验证：
- 不同页数的 PDF 是否正常加载
- 翻页动画流畅度是否满意
- 移动端触摸翻页是否正常
