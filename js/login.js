(function () {
  const modes = {
    visitor: {
      fallback: "projects.html",
      transition: "ACCESS GRANTED / VISITOR",
    },
    admin: {
      fallback: "admin/",
      transition: "ACCESS GRANTED / ADMIN",
    },
  };

  function updateStatus(element, message, tone) {
    element.textContent = message;
    element.classList.toggle("is-error", tone === "error");
    element.classList.toggle("is-ok", tone === "ok");
  }

  function getPreferredMode() {
    const mode = new URLSearchParams(window.location.search).get("mode");
    return modes[mode] ? mode : "visitor";
  }

  function getNextPath(mode) {
    const fallback = modes[mode]?.fallback || "index.html";
    const next = new URLSearchParams(window.location.search).get("next");

    if (!next) {
      return fallback;
    }

    if (next.startsWith("/") && !next.startsWith("//")) {
      return next;
    }

    if (/^[a-z0-9-./]+(?:[?#].*)?$/i.test(next) && !next.includes("..")) {
      return next;
    }

    return fallback;
  }

  function isAdminPath(path) {
    return path.startsWith("/admin") || path.startsWith("admin") || path.includes("moderation.html");
  }

  function getRedirectPath(mode) {
    const next = getNextPath(mode);

    if (mode !== "admin" && isAdminPath(next)) {
      return modes.visitor.fallback;
    }

    return next;
  }

  function setActiveMode(root, mode) {
    root.querySelectorAll("[data-auth-tab]").forEach((tab) => {
      const isActive = tab.dataset.authTab === mode;
      tab.classList.toggle("is-active", isActive);
      tab.setAttribute("aria-selected", String(isActive));
    });

    root.querySelectorAll("[data-auth-form]").forEach((panel) => {
      const isActive = panel.dataset.authForm === mode;
      panel.classList.toggle("is-active", isActive);
      panel.hidden = !isActive;
    });
  }

  function buildPayload(form, mode) {
    if (mode === "admin") {
      return {
        mode,
        username: form.querySelector("[data-admin-username]").value.trim(),
        password: form.querySelector("[data-admin-password]").value.trim(),
      };
    }

    return {
      mode,
      inviteCode: form.querySelector("[data-invite-code]").value.trim(),
    };
  }

  function validatePayload(payload) {
    if (payload.mode === "visitor") {
      return payload.inviteCode.length >= 6 ? "" : "邀请码至少需要 6 位字符。";
    }

    if (!payload.username || !payload.password) {
      return "请输入管理员账号和密码。";
    }

    return "";
  }

  function playSuccessTransition(root, role) {
    const transition = root.querySelector("[data-auth-transition]");
    const text = root.querySelector("[data-transition-text]");
    const message = modes[role]?.transition || "ACCESS GRANTED";

    if (text) {
      text.textContent = message;
    }

    root.classList.add("is-success");
    transition?.classList.add("is-active");
  }

  function initLogin() {
    const root = document.querySelector("[data-auth-root]");
    const shell = document.querySelector(".auth-shell");

    if (!root || root.dataset.bound === "true") {
      return;
    }

    const status = root.querySelector("[data-auth-status]");
    let activeMode = getPreferredMode();

    setActiveMode(root, activeMode);

    root.querySelectorAll("[data-auth-tab]").forEach((tab) => {
      tab.addEventListener("click", () => {
        activeMode = tab.dataset.authTab;
        setActiveMode(root, activeMode);
        updateStatus(status, "请选择登录方式。验证通过后会创建仅服务端可读的访问 Cookie。");
      });
    });

    root.querySelectorAll("[data-auth-form]").forEach((form) => {
      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const mode = form.dataset.authForm;
        const payload = buildPayload(form, mode);
        const validationError = validatePayload(payload);
        const button = form.querySelector("button[type='submit']");

        if (validationError) {
          updateStatus(status, validationError, "error");
          form.querySelector("input")?.focus();
          return;
        }

        button.disabled = true;
        shell?.classList.add("is-verifying");
        updateStatus(status, mode === "admin" ? "正在验证管理员身份..." : "正在验证访客邀请码...", "ok");

        try {
          const response = await fetch("/api/auth", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(payload),
          });
          const result = await response.json().catch(() => ({}));

          if (!response.ok) {
            throw new Error(result.error || "验证失败。");
          }

          sessionStorage.setItem(
            "solarisAuthState",
            JSON.stringify({ role: result.role, loggedAt: new Date().toISOString() })
          );
          updateStatus(status, "验证通过，正在打开访问轨道...", "ok");
          playSuccessTransition(shell || document.body, result.role || mode);
          window.setTimeout(() => {
            window.location.href = getRedirectPath(result.role || mode);
          }, 760);
        } catch (error) {
          shell?.classList.remove("is-verifying");
          updateStatus(status, error.message || "验证失败。", "error");
          form.querySelector("input")?.focus();
        } finally {
          button.disabled = false;
        }
      });
    });

    root.dataset.bound = "true";
  }

  initLogin();
})();
