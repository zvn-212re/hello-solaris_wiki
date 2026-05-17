# Solaris Wiki

Solaris Wiki 是一个以静态页面为主的个人网站，用来记录 Vibe Coding、AI Agent 实验、工程数据工具、个人项目和技术笔记。当前项目已经接入轻量构建脚本、Decap CMS 文章生成、Vercel API 和 Supabase 留言/投稿审核能力。

目标域名：`https://solaris.wiki`

## 技术栈

- 原生 HTML / CSS / JavaScript
- 零依赖静态生成脚本：`scripts/build-site.js`、`scripts/build-cms-content.js`
- 项目数据源：`data/projects.json`
- 内容源：`content/posts/*.md`
- 互动接口：`api/guestbook.js`、`api/submissions.js`、`api/moderation.js`
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

## 常用命令

```bash
npm run build
npm run build:ps
npm run check
```

`npm run build` 会根据 `data/projects.json` 生成首页、项目页、项目详情页、404 页面，再根据 `content/posts/*.md` 生成文章页、文章列表、搜索索引和 `sitemap.xml`。
在当前 Windows 环境中也可以用 `npm run build:ps` 执行同等生成流程。

## 内容维护

- 新增或修改项目：优先编辑 `data/projects.json`，再运行 `npm run build`。
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

## 注意事项

`pomodoro-tool.html` 是独立工具页，暂时保留内联 CSS/JS，便于单文件分发。主站核心页面由静态生成脚本维护公共结构，后台、搜索和投稿页仍是独立静态 HTML，需要改公共导航或页脚时同步检查。
