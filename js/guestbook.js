(function () {
  const STORAGE_KEY = "solarisGuestbookMessages";
  const MAX_MESSAGES = 12;

  function readLocalMessages() {
    try {
      const messages = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      return Array.isArray(messages) ? messages : [];
    } catch {
      return [];
    }
  }

  function saveLocalMessages(messages) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(0, MAX_MESSAGES)));
    } catch {
      // Local fallback only; ignore storage errors.
    }
  }

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
      text: row.message || row.text || "",
      createdAt: row.created_at || row.createdAt || new Date().toISOString(),
      remote: true,
    };
  }

  function renderMessages({ list, empty, clearButton, modeText }, messages, mode) {
    list.innerHTML = "";
    empty.hidden = messages.length > 0;
    clearButton.hidden = mode !== "local" || messages.length === 0;

    if (modeText) {
      modeText.textContent = mode === "remote" ? "Public Signals" : "Local Signals";
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

  async function fetchRemoteMessages() {
    const response = await fetch("/api/guestbook", { cache: "no-store" });

    if (!response.ok) {
      throw new Error("Guestbook API unavailable.");
    }

    const payload = await response.json();
    return (payload.messages || []).map(normalizeRemote);
  }

  async function postRemoteMessage(name, message) {
    const response = await fetch("/api/guestbook", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name, message }),
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(payload.error || "留言发送失败。");
    }

    return payload;
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
    let mode = "local";

    function renderLocal() {
      mode = "local";
      renderMessages(elements, readLocalMessages(), mode);
      if (statusText) {
        statusText.textContent = "线上留言服务未配置时，会临时保存到当前浏览器。";
      }
    }

    async function renderRemote() {
      const messages = await fetchRemoteMessages();
      mode = "remote";
      renderMessages(elements, messages, mode);
      if (statusText) {
        statusText.textContent = "留言会提交到公开留言区，审核通过后展示。";
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
        if (mode === "remote") {
          const payload = await postRemoteMessage(name.slice(0, 24), text.slice(0, 500));
          form.reset();
          if (statusText) {
            statusText.textContent =
              payload.status === "approved" ? "留言已发布。" : "留言已收到，等待审核。";
          }
          await renderRemote();
        } else {
          const messages = readLocalMessages();
          messages.unshift({
            name: name.slice(0, 24),
            text: text.slice(0, 220),
            createdAt: new Date().toISOString(),
          });
          saveLocalMessages(messages);
          form.reset();
          renderLocal();
        }
      } catch (error) {
        if (statusText) {
          statusText.textContent = error.message || "留言发送失败，已切回本地模式。";
        }
        mode = "local";
        renderLocal();
      } finally {
        button.disabled = false;
      }
    });

    clearButton.addEventListener("click", () => {
      saveLocalMessages([]);
      renderLocal();
    });

    root.dataset.bound = "true";
    renderRemote().catch(renderLocal);
  }

  window.SolarisGuestbook = {
    init: initGuestbook,
  };

  initGuestbook();
})();
