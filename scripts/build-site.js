const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const SITE_URL = "https://solaris.wiki";
const OG_IMAGE = `${SITE_URL}/images/3818c2c7aa04f65ddb23e7d25a159026522770383.png@360w_270h_1s.avif`;

const projects = JSON.parse(
  fs.readFileSync(path.join(ROOT, "data", "projects.json"), "utf8")
);

const site = {
  name: "Solaris Wiki",
  tagline: "索拉里斯星档案",
  email: "xiechanghui9@gmail.com",
  github: "https://github.com/zvn-212re",
};

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function attr(value) {
  return escapeHtml(value);
}

function canonical(page) {
  return page === "index.html" ? `${SITE_URL}/` : `${SITE_URL}/${page}`;
}

function tagList(tags = []) {
  return tags
    .map((tag) => `<span class="tag${tag.tone ? ` ${attr(tag.tone)}` : ""}">${escapeHtml(tag.text)}</span>`)
    .join("\n                ");
}

function actionLink(action, fallbackTone = "secondary") {
  const tone = action.primary ? "" : ` ${fallbackTone}`;
  const external = action.external ? ' target="_blank" rel="noopener noreferrer"' : "";
  return `<a class="button${tone}" href="${attr(action.href)}"${external}><i class="${attr(action.icon)}"></i> ${escapeHtml(action.label)}</a>`;
}

function emptyAction(label, icon) {
  return `<span class="button secondary is-disabled" aria-disabled="true"><i class="${attr(icon)}"></i> ${escapeHtml(label)}</span>`;
}

function renderActions(actions = [], includePlaceholders = false) {
  if (actions.length === 0 && includePlaceholders) {
    return `${emptyAction("暂无演示", "ri-external-link-line")}\n                ${emptyAction("源码待整理", "ri-github-line")}`;
  }

  return actions.map((action) => actionLink(action)).join("\n                ");
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

function head({ title, description, page, type = "website" }) {
  const pageTitle = page === "index.html" ? `${site.name} | 首页` : `${site.name} | ${title}`;
  return `<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  ${themeBootScript()}
  <meta name="description" content="${attr(description)}">
  <meta name="theme-color" content="#f4ead6">
  <meta property="og:type" content="${attr(type)}">
  <meta property="og:site_name" content="${attr(site.name)}">
  <meta property="og:title" content="${attr(pageTitle)}">
  <meta property="og:description" content="${attr(description)}">
  <meta property="og:url" content="${attr(canonical(page))}">
  <meta property="og:image" content="${attr(OG_IMAGE)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${attr(pageTitle)}">
  <meta name="twitter:description" content="${attr(description)}">
  <meta name="twitter:image" content="${attr(OG_IMAGE)}">
  <link rel="canonical" href="${attr(canonical(page))}">
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
    ["about", "about.html", "关于"],
  ];

  return `<header class="site-header">
    <nav class="nav" aria-label="主导航">
      <a class="brand" href="index.html">
        <span class="brand-mark"><i class="ri-planet-line"></i></span>
        <span>${escapeHtml(site.name)}</span>
      </a>
      <div class="nav-links">
        ${links
          .map(([key, href, label]) => {
            const current = key === active;
            return `<a${current ? ' class="active" aria-current="page"' : ""} href="${href}">${label}</a>`;
          })
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
        <a href="${site.github}" target="_blank" rel="noopener noreferrer" aria-label="GitHub 主页"><i class="ri-github-line"></i> GitHub</a>
        <a href="mailto:${site.email}"><i class="ri-mail-line"></i> ${site.email}</a>
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

function scripts() {
  return `<script src="js/theme-toggle.js"></script>
  <script src="js/hero.js"></script>
  <script src="js/music-player.js"></script>
  <script src="js/pomodoro.js"></script>
  <script src="js/site-router.js"></script>`;
}

function page({ page, title, description, active = "index", main, type }) {
  return `<!DOCTYPE html>
<html lang="zh-CN">
${head({ title, description, page, type })}
<body>
  ${nav(active)}

  <main>
${main}
  </main>

  ${footer()}
  ${scripts()}
</body>
</html>
`;
}

function homeProjectCard(project) {
  const action = project.actions.find((item) => item.primary);
  return `<article class="card">
            <div class="icon-field" aria-hidden="true">
              <i class="${attr(project.icon)}"></i>
            </div>
            <div class="card-body">
              <h3>${escapeHtml(project.title)}</h3>
              <p>${escapeHtml(project.homeSummary || project.summary)}</p>
              <div class="tags">
                ${tagList(project.tags)}
              </div>
              ${action ? `<div class="actions">
                ${actionLink(action, "secondary")}
              </div>` : "<!-- no primary action -->"}
            </div>
          </article>`;
}

function indexMain() {
  const featured = projects.filter((project) => project.homeFeatured).slice(0, 3);
  return `    <section class="hero">
      <div class="container hero-content">
        <div class="hero-copy">
          <p class="eyebrow"><i class="ri-sparkling-2-line"></i> 索拉里斯星档案</p>
          <h1>Solaris Wiki</h1>
          <p class="subtitle">在索拉里斯星的海洋上，记录每一个探索的涟漪。</p>
          <p class="intro">
            你好，我是 <span class="identity-name">妈妈是水上由岐</span><br>
            一个用 AI 探索工程与代码世界的记录者。
          </p>

          <button class="quote-console" id="quoteRotator" type="button" aria-live="polite">
            <span class="quote-kicker">SOLARIS SIGNAL / CLICK TO SWITCH</span>
            <span class="quote-text" id="quoteText">“We don't need other worlds, we need mirrors.”</span>
            <span class="quote-meta" id="quoteMeta">Stanisław Lem, Solaris</span>
          </button>
        </div>

        <aside class="hero-side" aria-label="电视框中的随机站长二次元图像">
          <div class="portrait-tv">
            <span class="pixel-window-title">OWNER TV</span>
            <div class="portrait-screen">
              <img id="heroPortrait" src="images/3818c2c7aa04f65ddb23e7d25a159026522770383.png@360w_270h_1s.avif" alt="随机站长二次元像素风图像">
              <span class="blink-eye left"></span>
              <span class="blink-eye right"></span>
            </div>
            <div class="pixel-caption">RANDOM SIGNAL // BLINK MODE</div>
          </div>
        </aside>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <div class="section-head">
          <h2>最新项目</h2>
          <p class="section-note">这里会逐步沉淀我的实验、工具和工程化笔记，项目摘要由 <code>data/projects.json</code> 统一生成。</p>
        </div>

        <div class="grid home-grid">
          ${featured.map(homeProjectCard).join("\n\n          ")}
        </div>
      </div>
    </section>

    <section class="section update-section" aria-labelledby="siteUpdatesTitle">
      <div class="container">
        <div class="section-head">
          <h2 id="siteUpdatesTitle">站点更新</h2>
          <p class="section-note">记录这个小站最近修了什么、加了什么，免得改完就忘。</p>
        </div>

        <div class="update-list">
          <article class="update-item">
            <time datetime="2026-05-15">2026.05.15</time>
            <div class="update-copy">
              <h3>项目数据源与静态生成</h3>
              <p>项目列表和详情页改为从数据文件生成，公共导航、页脚和分享信息统一维护。</p>
            </div>
            <span class="update-badge">Architecture</span>
          </article>

          <article class="update-item">
            <time datetime="2026-05-15">2026.05.15</time>
            <div class="update-copy">
              <h3>补齐站点基础物料</h3>
              <p>新增 README、404、robots、sitemap、favicon 和 Open Graph 分享信息。</p>
            </div>
            <span class="update-badge">SEO</span>
          </article>

          <article class="update-item">
            <time datetime="2026-05-15">2026.05.15</time>
            <div class="update-copy">
              <h3>稳定页面缩放表现</h3>
              <p>收紧标题、阴影和番茄钟数字的尺寸逻辑，减少浏览器缩放时的布局跳动。</p>
            </div>
            <span class="update-badge">Fix</span>
          </article>
        </div>
      </div>
    </section>`;
}

function projectRow(project) {
  return `<article class="card project-card" data-detail-url="${attr(project.detailUrl)}" tabindex="0" role="link" aria-label="查看${attr(project.title)}详情">
            <div class="screenshot" aria-hidden="true">
              <i class="${attr(project.icon)}"></i>
            </div>
            <div class="card-body">
              <h3>${escapeHtml(project.title)}</h3>
              <p>${escapeHtml(project.summary)}</p>
              <div class="tags">
                ${tagList(project.tags)}
              </div>
              <div class="actions">
                ${renderActions(project.actions, true)}
              </div>
            </div>
          </article>`;
}

function projectsMain() {
  return `    <section class="page-hero">
      <div class="container">
        <p class="eyebrow"><i class="ri-archive-2-line"></i> Project Archive</p>
        <h1>项目档案</h1>
        <p>这里存放正在打磨的 Web 应用、工程工具、AI Agent 实验和长期笔记。</p>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <div class="grid project-grid">
          ${projects.map(projectRow).join("\n\n          ")}
        </div>
      </div>
    </section>`;
}

function aboutMain() {
  return `    <section class="page-hero">
      <div class="container">
        <p class="eyebrow"><i class="ri-user-3-line"></i> About</p>
        <h1>关于我</h1>
        <p>一份关于工程、代码、AI 工具和索拉里斯式想象力的个人档案。</p>
      </div>
    </section>

    <section class="section">
      <div class="container about-layout">
        <div class="avatar" aria-label="头像占位符">
          <i class="ri-user-smile-line"></i>
        </div>

        <div>
          <p class="about-copy">
            我有工程咨询相关背景，长期接触造价数据、项目资料、模型表达与复杂表格，也因此对“如何把工程经验变成可复用的工具”格外感兴趣。最近我把更多时间投入到 AI 探索和 Vibe Coding 实践中，尝试用 Claude Code、Codex CLI、MCP 与 Agent 工作流，把想法快速落成网页、脚本、数据库和自动化流程。这个站点会记录我的实验、踩坑、复盘和作品。科幻文学也是我的长期燃料，尤其喜欢那些把人、技术与未知世界放在一起审视的作品；Solaris Wiki 这个名字，就来自这种安静又辽阔的想象。
          </p>

          <div class="skills">
            <h2>技能标签</h2>
            <div class="tags" aria-label="技能标签组">
              <span class="tag">Vibe Coding</span>
              <span class="tag">Claude Code</span>
              <span class="tag">Codex CLI</span>
              <span class="tag">3D Printing</span>
              <span class="tag">BIM</span>
              <span class="tag">Agent 工作流</span>
              <span class="tag">MCP</span>
              <span class="tag">CLI</span>
            </div>
          </div>

          <div class="skills">
            <h2>联系方式</h2>
            <div class="contact-list">
              <a href="${site.github}" target="_blank" rel="noopener noreferrer"><i class="ri-github-line"></i> github.com/zvn-212re</a>
              <a href="mailto:${site.email}"><i class="ri-mail-line"></i> ${site.email}</a>
              <a href="${SITE_URL}" target="_blank" rel="noopener noreferrer"><i class="ri-global-line"></i> solaris.wiki</a>
            </div>
          </div>
        </div>
      </div>
    </section>`;
}

function pomodoroMain() {
  return `    <section class="page-hero">
      <div class="container">
        <p class="eyebrow"><i class="ri-timer-flash-line"></i> Focus Timer</p>
        <h1>番茄钟</h1>
        <p>25 分钟专注，5 分钟短休息。让每一轮工作都有清晰的开始、结束和记录。</p>
        <div class="actions">
          <a class="button" href="pomodoro-tool.html"><i class="ri-window-line"></i> 打开独立工具页</a>
          <a class="button secondary" href="projects.html"><i class="ri-arrow-left-line"></i> 返回项目档案</a>
        </div>
      </div>
    </section>

    <section class="section pomodoro-section">
      <div class="container pomodoro-layout" data-pomodoro-root>
        <section class="timer-panel" aria-label="番茄钟计时器">
          <div class="mode-tabs" role="tablist" aria-label="计时模式">
            <button class="mode-tab active" type="button" data-mode="work" aria-pressed="true">专注 25:00</button>
            <button class="mode-tab" type="button" data-mode="break" aria-pressed="false">短休息 05:00</button>
          </div>

          <div class="progress-wrap" aria-live="polite">
            <svg class="progress-ring" viewBox="0 0 220 220" role="img" aria-label="当前计时进度">
              <circle class="progress-track" cx="110" cy="110" r="96"></circle>
              <circle class="progress-bar" cx="110" cy="110" r="96"></circle>
            </svg>
            <div class="time-display">
              <span class="mode-label" id="modeLabel">专注中</span>
              <strong id="timeText">25:00</strong>
              <span class="status-text" id="statusText">准备开始</span>
            </div>
          </div>

          <div class="timer-actions">
            <button class="button timer-button primary-action" type="button" id="toggleButton">
              <i class="ri-play-fill"></i>
              <span>开始</span>
            </button>
            <button class="button secondary timer-button" type="button" id="resetButton">
              <i class="ri-restart-line"></i>
              <span>重置</span>
            </button>
          </div>

          <p class="completion-message" id="completionMessage" role="status" aria-live="assertive"></p>
        </section>

        <aside class="stats-panel" aria-label="番茄钟统计">
          <div>
            <p class="panel-kicker">今日番茄</p>
            <div class="tomato-count">
              <strong id="tomatoCount">0</strong>
              <span>个已完成</span>
            </div>
          </div>

          <div class="tomato-row" id="tomatoRow" aria-label="番茄完成记录">
            <span class="empty-tomato">还没有完成的番茄</span>
          </div>

          <div class="focus-notes">
            <h2>本轮规则</h2>
            <ul>
              <li>专注阶段默认 25 分钟。</li>
              <li>专注完成后自动进入 5 分钟短休息。</li>
              <li>只有完成专注阶段才会增加番茄计数。</li>
            </ul>
          </div>
        </aside>
      </div>
    </section>`;
}

function projectDetailMain(project) {
  const detail = project.detail;
  const tags = [...project.tags, detail.statusTag].filter(Boolean);
  const actions = [...(detail.actions || []), { label: "返回项目档案", href: "projects.html", icon: "ri-arrow-left-line" }];

  return `    <section class="page-hero">
      <div class="container">
        <p class="eyebrow"><i class="${attr(project.icon)}"></i> Project Detail</p>
        <h1 class="project-title">${escapeHtml(project.title)}</h1>
        <p>${escapeHtml(project.summary)}</p>
      </div>
    </section>

    <section class="section">
      <div class="container detail-layout">
        <article class="detail-panel">
          <div class="detail-meta">
            ${tagList(tags)}
          </div>
          <h2>项目概览</h2>
          <p>${escapeHtml(detail.overview)}</p>
          <h2>${escapeHtml(detail.listTitle)}</h2>
          <ul class="detail-list">
            ${detail.items.map((item) => `<li>${escapeHtml(item)}</li>`).join("\n            ")}
          </ul>
        </article>

        <aside class="detail-side-panel">
          <div class="detail-visual" aria-hidden="true"><i class="${attr(project.icon)}"></i></div>
          <div class="detail-status">
            ${detail.statusRows.map(([label, value]) => `<div class="detail-status-row"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`).join("\n            ")}
          </div>
          <div class="detail-actions">
            ${actions.map((action) => actionLink(action)).join("\n            ")}
          </div>
        </aside>
      </div>
    </section>`;
}

function notFoundMain() {
  return `    <section class="page-hero">
      <div class="container">
        <p class="eyebrow"><i class="ri-compass-3-line"></i> 404 Signal Lost</p>
        <h1>页面走丢了</h1>
        <p>这颗信号暂时没有被索拉里斯星档案收录。可以回到首页，或者继续翻项目档案。</p>
        <div class="actions">
          <a class="button" href="index.html"><i class="ri-home-4-line"></i> 回到首页</a>
          <a class="button secondary" href="projects.html"><i class="ri-archive-2-line"></i> 查看项目</a>
        </div>
      </div>
    </section>`;
}

const pages = [
  {
    page: "index.html",
    title: "首页",
    description: "Solaris Wiki - 索拉里斯星档案，记录 Vibe Coding、AI Agent 实验与工程数据工具。",
    active: "index",
    main: indexMain(),
  },
  {
    page: "projects.html",
    title: "项目档案",
    description: "Solaris Wiki 项目档案，展示 Vibe Coding、AI Agent 与工程数据工具项目。",
    active: "projects",
    main: projectsMain(),
  },
  {
    page: "about.html",
    title: "关于我",
    description: "关于 Solaris Wiki 作者，记录工程咨询、AI 探索、Vibe Coding 与科幻阅读。",
    active: "about",
    main: aboutMain(),
  },
  {
    page: "pomodoro.html",
    title: "番茄钟",
    description: "Solaris Wiki 番茄钟 Web 应用，支持 25 分钟专注、5 分钟短休息、进度环和番茄计数。",
    active: "projects",
    main: pomodoroMain(),
  },
  {
    page: "404.html",
    title: "404",
    description: "Solaris Wiki 404 页面。",
    active: "index",
    main: notFoundMain(),
  },
  ...projects.map((project) => ({
    page: project.detailUrl,
    title: project.title,
    description: project.detail.description,
    active: "projects",
    main: projectDetailMain(project),
    type: "article",
  })),
];

for (const item of pages) {
  fs.writeFileSync(
    path.join(ROOT, item.page),
    page(item),
    "utf8"
  );
}

const urls = [
  "index.html",
  "projects.html",
  "about.html",
  "pomodoro.html",
  "pomodoro-tool.html",
  ...projects.map((project) => project.detailUrl),
];

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((url) => `  <url><loc>${canonical(url)}</loc></url>`).join("\n")}
</urlset>
`;

fs.writeFileSync(path.join(ROOT, "sitemap.xml"), sitemap, "utf8");
console.log(`Built ${pages.length} pages and sitemap.xml`);
