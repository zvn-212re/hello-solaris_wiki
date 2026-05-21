const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(ROOT, "dist");
const SITE_URL = "https://solaris.wiki";
const OG_IMAGE = `${SITE_URL}/images/3818c2c7aa04f65ddb23e7d25a159026522770383.png@360w_270h_1s.avif`;
const POSTS_DIR = path.join(ROOT, "content", "posts");
const ROOT_SEARCH_INDEX_PATH = path.join(ROOT, "data", "search-index.json");
const SEARCH_INDEX_PATH = path.join(OUT_DIR, "data", "search-index.json");

function readJson(relativePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(path.join(ROOT, relativePath), "utf8"));
  } catch {
    return fallback;
  }
}

function readJsonArray(relativePath, key, fallback = []) {
  const payload = readJson(relativePath, fallback);

  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.[key])) {
    return payload[key];
  }

  return fallback;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function slugFromFile(file) {
  return path.basename(file, path.extname(file)).replace(/^\d{4}-\d{2}-\d{2}-/, "");
}

function parseFrontMatter(raw) {
  if (!raw.startsWith("---")) {
    return { data: {}, body: raw };
  }

  const end = raw.indexOf("\n---", 3);

  if (end === -1) {
    return { data: {}, body: raw };
  }

  const frontMatter = raw.slice(3, end).trim();
  const body = raw.slice(end + 4).trim();
  const data = {};
  let currentList = null;

  for (const line of frontMatter.split(/\r?\n/)) {
    const listMatch = line.match(/^\s*-\s+(.+)$/);

    if (listMatch && currentList) {
      data[currentList].push(listMatch[1].trim());
      continue;
    }

    const fieldMatch = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);

    if (!fieldMatch) {
      currentList = null;
      continue;
    }

    const [, key, value] = fieldMatch;
    const cleanValue = value.trim().replace(/^["']|["']$/g, "");

    if (!cleanValue) {
      data[key] = [];
      currentList = key;
    } else {
      data[key] = cleanValue;
      currentList = null;
    }
  }

  return { data, body };
}

function renderInline(value) {
  return escapeHtml(value)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
}

function markdownToHtml(markdown) {
  const lines = markdown.split(/\r?\n/);
  const blocks = [];
  let paragraph = [];
  let list = [];

  function flushParagraph() {
    if (paragraph.length) {
      blocks.push(`<p>${renderInline(paragraph.join(" "))}</p>`);
      paragraph = [];
    }
  }

  function flushList() {
    if (list.length) {
      blocks.push(`<ul>${list.map((item) => `<li>${renderInline(item)}</li>`).join("")}</ul>`);
      list = [];
    }
  }

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed) {
      flushParagraph();
      flushList();
      continue;
    }

    if (trimmed.startsWith("### ")) {
      flushParagraph();
      flushList();
      blocks.push(`<h3>${renderInline(trimmed.slice(4))}</h3>`);
      continue;
    }

    if (trimmed.startsWith("## ")) {
      flushParagraph();
      flushList();
      blocks.push(`<h2>${renderInline(trimmed.slice(3))}</h2>`);
      continue;
    }

    if (trimmed.startsWith("# ")) {
      flushParagraph();
      flushList();
      blocks.push(`<h2>${renderInline(trimmed.slice(2))}</h2>`);
      continue;
    }

    if (trimmed.startsWith("- ")) {
      flushParagraph();
      list.push(trimmed.slice(2));
      continue;
    }

    paragraph.push(trimmed);
  }

  flushParagraph();
  flushList();
  return blocks.join("\n            ");
}

function readPosts() {
  if (!fs.existsSync(POSTS_DIR)) {
    return [];
  }

  return fs
    .readdirSync(POSTS_DIR)
    .filter((file) => file.endsWith(".md"))
    .map((file) => {
      const raw = fs.readFileSync(path.join(POSTS_DIR, file), "utf8");
      const { data, body } = parseFrontMatter(raw);
      const slug = data.slug || slugFromFile(file);

      return {
        slug,
        title: data.title || slug,
        summary: data.summary || body.slice(0, 120),
        date: data.date || "2026-05-17",
        status: data.status || "draft",
        tags: Array.isArray(data.tags) ? data.tags : [],
        body,
        url: `article-${slug}.html`,
      };
    })
    .filter((post) => post.status === "published")
    .sort((a, b) => String(b.date).localeCompare(String(a.date)));
}

function themeBootScript() {
  return `<script>
    (() => {
      try {
        if (localStorage.getItem("solarisTheme") === "night") {
          document.documentElement.dataset.theme = "night";
        }
      } catch {}
    })();
  </script>`;
}

function head(title, description, page, type = "website") {
  const canonical = page === "index.html" ? `${SITE_URL}/` : `${SITE_URL}/${page}`;
  const pageTitle = `Solaris Wiki | ${title}`;

  return `<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  ${themeBootScript()}
  <meta name="description" content="${escapeHtml(description)}">
  <meta name="theme-color" content="#f4ead6">
  <meta property="og:type" content="${escapeHtml(type)}">
  <meta property="og:site_name" content="Solaris Wiki">
  <meta property="og:title" content="${escapeHtml(pageTitle)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:url" content="${escapeHtml(canonical)}">
  <meta property="og:image" content="${escapeHtml(OG_IMAGE)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(pageTitle)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${escapeHtml(OG_IMAGE)}">
  <link rel="canonical" href="${escapeHtml(canonical)}">
  <link rel="icon" href="favicon.svg" type="image/svg+xml">
  <title>${escapeHtml(pageTitle)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600;700&family=Press+Start+2P&display=swap" rel="stylesheet">
  <link href="https://cdn.jsdelivr.net/npm/remixicon@4.5.0/fonts/remixicon.css" rel="stylesheet">
  <link rel="stylesheet" href="css/styles.css">
</head>`;
}

function nav(active) {
  const links = [
    ["index", "index.html", "首页"],
    ["projects", "projects.html", "项目"],
    ["articles", "articles.html", "文章"],
    ["about", "about.html", "关于"],
  ];

  return `<header class="site-header">
    <nav class="nav" aria-label="主导航">
      <a class="brand" href="index.html">
        <span class="brand-mark"><i class="ri-planet-line"></i></span>
        <span>Solaris Wiki</span>
      </a>
      <div class="nav-links">
        ${links
          .map(([key, href, label]) => `<a${key === active ? ' class="active" aria-current="page"' : ""} href="${href}">${label}</a>`)
          .join("\n        ")}
      </div>
      <div class="nav-actions">
        <button class="theme-lamp" type="button" data-theme-toggle aria-label="切换夜间模式" aria-pressed="false">
          <span class="lamp-cord" aria-hidden="true"></span>
          <span class="lamp-head" aria-hidden="true"></span>
          <span class="lamp-glow" aria-hidden="true"></span>
        </button>
      </div>
    </nav>
  </header>`;
}

function footer() {
  return `<footer class="site-footer">
    <div class="footer-inner">
      <a href="${SITE_URL}" target="_blank" rel="noopener noreferrer">solaris.wiki</a>
      <div class="footer-links">
        <a href="https://github.com/zvn-212re" target="_blank" rel="noopener noreferrer" aria-label="GitHub 主页"><i class="ri-github-line"></i> GitHub</a>
        <a href="mailto:xiechanghui9@gmail.com"><i class="ri-mail-line"></i> xiechanghui9@gmail.com</a>
        <button class="footer-action" type="button" data-auth-logout><i class="ri-logout-box-r-line"></i> 退出</button>
      </div>
      <div class="music-player" data-music-player>
        <button class="music-toggle" type="button" data-music-toggle aria-expanded="false">
          <i class="ri-music-2-line"></i> MUSIC
        </button>
        <div class="music-panel" data-music-panel>
          <div class="music-display">
            <span class="music-led" data-music-led></span>
            <span data-music-title>8-bit 海面信号</span>
          </div>
          <div class="music-controls">
            <button class="music-button" type="button" data-music-play>PLAY</button>
            <select class="music-select" data-music-track aria-label="选择音乐">
              <option value="signal">8-bit 海面信号</option>
              <option value="orbit">像素轨道巡航</option>
              <option value="terminal">终端夜航</option>
            </select>
          </div>
          <label class="music-volume">
            <span>VOL</span>
            <input type="range" min="0" max="100" value="36" data-music-volume>
          </label>
        </div>
      </div>
    </div>
  </footer>`;
}

function scripts(extra = "") {
  return `<script src="js/theme-toggle.js"></script>
  <script src="js/music-player.js"></script>
  <script src="js/session-controls.js"></script>
  <script src="js/site-router.js"></script>${extra ? `\n  ${extra}` : ""}`;
}

function page({ title, description, active, pageName, main, extraScripts, type }) {
  return `<!DOCTYPE html>
<html lang="zh-CN">
${head(title, description, pageName, type)}
<body>
  ${nav(active)}

  <main>
${main}
  </main>

  ${footer()}
  ${scripts(extraScripts)}
</body>
</html>
`;
}

function tagHtml(tags) {
  return tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("\n                ");
}

function renderArticlesPage(posts) {
  const cards = posts.length
    ? posts
        .map(
          (post) => `<article class="card article-card">
            <div class="card-body">
              <p class="panel-kicker">${escapeHtml(post.date)}</p>
              <h3>${escapeHtml(post.title)}</h3>
              <p>${escapeHtml(post.summary)}</p>
              <div class="tags">
                ${tagHtml(post.tags)}
              </div>
              <div class="actions">
                <a class="button" href="${escapeHtml(post.url)}"><i class="ri-book-open-line"></i> 阅读</a>
              </div>
            </div>
          </article>`
        )
        .join("\n\n          ")
    : `<article class="card article-card"><div class="card-body"><h3>还没有公开文章</h3><p>后台发布后会自动出现在这里。</p></div></article>`;

  return page({
    title: "文章",
    description: "Solaris Wiki 文章与技术笔记。",
    active: "articles",
    pageName: "articles.html",
    main: `    <section class="page-hero">
      <div class="container">
        <p class="eyebrow"><i class="ri-book-open-line"></i> Articles</p>
        <h1>文章与笔记</h1>
        <p>后台发布的 Markdown 内容会在构建时生成静态文章页。</p>
        <div class="actions">
          <a class="button" href="search.html"><i class="ri-search-line"></i> 搜索站内内容</a>
          <a class="button secondary" href="submit.html"><i class="ri-send-plane-line"></i> 投稿</a>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <div class="grid home-grid">
          ${cards}
        </div>
      </div>
    </section>`,
  });
}

function renderArticle(post) {
  return page({
    title: post.title,
    description: post.summary,
    active: "articles",
    pageName: post.url,
    type: "article",
    main: `    <section class="page-hero article-hero">
      <div class="container">
        <p class="eyebrow"><i class="ri-book-open-line"></i> ${escapeHtml(post.date)}</p>
        <h1>${escapeHtml(post.title)}</h1>
        <p>${escapeHtml(post.summary)}</p>
        <div class="tags">
          ${tagHtml(post.tags)}
        </div>
      </div>
    </section>

    <section class="section">
      <div class="container article-layout">
        <article class="detail-panel article-content">
          ${markdownToHtml(post.body)}
        </article>
      </div>
    </section>`,
  });
}

function buildSearchIndex(posts) {
  const projects = readJsonArray("data/projects.json", "projects");
  const updates = readJsonArray("data/site-updates.json", "updates");
  const records = [
    {
      title: "首页",
      url: "index.html",
      type: "Page",
      summary: "Solaris Wiki 首页、最新项目、站点更新与留言区。",
      tags: ["Solaris Wiki"],
    },
    {
      title: "项目档案",
      url: "projects.html",
      type: "Page",
      summary: "项目、工具、AI Agent 实验与工程数据工具。",
      tags: ["Projects"],
    },
    {
      title: "文章与笔记",
      url: "articles.html",
      type: "Page",
      summary: "后台发布的 Markdown 文章。",
      tags: ["Articles"],
    },
    ...projects.map((project) => ({
      title: project.title,
      url: project.detailUrl,
      type: "Project",
      summary: project.summary,
      tags: (project.tags || []).map((tag) => tag.text),
    })),
    ...posts.map((post) => ({
      title: post.title,
      url: post.url,
      type: "Article",
      summary: post.summary,
      tags: post.tags,
    })),
    ...updates.map((update) => ({
      title: update.title,
      url: "index.html#siteUpdatesTitle",
      type: "Update",
      summary: update.summary,
      tags: [update.version, update.type, update.level],
    })),
  ];

  const payload = `${JSON.stringify(records, null, 2)}\n`;
  fs.mkdirSync(path.dirname(ROOT_SEARCH_INDEX_PATH), { recursive: true });
  fs.mkdirSync(path.dirname(SEARCH_INDEX_PATH), { recursive: true });
  fs.writeFileSync(ROOT_SEARCH_INDEX_PATH, payload, "utf8");
  fs.writeFileSync(SEARCH_INDEX_PATH, payload, "utf8");
}

function writeSitemap(posts) {
  const projects = readJsonArray("data/projects.json", "projects");
  const urls = [
    "index.html",
    "projects.html",
    "articles.html",
    "about.html",
    "pomodoro.html",
    "pomodoro-tool.html",
    "search.html",
    "submit.html",
    ...projects.map((project) => project.detailUrl),
    ...posts.map((post) => post.url),
  ];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((url) => `  <url><loc>${url === "index.html" ? `${SITE_URL}/` : `${SITE_URL}/${url}`}</loc></url>`).join("\n")}
</urlset>
`;

  fs.writeFileSync(path.join(ROOT, "sitemap.xml"), sitemap, "utf8");
  fs.writeFileSync(path.join(OUT_DIR, "sitemap.xml"), sitemap, "utf8");
}

const posts = readPosts();

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(path.join(ROOT, "articles.html"), renderArticlesPage(posts), "utf8");
fs.writeFileSync(path.join(OUT_DIR, "articles.html"), renderArticlesPage(posts), "utf8");

for (const post of posts) {
  fs.writeFileSync(path.join(ROOT, post.url), renderArticle(post), "utf8");
  fs.writeFileSync(path.join(OUT_DIR, post.url), renderArticle(post), "utf8");
}

buildSearchIndex(posts);
writeSitemap(posts);
console.log(`Built ${posts.length} CMS article page(s), articles.html, search index, and sitemap.xml`);
