(function () {
  const STORAGE_KEY = "solarisTheme";
  const NIGHT = "night";
  const DAY = "day";

  function readTheme() {
    try {
      return localStorage.getItem(STORAGE_KEY) === NIGHT ? NIGHT : DAY;
    } catch {
      return DAY;
    }
  }

  function saveTheme(theme) {
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Local storage can be blocked in private browsing modes.
    }
  }

  function applyTheme(theme, animate = false) {
    const root = document.documentElement;

    if (animate) {
      root.classList.remove("theme-transition");
      void root.offsetWidth;
      root.classList.add("theme-transition");
      window.setTimeout(() => root.classList.remove("theme-transition"), 720);
    }

    if (theme === NIGHT) {
      root.dataset.theme = NIGHT;
    } else {
      delete root.dataset.theme;
    }

    document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
      const isNight = theme === NIGHT;
      button.setAttribute("aria-pressed", String(isNight));
      button.setAttribute("aria-label", isNight ? "切换白天模式" : "切换夜间模式");
      button.title = isNight ? "切换白天模式" : "切换夜间模式";
    });
  }

  function setTheme(theme, animate = true) {
    applyTheme(theme, animate);
    saveTheme(theme);
  }

  function toggleTheme() {
    const nextTheme = document.documentElement.dataset.theme === NIGHT ? DAY : NIGHT;
    setTheme(nextTheme, true);
  }

  function bind() {
    applyTheme(readTheme(), false);

    document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
      if (button.dataset.themeBound === "true") {
        return;
      }

      button.dataset.themeBound = "true";
      button.addEventListener("click", toggleTheme);
    });
  }

  window.SolarisTheme = {
    init: bind,
    setTheme,
    toggle: toggleTheme,
  };

  bind();
})();
