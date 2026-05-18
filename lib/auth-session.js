const crypto = require("node:crypto");

const SITE_AUTH_COOKIE = "solaris_site_session";
const ROLE_VISITOR = "visitor";
const ROLE_ADMIN = "admin";
const DEFAULT_MAX_AGE_SECONDS = 60 * 60 * 12;

function getMaxAgeSeconds() {
  const configured = Number(process.env.SOLARIS_AUTH_MAX_AGE_SECONDS);
  return Number.isFinite(configured) && configured > 0
    ? Math.floor(configured)
    : DEFAULT_MAX_AGE_SECONDS;
}

function isHostedRuntime() {
  return Boolean(process.env.VERCEL);
}

function getAuthSecret() {
  if (process.env.SOLARIS_AUTH_SECRET) {
    return process.env.SOLARIS_AUTH_SECRET;
  }

  if (isHostedRuntime()) {
    return "";
  }

  return process.env.SOLARIS_ADMIN_PASSWORD || "solaris2026";
}

function signSession(role, expiresAt, secret = getAuthSecret()) {
  if (!secret) {
    return "";
  }

  return crypto
    .createHmac("sha256", secret)
    .update(`${role}.${expiresAt}`)
    .digest("hex");
}

function isKnownRole(role) {
  return role === ROLE_VISITOR || role === ROLE_ADMIN;
}

function createSiteSessionValue(role = ROLE_VISITOR, now = Date.now()) {
  const sessionRole = isKnownRole(role) ? role : ROLE_VISITOR;
  const expiresAt = now + getMaxAgeSeconds() * 1000;
  return `${sessionRole}.${expiresAt}.${signSession(sessionRole, expiresAt)}`;
}

function parseCookies(header = "") {
  return String(header)
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce((cookies, part) => {
      const index = part.indexOf("=");

      if (index === -1) {
        return cookies;
      }

      cookies[part.slice(0, index)] = decodeURIComponent(part.slice(index + 1));
      return cookies;
    }, {});
}

function getCookieValue(request, name) {
  return parseCookies(request.headers.cookie || "")[name] || "";
}

function verifySiteSessionValue(value, now = Date.now()) {
  const [role = "", expiresRaw, signature = ""] = String(value || "").split(".");
  const expiresAt = Number(expiresRaw);

  if (!isKnownRole(role) || !Number.isFinite(expiresAt) || expiresAt <= now || !signature) {
    return "";
  }

  const expected = signSession(role, expiresAt);

  if (!expected || expected.length !== signature.length) {
    return "";
  }

  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected)) ? role : "";
}

function verifySiteSessionRequest(request) {
  return verifySiteSessionValue(getCookieValue(request, SITE_AUTH_COOKIE));
}

function shouldUseSecureCookie(request) {
  const host = String(request.headers.host || "");
  const protocol = String(request.headers["x-forwarded-proto"] || "");

  if (host.startsWith("localhost") || host.startsWith("127.0.0.1")) {
    return false;
  }

  return protocol === "https" || Boolean(process.env.VERCEL);
}

function serializeCookie(name, value, attributes = {}) {
  const parts = [`${name}=${encodeURIComponent(value)}`, "Path=/", "HttpOnly", "SameSite=Lax"];

  if (attributes.maxAge !== undefined) {
    parts.push(`Max-Age=${attributes.maxAge}`);
  }

  if (attributes.secure) {
    parts.push("Secure");
  }

  return parts.join("; ");
}

function createSiteSessionCookie(request, role) {
  return serializeCookie(SITE_AUTH_COOKIE, createSiteSessionValue(role), {
    maxAge: getMaxAgeSeconds(),
    secure: shouldUseSecureCookie(request),
  });
}

function createExpiredSiteSessionCookie(request) {
  return serializeCookie(SITE_AUTH_COOKIE, "", {
    maxAge: 0,
    secure: shouldUseSecureCookie(request),
  });
}

module.exports = {
  ROLE_ADMIN,
  ROLE_VISITOR,
  SITE_AUTH_COOKIE,
  createExpiredSiteSessionCookie,
  createSiteSessionCookie,
  getAuthSecret,
  isHostedRuntime,
  verifySiteSessionRequest,
};
