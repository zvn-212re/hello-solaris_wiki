const {
  cleanText,
  readJsonBody,
  requireAdmin,
  sendJson,
  supabaseFetch,
} = require("../lib/supabase-api");

const TABLES = {
  guestbook: process.env.SOLARIS_GUESTBOOK_TABLE || "guestbook_messages",
  submissions: process.env.SOLARIS_SUBMISSIONS_TABLE || "content_submissions",
};

function getKind(request) {
  const url = new URL(request.url, "https://solaris.wiki");
  return url.searchParams.get("kind") || "guestbook";
}

function tableFor(kind) {
  const table = TABLES[kind];

  if (!table) {
    const error = new Error("Unknown moderation kind.");
    error.statusCode = 400;
    throw error;
  }

  return table;
}

module.exports = async function handler(request, response) {
  try {
    requireAdmin(request);

    if (request.method === "GET") {
      const kind = getKind(request);
      const rows = await supabaseFetch(
        `${tableFor(kind)}?select=*&order=created_at.desc&limit=100`
      );
      sendJson(response, 200, { items: rows || [] });
      return;
    }

    if (request.method === "PATCH") {
      const body = await readJsonBody(request);
      const kind = cleanText(body.kind, 24);
      const id = cleanText(body.id, 80);
      const status = cleanText(body.status, 24);

      if (!id || !["pending", "approved", "hidden", "rejected"].includes(status)) {
        sendJson(response, 400, { error: "Invalid moderation payload." });
        return;
      }

      const rows = await supabaseFetch(`${tableFor(kind)}?id=eq.${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { prefer: "return=representation" },
        body: JSON.stringify({ status }),
      });

      sendJson(response, 200, { item: rows?.[0] || null });
      return;
    }

    if (request.method === "DELETE") {
      const url = new URL(request.url, "https://solaris.wiki");
      const kind = url.searchParams.get("kind") || "";
      const id = url.searchParams.get("id") || "";

      if (!id) {
        sendJson(response, 400, { error: "Missing id." });
        return;
      }

      await supabaseFetch(`${tableFor(kind)}?id=eq.${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      sendJson(response, 200, { ok: true });
      return;
    }

    response.setHeader("allow", "GET, PATCH, DELETE");
    sendJson(response, 405, { error: "Method not allowed." });
  } catch (error) {
    sendJson(response, error.statusCode || 500, {
      error: error.message || "Moderation request failed.",
      detail: error.payload,
    });
  }
};
