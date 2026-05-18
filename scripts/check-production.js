const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const SITE_URL = process.env.SOLARIS_SITE_URL || "https://solaris.wiki";
const ENV_FILES = [".env.local", ".env"];

function loadEnvFile(file) {
  const fullPath = path.join(ROOT, file);

  if (!fs.existsSync(fullPath)) {
    return;
  }

  for (const rawLine of fs.readFileSync(fullPath, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) {
      continue;
    }

    const separator = line.indexOf("=");

    if (separator === -1) {
      continue;
    }

    const name = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim().replace(/^["']|["']$/g, "");

    if (name && process.env[name] === undefined) {
      process.env[name] = value;
    }
  }
}

function requireEnv(name) {
  if (!process.env[name]) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return process.env[name];
}

async function login(payload) {
  const response = await fetch(`${SITE_URL}/api/auth`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
    redirect: "manual",
  });

  return {
    status: response.status,
    cookie: (response.headers.get("set-cookie") || "").split(";")[0],
  };
}

async function get(pathname, cookie) {
  const response = await fetch(`${SITE_URL}${pathname}`, {
    headers: cookie ? { cookie } : undefined,
    redirect: "manual",
  });

  return {
    status: response.status,
    redirectedToLogin: (response.headers.get("location") || "").includes("/login.html"),
  };
}

async function main() {
  for (const file of ENV_FILES) {
    loadEnvFile(file);
  }

  const visitor = await login({
    mode: "visitor",
    inviteCode: requireEnv("SOLARIS_VISITOR_INVITE_CODE"),
  });
  const home = await get("/index.html", visitor.cookie);
  const guestbook = await get("/api/guestbook", visitor.cookie);

  const admin = await login({
    mode: "admin",
    username: requireEnv("SOLARIS_ADMIN_USERNAME"),
    password: requireEnv("SOLARIS_ADMIN_PASSWORD"),
  });
  const moderation = await get("/api/moderation?kind=guestbook", admin.cookie);

  console.log(
    JSON.stringify(
      {
        site: SITE_URL,
        visitorLoginStatus: visitor.status,
        visitorCookiePresent: Boolean(visitor.cookie),
        homeStatus: home.status,
        homeRedirectedToLogin: home.redirectedToLogin,
        guestbookStatus: guestbook.status,
        adminLoginStatus: admin.status,
        adminCookiePresent: Boolean(admin.cookie),
        moderationStatus: moderation.status,
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});
