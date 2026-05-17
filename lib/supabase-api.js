const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
};

function sendJson(response, statusCode, payload) {
  response.statusCode = statusCode;
  response.setHeader("content-type", JSON_HEADERS["content-type"]);
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

  return JSON.parse(raw);
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

function requireAdmin(request) {
  const expected = process.env.SOLARIS_ADMIN_TOKEN;
  const headerToken =
    request.headers["x-admin-token"] ||
    String(request.headers.authorization || "").replace(/^Bearer\s+/i, "");

  if (!expected) {
    const error = new Error("SOLARIS_ADMIN_TOKEN is not configured.");
    error.statusCode = 503;
    throw error;
  }

  if (!headerToken || headerToken !== expected) {
    const error = new Error("Invalid admin token.");
    error.statusCode = 401;
    throw error;
  }
}

module.exports = {
  cleanText,
  readJsonBody,
  requireAdmin,
  sendJson,
  supabaseFetch,
};
