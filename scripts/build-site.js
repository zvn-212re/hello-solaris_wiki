const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(ROOT, "dist");
const SITE_URL = "https://solaris.wiki";
const OG_IMAGE = `${SITE_URL}/images/3818c2c7aa04f65ddb23e7d25a159026522770383.png@360w_270h_1s.avif`;
const STATIC_DIRS = ["admin", "css", "guitar", "images", "js"];
const STATIC_FILES = [
  "favicon.svg",
  "login.html",
  "maintenance.html",
  "moderation.html",
  "pomodoro-tool.html",
  "robots.txt",
  "search.html",
  "submit.html",
];

function readDataArray(relativePath, key) {
  const payload = JSON.parse(fs.readFileSync(path.join(ROOT, relativePath), "utf8"));

  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.[key])) {
    return payload[key];
  }

  return [];
}

const projects = readDataArray("data/projects.json", "projects");
const siteUpdates = readDataArray("data/site-updates.json", "updates");

const site = {
  name: "Solaris Wiki",
  tagline: "索拉里斯星档案",
  email: "xiechanghui9@gmail.com",
  github: "https://github.com/zvn-212re",
  author: "zvn-212re",
};

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function resetOutput() {
  fs.rmSync(OUT_DIR, { recursive: true, force: true });
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

function copyPublicAssets() {
  for (const dir of STATIC_DIRS) {
    const from = path.join(ROOT, dir);
    const to = path.join(OUT_DIR, dir);

    if (fs.existsSync(from)) {
      fs.cpSync(from, to, { recursive: true });
    }
  }

  for (const file of STATIC_FILES) {
    const from = path.join(ROOT, file);
    const to = path.join(OUT_DIR, file);

    if (fs.existsSync(from)) {
      fs.copyFileSync(from, to);
    }
  }
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

function statusRowParts(row) {
  if (Array.isArray(row)) {
    return [row[0], row[1]];
  }

  return [row?.label, row?.value];
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
    ["articles", "articles.html", "文章"],
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
        <span class="footer-author">by ${escapeHtml(site.author)}</span>
        <a href="${site.github}" target="_blank" rel="noopener noreferrer" aria-label="GitHub 主页"><i class="ri-github-line"></i> GitHub</a>
        <a href="mailto:${site.email}"><i class="ri-mail-line"></i> ${site.email}</a>
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

function scripts() {
  return `<script src="js/theme-toggle.js"></script>
  <script src="js/hero.js"></script>
  <script src="js/music-player.js"></script>
  <script src="js/pomodoro.js"></script>
  <script src="js/site-updates.js"></script>
  <script src="js/guestbook.js"></script>
  <script src="js/session-controls.js"></script>
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
  const action = (project.actions || []).find((item) => item.primary);
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

function siteUpdateItem(update) {
  const levelLabel = update.level === "major" ? "大版本" : "小更新";

  return `<article class="update-item" data-update-item>
            <div class="update-version">
              <span>${escapeHtml(update.version)}</span>
              <time datetime="${attr(update.date)}">${escapeHtml(update.date.replaceAll("-", "."))}</time>
            </div>
            <div class="update-copy">
              <h3>${escapeHtml(update.title)}</h3>
              <p>${escapeHtml(update.summary)}</p>
            </div>
            <div class="update-badges">
              <span class="update-badge">${escapeHtml(update.type)}</span>
              <span class="update-badge secondary">${levelLabel}</span>
            </div>
          </article>`;
}

function siteUpdatesSection() {
  return `    <section class="section update-section" aria-labelledby="siteUpdatesTitle">
      <div class="container" data-site-updates>
        <div class="section-head">
          <div>
            <h2 id="siteUpdatesTitle">站点更新</h2>
            <p class="section-note">每次提交后的简短总结，从 <code>v.0.0.1</code> 开始记录；较大的结构更新使用 <code>v.0.1.1</code> 这类编号。</p>
          </div>
          <div class="update-controls" aria-label="站点更新控制">
            <span class="update-count" data-updates-count></span>
            <button class="button secondary update-control" type="button" data-updates-more aria-expanded="false">显示更多</button>
          </div>
        </div>

        <div class="update-list">
          ${siteUpdates.map(siteUpdateItem).join("\n\n          ")}
        </div>

        <div class="update-pager" aria-label="站点更新分页">
          <button class="button secondary update-control" type="button" data-updates-prev>上一页</button>
          <span data-updates-page>1 / 1</span>
          <button class="button secondary update-control" type="button" data-updates-next>下一页</button>
        </div>
      </div>
    </section>`;
}

function guestbookSection() {
  return `    <section class="section guestbook-section" aria-labelledby="guestbookTitle">
      <div class="container guestbook-layout" data-guestbook>
        <div class="section-head guestbook-head">
          <div>
            <h2 id="guestbookTitle">留言区</h2>
            <p class="section-note">留言会提交到云端，审核通过后公开展示；想直接联系我，也可以顺手发邮件。</p>
          </div>
          <a class="button secondary update-control" href="mailto:${site.email}?subject=Solaris%20Wiki%20留言"><i class="ri-mail-line"></i> 发邮件</a>
        </div>

        <div class="guestbook-grid">
          <form class="guestbook-form" data-guestbook-form>
            <label>
              <span>昵称</span>
              <input type="text" name="name" maxlength="24" placeholder="匿名访客" data-guestbook-name>
            </label>
            <label>
              <span>留言</span>
              <textarea name="message" rows="5" maxlength="220" placeholder="在这里留下一段信号..." data-guestbook-message required></textarea>
            </label>
            <button class="button" type="submit"><i class="ri-send-plane-line"></i> 留下信号</button>
          </form>

          <div class="guestbook-board">
            <div class="guestbook-toolbar">
              <span class="panel-kicker" data-guestbook-mode>Public Signals</span>
              <button class="button secondary update-control" type="button" data-guestbook-clear hidden>清空</button>
            </div>
            <p class="empty-tomato" data-guestbook-empty>还没有留言。第一条信号就交给哥哥啦。</p>
            <p class="guestbook-status" data-guestbook-status>留言服务连接中...</p>
            <div class="guestbook-list" data-guestbook-list></div>
          </div>
        </div>
      </div>
    </section>`;
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

${siteUpdatesSection()}

${guestbookSection()}`;
}

function projectRow(project) {
  const cardUrl = project.cardUrl || project.detailUrl;
  const cardLabel = project.cardUrl ? `打开${project.title}` : `查看${project.title}详情`;
  return `<article class="card project-card" data-detail-url="${attr(cardUrl)}" tabindex="0" role="link" aria-label="${attr(cardLabel)}">
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
                ${renderActions(project.actions || [], true)}
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
  const tags = [...(project.tags || []), detail.statusTag].filter(Boolean);
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
            ${(detail.items || []).map((item) => `<li>${escapeHtml(item)}</li>`).join("\n            ")}
          </ul>
        </article>

        <aside class="detail-side-panel">
          <div class="detail-visual" aria-hidden="true"><i class="${attr(project.icon)}"></i></div>
          <div class="detail-status">
            ${(detail.statusRows || []).map((row) => {
              const [label, value] = statusRowParts(row);
              return `<div class="detail-status-row"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`;
            }).join("\n            ")}
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

resetOutput();
copyPublicAssets();

for (const item of pages) {
  const html = page(item);
  fs.writeFileSync(path.join(ROOT, item.page), html, "utf8");
  fs.writeFileSync(path.join(OUT_DIR, item.page), html, "utf8");
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
fs.writeFileSync(path.join(OUT_DIR, "sitemap.xml"), sitemap, "utf8");
console.log(`Built ${pages.length} pages and sitemap.xml`);
