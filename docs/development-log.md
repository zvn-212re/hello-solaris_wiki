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

### 架构整理与站点基础物料

需求：

- 按架构评估建议逐步提高站点可维护性、SEO 和后续扩展能力。
- 保持纯静态站路线，不引入 React/Vue 等前端框架。

处理：

- 新增 `data/projects.json` 作为项目档案数据源。
- 新增 `scripts/build-site.js`，用于从项目数据生成首页、项目页、项目详情页、404 页面和 `sitemap.xml`。
- 新增 `scripts/build-site.ps1`，作为当前 Windows 环境的无 Node fallback 生成脚本。
- 新增 `package.json`，提供 `npm run build`、`npm run build:ps` 和 `npm run check`。
- 重写 `README.md`，补充项目定位、本地预览、构建命令、内容维护方式和页面说明。
- 新增 `404.html`、`robots.txt`、`sitemap.xml`、`favicon.svg`。
- 为主站页面和独立番茄钟工具页补充 canonical、favicon、Open Graph 和 Twitter Card meta。
- 项目档案页中的占位 `href="#"` 替换为不可点击的禁用按钮状态，避免空链接。

脚本调整：

- `js/site-router.js` 扩展局部切页范围，覆盖项目详情页和站内番茄钟页。
- 局部切页后统一重新初始化 Hero、主题、音乐播放器和番茄钟模块，并派发 `solaris:pagechange` 事件。
- `js/pomodoro.js` 改为可重复初始化的页面增强模块，只在存在 `[data-pomodoro-root]` 时绑定计时器。

验证：

- 当前执行环境没有 `node`/`npm`，无法运行 `npm run build` 或 `npm run check`。
- 已使用 `scripts/build-site.ps1` 生成主站页面和 `sitemap.xml`。
- 已检查主站 HTML 中不再存在 `href="#"` 占位链接。

### 定时维护页与 Edge Middleware

需求：

- 网站需要在指定时间段内自动显示维护页。
- 时间结束后自动恢复正常访问。
- 维护页保持 Solaris Wiki 像素纸张风，并支持夜间模式。

处理：

- 新增 `maintenance.html`，作为独立维护页，不依赖主站 CSS。
- 维护页右侧使用 `images/` 中现有 AVIF 图片完整展示。
- 维护页加入单条科幻文学摘录轮播，30 秒自动切换，也可点击手动切换。
- 维护页复用 `solarisTheme`，支持与主站一致的白天/夜间模式。
- 新增 `middleware.js`，使用 Vercel Routing Middleware 判断维护时间窗口。
- 定时维护窗口配置为北京时间每天 `00:00-06:00`。
- 预留 `TEMPORARY_MAINTENANCE_WINDOWS`，后续可将 `enabled` 改为 `true` 并设置临时时间段。
- 临时维护优先级高于每日定时维护。
- 维护期间访问普通页面会临时重定向到 `/maintenance.html`。
- 维护页会根据 URL 参数显示当前是“定时维护”还是“临时维护”。
- 静态资源、`maintenance.html`、`favicon.svg`、`robots.txt`、`sitemap.xml` 会被排除，避免维护页资源加载失败。
- 增加 `maintenance_bypass` 查询参数，用于临时跳过维护重定向。
- `npm run check` 增加 `middleware.js` 语法检查。

验证：

- 已执行 `node --check middleware.js`。
- 已确认 `maintenance.html` 不在 `sitemap.xml` 中，并含有 `noindex`。

### 版本化站点更新与留言区

需求：

- 首页“站点更新”作为每次 commit 的内容总结。
- 编号从 `v.0.0.1` 开始。
- 普通小更新递增末位，例如 `v.0.0.2`、`v.0.0.3`。
- 较大的结构或功能更新使用中位递增，例如 `v.0.1.1`。
- 首页最多默认显示 4 条，点击“显示更多”后同屏显示 7 条。
- 支持翻页查看更早的更新内容。
- 首页最后增加网页留言区。

处理：

- 新增 `data/site-updates.json`，作为站点更新的单一数据源。
- 新增 `js/site-updates.js`，控制默认 4 条、展开 7 条和分页。
- 新增 `js/guestbook.js`，实现静态站本地留言区，留言保存在当前浏览器 `localStorage`。
- 更新 `scripts/build-site.js` 和 `scripts/build-site.ps1`，首页站点更新和留言区都由生成脚本输出。
- 更新 `css/styles.css`，补充版本号、更新控制、分页、留言表单和本地留言列表样式。
- 更新 `js/site-router.js`，局部切页后重新初始化站点更新和留言区模块。

验证：

- 已执行 Node 生成脚本和 PowerShell 生成脚本，均成功生成页面。
- 已执行新增脚本语法检查。
- 已执行 `git diff --check`。

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

### 稳定页面缩放表现

问题：

- 浏览器缩放或不同设备宽度下，部分字体、边框、像素阴影和计时数字会因为 `vw` 参与计算而发生二次缩放。
- 独立番茄钟工具页的倒计时数字也会跟随视口宽度继续变化，容易放大布局挤压。

处理：

- 主站 `css/styles.css` 中将核心视觉尺度从 `vw/clamp()` 改为稳定的 `px/rem`。
- 保留 `1040px`、`860px`、`640px` 响应式断点，在小屏场景单独降低标题和计时数字尺寸。
- 增加 `text-size-adjust: 100%`，避免移动端浏览器额外自动放大文本。
- 同步处理 `pomodoro-tool.html` 的倒计时数字，减少缩放时的布局跳动。

注意：

- 没有使用 `user-scalable=no` 强行禁用用户缩放，避免影响无障碍和浏览器可控性。
- 桌面浏览器的缩放比例不能被网页可靠锁死，本次处理目标是稳定站点内部布局尺度。

### 项目档案改为长条列表

需求：

- `projects.html` 中详细项目展示不再使用多列卡片网格。
- 每个项目改为一行长条样式，方便按项目逐条扫描。

处理：

- 保留现有 HTML 结构，只在 `css/styles.css` 中针对 `.project-grid` 覆盖布局。
- 桌面端项目行使用“左侧像素图标 / 中间项目说明 / 右侧操作按钮”的横向结构。
- 平板和手机端自动收窄，手机端回到上下堆叠，避免按钮和正文挤压。

### 首页新增站点更新区块

需求：

- 首页增加一个区域，用来展示网站最近更新情况。

处理：

- 在 `index.html` 的“最新项目”后新增“站点更新”区块。
- 以三条像素风时间线展示最近改动：项目档案长条列表、缩放稳定、夜间模式和音乐状态保持。
- 在 `css/styles.css` 中新增 `.update-section`、`.update-list`、`.update-item` 等样式。
- 桌面端使用日期 / 更新内容 / 类型标签三列展示，平板和手机端自动收窄。

### 项目档案接入详情页

需求：

- 项目档案里的每个项目长条可以点击进入对应的详细说明页面。
- 详情页先做简单布局，用于预览后续内容组织方式。

处理：

- 在 `projects.html` 的项目行上增加 `data-detail-url`、`tabindex`、`role="link"` 和可访问标签。
- 在 `js/site-router.js` 中增加项目行点击和键盘 Enter/Space 跳转逻辑。
- 保留项目行内部按钮的独立行为，点击按钮不会触发整行跳转。
- 新增 5 个详情页：
  - `project-pomodoro.html`
  - `project-3d-printing.html`
  - `project-agent-workflow.html`
  - `project-claude-notes.html`
  - `project-sh-info-price.html`
- 在 `css/styles.css` 中新增详情页双栏布局、状态面板、项目图标占位和移动端堆叠样式。

### 统一项目标题混排字体

问题：

- 项目名称里经常混排英文和中文，例如 `AI Agent 工作流实验`、`Claude Code 深度使用笔记`。
- 原先项目标题继承像素英文字体，英文使用 `Press Start 2P`，中文回退到微软雅黑，视觉差异过大。

处理：

- 将项目卡片标题、首页更新标题和详情页项目标题改为 `var(--font-ui)`。
- 详情页项目名增加 `project-title` 类，单独控制混排标题尺寸。
- 保留页面主视觉、标签、装饰文字等位置的像素字体，避免整体风格被抹平。

### 本轮提交改动

本轮准备提交的改动包括：

- `docs/development-log.md`
- `index.html`
- `projects.html`
- `pomodoro-tool.html`
- `css/styles.css`
- `js/site-router.js`
- `AGENTS.md`
- `project-pomodoro.html`
- `project-3d-printing.html`
- `project-agent-workflow.html`
- `project-claude-notes.html`
- `project-sh-info-price.html`

提交前验证范围：

- `node --check` 检查 5 个 JS 文件。
- 使用临时静态服务检查首页、项目页、项目详情页、CSS 和关键 JS 资源返回 `200`。

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

## 2026-05-17

### CMS 与公开互动地基

- 新增 `/admin/` Decap CMS 入口，用于手机端编辑文章、项目草稿和站点更新草稿。
- 新增 `content/posts/` Markdown 内容目录，并增加 `scripts/build-cms-content.js`，构建时生成 `articles.html`、文章详情页、搜索索引和 sitemap。
- 新增 `/api/guestbook`、`/api/submissions`、`/api/moderation`，通过 Supabase 存储公开留言、访客投稿和审核状态。
- 首页留言区改为优先读取公开留言 API，未配置 Supabase 时自动退回浏览器本地留言。
- 新增 `submit.html` 投稿页、`moderation.html` 审核台和 `search.html` 站内搜索页。
- 新增 `docs/cms-setup.md`，记录 Vercel 环境变量、Supabase SQL 和后台使用说明。

### 架构与视觉审阅整改

发现的问题：

- 项目已经接入构建、CMS、API 和 Supabase，但 README 与 `AGENTS.md` 仍描述为“无构建、无 package、api/data 预留”。
- `scripts/build-site.js` 只写入 `dist/`，根目录 HTML 会滞后，导致本地直接预览和 Vercel 输出不一致。
- 定时维护默认每天 00:00-06:00 生效，线上可用性风险过高。
- `site-router.js` 未覆盖文章、搜索、投稿页面，也未初始化搜索和投稿脚本；带 hash 的站内链接会被拦截后滚回顶部。
- CMS 生成页缺少分享 meta，页脚没有音乐播放器但加载了音乐脚本。
- 搜索页、投稿页的 head、页脚和脚本集合与主站不一致。
- 移动端导航仍按 3 列排布，但主导航已经变为 4 个入口。
- 登录页“保持登录”勾选项没有真实持久化逻辑，会误导用户。
- 投稿正文前端没有长度限制提示，服务端会静默截断。

处理：

- 更新 README 与 `AGENTS.md`，记录当前构建、CMS、API、数据源和部署方式。
- `scripts/build-site.js` 同时写入根目录和 `dist/`；`scripts/build-cms-content.js` 同时写入根目录和 `dist/` 的搜索索引。
- `middleware.js` 为每日定时维护增加 `enabled: false` 显式开关，默认不自动封站。
- 扩展 `site-router.js` 的可路由页面，支持文章、搜索、投稿、hash 滚动，并初始化搜索/投稿模块。
- CMS 文章模板补齐 theme-color、OG、Twitter Card 和音乐播放器页脚。
- 搜索页、投稿页补齐 meta、统一页脚播放器和路由脚本；投稿正文增加 `maxlength="8000"`。
- 移动端主导航从 3 列改为 2 列，避免 4 个入口排成不平衡的 3+1。
- 移除登录页未使用的“保持登录”勾选和对应 localStorage 逻辑。

验证：

- 已运行 `powershell -NoProfile -ExecutionPolicy Bypass -File scripts\build-site.ps1`，成功生成 10 个主站页面、1 个 CMS 文章页、文章列表、搜索索引和 sitemap。
- 已使用同一本机 Node 路径对 `package.json` 中覆盖的 JS 文件执行 `node --check`，全部通过。
- 当前环境的默认 `node` / `npm` 不在 PATH；构建脚本通过本机 fnm Node 路径完成验证。

### 整站私有访问

需求：

- 打开 Solaris Wiki 时先验证登录，不再让首页作为公开入口。

处理：

- 新增 `api/auth.js`，通过服务端配置校验访问凭据，成功后设置 `HttpOnly`、`SameSite=Lax` 的 `solaris_site_session` Cookie。
- 新增 `lib/auth-session.js`，封装服务端 session 签名、Cookie 创建和审核 API 复用校验。
- `middleware.js` 改为默认拦截普通页面、文章、数据文件和 API；未登录访问页面会跳到 `/login.html?next=...`，未登录访问 API 返回 `401` JSON。
- `/css/`、`/js/`、`/images/`、`favicon.svg`、`/api/auth` 和 `/maintenance.html` 保持公开，以便登录页和维护页正常渲染。
- `login.html` 和 `js/login.js` 改为私有访问登录，不再把 token 作为前端登录状态保存。
- `js/moderation-dashboard.js` 改为优先依赖站点登录 Cookie，令牌输入框仅作为备用手动方式。
- 更新 README、`AGENTS.md` 和 `docs/cms-setup.md`，记录整站私有访问逻辑和 `SOLARIS_AUTH_MAX_AGE_SECONDS` 可选环境变量。

### 双通道真实访问验证

需求：

- 访问验证页作为独立首页使用。
- 支持访客邀请码登录和管理员账号密码登录。
- 访客只能访问普通受保护内容；管理员可以进入 CMS 和审核台。

处理：

- `login.html` 改为双标签页：访客邀请码和管理员登录。
- `js/login.js` 增加标签页切换、前端格式校验、`/api/auth` 双通道请求、`sessionStorage` 非权威状态记录和成功转场动画。
- `api/auth.js` 支持 `visitor` / `admin` 两种模式：访客邀请码默认 `SOLARIS2026`，管理员默认 `admin` / `solaris2026`，生产环境可用环境变量覆盖。
- `lib/auth-session.js` 将 Cookie 改为 `role.expiresAt.signature`，签名包含角色，防止访客伪造管理员。
- `middleware.js` 读取 Cookie 后按角色放行：`visitor` 可访问普通页面和数据，`admin` 可访问 `/admin/`、`/moderation.html` 和 `/api/moderation`。
- `css/auth.css` 增加双标签页、登录卡片发光、卡片淡出和全屏访问通过遮罩动画。
- 更新 `README.md`、`AGENTS.md` 和 `docs/cms-setup.md` 中的访问策略与环境变量说明。

## 2026-05-18

### 真实上线配置收紧

发现的问题：

- 管理员登录会在未配置 `SOLARIS_ADMIN_PASSWORD` 时回退到旧的 `SOLARIS_ADMIN_TOKEN`，容易造成“页面密码不对”的误解。
- 生产环境缺少关键登录环境变量时仍可能使用演示默认值，不适合作为真实私有站。
- 登录页上的辅助链接会让本地静态预览看起来可以绕过权限；实际 middleware 只在 Vercel / `vercel dev` 生效。
- 留言区在 API 或 Supabase 未配置时会自动退回浏览器本地存储，容易被误认为线上留言已经生效。

处理：

- `api/auth.js` 生产环境必须配置 `SOLARIS_AUTH_SECRET`、`SOLARIS_VISITOR_INVITE_CODE`、`SOLARIS_ADMIN_USERNAME` 和 `SOLARIS_ADMIN_PASSWORD`。
- `SOLARIS_ADMIN_TOKEN` 仅保留为审核 API 备用 header 令牌，不再作为网页登录密码。
- `middleware.js` 与 `lib/auth-session.js` 生产环境只信任 `SOLARIS_AUTH_SECRET` 签名 Cookie；本地开发才允许演示默认值。
- 登录页辅助链接改为回到 `login.html?next=...`，避免在静态预览中形成误导性入口。
- `js/guestbook.js` 改为云端留言模式，Supabase/API 未配置时明确报错，不再写入本地留言。
- 新增 `supabase/schema.sql`，集中保存留言和投稿表结构。

### 全局架构审查与整改

发现的问题：

- `pomodoro-tool.html` 是 sitemap 和项目入口中引用的真实页面，但没有被复制到 Vercel `dist/` 输出目录。
- 私有站仍使用 `robots.txt` 的 `Allow: /`，会诱导搜索引擎抓取登录保护页面。
- `vercel.json` 缺少基础安全响应头和私有内容缓存控制。
- `/api/auth`、留言和投稿接口缺少基础限流，公开邀请码泄露后容易被刷。
- API JSON 解析失败会落到 500，不利于定位前端请求问题。
- SPA 局部路由在登录过期后可能把 `login.html` 的主体误替换进当前页面。
- 登录后没有明确的退出入口，只能手动清 Cookie。
- 审核台允许 `hidden` 状态，但初版 Supabase schema 没把 `hidden` 放进状态约束。

处理：

- `scripts/build-site.js` 将 `pomodoro-tool.html` 纳入静态复制列表。
- `robots.txt` 改为私有期 `Disallow: /`。
- `vercel.json` 增加 `Cache-Control: private, no-store`、`X-Content-Type-Options`、`X-Frame-Options`、`Referrer-Policy`、`Permissions-Policy` 和 HSTS。
- `lib/supabase-api.js` 增加轻量 IP 限流、API `no-store`、JSON 400 错误和管理员备用令牌恒定时间比较。
- `api/auth.js`、`api/guestbook.js`、`api/submissions.js` 接入限流。
- `js/site-router.js` 在 fetch 被重定向到登录页时改为整页跳转，并修正可读性缩进。
- 新增 `js/session-controls.js`，全站底部“退出”按钮调用 `DELETE /api/auth` 清理 Cookie。
- `supabase/schema.sql` 状态约束加入 `hidden`。
- `data/site-updates.json` 新增 `v.0.3.0`，记录真实访问验证、云端留言和私有站安全加固。

### Supabase 配置安全边界

说明：

- service role key 只能安全地放在服务端环境变量中，用于 Vercel API 访问已存在的表。
- 创建表结构仍应通过 Supabase SQL Editor、Supabase CLI、数据库连接串或 Management API migration 完成，不能把 service role key 写进前端或仓库。
- 当前本机没有 `psql` 和 Supabase CLI，因此新增 `scripts/check-supabase.js` 作为连通性检查，而不是直接建表工具。

处理：

- 新增 `npm run check:supabase`，读取 `.env.local` / `.env` 中的 `SUPABASE_URL` 和 `SUPABASE_SERVICE_ROLE_KEY`，验证 `guestbook_messages` 与 `content_submissions` 是否可访问。
- 文档补充 `.env.local` 示例和检查命令，避免在聊天或 Git 中暴露密钥。

## 2026-05-20

### 上海信息价独立应用接入主站

需求：

- 主站中的“上海信息价数据库比对系统”不再只保留占位状态。
- 在独立应用完成 82 期材料信息价扩容后，把 Solaris Wiki 的首页卡片、项目列表和详情页接上可预览入口。

处理：

- 更新 `data/projects.json` 中的信息价项目描述、标签、状态行和按钮。
- 首页最新项目卡片现在显示 82 期材料信息价采集与懒加载查询预览。
- 项目档案页和详情页更新为 82 期数据状态，公开页面暂不暴露本机预览地址。
- 详情页补充数据范围 `2019.05 - 2026.04`、`82期 / 541,830条` 和正式外链待接入状态。

后续：

- 独立应用部署到 Vercel 后，需要把主站按钮中的本地地址替换为正式外链。

### 站内查询工具与登录页风格统一

需求：

- 价格查询项目需要在 Solaris Wiki 网站中可直接使用，不再只停留在项目说明或占位按钮。
- 登录页面需要和主站当前复古像素纸张风统一。

处理：

- 新增 `tools/sh-info-price/`，实现站内静态查询工具：
  - 读取相邻独立项目 `H:\codex\sh-info-price\public\data` 中的 `manifest.json`、`latest.json`、`search-index.json` 和按材料拆分的历史文件。
  - 支持关键词检索、分页、材料历史趋势 SVG 折线图、两个月份含税信息价对比和 CSV 导出。
  - 使用主站导航、页脚、昼夜主题和像素纸张风控件。
- 新增 `scripts/build-price-app.js`，主站构建后把查询工具挂载到：
  - `dist/sh-info-price/`：Vercel 输出目录。
  - `sh-info-price/`：本地静态预览目录，已加入 `.gitignore`。
- 更新 `data/projects.json`，首页卡片、项目档案和项目详情页都指向 `sh-info-price/`。
- 更新 `js/site-router.js`，让 `/sh-info-price/` 走整页导航，避免 SPA 局部路由误吞独立工具页。
- 更新 `js/session-controls.js`，退出登录统一跳转到 `/login.html`，兼容子路径页面。
- 新增 `scripts/serve-static.js` 和 `npm run serve`，用于在没有 Python 的本机环境中预览需要 `fetch()` 读取 JSON 的静态页面。
- 重写 `css/auth.css`，将登录页从深色山景风改为和主站一致的纸张网格、硬边框、像素阴影、彩条、像素标签和昼夜主题。
- `login.html` 增加主题预加载、吊灯按钮和登录按钮图标。

说明：

- 曾尝试让独立 Next.js 项目做 `/sh-info-price/` 子路径静态导出，但当前本机 Next CLI 在构建启动阶段长时间卡住。为保证站内可用，本轮采用主站轻量静态工具复用同一份数据的方案；独立 Next 项目源码仍保留，不直接塞入主站。

验证：

- `node --check scripts/build-price-app.js`
- `node --check scripts/serve-static.js`
- `node --check tools/sh-info-price/price-tool.js`
- `node --check js/site-router.js`
- `node --check js/session-controls.js`
- `node scripts/build-site.js`
- `node scripts/build-cms-content.js`
- `node scripts/build-price-app.js`
- 本地临时静态服务检查以下资源返回 `200`：
  - `/sh-info-price/`
  - `/sh-info-price/data/manifest.json`
  - `/sh-info-price/price-tool.js`
  - `/login.html`
  - `/css/auth.css`
- `/sh-info-price/data/manifest.json` 读到最新期 `2026-04`，总记录数 `541,830`。

### 修复生产环境查询工具未挂载

问题：

- Vercel 构建主站时只有 `solaris-wiki` 仓库，不一定存在本机相邻目录 `H:\codex\sh-info-price`。
- 旧版 `scripts/build-price-app.js` 在找不到本地 `public/data` 时会生成“查询工具未挂载”兜底页，导致线上按钮进入后不可用。

处理：

- `scripts/build-price-app.js` 改为始终挂载 `tools/sh-info-price/` 查询工具。
- 如果本地存在 `sh-info-price/public/data`，构建时继续复制本地数据。
- 如果本地数据不存在，不再生成兜底页；前端工具会先尝试 `/sh-info-price/data/*`，失败后自动从 `https://raw.githubusercontent.com/zvn-212re/sh-info-price/main/public/data/` 读取数据。

验证：

- `node --check scripts/build-price-app.js`
- `node --check tools/sh-info-price/price-tool.js`
- 使用不存在的 `SH_INFO_PRICE_DIR` 模拟生产环境，构建结果仍生成真实查询工具入口，不再包含“查询工具未挂载”。

### 切换为独立部署与正式静态数据源

处理：

- 信息价主入口改为独立应用 `https://sh-info-price.vercel.app/`，主站卡片与详情页按钮改为外链打开。
- 主站备用 `/sh-info-price/` 工具新增 `price-config.js` 运行时配置，默认读取 `https://sh-info-price.vercel.app/data/`。
- `tools/sh-info-price/price-tool.js` 移除 GitHub raw 数据源，正式数据读取失败时不再回退到 GitHub。
- `scripts/build-price-app.js` 默认不再复制完整本地 `public/data`，仅在 `SH_INFO_PRICE_COPY_LOCAL_DATA=1` 时为离线预览复制数据。
- 新增 `docs/sh-info-price-static-hosting.md` 记录主站环境变量与负荷判断。

## 2026-05-21

### 修复信息价入口 404 与 CMS 可视化管理

问题：

- 主站信息价项目按钮指向独立应用域名，线上域名未就绪时会进入 404。
- `/admin/` 已接入 Decap CMS，但主要管理文章、项目草稿和更新草稿，不能直接可视化维护驱动页面的项目档案和站点更新数据。

处理：

- 将信息价项目首页卡片、项目档案按钮和详情页按钮固定改为站内 `/sh-info-price/` 查询工具。
- 移除主站构建时用 `SH_INFO_PRICE_APP_URL` 覆盖项目按钮的逻辑，避免生产环境遗留变量再次把入口改到失效外链。
- 将 `data/projects.json` 和 `data/site-updates.json` 调整为 Decap CMS 更容易编辑的对象结构，并让构建脚本兼容数组旧结构。
- `/admin/` 新增“站点数据”集合，可视化维护项目档案、项目详情、按钮、状态信息和首页站点更新。
- 更新 README、CMS 文档、信息价静态托管说明和接手说明。

验证：

- `node --check scripts/build-site.js`
- `node --check scripts/build-cms-content.js`
- `node --check scripts/build-price-app.js`
- `node --check tools/sh-info-price/price-tool.js`
- `node scripts/build-site.js`
- `node scripts/build-cms-content.js`
- `node scripts/build-price-app.js`
- `powershell -NoProfile -ExecutionPolicy Bypass -File scripts\build-site.ps1`
- 临时本地 HTTP 服务检查 `/`、`/projects.html`、`/project-sh-info-price.html` 和 `/sh-info-price/` 均返回 `200`。
- `npm run check` / `npm run build` 在当前沙箱内因 npm 读取 `C:\Users\banabann` 被拒绝失败；已用等价 Node 脚本完成验证。
