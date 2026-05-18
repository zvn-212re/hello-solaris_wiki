# Solaris Wiki CMS 与公开留言配置

这套方案把站点拆成两类能力：

- 内容发布：`/admin/` 使用 Decap CMS，把文章、项目草稿和站点更新草稿写回 GitHub 仓库。
- 互动数据：留言、投稿、审核走 Vercel Serverless Function + Supabase。

## Vercel 环境变量

在 Vercel Project Settings -> Environment Variables 中添加：

```txt
SUPABASE_URL=你的 Supabase Project URL
SUPABASE_SERVICE_ROLE_KEY=你的 Supabase service_role key
SOLARIS_AUTH_SECRET=自己生成的一段长随机签名密钥
SOLARIS_VISITOR_INVITE_CODE=SOLARIS2026
SOLARIS_ADMIN_USERNAME=admin
SOLARIS_ADMIN_PASSWORD=solaris2026
SOLARIS_ADMIN_TOKEN=可选的审核 API 备用令牌
SOLARIS_AUTH_MAX_AGE_SECONDS=43200
SOLARIS_GUESTBOOK_AUTO_APPROVE=false
SOLARIS_GUESTBOOK_TABLE=guestbook_messages
SOLARIS_SUBMISSIONS_TABLE=content_submissions
```

`SUPABASE_SERVICE_ROLE_KEY` 只在服务端 API 中使用，不要放到前端页面里。
`SOLARIS_AUTH_SECRET` 用于签名访问 Cookie，生产环境必须设置为不同于登录密码的长随机字符串。
`SOLARIS_VISITOR_INVITE_CODE` 是访客邀请码，生产环境必须设置；本地开发未设置时才会使用 `SOLARIS2026`。
`SOLARIS_ADMIN_USERNAME` / `SOLARIS_ADMIN_PASSWORD` 是管理员登录账号密码，生产环境必须设置；本地开发未设置时才会使用 `admin` / `solaris2026`。
`SOLARIS_ADMIN_TOKEN` 只作为审核 API 的备用 header 令牌，不再作为网页登录密码。
`SOLARIS_AUTH_MAX_AGE_SECONDS` 可选，默认 12 小时。

当前 API 带轻量 IP 限流：登录 15 分钟 24 次、留言每小时 10 次、投稿每小时 5 次。这个限流适合个人站基础防刷，但不是专业风控系统。

## Supabase 表结构

在 Supabase SQL Editor 执行仓库里的 `supabase/schema.sql`。

当前 API 使用服务端 service role key 访问 Supabase，所以不用向浏览器暴露 anon key。

配置完成后可在本地创建不会提交到 Git 的 `.env.local`：

```txt
SUPABASE_URL=你的 Supabase Project URL
SUPABASE_SERVICE_ROLE_KEY=新的服务端密钥
SOLARIS_GUESTBOOK_TABLE=guestbook_messages
SOLARIS_SUBMISSIONS_TABLE=content_submissions
```

然后运行：

```bash
npm run check:supabase
```

该命令只验证后端密钥能否访问留言和投稿表，不会打印密钥，也不会写入数据库。

## 后台地址

- 内容后台：`/admin/`
- 私有访问登录：`/login.html`
- 审核台：`/moderation.html`
- 投稿页：`/submit.html`
- 文章列表：`/articles.html`
- 站内搜索：`/search.html`

Decap CMS 的 GitHub 登录需要配置 GitHub OAuth。部署到 Vercel 时，推荐后续补一个 OAuth 代理或改用支持 Git Gateway 的托管服务；本地可用 `npx decap-server` 配合 `local_backend: true` 调试。

当前站点启用整站私有访问：未登录访问普通页面、文章、数据文件或 API 会先跳转到 `/login.html`。登录页提供访客邀请码和管理员账号密码两个通道，调用 `/api/auth` 后设置带 `visitor` / `admin` 角色的 `HttpOnly` 访问 Cookie。访客可访问普通内容；管理员可访问 `/admin/`、`/moderation.html` 和审核 API。这个保护只在 Vercel / `vercel dev` 这类会运行 middleware 的环境中生效；直接双击本地 HTML 文件不会经过服务器权限层。

底部“退出”按钮会调用 `DELETE /api/auth` 清理访问 Cookie，并回到登录页。

当前 `robots.txt` 使用 `Disallow: /`，符合整站私有期策略。如果未来要开放公开首页或文章，需要同步调整 robots、middleware 和 sitemap。

## 构建流程

```bash
npm run build
```

构建会先生成主站页面，再根据 `content/posts/*.md` 生成文章页、`articles.html`、`data/search-index.json` 和新版 `sitemap.xml`。
