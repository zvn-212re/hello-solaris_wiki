# Solaris Wiki

Solaris Wiki 是一个以静态页面为主的个人网站，用来记录 Vibe Coding、AI Agent 实验、工程数据工具、个人项目和技术笔记。当前项目已经接入轻量构建脚本、Decap CMS 文章生成、Vercel API 和 Supabase 留言/投稿审核能力。

当前访问策略：整站私有访问。首次打开普通页面会先跳转到 `login.html`，访客可用邀请码进入普通内容，管理员可用账号密码进入 CMS 后台。验证后由服务端设置带角色签名的 `HttpOnly` Cookie，再由 middleware 按权限放行。生产环境必须配置 `SOLARIS_AUTH_SECRET`、访客邀请码和管理员账号密码。

目标域名：`https://solaris.wiki`

## 技术栈

- 原生 HTML / CSS / JavaScript
- 零依赖静态生成脚本：`scripts/build-site.js`、`scripts/build-cms-content.js`
- 项目数据源：`data/projects.json`，可在 `/admin/` 的“站点数据”里可视化维护
- 内容源：`content/posts/*.md`
- 互动接口：`api/guestbook.js`、`api/submissions.js`、`api/moderation.js`
- 信息价数据代理：`api/price-data.js`
- 私有访问：`middleware.js` + `api/auth.js`
- 站点安全：Vercel headers、基础 API 限流、`HttpOnly` Cookie、私有期 `robots.txt`
- 部署目标：Vercel

构建输出目录为 `dist/`，由 `vercel.json` 指定为 Vercel 的 `outputDirectory`。根目录中的 HTML 仍保留，便于本地直接预览和审阅生成结果。

## 本地预览

直接打开 `index.html` 可以查看静态页面。若要使用局部切页能力，建议启动静态服务器：

```bash
python -m http.server 3000
```

然后访问：

```txt
http://localhost:3000
```

权限验证、`HttpOnly` Cookie 和 `/api/*` 接口需要 Vercel 运行时，直接双击 HTML 或普通静态服务器不会执行 middleware。要完整验证登录和留言流程，请使用线上 Vercel 部署或 `vercel dev`。

## 常用命令

```bash
npm run build
npm run serve
npm run build:ps
npm run check
npm run check:supabase
```

`npm run build` 会根据 `data/projects.json` 生成首页、项目页、项目详情页、404 页面，再根据 `content/posts/*.md` 生成文章页、文章列表、搜索索引和 `sitemap.xml`。
在当前 Windows 环境中也可以用 `npm run build:ps` 执行同等生成流程。
`npm run serve` 会在 `http://127.0.0.1:4173` 启动零依赖静态预览，适合验证需要 `fetch()` 读取 JSON 的页面。
`npm run check:supabase` 会读取 `.env.local` / `.env`，验证 Supabase service role key 是否能访问留言和投稿表，不会打印密钥。

## 内容维护

- 新增或修改项目：优先进入 `/admin/` 的“站点数据 -> 项目档案”可视化编辑；也可以直接编辑 `data/projects.json`，再运行 `npm run build`。
- 新增或修改站点更新：进入 `/admin/` 的“站点数据 -> 站点更新”维护，保存后由 Vercel 重新构建页面。
- 信息价查询工具：正式系统部署在独立 `sh-info-price` Vercel 项目，主站按钮优先打开完整应用；`/sh-info-price/` 仅作为站内备用入口，优先读取独立应用 `/data/`，再通过同域 `/api/price-data` 代理读取正式静态数据源。
- 修改公共导航、页脚、全站 meta：同步编辑 `scripts/build-site.js` 和 `scripts/build-cms-content.js`。
- 修改视觉样式：编辑 `css/styles.css`。
- 修改番茄钟、音乐、主题、路由等交互：编辑 `js/` 下对应脚本。
- 重要需求变化、技术决策和验证结果记录在 `docs/development-log.md`。

## 当前页面

- `index.html`：首页
- `projects.html`：项目档案
- `about.html`：关于页
- `pomodoro.html`：站内番茄钟展示页
- `pomodoro-tool.html`：独立番茄钟工具页
- `project-*.html`：项目详情页
- `articles.html` / `article-*.html`：文章列表和文章详情
- `search.html` / `submit.html`：站内搜索和投稿入口
- `login.html` / `moderation.html` / `admin/`：后台登录、审核台和 Decap CMS
- `404.html`：静态 404 页面

## 站点物料

已包含：

- `favicon.svg`
- `robots.txt`
- `sitemap.xml`
- Open Graph / Twitter Card meta
- Canonical URL

## 仍需补齐

- 在 Vercel 配置生产环境变量，并轮换已经泄露过的 Supabase service role key。
- 在 Supabase SQL Editor 执行 `supabase/schema.sql`，让留言、投稿和审核进入真实云端数据。
- Decap CMS 的 GitHub OAuth / Git Gateway 仍需正式配置，否则 `/admin/` 只能算入口页。
- 主站默认假定独立应用域名为 `https://sh-info-price.vercel.app/`。如果 Vercel 分配了其他域名，在主站设置 `SH_INFO_PRICE_APP_URL` 和 `SH_INFO_PRICE_DATA_BASE_URL`；只有离线预览需要完整本地数据时，才设置 `SH_INFO_PRICE_COPY_LOCAL_DATA=1`。
- 如果未来要公开个人站，需要把 `robots.txt` 从 `Disallow: /` 改回开放策略，并决定哪些页面不再需要登录。
- 仍缺正式 OG 分享图、站点截图、项目截图、个人头像或可公开展示的作品封面。

## 注意事项

`pomodoro-tool.html` 是独立工具页，暂时保留内联 CSS/JS，便于单文件分发。主站核心页面由静态生成脚本维护公共结构，后台、搜索和投稿页仍是独立静态 HTML，需要改公共导航或页脚时同步检查。
