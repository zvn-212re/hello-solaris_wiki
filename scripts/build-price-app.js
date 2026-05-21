const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(ROOT, "dist");
const MOUNT_NAME = "sh-info-price";
const TOOL_SOURCE_DIR = path.join(ROOT, "tools", MOUNT_NAME);
const DEFAULT_PRICE_APP_DIR = path.resolve(ROOT, "..", "..", "sh-info-price");
const DEFAULT_PRICE_APP_URL = "https://sh-info-price.vercel.app/";
const DEFAULT_PROXY_DATA_BASE_URL = "/api/price-data?path={path}";
const DEFAULT_DATA_BASE_URL = "https://raw.githubusercontent.com/zvn-212re/sh-info-price/main/public/data/";
const PRICE_APP_DIR = process.env.SH_INFO_PRICE_DIR
  ? path.resolve(process.env.SH_INFO_PRICE_DIR)
  : DEFAULT_PRICE_APP_DIR;
const PRICE_DATA_DIR = path.join(PRICE_APP_DIR, "public", "data");
const PRICE_APP_URL = normalizeUrl(process.env.SH_INFO_PRICE_APP_URL || DEFAULT_PRICE_APP_URL);
const PRICE_DATA_BASE_URL = normalizeUrl(
  process.env.SH_INFO_PRICE_DATA_BASE_URL || new URL("data/", PRICE_APP_URL).toString()
);
const COPY_LOCAL_DATA = process.env.SH_INFO_PRICE_COPY_LOCAL_DATA === "1";

function normalizeUrl(value) {
  const text = String(value || "").trim();
  if (text.includes("{path}")) {
    return text;
  }

  return text ? text.replace(/\/?$/, "/") : "";
}

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

function writeRuntimeConfig(destDir, copiedLocalData) {
  const remoteSources = uniqueUrls([
    PRICE_DATA_BASE_URL,
    DEFAULT_PROXY_DATA_BASE_URL,
    DEFAULT_DATA_BASE_URL,
    new URL("data/", PRICE_APP_URL).toString()
  ]);
  const config = {
    appUrl: PRICE_APP_URL,
    dataBaseUrl: copiedLocalData ? "" : PRICE_DATA_BASE_URL,
    dataBaseUrls: remoteSources,
    fallbackDataBaseUrl: DEFAULT_DATA_BASE_URL
  };

  fs.writeFileSync(
    path.join(destDir, "price-config.js"),
    `window.SolarisPriceConfig = ${JSON.stringify(config, null, 2)};\n`,
    "utf8"
  );
}

function copyStaticTool(destDir, allowedParent) {
  ensureCleanDir(destDir, allowedParent);
  fs.cpSync(TOOL_SOURCE_DIR, destDir, { recursive: true });

  const copiedLocalData = COPY_LOCAL_DATA && fs.existsSync(PRICE_DATA_DIR);

  if (copiedLocalData) {
    fs.cpSync(PRICE_DATA_DIR, path.join(destDir, "data"), { recursive: true });
  }

  writeRuntimeConfig(destDir, copiedLocalData);
  return copiedLocalData;
}

function uniqueUrls(urls) {
  return [...new Set(urls.map(normalizeUrl).filter(Boolean))];
}

function buildMountedPriceTool() {
  const distDest = path.join(OUT_DIR, MOUNT_NAME);
  const rootDest = path.join(ROOT, MOUNT_NAME);

  if (!fs.existsSync(TOOL_SOURCE_DIR)) {
    throw new Error(`未找到站内查询工具模板：${TOOL_SOURCE_DIR}`);
  }

  const copiedLocalData = copyStaticTool(distDest, OUT_DIR);
  copyStaticTool(rootDest, ROOT);

  if (copiedLocalData) {
    console.log(`[price-app] Mounted static query tool with local data at ${distDest}`);
    return;
  }

  if (COPY_LOCAL_DATA) {
    console.warn(`[price-app] Local data not found at ${PRICE_DATA_DIR}; using ${PRICE_DATA_BASE_URL}`);
  }

  console.log(`[price-app] Mounted static query tool at ${distDest}; data source ${PRICE_DATA_BASE_URL}`);
}

buildMountedPriceTool();
