# Solaris Wiki 接手说明

## 项目概况

项目名：Solaris Wiki  
域名目标：`solaris.wiki`  
项目路径：`H:\codex\personl web\solaris-wiki`  
远端仓库：`https://github.com/zvn-212re/hello-solaris_wiki.git`  
部署目标：Vercel  

这是一个以静态页面为主、带轻量构建和少量 Vercel API 的个人网站，用于记录 Vibe Coding、AI Agent 实验、工程数据工具、个人项目和技术笔记。

## 当前技术状态

- 使用原生 HTML/CSS/JavaScript。
- 没有前端框架，但已有零依赖 Node 构建脚本和 `package.json`。
- `vercel.json` 使用 `npm run build`，输出目录为 `dist`。
- 根目录 HTML 可以直接打开；涉及局部路由、搜索、投稿或 API 时建议用 Vercel 预览或 `vercel dev`，普通静态服务器不会执行 middleware。
- `api/` 已启用 Vercel Serverless Function，用于留言、投稿和审核。
- 当前访问策略为整站私有访问，未登录访问普通页面会先跳转到 `login.html`。
- `login.html` 是双通道独立访问首页：访客邀请码进入普通内容，管理员账号密码进入 `/admin/` 和审核台。
- `api/auth.js` 校验访客邀请码或管理员账号密码，并设置带角色签名的 `HttpOnly` Cookie；`middleware.js` 根据该 Cookie 中的 `visitor/admin` 角色放行站点页面和 API。生产环境必须配置 `SOLARIS_AUTH_SECRET`、访客邀请码和管理员账号密码。
- `api/auth.js`、`api/guestbook.js`、`api/submissions.js` 已有轻量 IP 限流；所有 API JSON 响应默认 `no-store`。
- `vercel.json` 已配置基础安全响应头；当前私有期 `robots.txt` 使用 `Disallow: /`。
- `data/` 已启用项目数据、站点更新和搜索索引。
- `content/posts/` 已启用 Markdown 文章源，构建时生成文章页和文章列表。
- 全站导航和页脚主要由构建脚本生成，少数独立页面仍需手动同步。

## 当前视觉方向

当前版本已经从最初的“深色科幻极简风”演进为：

- 复古像素风
- 纸张质感背景
- 8-bit 个人档案站
- 硬边框、像素阴影、贴纸式标签
- 米色纸张底色、蓝色/橙色/红色点缀

后续修改应延续当前视觉语言，不要按最初深色方案推倒重做。

## 当前页面结构

- `index.html`：首页，包含主视觉、随机头像电视框、引用切换、最新项目卡片和站点更新区块。
- `projects.html`：项目档案页，包含番茄钟、3D 打印、AI Agent、Claude Code、上海信息价数据库比对系统等项目长条列表。
- `project-pomodoro.html`：番茄钟 Web 应用详情页。
- `project-3d-printing.html`：酒厂厂房 3D 打印详情页。
- `project-agent-workflow.html`：AI Agent 工作流实验详情页。
- `project-claude-notes.html`：Claude Code 深度使用笔记详情页。
- `project-sh-info-price.html`：上海信息价数据库比对系统详情页。
- `about.html`：关于页，包含个人介绍、技能标签、联系方式。
- `pomodoro.html`：站内番茄钟展示页。
- `pomodoro-tool.html`：独立番茄钟工具页，包含更完整的参数设置。
- `articles.html` / `article-*.html`：文章列表和文章详情页。
- `search.html` / `submit.html`：站内搜索和投稿入口。
- `login.html` / `moderation.html` / `admin/`：后台验证、审核台和 Decap CMS。

## 当前脚本

- `js/site-router.js`：为主站页面、文章页和项目详情页提供局部加载和导航高亮，并支持项目长条点击进入详情页。
- `js/hero.js`：首页头像、引用切换和主视觉相关交互。
- `js/theme-toggle.js`：白天/夜间主题切换，使用右上角像素吊灯按钮和 `localStorage` 保存用户选择。
- `js/music-player.js`：底部音乐播放器交互。
- `js/pomodoro.js`：番茄钟展示页逻辑。
- `js/search.js`：站内搜索逻辑。
- `js/guestbook.js`：云端留言区，依赖 `/api/guestbook` 和 Supabase。
- `js/submission-form.js`：投稿表单提交。
- `js/session-controls.js`：全站退出登录按钮，调用 `/api/auth` 的 `DELETE` 清理服务端 Cookie。
- `js/login.js`、`js/moderation-dashboard.js`：后台验证和审核台交互。

## 当前样式

主要样式文件：

- `css/styles.css`

样式特点：

- 大量使用 CSS 变量。
- 白天/夜间模式通过 `html[data-theme="night"]` 和 CSS 变量切换。
- 夜间模式是 8-bit 星际宇宙风，背景使用 CSS 像素星空，不依赖图片。
- 响应式断点主要在 `1040px`、`860px`、`640px`。
- 项目档案页使用长条列表，桌面端为“左侧图标 / 中间说明 / 右侧按钮”，移动端自动堆叠。
- 首页最新项目仍使用卡片网格。
- 项目标题混排英文和中文时使用 `var(--font-ui)`，避免像素英文字体与中文回退字体差距过大。
- 底部 footer 固定在视口底部，移动端需特别注意遮挡内容。

## 当前资源

`images/` 中有 4 张 AVIF 图片，用于首页随机头像/电视框展示。  
已有 `favicon.svg`，但还没有正式 Open Graph 分享图、站点截图、项目截图或个人头像物料。

## 已完成

- 初始化静态网站结构。
- 已有 Git 仓库并连接 GitHub 远端。
- 首页、项目页、关于页已成型。
- 已完成复古像素风视觉改造。
- 已添加番茄钟展示页和独立番茄钟工具页。
- 已有底部音乐播放器。
- 已有静态路由增强脚本。
- 首页已新增“站点更新”区块。
- 项目档案页已改为长条列表。
- 已新增 5 个项目详情页入口和初版详情页布局。
- 已处理浏览器缩放时部分字体、阴影和计时数字二次缩放的问题。
- `projects.html` 中已预留“上海信息价数据库比对系统”卡片。

## 尚未完成

- Vercel 生产环境变量、Supabase 表结构和 Decap CMS OAuth / Git Gateway 仍需在平台侧配置。
- 当前是整站私有访问；如果未来要公开首页或文章，需要重新调整 `robots.txt`、middleware 放行规则和 sitemap 策略。
- 主站核心页面已添加 Open Graph / Twitter Card 分享信息，独立页面新增时仍需继续同步。
- “上海信息价数据库比对系统”已接入站内静态查询工具，路径为 `/sh-info-price/`。
- `api/` 与 `data/` 已启用；后续变更需同步检查构建输出和 Vercel 环境变量。
- 尚未做系统的移动端视觉验收。
- 尚未做无障碍和 SEO 细节检查。

## 上海信息价系统集成约定

独立项目路径：

```txt
H:\codex\sh-info-price
```

集成策略：

- 信息价系统源码仍作为独立 Next.js 应用维护。
- 主站使用 `tools/sh-info-price/` 中的轻量静态查询页，并在构建时从 `H:\codex\sh-info-price\public\data` 复制同一份静态数据。
- `scripts/build-price-app.js` 会把查询工具挂载到 `dist/sh-info-price/`，同时生成本地预览用的根目录 `sh-info-price/`。
- 根目录 `sh-info-price/` 是生成产物，已加入 `.gitignore`，不要手动维护或提交。
- 不要把完整 Next.js 项目源码直接塞进本静态站目录。

当前主站中的信息价卡片、首页卡片和详情页按钮都指向站内 `/sh-info-price/`。

## 本地预览建议

因为项目是纯静态站，可以直接打开：

```txt
index.html
```

也可以使用任意静态服务器，例如：

```bash
python -m http.server 3000
```

然后访问：

```txt
http://localhost:3000
```

如果使用 `site-router.js` 的局部页面加载能力，建议用本地静态服务器预览，而不是直接双击 HTML。

## Git 状态记录

最近检查时：

- 当前分支：`main`
- 工作区干净
- 本地 `main` 与 `origin/main` 同步

后续修改前应先检查：

```bash
git status --short
```

不要覆盖用户未提交改动。

## 注意事项

- PowerShell 输出中文可能显示乱码，但 HTML 文件本身是 UTF-8。
- 当前站点美术风格已经确定为像素纸张风，除非用户明确要求，不要回退到深色科幻极简风。
- 修改导航或页脚时，需要同步更新多个 HTML 文件。
- 修改 footer 或音乐播放器时，要重点检查移动端遮挡问题。
- 后续所有代码项目都需要维护 `docs/development-log.md` 这类开发记录文档，用于记录需求变化、技术决策、修复过程和验证结果。
