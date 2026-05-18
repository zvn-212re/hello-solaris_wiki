const crypto = require("node:crypto");
const {
  createExpiredSiteSessionCookie,
  createSiteSessionCookie,
  getAuthSecret,
  isHostedRuntime,
  ROLE_ADMIN,
  ROLE_VISITOR,
} = require("../lib/auth-session");
const { checkRateLimit, readJsonBody, sendJson } = require("../lib/supabase-api");

function getAuthSetting(name, localFallback = "") {
  if (process.env[name]) {
    return process.env[name];
  }

  return isHostedRuntime() ? "" : localFallback;
}

function tokensMatch(input, expected) {
  const inputBuffer = Buffer.from(input || "");
  const expectedBuffer = Buffer.from(expected || "");

  if (!inputBuffer.length || inputBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(inputBuffer, expectedBuffer);
}

module.exports = async function handler(request, response) {
  try {
    if (request.method === "POST") {
      checkRateLimit(request, "auth", {
        limit: 24,
        windowMs: 15 * 60 * 1000,
      });

      const body = await readJsonBody(request);
      const mode = String(body.mode || "visitor").trim();
      let role = "";

      if (!getAuthSecret()) {
        sendJson(response, 503, { error: "访问验证未配置，请先设置 SOLARIS_AUTH_SECRET。" });
        return;
      }

      if (mode === ROLE_VISITOR) {
        const expectedInvite = getAuthSetting("SOLARIS_VISITOR_INVITE_CODE", "SOLARIS2026");
        const inviteCode = String(body.inviteCode || "").trim();

        if (!expectedInvite) {
          sendJson(response, 503, { error: "访客邀请码未配置，请先设置 SOLARIS_VISITOR_INVITE_CODE。" });
          return;
        }

        if (!tokensMatch(inviteCode, expectedInvite)) {
          sendJson(response, 401, { error: "访客邀请码无效。" });
          return;
        }

        role = ROLE_VISITOR;
      } else if (mode === ROLE_ADMIN) {
        const expectedUser = getAuthSetting("SOLARIS_ADMIN_USERNAME", "admin");
        const expectedPassword = getAuthSetting("SOLARIS_ADMIN_PASSWORD", "solaris2026");
        const username = String(body.username || "").trim();
        const password = String(body.password || "").trim();

        if (!expectedUser || !expectedPassword) {
          sendJson(response, 503, { error: "管理员账号密码未配置，请先设置 SOLARIS_ADMIN_USERNAME 和 SOLARIS_ADMIN_PASSWORD。" });
          return;
        }

        if (!tokensMatch(username, expectedUser) || !tokensMatch(password, expectedPassword)) {
          sendJson(response, 401, { error: "管理员账号或密码无效。" });
          return;
        }

        role = ROLE_ADMIN;
      } else {
        sendJson(response, 400, { error: "Unknown authentication mode." });
        return;
      }

      response.setHeader("set-cookie", createSiteSessionCookie(request, role));
      sendJson(response, 200, { ok: true, role });
      return;
    }

    if (request.method === "DELETE") {
      response.setHeader("set-cookie", createExpiredSiteSessionCookie(request));
      sendJson(response, 200, { ok: true });
      return;
    }

    response.setHeader("allow", "POST, DELETE");
    sendJson(response, 405, { error: "Method not allowed." });
  } catch (error) {
    sendJson(response, error.statusCode || 500, {
      error: error.message || "Authentication request failed.",
    });
  }
};
