const routablePages = new Set(["index.html", "projects.html", "about.html"]);

function getPageName(url) {
  const name = url.pathname.split("/").pop();
  return name || "index.html";
}

function updateActiveNav(pageName) {
  document.querySelectorAll(".nav-links a").forEach((link) => {
    const linkPage = getPageName(new URL(link.href, window.location.href));
    const isProjectDetail = pageName.startsWith("project-") && linkPage === "projects.html";
    const isActive = linkPage === pageName || isProjectDetail;
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

  if (!routablePages.has(pageName)) {
    window.location.href = url.href;
    return;
  }

  const response = await fetch(url.href, { cache: "no-cache" });
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
  window.scrollTo({ top: 0, behavior: "instant" });
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

  if (url.origin !== window.location.origin || !routablePages.has(pageName)) {
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

  window.location.href = new URL(detailUrl, window.location.href).href;
}

document.addEventListener("click", (event) => {
  if (event.target.closest("a, button, input, select, textarea")) {
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
