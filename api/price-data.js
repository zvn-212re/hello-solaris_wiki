const DEFAULT_DATA_BASE_URL = "https://sh-info-price.vercel.app/data/";
const CACHE_CONTROL = "public, max-age=300, s-maxage=86400, stale-while-revalidate=604800";
const ALLOWED_ROOT_FILES = new Set(["manifest.json", "latest.json", "search-index.json"]);

function normalizeBaseUrl(value) {
  const text = String(value || "").trim();
  return text ? text.replace(/\/?$/, "/") : "";
}

function sendJson(response, status, payload) {
  response.statusCode = status;
  response.setHeader("content-type", "application/json; charset=utf-8");
  response.setHeader("cache-control", "no-store");
  response.end(JSON.stringify(payload));
}

function safeDataPath(value) {
  const text = String(value || "")
    .trim()
    .replaceAll("\\", "/")
    .replace(/^\/+/, "")
    .replace(/^data\//, "");

  if (!text || text.includes("..") || text.startsWith("/") || /^https?:/i.test(text)) {
    return "";
  }

  if (ALLOWED_ROOT_FILES.has(text)) {
    return text;
  }

  if (/^histories\/[a-f0-9]{16}\.json$/i.test(text)) {
    return text;
  }

  return "";
}

module.exports = async function handler(request, response) {
  if (request.method !== "GET" && request.method !== "HEAD") {
    response.setHeader("allow", "GET, HEAD");
    sendJson(response, 405, { error: "Method not allowed." });
    return;
  }

  const dataPath = safeDataPath(request.query?.path);

  if (!dataPath) {
    sendJson(response, 400, { error: "Invalid data path." });
    return;
  }

  const baseUrl = normalizeBaseUrl(process.env.SH_INFO_PRICE_DATA_BASE_URL || DEFAULT_DATA_BASE_URL);
  const upstreamUrl = new URL(dataPath, baseUrl);

  try {
    const upstream = await fetch(upstreamUrl, {
      headers: { accept: "application/json" },
    });

    if (!upstream.ok) {
      sendJson(response, upstream.status, { error: "Price data not found." });
      return;
    }

    const body = Buffer.from(await upstream.arrayBuffer());
    response.statusCode = 200;
    response.setHeader("content-type", "application/json; charset=utf-8");
    response.setHeader("cache-control", CACHE_CONTROL);
    response.end(request.method === "HEAD" ? undefined : body);
  } catch {
    sendJson(response, 502, { error: "Price data source unavailable." });
  }
};
