const {
  cleanText,
  readJsonBody,
  sendJson,
  supabaseFetch,
} = require("../lib/supabase-api");

const TABLE = process.env.SOLARIS_SUBMISSIONS_TABLE || "content_submissions";

module.exports = async function handler(request, response) {
  try {
    if (request.method !== "POST") {
      response.setHeader("allow", "POST");
      sendJson(response, 405, { error: "Method not allowed." });
      return;
    }

    const body = await readJsonBody(request);
    const title = cleanText(body.title, 80);
    const author = cleanText(body.author || "匿名投稿者", 40) || "匿名投稿者";
    const contact = cleanText(body.contact, 120);
    const type = cleanText(body.type || "post", 24) || "post";
    const summary = cleanText(body.summary, 260);
    const content = String(body.content || "").trim().slice(0, 8000);

    if (!title || !content) {
      sendJson(response, 400, { error: "标题和正文不能为空。" });
      return;
    }

    const rows = await supabaseFetch(TABLE, {
      method: "POST",
      headers: { prefer: "return=representation" },
      body: JSON.stringify([
        {
          title,
          author,
          contact,
          type,
          summary,
          content,
          status: "pending",
        },
      ]),
    });

    sendJson(response, 201, { submission: rows?.[0] || null });
  } catch (error) {
    sendJson(response, error.statusCode || 500, {
      error: error.message || "Submission request failed.",
      detail: error.payload,
    });
  }
};
