---
title: CMS 地基：从静态站走向可管理内容
summary: 记录 Solaris Wiki 引入后台、投稿、公开留言和搜索索引的第一阶段。
date: 2026-05-17
status: published
tags:
  - CMS
  - Supabase
  - Decap
---

这一阶段的目标不是把 Solaris Wiki 立刻改成复杂系统，而是保留静态站的轻巧，同时给内容增长预留后台、审核和搜索能力。

后台写作交给 Decap CMS，公开留言和投稿交给 Supabase，构建阶段会把 Markdown 内容生成静态文章页与搜索索引。

这样手机上可以写文章，访客可以留言和投稿，站点仍然能以静态页面为主部署在 Vercel 上。
