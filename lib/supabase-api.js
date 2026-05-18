const crypto = require("node:crypto");

const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
};

const { ROLE_ADMIN, verifySiteSessionRequest } = require("./auth-session");
const rateBuckets = new Map();

function sendJson(response, statusCode, payload) {
  response.statusCode = statusCode;
  response.setHeader("content-type", JSON_HEADERS["content-type"]);
  response.setHeader("cache-control", "no-store");
  response.end(JSON.stringify(payload));
}

function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    return null;
  }

  return {
    url: url.replace(/\/$/, ""),
    serviceKey,
  };
}

async function readJsonBody(request) {
  const chunks = [];

  for await (const chunk of request) {
    chunks.push(chunk);
  }

  const raw = Buffer.concat(chunks).toString("utf8");

  if (!raw.trim()) {
    return {};
  }

  try {
    return JSON.parse(raw);
  } catch {
    const error = new Error("请求 JSON 格式无效。");
    error.statusCode = 400;
    throw error;
  }
}

function cleanText(value, maxLength) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

async function supabaseFetch(path, options = {}) {
  const config = getSupabaseConfig();

  if (!config) {
    const error = new Error("Supabase is not configured.");
    error.statusCode = 503;
    throw error;
  }

  const response = await fetch(`${config.url}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: config.serviceKey,
      authorization: `Bearer ${config.serviceKey}`,
      ...JSON_HEADERS,
      ...(options.headers || {}),
    },
  });

  const text = await response.text();
  let payload = null;

  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = { message: text };
    }
  }

  if (!response.ok) {
    const error = new Error(payload?.message || "Supabase request failed.");
    error.statusCode = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
}

function firstHeaderValue(value) {
  return Array.isArray(value) ? value[0] : String(value || "");
}

function getClientIp(request) {
  const forwarded = firstHeaderValue(request.headers["x-forwarded-for"]);

  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  return (
    firstHeaderValue(request.headers["x-real-ip"]) ||
    request.socket?.remoteAddress ||
    "unknown"
  );
}

function cleanupRateBuckets(now) {
  if (rateBuckets.size < 500) {
    return;
  }

  for (const [key, bucket] of rateBuckets) {
    if (bucket.resetAt <= now) {
      rateBuckets.delete(key);
    }
  }
}

function checkRateLimit(request, name, { limit, windowMs }) {
  const now = Date.now();
  const key = `${name}:${getClientIp(request)}`;
  const bucket = rateBuckets.get(key);

  cleanupRateBuckets(now);

  if (!bucket || bucket.resetAt <= now) {
    rateBuckets.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });
    return;
  }

  if (bucket.count >= limit) {
    const error = new Error("请求过于频繁，请稍后再试。");
    error.statusCode = 429;
    error.retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
    throw error;
  }

  bucket.count += 1;
}

function tokensMatch(input, expected) {
  const inputBuffer = Buffer.from(input || "");
  const expectedBuffer = Buffer.from(expected || "");

  if (!inputBuffer.length || inputBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(inputBuffer, expectedBuffer);
}

function requireAdmin(request) {
  if (verifySiteSessionRequest(request) === ROLE_ADMIN) {
    return;
  }

  const expected = process.env.SOLARIS_ADMIN_TOKEN || "";
  const headerToken =
    request.headers["x-admin-token"] ||
    String(request.headers.authorization || "").replace(/^Bearer\s+/i, "");

  if (!expected) {
    const error = new Error("Admin session required.");
    error.statusCode = 401;
    throw error;
  }

  if (!tokensMatch(headerToken, expected)) {
    const error = new Error("Invalid admin token.");
    error.statusCode = 401;
    throw error;
  }
}

module.exports = {
  checkRateLimit,
  cleanText,
  readJsonBody,
  requireAdmin,
  sendJson,
  supabaseFetch,
};
