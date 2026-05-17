(function () {
  const COLLAPSED_SIZE = 4;
  const EXPANDED_SIZE = 7;

  function initSiteUpdates() {
    const root = document.querySelector("[data-site-updates]");

    if (!root || root.dataset.bound === "true") {
      return;
    }

    const items = Array.from(root.querySelectorAll("[data-update-item]"));
    const moreButton = root.querySelector("[data-updates-more]");
    const prevButton = root.querySelector("[data-updates-prev]");
    const nextButton = root.querySelector("[data-updates-next]");
    const pageText = root.querySelector("[data-updates-page]");
    const countText = root.querySelector("[data-updates-count]");
    const state = {
      expanded: false,
      page: 0,
    };

    function getPageSize() {
      return state.expanded ? EXPANDED_SIZE : COLLAPSED_SIZE;
    }

    function getTotalPages() {
      return Math.max(1, Math.ceil(items.length / getPageSize()));
    }

    function render() {
      const pageSize = getPageSize();
      const totalPages = getTotalPages();
      state.page = Math.min(state.page, totalPages - 1);
      const start = state.page * pageSize;
      const end = start + pageSize;

      items.forEach((item, index) => {
        item.hidden = index < start || index >= end;
      });

      if (moreButton) {
        moreButton.textContent = state.expanded ? "收起" : "显示更多";
        moreButton.setAttribute("aria-expanded", String(state.expanded));
      }

      if (prevButton) {
        prevButton.disabled = state.page === 0;
      }

      if (nextButton) {
        nextButton.disabled = state.page >= totalPages - 1;
      }

      if (pageText) {
        pageText.textContent = `${state.page + 1} / ${totalPages}`;
      }

      if (countText) {
        countText.textContent = `显示 ${Math.min(pageSize, items.length - start)} / ${items.length} 条`;
      }
    }

    moreButton?.addEventListener("click", () => {
      state.expanded = !state.expanded;
      state.page = 0;
      render();
    });

    prevButton?.addEventListener("click", () => {
      state.page = Math.max(0, state.page - 1);
      render();
    });

    nextButton?.addEventListener("click", () => {
      state.page = Math.min(getTotalPages() - 1, state.page + 1);
      render();
    });

    root.dataset.bound = "true";
    render();
  }

  window.SolarisUpdates = {
    init: initSiteUpdates,
  };

  initSiteUpdates();
})();
