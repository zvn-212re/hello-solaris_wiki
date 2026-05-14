# Solaris Wiki 开发记录

本文档记录项目开发过程中的关键决策、结构变化、问题修复和后续约定。  
它用于回顾“为什么这样做”，不是替代 `AGENTS.md` 的接手说明。

## 2026-05-14

### 初始项目目标

- 创建个人网站 `solaris.wiki`。
- 使用纯静态 HTML/CSS/JS，优先部署到 Vercel。
- 页面包括首页、项目页、关于页。
- 预留 `data/` 存放后续工程数据 JSON。
- 预留 `api/` 作为 Vercel Serverless Functions 目录。
- 网站定位为记录 Vibe Coding、AI Agent 实验与工程数据工具。

### 初始技术路线

- 不使用 React、Vue 等前端框架。
- 使用原生 HTML/CSS/JS。
- 可引入 Google Fonts 和 Remix Icon。
- 全站导航栏和页脚通过复制 HTML 维护，暂不组件化。
- 通过 Git 管理代码，并部署到 Vercel。

### 视觉方向演进

最初设想是深色科幻极简风：

- 深色背景
- 暖金色强调色
- 浅灰正文
- Space Grotesk 和 Inter 字体

后续根据审美调整，项目演进为当前版本：

- 复古像素风
- 纸张质感背景
- 8-bit 个人档案站
- 硬边框、像素阴影、贴纸式标签
- 米色纸张底色，搭配蓝色、橙色、红色点缀

后续维护以当前复古像素纸张风为准，不再按初始深色方案重做。

### 当前页面基础

已形成这些页面：

- `index.html`：首页
- `projects.html`：项目档案页
- `about.html`：关于页
- `pomodoro.html`：番茄钟展示页
- `pomodoro-tool.html`：独立番茄钟工具页

### 当前脚本基础

已形成这些脚本：

- `js/site-router.js`：静态页面局部切换和导航高亮。
- `js/hero.js`：首页头像、引用切换和主视觉交互。
- `js/music-player.js`：底部音乐播放器。
- `js/pomodoro.js`：番茄钟展示页逻辑。

### 上海信息价系统关系

讨论并确认“上海信息价数据库比对系统”不直接塞进主站目录。

集成约定：

- 信息价系统作为独立 Vercel 应用部署。
- 主站只展示预览卡片、截图或 iframe。
- 主站提供“打开完整版本”的外部链接。
- `projects.html` 中的信息价系统卡片先保持占位状态。

## 2026-05-15

### 新增项目接手说明

新增：

```txt
AGENTS.md
```

记录内容包括：

- 项目定位
- 当前技术状态
- 当前视觉方向
- 页面结构
- 脚本说明
- 已完成事项
- 尚未完成事项
- 上海信息价系统集成约定
- 本地预览建议
- Git 注意事项

该文件只记录工程上下文，不记录人物设定。

### 修复音乐播放器切页停止问题

问题：

- 音乐播放器在切换页面时可能停止。
- 原因是多页面站点可能触发整页刷新，或局部切换后播放器 UI 状态不同步。

处理：

- 将 `js/music-player.js` 改为 `window.SolarisMusic` 全站单例。
- 使用 `localStorage` 保存曲目、音量、面板展开状态。
- 播放按钮文案改为稳定的 `PLAY / PAUSE`。
- 在 `js/site-router.js` 页面局部切换后调用 `window.SolarisMusic?.render()`。

注意：

- 浏览器安全策略不允许页面刷新后自动播放音频。
- 通过 `site-router.js` 局部切换 `index.html`、`projects.html`、`about.html` 时，播放器状态可以保持。
- 如果直接整页跳转到复杂工具页，音乐仍可能停止，这是多页面静态站的正常限制。

### 优化缩放和响应式排版

问题：

- 网页缩放比例过大或过小时，部分布局可能挤压、换行或遮挡。
- 底部固定 footer 在小屏或高缩放时可能遮挡内容。

处理：

- 给关键布局容器补 `min-width: 0`。
- 给文本、按钮、标题等补 `overflow-wrap: anywhere`。
- 项目卡片网格从固定列数改为弹性 `auto-fit + minmax`。
- 按钮允许弹性换行。
- 小屏和低高度场景下，footer 从固定定位改为普通文档流。
- 小屏音乐面板从浮层改为占位展开，避免遮挡页面。

### 验证

已执行：

```bash
node --check js/music-player.js
node --check js/site-router.js
```

结果：通过。

使用临时 Node 静态服务器验证以下资源返回 `200`：

- `/index.html`
- `/projects.html`
- `/js/music-player.js`
- `/css/styles.css`

### 新增夜间模式方案

需求：

- 在网站右上角增加一个互动吊灯。
- 点击吊灯切换白天/夜间模式。
- 夜间模式保持 8-bit 像素风，但转为星际宇宙风格。
- 白天与夜间切换需要有舒缓过渡。

实现：

- 新增 `js/theme-toggle.js`。
- 使用 `localStorage` 保存用户主题选择。
- 使用 `document.documentElement.dataset.theme = "night"` 控制夜间模式。
- 在 `index.html`、`projects.html`、`about.html`、`pomodoro.html` 中加入吊灯按钮。
- 在页面 `<head>` 中加入极小的主题预加载脚本，减少刷新时主题闪烁。
- 在 `css/styles.css` 中加入夜间主题 CSS 变量、像素星空背景和吊灯样式。
- 在 `js/site-router.js` 局部切页后调用 `window.SolarisTheme?.init()`，确保主题按钮状态同步。

设计方向：

- 白天模式保持当前复古像素纸张风。
- 夜间模式转为深蓝黑星空、蓝白星光和暖金点缀。
- 吊灯在 hover 时轻微摇晃，夜间状态下光晕变为蓝白星光。

当前范围：

- 已覆盖主站普通页面和站内番茄钟展示页。
- `pomodoro-tool.html` 是独立内联样式工具页，暂未纳入本轮主题系统，避免影响工具页原有布局。

验证：

```bash
node --check js/theme-toggle.js
node --check js/site-router.js
```

结果：通过。

### 调整导航右对齐

问题：

- 新增吊灯后，导航栏变为 `brand / nav-links / lamp` 三组 flex 子项。
- 原本 `justify-content: space-between` 会让“首页 / 项目 / 关于”处在中间区域，看起来没有贴近右上角。

处理：

- 将 `.nav` 的主轴分布改为 `justify-content: flex-start`。
- 给 `.brand` 添加 `margin-right: auto`。
- 桌面端形成“左侧品牌，右侧导航链接 + 吊灯”的布局。
- 移动端取消 `.brand` 的 `margin-right`，保持纵向堆叠布局。

### 当前待提交改动

当前改动包括：

- `AGENTS.md`
- `docs/development-log.md`
- `index.html`
- `projects.html`
- `about.html`
- `pomodoro.html`
- `css/styles.css`
- `js/theme-toggle.js`
- `js/music-player.js`
- `js/site-router.js`

尚未执行提交。

## 长期约定

后续所有代码项目都需要维护类似的开发记录文档。

推荐路径：

```txt
docs/development-log.md
```

记录范围：

- 需求变化
- 技术路线选择
- 重要设计决策
- 关键代码结构调整
- 问题定位和修复过程
- 尚未完成事项
- 部署和验证结果

`AGENTS.md` 负责记录“当前状态和接手说明”。  
`docs/development-log.md` 负责记录“开发过程和决策历史”。
