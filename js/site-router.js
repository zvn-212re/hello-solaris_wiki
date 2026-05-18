const routablePages = new Set([
  "index.html",
  "projects.html",
  "articles.html",
  "about.html",
  "pomodoro.html",
  "search.html",
  "submit.html",
]);

function getPageName(url) {
  const name = url.pathname.split("/").pop();
  return name || "index.html";
}

function isRoutablePage(pageName) {
  return (
    routablePages.has(pageName) ||
    /^project-[a-z0-9-]+\.html$/i.test(pageName) ||
    /^article-[a-z0-9-]+\.html$/i.test(pageName)
  );
}

function updateActiveNav(pageName) {
  document.querySelectorAll(".nav-links a").forEach((link) => {
    const linkPage = getPageName(new URL(link.href, window.location.href));
    const isProjectPage =
      (pageName.startsWith("project-") || pageName === "pomodoro.html") &&
      linkPage === "projects.html";
    const isArticlePage = pageName.startsWith("article-") && linkPage === "articles.html";
    const isActive = linkPage === pageName || isProjectPage || isArticlePage;
    link.classList.toggle("active", isActive);

    if (isActive) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });
}

async function loadPage(url, pushState = true) {
  const pageName = getPageName(url);

  if (!isRoutablePage(pageName)) {
    window.location.href = url.href;
    return;
  }

  const response = await fetch(url.href, { cache: "no-cache" });

  if (!response.ok) {
    window.location.href = url.href;
    return;
  }

  if (response.redirected && new URL(response.url).pathname.endsWith("/login.html")) {
    window.location.href = response.url;
    return;
  }

  const html = await response.text();
  const nextDocument = new DOMParser().parseFromString(html, "text/html");
  const nextMain = nextDocument.querySelector("main");
  const currentMain = document.querySelector("main");

  if (!nextMain || !currentMain) {
    window.location.href = url.href;
    return;
  }

  currentMain.replaceWith(nextMain);
  document.title = nextDocument.title;
  updateActiveNav(pageName);

  if (pushState) {
    window.history.pushState({ pageName }, "", url.href);
  }

  window.SolarisHero?.init();
  window.SolarisTheme?.init();
  window.SolarisMusic?.render();
  window.SolarisPomodoro?.init();
  window.SolarisUpdates?.init();
  window.SolarisGuestbook?.init();
  window.SolarisSearch?.init();
  window.SolarisSubmissionForm?.init();
  window.SolarisSession?.init();
  window.dispatchEvent(new CustomEvent("solaris:pagechange", { detail: { pageName } }));

  if (url.hash) {
    document.querySelector(url.hash)?.scrollIntoView();
  } else {
    window.scrollTo({ top: 0, behavior: "auto" });
  }
}

document.addEventListener("click", (event) => {
  const link = event.target.closest("a[href]");

  if (!link || link.target || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
    return;
  }

  if (link.getAttribute("href") === "#") {
    event.preventDefault();
    return;
  }

  const url = new URL(link.href, window.location.href);
  const pageName = getPageName(url);

  if (
    url.origin === window.location.origin &&
    url.pathname === window.location.pathname &&
    url.hash
  ) {
    return;
  }

  if (url.origin !== window.location.origin || !isRoutablePage(pageName)) {
    return;
  }

  event.preventDefault();
  loadPage(url).catch(() => {
    window.location.href = url.href;
  });
});

function openProjectCard(card) {
  const detailUrl = card?.dataset.detailUrl;

  if (!detailUrl) {
    return;
  }

  const url = new URL(detailUrl, window.location.href);
  const pageName = getPageName(url);

  if (url.origin === window.location.origin && isRoutablePage(pageName)) {
    loadPage(url).catch(() => {
      window.location.href = url.href;
    });
    return;
  }

  window.location.href = url.href;
}

document.addEventListener("click", (event) => {
  if (event.target.closest("a, button, input, select, textarea, .button")) {
    return;
  }

  const card = event.target.closest("[data-detail-url]");
  openProjectCard(card);
});

document.addEventListener("keydown", (event) => {
  if (event.target.closest("a, button, input, select, textarea")) {
    return;
  }

  if (event.key !== "Enter" && event.key !== " ") {
    return;
  }

  const card = event.target.closest("[data-detail-url]");

  if (!card) {
    return;
  }

  event.preventDefault();
  openProjectCard(card);
});

window.addEventListener("popstate", () => {
  loadPage(new URL(window.location.href), false);
});
