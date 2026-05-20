(function () {
  async function logout(button) {
    button.disabled = true;
    button.textContent = "退出中...";

    try {
      await fetch("/api/auth", {
        method: "DELETE",
        credentials: "same-origin",
      });
    } catch {
      // Redirect anyway; the server cookie may already be gone or unreachable.
    } finally {
      try {
        sessionStorage.removeItem("solarisAuthState");
        sessionStorage.removeItem("solarisAdminToken");
      } catch {
        // Session storage may be unavailable in privacy modes.
      }

      window.location.href = "/login.html";
    }
  }

  function initSessionControls() {
    document.querySelectorAll("[data-auth-logout]").forEach((button) => {
      if (button.dataset.bound === "true") {
        return;
      }

      button.dataset.bound = "true";
      button.addEventListener("click", () => logout(button));
    });
  }

  window.SolarisSession = {
    init: initSessionControls,
  };

  initSessionControls();
})();
