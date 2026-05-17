const {
  cleanText,
  readJsonBody,
  sendJson,
  supabaseFetch,
} = require("../lib/supabase-api");

const TABLE = process.env.SOLARIS_GUESTBOOK_TABLE || "guestbook_messages";

module.exports = async function handler(request, response) {
  try {
    if (request.method === "GET") {
      const rows = await supabaseFetch(
        `${TABLE}?select=id,name,message,created_at&status=eq.approved&order=created_at.desc&limit=50`
      );
      sendJson(response, 200, { messages: rows || [] });
      return;
    }

    if (request.method === "POST") {
      const body = await readJsonBody(request);
      const name = cleanText(body.name || "匿名访客", 24) || "匿名访客";
      const message = cleanText(body.message, 500);

      if (!message) {
        sendJson(response, 400, { error: "留言内容不能为空。" });
        return;
      }

      const autoApprove = process.env.SOLARIS_GUESTBOOK_AUTO_APPROVE === "true";
      const status = autoApprove ? "approved" : "pending";
      const rows = await supabaseFetch(TABLE, {
        method: "POST",
        headers: { prefer: "return=representation" },
        body: JSON.stringify([{ name, message, status }]),
      });

      sendJson(response, 201, {
        message: rows?.[0] || null,
        status,
      });
      return;
    }

    response.setHeader("allow", "GET, POST");
    sendJson(response, 405, { error: "Method not allowed." });
  } catch (error) {
    sendJson(response, error.statusCode || 500, {
      error: error.message || "Guestbook request failed.",
      detail: error.payload,
    });
  }
};
