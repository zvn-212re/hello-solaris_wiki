# 信息价独立部署与静态数据源

## 当前架构

信息价查询数据由 `H:\codex\sh-info-price` 独立项目维护并部署为正式应用，主站 Solaris Wiki 固定提供站内查询工具，避免独立应用入口变化时站内没有可用入口。

- 主站查询入口：`/sh-info-price/`
- 主站数据代理：`/api/price-data?path=manifest.json`
- 正式应用入口：`https://sh-info-price.vercel.app/`
- 正式静态数据源：`https://sh-info-price.vercel.app/data/`
- 兜底数据源：`https://raw.githubusercontent.com/zvn-212re/sh-info-price/main/public/data/`

站内工具会读取构建时写入的 `price-config.js`，按顺序尝试站内本地数据、独立应用 `/data/`、同域 `/api/price-data` 代理和 GitHub raw 兜底。独立 Vercel 应用部署好后，它就是主数据源。

## 构建环境变量

如果 Vercel 分配的域名不是默认值，在主站构建环境设置：

```txt
SH_INFO_PRICE_APP_URL=https://your-domain.example/
SH_INFO_PRICE_DATA_BASE_URL=https://your-domain.example/data/
```

`/api/price-data` 也读取 `SH_INFO_PRICE_DATA_BASE_URL`；未设置时代理 GitHub raw 数据源。

默认情况下，主站构建不会复制完整 `H:\codex\sh-info-price\public\data`，避免主站部署包重复携带大体积数据。

本地需要离线完整预览时再启用：

```txt
SH_INFO_PRICE_COPY_LOCAL_DATA=1
```

## 负荷判断

主站承担查询页面静态资源，价格数据请求由独立数据源的静态托管/CDN 承担。首屏查询会读取 `manifest.json`、`latest.json`、`search-index.json`，单材料历史趋势文件按需加载，所以用户不会一次性下载整个 `public/data` 目录。
