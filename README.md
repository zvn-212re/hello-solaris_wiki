# Solaris Wiki

Solaris Wiki 是一个纯静态个人网站，用来记录 Vibe Coding、AI Agent 实验、工程数据工具、个人项目和技术笔记。

目标域名：`https://solaris.wiki`

## 技术栈

- 原生 HTML / CSS / JavaScript
- 零依赖静态生成脚本：`scripts/build-site.js`
- 项目数据源：`data/projects.json`
- 部署目标：Vercel 静态站

生成后的页面仍位于仓库根目录，可以直接作为静态文件部署。

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

`npm run build` 会根据 `data/projects.json` 生成首页、项目页、项目详情页、404 页面和 `sitemap.xml`。
在当前 Windows 环境中也可以用 `npm run build:ps` 执行同等生成流程。

## 内容维护

- 新增或修改项目：优先编辑 `data/projects.json`，再运行 `npm run build`。
- 修改公共导航、页脚、全站 meta：编辑 `scripts/build-site.js`。
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
- `404.html`：静态 404 页面

## 站点物料

已包含：

- `favicon.svg`
- `robots.txt`
- `sitemap.xml`
- Open Graph / Twitter Card meta
- Canonical URL

## 注意事项

`pomodoro-tool.html` 是独立工具页，暂时保留内联 CSS/JS，便于单文件分发。主站普通页面由静态生成脚本统一维护公共结构。
