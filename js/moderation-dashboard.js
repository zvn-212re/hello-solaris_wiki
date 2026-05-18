(function () {
  const kinds = ["guestbook", "submissions"];

  function getToken() {
    return sessionStorage.getItem("solarisAdminToken") || "";
  }

  function setToken(value) {
    sessionStorage.setItem("solarisAdminToken", value);
  }

  async function requestModeration(path, options = {}) {
    const token = getToken();
    const headers = {
      "content-type": "application/json",
      ...(options.headers || {}),
    };

    if (token) {
      headers["x-admin-token"] = token;
    }

    const response = await fetch(path, {
      ...options,
      headers,
    });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(payload.error || "审核请求失败。");
    }

    return payload;
  }

  function field(item, names) {
    for (const name of names) {
      if (item[name]) {
        return item[name];
      }
    }
    return "";
  }

  function renderItems(root, kind, items) {
    const list = root.querySelector(`[data-moderation-list="${kind}"]`);
    list.innerHTML = "";

    if (!items.length) {
      const empty = document.createElement("p");
      empty.className = "empty-tomato";
      empty.textContent = "没有待审内容。";
      list.append(empty);
      return;
    }

    items.forEach((item) => {
      const card = document.createElement("article");
      card.className = "guestbook-item moderation-item";

      const title = document.createElement("h3");
      title.textContent = field(item, ["title", "name"]) || "未命名";

      const body = document.createElement("p");
      body.className = "guestbook-message";
      body.textContent = field(item, ["message", "content", "summary"]);

      const meta = document.createElement("p");
      meta.className = "guestbook-meta";
      meta.textContent = `${item.status || "pending"} / ${item.created_at || ""}`;

      const actions = document.createElement("div");
      actions.className = "actions compact-actions";

      ["approved", "pending", "hidden", "rejected"].forEach((status) => {
        const button = document.createElement("button");
        button.className = status === "approved" ? "button" : "button secondary";
        button.type = "button";
        button.textContent = status;
        button.addEventListener("click", async () => {
          await requestModeration("/api/moderation", {
            method: "PATCH",
            body: JSON.stringify({ kind, id: item.id, status }),
          });
          await loadKind(root, kind);
        });
        actions.append(button);
      });

      card.append(title, body, meta, actions);
      list.append(card);
    });
  }

  async function loadKind(root, kind) {
    const status = root.querySelector("[data-moderation-status]");
    status.textContent = `正在读取 ${kind}...`;
    const payload = await requestModeration(`/api/moderation?kind=${kind}`);
    renderItems(root, kind, payload.items || []);
    status.textContent = "审核数据已同步。";
  }

  function initModeration() {
    const root = document.querySelector("[data-moderation]");

    if (!root || root.dataset.bound === "true") {
      return;
    }

    const tokenInput = root.querySelector("[data-admin-token]");
    const loadButton = root.querySelector("[data-load-moderation]");
    const status = root.querySelector("[data-moderation-status]");
    tokenInput.value = getToken();

    if (!tokenInput.value && status) {
      status.textContent = "已通过站点登录时可直接读取；令牌输入框仅作为备用。";
    }

    loadButton.addEventListener("click", async () => {
      setToken(tokenInput.value.trim());

      try {
        await Promise.all(kinds.map((kind) => loadKind(root, kind)));
      } catch (error) {
        root.querySelector("[data-moderation-status]").textContent =
          error.message || "审核数据读取失败。";
      }
    });

    root.dataset.bound = "true";
  }

  window.SolarisModeration = {
    init: initModeration,
  };

  initModeration();
})();
