# 信息价独立部署与静态数据源

## 当前架构

信息价查询数据由 `H:\codex\sh-info-price` 独立项目维护，主站 Solaris Wiki 固定提供站内查询工具，避免独立应用域名未就绪时入口跳到 404。

- 主站查询入口：`/sh-info-price/`
- 正式静态数据源：`https://sh-info-price.vercel.app/data/`
- 独立应用入口：可选，域名稳定后再作为详情页外链补充

主站不再把 GitHub raw 作为生产数据源。站内工具会读取构建时写入的 `price-config.js`，默认从正式静态托管地址加载 JSON。

## 构建环境变量

如果正式数据源域名不是默认 Vercel 域名，在主站构建环境设置：

```txt
SH_INFO_PRICE_DATA_BASE_URL=https://your-domain.example/data/
```

默认情况下，主站构建不会复制完整 `H:\codex\sh-info-price\public\data`，避免主站部署包重复携带大体积数据。

本地需要离线完整预览时再启用：

```txt
SH_INFO_PRICE_COPY_LOCAL_DATA=1
```

## 负荷判断

主站承担查询页面静态资源，价格数据请求由独立数据源的静态托管/CDN 承担。首屏查询会读取 `manifest.json`、`latest.json`、`search-index.json`，单材料历史趋势文件按需加载，所以用户不会一次性下载整个 `public/data` 目录。
