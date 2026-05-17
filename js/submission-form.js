(function () {
  function initSubmissionForm() {
    const form = document.querySelector("[data-submission-form]");

    if (!form || form.dataset.bound === "true") {
      return;
    }

    const status = document.querySelector("[data-submission-status]");
    const button = form.querySelector("button[type='submit']");

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const payload = Object.fromEntries(new FormData(form).entries());
      button.disabled = true;
      status.textContent = "正在发送投稿...";

      try {
        const response = await fetch("/api/submissions", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
        });
        const result = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(result.error || "投稿失败。");
        }

        form.reset();
        status.textContent = "投稿已收到，等待审核。";
      } catch (error) {
        status.textContent = `${error.message || "投稿失败。"} 如果还没配置 Supabase，可以先通过邮件发送。`;
      } finally {
        button.disabled = false;
      }
    });

    form.dataset.bound = "true";
  }

  window.SolarisSubmissionForm = {
    init: initSubmissionForm,
  };

  initSubmissionForm();
})();
