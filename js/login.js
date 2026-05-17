(function () {
  const ADMIN_TOKEN_KEY = "solarisAdminToken";

  function updateStatus(element, message, tone) {
    element.textContent = message;
    element.classList.toggle("is-error", tone === "error");
    element.classList.toggle("is-ok", tone === "ok");
  }

  function initLogin() {
    const form = document.querySelector("[data-auth-form]");

    if (!form || form.dataset.bound === "true") {
      return;
    }

    const status = form.querySelector("[data-auth-status]");
    const tokenInput = form.querySelector("[data-auth-token]");
    const savedToken = sessionStorage.getItem(ADMIN_TOKEN_KEY) || "";

    if (savedToken) {
      tokenInput.value = savedToken;
      updateStatus(status, "已检测到当前会话令牌，可直接进入审核台。", "ok");
    }

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const token = tokenInput.value.trim();

      if (!token || token.length < 16) {
        updateStatus(status, "请输入有效的管理员令牌。", "error");
        tokenInput.focus();
        return;
      }

      sessionStorage.setItem(ADMIN_TOKEN_KEY, token);

      updateStatus(status, "验证信息已保存，正在进入审核台...", "ok");
      window.setTimeout(() => {
        window.location.href = "moderation.html";
      }, 420);
    });

    form.dataset.bound = "true";
  }

  initLogin();
})();
