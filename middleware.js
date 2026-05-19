const BEIJING_OFFSET_MINUTES = 8 * 60;
const DAILY_SCHEDULED_WINDOW = {
  enabled: false,
  label: "Scheduled archive maintenance",
  startHour: 0,
  startMinute: 0,
  endHour: 6,
  endMinute: 0,
};

const TEMPORARY_MAINTENANCE_WINDOWS = [
  // Set enabled to true and adjust the ISO timestamps for one-off maintenance.
  // Example:
  // {
  //   enabled: true,
  //   label: "Emergency database maintenance",
  //   start: "2026-05-20T22:00:00+08:00",
  //   end: "2026-05-20T23:30:00+08:00",
  // },
  {
    enabled: false,
    label: "Temporary maintenance",
    start: "2026-05-20T22:00:00+08:00",
    end: "2026-05-20T23:30:00+08:00",
  },
];

const MAINTENANCE_PATH = "/maintenance.html";
const LOGIN_PATH = "/login.html";
const AUTH_API_PATH = "/api/auth";
const SITE_AUTH_COOKIE = "solaris_site_session";
const ROLE_VISITOR = "visitor";
const ROLE_ADMIN = "admin";
const BYPASS_QUERY = "maintenance_bypass";
const PUBLIC_PATHS = new Set([LOGIN_PATH, AUTH_API_PATH, "/favicon.svg"]);
const PUBLIC_PATH_PREFIXES = ["/css/", "/js/", "/images/"];
const PUBLIC_FILE_PATTERN = /\.(?:avif|css|gif|ico|jpg|jpeg|js|map|png|svg|webp|woff2?)$/i;

export const config = {
  matcher: [
    "/((?!_next/).*)",
  ],
};

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

function bytesToHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function isKnownRole(role) {
  return role === ROLE_VISITOR || role === ROLE_ADMIN;
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

async function signSession(role, expiresAt, secret) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`${role}.${expiresAt}`)
  );

  return bytesToHex(signature);
}

function signaturesMatch(left, right) {
  if (!left || !right || left.length !== right.length) {
    return false;
  }

  let diff = 0;
  for (let index = 0; index < left.length; index += 1) {
    diff |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }

  return diff === 0;
}

async function verifySiteSession(request, now = Date.now()) {
  const secret = getAuthSecret();
  const cookies = parseCookies(request.headers.get("cookie") || "");
  const [role = "", expiresRaw, signature = ""] = String(cookies[SITE_AUTH_COOKIE] || "").split(".");
  const expiresAt = Number(expiresRaw);

  if (!secret || !isKnownRole(role) || !Number.isFinite(expiresAt) || expiresAt <= now || !signature) {
    return "";
  }

  return signaturesMatch(signature, await signSession(role, expiresAt, secret)) ? role : "";
}

function getBeijingMinutesOfDay(now = new Date()) {
  const utcMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
  return (utcMinutes + BEIJING_OFFSET_MINUTES) % (24 * 60);
}

function isWithinDailyWindow(minutesOfDay, window) {
  const start = window.startHour * 60 + window.startMinute;
  const end = window.endHour * 60 + window.endMinute;

  if (start === end) {
    return false;
  }

  if (start < end) {
    return minutesOfDay >= start && minutesOfDay < end;
  }

  return minutesOfDay >= start || minutesOfDay < end;
}

function getTemporaryMaintenance(now = Date.now()) {
  return TEMPORARY_MAINTENANCE_WINDOWS.find((window) => {
    if (!window.enabled) {
      return false;
    }

    const start = Date.parse(window.start);
    const end = Date.parse(window.end);

    if (!Number.isFinite(start) || !Number.isFinite(end)) {
      return false;
    }

    return now >= start && now < end;
  });
}

function getMaintenanceState(nowDate = new Date()) {
  const now = nowDate.getTime();
  const temporaryWindow = getTemporaryMaintenance(now);

  if (temporaryWindow) {
    return {
      active: true,
      type: "temporary",
      label: temporaryWindow.label,
    };
  }

  if (
    DAILY_SCHEDULED_WINDOW.enabled &&
    isWithinDailyWindow(getBeijingMinutesOfDay(nowDate), DAILY_SCHEDULED_WINDOW)
  ) {
    return {
      active: true,
      type: "scheduled",
      label: DAILY_SCHEDULED_WINDOW.label,
    };
  }

  return {
    active: false,
    type: "none",
    label: "",
  };
}

function isPublicPath(pathname) {
  if (pathname === MAINTENANCE_PATH) {
    return true;
  }

  if (PUBLIC_PATHS.has(pathname) || PUBLIC_FILE_PATTERN.test(pathname)) {
    return true;
  }

  return PUBLIC_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function safeNextPath(value) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/index.html";
  }

  return value;
}

function isAdminPath(pathname) {
  return (
    pathname === "/moderation.html" ||
    pathname === "/api/moderation" ||
    pathname === "/admin" ||
    pathname.startsWith("/admin/")
  );
}

function hasAccess(role, pathname) {
  if (!role) {
    return false;
  }

  if (isAdminPath(pathname)) {
    return role === ROLE_ADMIN;
  }

  return role === ROLE_VISITOR || role === ROLE_ADMIN;
}

function redirectResponse(url, status = 307, extraHeaders = {}) {
  return new Response(null, {
    status,
    headers: {
      location: url.toString(),
      "cache-control": "no-store",
      ...extraHeaders,
    },
  });
}

function unauthorizedResponse(url) {
  if (url.pathname.startsWith("/api/")) {
    return new Response(JSON.stringify({ error: "Authentication required." }), {
      status: 401,
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "no-store",
      },
    });
  }

  const loginUrl = new URL(LOGIN_PATH, url);
  loginUrl.searchParams.set("next", `${url.pathname}${url.search}`);
  if (isAdminPath(url.pathname)) {
    loginUrl.searchParams.set("mode", ROLE_ADMIN);
  }
  return redirectResponse(loginUrl);
}

export default async function middleware(request) {
  const url = new URL(request.url);
  const sessionRole = await verifySiteSession(request);

  if (!isPublicPath(url.pathname) && !hasAccess(sessionRole, url.pathname)) {
    return unauthorizedResponse(url);
  }

  if (url.pathname === LOGIN_PATH && sessionRole) {
    const nextPath = safeNextPath(url.searchParams.get("next"));
    const nextUrl = new URL(nextPath, request.url);

    if (hasAccess(sessionRole, nextUrl.pathname)) {
      return redirectResponse(nextUrl);
    }
  }

  if (url.searchParams.has(BYPASS_QUERY) || isPublicPath(url.pathname)) {
    return undefined;
  }

  const maintenance = getMaintenanceState();

  if (!maintenance.active) {
    return undefined;
  }

  const maintenanceUrl = new URL(MAINTENANCE_PATH, request.url);
  maintenanceUrl.searchParams.set("mode", maintenance.type);
  maintenanceUrl.searchParams.set("label", maintenance.label);

  return redirectResponse(maintenanceUrl, 307, {
    "x-solaris-maintenance": maintenance.type,
  });
}
