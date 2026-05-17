# Solaris Wiki CMS 与公开留言配置

这套方案把站点拆成两类能力：

- 内容发布：`/admin/` 使用 Decap CMS，把文章、项目草稿和站点更新草稿写回 GitHub 仓库。
- 互动数据：留言、投稿、审核走 Vercel Serverless Function + Supabase。

## Vercel 环境变量

在 Vercel Project Settings -> Environment Variables 中添加：

```txt
SUPABASE_URL=你的 Supabase Project URL
SUPABASE_SERVICE_ROLE_KEY=你的 Supabase service_role key
SOLARIS_ADMIN_TOKEN=自己生成的一段长随机密码
SOLARIS_GUESTBOOK_AUTO_APPROVE=false
SOLARIS_GUESTBOOK_TABLE=guestbook_messages
SOLARIS_SUBMISSIONS_TABLE=content_submissions
```

`SUPABASE_SERVICE_ROLE_KEY` 只在服务端 API 中使用，不要放到前端页面里。

## Supabase 表结构

在 Supabase SQL Editor 执行：

```sql
create table if not exists guestbook_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  message text not null,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

create index if not exists guestbook_messages_status_created_at_idx
  on guestbook_messages (status, created_at desc);

create table if not exists content_submissions (
  id uuid primary key default gen_random_uuid(),
  type text not null default 'post',
  title text not null,
  author text not null default '匿名投稿者',
  contact text,
  summary text,
  content text not null,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

create index if not exists content_submissions_status_created_at_idx
  on content_submissions (status, created_at desc);
```

当前 API 使用服务端 service role key 访问 Supabase，所以不用向浏览器暴露 anon key。

## 后台地址

- 内容后台：`/admin/`
- 审核台：`/moderation.html`
- 投稿页：`/submit.html`
- 文章列表：`/articles.html`
- 站内搜索：`/search.html`

Decap CMS 的 GitHub 登录需要配置 GitHub OAuth。部署到 Vercel 时，推荐后续补一个 OAuth 代理或改用支持 Git Gateway 的托管服务；本地可用 `npx decap-server` 配合 `local_backend: true` 调试。

## 构建流程

```bash
npm run build
```

构建会先生成主站页面，再根据 `content/posts/*.md` 生成文章页、`articles.html`、`data/search-index.json` 和新版 `sitemap.xml`。
