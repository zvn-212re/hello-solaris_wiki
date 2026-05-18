(function () {
  function formatDate(value) {
    try {
      return new Intl.DateTimeFormat("zh-CN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(value));
    } catch {
      return "刚刚";
    }
  }

  function normalizeRemote(row) {
    return {
      id: row.id,
      name: row.name || "匿名访客",
      text: row.message || "",
      createdAt: row.created_at || new Date().toISOString(),
    };
  }

  function setStatus(element, message, tone) {
    if (!element) {
      return;
    }

    element.textContent = message;
    element.classList.toggle("is-error", tone === "error");
    element.classList.toggle("is-ok", tone === "ok");
  }

  function renderMessages({ list, empty, clearButton, modeText }, messages) {
    list.innerHTML = "";
    empty.hidden = messages.length > 0;
    clearButton.hidden = true;

    if (modeText) {
      modeText.textContent = "Cloud Signals";
    }

    messages.forEach((message) => {
      const item = document.createElement("article");
      item.className = "guestbook-item";

      const meta = document.createElement("p");
      meta.className = "guestbook-meta";
      meta.textContent = `${message.name} / ${formatDate(message.createdAt)}`;

      const body = document.createElement("p");
      body.className = "guestbook-message";
      body.textContent = message.text;

      item.append(meta, body);
      list.append(item);
    });
  }

  async function readJsonResponse(response, fallbackMessage) {
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(payload.error || fallbackMessage);
    }

    return payload;
  }

  async function fetchRemoteMessages() {
    const response = await fetch("/api/guestbook", {
      cache: "no-store",
      credentials: "same-origin",
    });
    const payload = await readJsonResponse(response, "云端留言服务暂时不可用。");
    return (payload.messages || []).map(normalizeRemote);
  }

  async function postRemoteMessage(name, message) {
    const response = await fetch("/api/guestbook", {
      method: "POST",
      headers: { "content-type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ name, message }),
    });

    return readJsonResponse(response, "留言发送失败。");
  }

  function initGuestbook() {
    const root = document.querySelector("[data-guestbook]");

    if (!root || root.dataset.bound === "true") {
      return;
    }

    const form = root.querySelector("[data-guestbook-form]");
    const nameInput = root.querySelector("[data-guestbook-name]");
    const messageInput = root.querySelector("[data-guestbook-message]");
    const list = root.querySelector("[data-guestbook-list]");
    const empty = root.querySelector("[data-guestbook-empty]");
    const clearButton = root.querySelector("[data-guestbook-clear]");
    const modeText = root.querySelector("[data-guestbook-mode]");
    const statusText = root.querySelector("[data-guestbook-status]");
    const elements = { list, empty, clearButton, modeText };

    async function refreshMessages() {
      setStatus(statusText, "正在读取云端留言...", "ok");

      try {
        const messages = await fetchRemoteMessages();
        renderMessages(elements, messages);
        setStatus(statusText, "留言会提交到云端，审核通过后公开展示。", "ok");
      } catch (error) {
        renderMessages(elements, []);
        setStatus(
          statusText,
          `${error.message || "云端留言服务暂时不可用。"} 请检查 Supabase 表和 Vercel 环境变量。`,
          "error"
        );
      }
    }

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const name = nameInput.value.trim() || "匿名访客";
      const text = messageInput.value.trim();

      if (!text) {
        messageInput.focus();
        return;
      }

      const button = form.querySelector("button[type='submit']");
      button.disabled = true;

      try {
        const payload = await postRemoteMessage(name.slice(0, 24), text.slice(0, 500));
        form.reset();
        setStatus(
          statusText,
          payload.status === "approved" ? "留言已发布。" : "留言已收到，等待审核。",
          "ok"
        );
        await refreshMessages();
      } catch (error) {
        setStatus(statusText, error.message || "留言发送失败，请稍后再试。", "error");
      } finally {
        button.disabled = false;
      }
    });

    clearButton.addEventListener("click", refreshMessages);

    root.dataset.bound = "true";
    refreshMessages();
  }

  window.SolarisGuestbook = {
    init: initGuestbook,
  };

  initGuestbook();
})();
