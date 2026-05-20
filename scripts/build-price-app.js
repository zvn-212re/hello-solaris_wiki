const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(ROOT, "dist");
const MOUNT_NAME = "sh-info-price";
const TOOL_SOURCE_DIR = path.join(ROOT, "tools", MOUNT_NAME);
const DEFAULT_PRICE_APP_DIR = path.resolve(ROOT, "..", "..", "sh-info-price");
const PRICE_APP_DIR = process.env.SH_INFO_PRICE_DIR
  ? path.resolve(process.env.SH_INFO_PRICE_DIR)
  : DEFAULT_PRICE_APP_DIR;
const PRICE_DATA_DIR = path.join(PRICE_APP_DIR, "public", "data");

function isInside(child, parent) {
  const relative = path.relative(parent, child);
  return relative && !relative.startsWith("..") && !path.isAbsolute(relative);
}

function ensureCleanDir(dir, allowedParent) {
  if (!isInside(dir, allowedParent)) {
    throw new Error(`Refusing to write outside ${allowedParent}: ${dir}`);
  }

  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
}

function writeFallbackPage(to, allowedParent, reason) {
  ensureCleanDir(to, allowedParent);
  fs.writeFileSync(
    path.join(to, "index.html"),
    `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="noindex">
  <title>上海信息价数据库比对系统</title>
  <link rel="stylesheet" href="../css/styles.css">
</head>
<body>
  <main>
    <section class="page-hero">
      <div class="container">
        <p class="eyebrow">SH INFO PRICE</p>
        <h1 class="project-title">查询工具未挂载</h1>
        <p>${reason}</p>
        <div class="actions">
          <a class="button secondary" href="../project-sh-info-price.html">返回项目详情</a>
        </div>
      </div>
    </section>
  </main>
</body>
</html>
`,
    "utf8"
  );
}

function copyStaticTool(destDir, allowedParent) {
  ensureCleanDir(destDir, allowedParent);
  fs.cpSync(TOOL_SOURCE_DIR, destDir, { recursive: true });
  fs.cpSync(PRICE_DATA_DIR, path.join(destDir, "data"), { recursive: true });
}

function buildMountedPriceTool() {
  const distDest = path.join(OUT_DIR, MOUNT_NAME);
  const rootDest = path.join(ROOT, MOUNT_NAME);

  if (!fs.existsSync(TOOL_SOURCE_DIR)) {
    const reason = `未找到站内查询工具模板：${TOOL_SOURCE_DIR}`;
    console.warn(`[price-app] ${reason}`);
    writeFallbackPage(distDest, OUT_DIR, reason);
    writeFallbackPage(rootDest, ROOT, reason);
    return;
  }

  if (!fs.existsSync(PRICE_DATA_DIR)) {
    const reason = `未找到价格项目静态数据：${PRICE_DATA_DIR}`;
    console.warn(`[price-app] ${reason}`);
    writeFallbackPage(distDest, OUT_DIR, reason);
    writeFallbackPage(rootDest, ROOT, reason);
    return;
  }

  copyStaticTool(distDest, OUT_DIR);
  copyStaticTool(rootDest, ROOT);
  console.log(`[price-app] Mounted static query tool at ${distDest}`);
}

buildMountedPriceTool();
