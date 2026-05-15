$ErrorActionPreference = "Stop"

$ScriptDir = if ($PSScriptRoot) { $PSScriptRoot } else { Join-Path (Get-Location) "scripts" }
$Root = Resolve-Path (Join-Path $ScriptDir "..")
$SiteUrl = "https://solaris.wiki"
$OgImage = "$SiteUrl/images/3818c2c7aa04f65ddb23e7d25a159026522770383.png@360w_270h_1s.avif"
$Projects = Get-Content -LiteralPath (Join-Path $Root "data/projects.json") -Encoding UTF8 | ConvertFrom-Json

function Write-Text($Path, $Content) {
  $encoding = New-Object System.Text.UTF8Encoding($false)
  [System.IO.File]::WriteAllText((Join-Path $Root $Path), $Content, $encoding)
}

function Html($Value) {
  return [System.Net.WebUtility]::HtmlEncode([string]$Value)
}

function Canonical($Page) {
  if ($Page -eq "index.html") { return "$SiteUrl/" }
  return "$SiteUrl/$Page"
}

function ThemeBoot {
@'
<script>
    (() => {
      try {
        if (localStorage.getItem("solarisTheme") === "night") {
          document.documentElement.dataset.theme = "night";
        }
      } catch {}
    })();
  </script>
'@
}

function Head($Title, $Description, $Page, $Type = "website") {
  $pageTitle = if ($Page -eq "index.html") { "Solaris Wiki | 首页" } else { "Solaris Wiki | $Title" }
  $canonical = Canonical $Page
  $theme = ThemeBoot
@"
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  $theme
  <meta name="description" content="$(Html $Description)">
  <meta name="theme-color" content="#f4ead6">
  <meta property="og:type" content="$(Html $Type)">
  <meta property="og:site_name" content="Solaris Wiki">
  <meta property="og:title" content="$(Html $pageTitle)">
  <meta property="og:description" content="$(Html $Description)">
  <meta property="og:url" content="$(Html $canonical)">
  <meta property="og:image" content="$(Html $OgImage)">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="$(Html $pageTitle)">
  <meta name="twitter:description" content="$(Html $Description)">
  <meta name="twitter:image" content="$(Html $OgImage)">
  <link rel="canonical" href="$(Html $canonical)">
  <link rel="icon" href="favicon.svg" type="image/svg+xml">
  <title>$(Html $pageTitle)</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600;700&family=Press+Start+2P&display=swap" rel="stylesheet">
  <link href="https://cdn.jsdelivr.net/npm/remixicon@4.5.0/fonts/remixicon.css" rel="stylesheet">
  <link rel="stylesheet" href="css/styles.css">
</head>
"@
}

function Nav($Active) {
  $items = @(
    @{ Key = "index"; Href = "index.html"; Label = "首页" },
    @{ Key = "projects"; Href = "projects.html"; Label = "项目" },
    @{ Key = "about"; Href = "about.html"; Label = "关于" }
  )
  $linkItems = @()
  foreach ($item in $items) {
    $current = if ($item.Key -eq $Active) { ' class="active" aria-current="page"' } else { "" }
    $linkItems += ('<a{0} href="{1}">{2}</a>' -f $current, $item.Href, $item.Label)
  }
  $links = $linkItems -join "`n        "
@"
<header class="site-header">
    <nav class="nav" aria-label="主导航">
      <a class="brand" href="index.html">
        <span class="brand-mark"><i class="ri-planet-line"></i></span>
        <span>Solaris Wiki</span>
      </a>
      <div class="nav-links">
        $links
      </div>
      <div class="nav-actions">
        <button class="theme-lamp" type="button" data-theme-toggle aria-label="切换夜间模式" aria-pressed="false">
          <span class="lamp-cord" aria-hidden="true"></span>
          <span class="lamp-head" aria-hidden="true"></span>
          <span class="lamp-glow" aria-hidden="true"></span>
        </button>
      </div>
    </nav>
  </header>
"@
}

function Footer {
@'
<footer class="site-footer">
    <div class="footer-inner">
      <a href="https://solaris.wiki" target="_blank" rel="noopener noreferrer">solaris.wiki</a>
      <div class="footer-links">
        <a href="https://github.com/zvn-212re" target="_blank" rel="noopener noreferrer" aria-label="GitHub 主页"><i class="ri-github-line"></i> GitHub</a>
        <a href="mailto:xiechanghui9@gmail.com"><i class="ri-mail-line"></i> xiechanghui9@gmail.com</a>
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
  </footer>
'@
}

function Scripts {
@'
<script src="js/theme-toggle.js"></script>
  <script src="js/hero.js"></script>
  <script src="js/music-player.js"></script>
  <script src="js/pomodoro.js"></script>
  <script src="js/site-router.js"></script>
'@
}

function Tags {
  param([object[]]$TagItems)

  $html = @()
  foreach ($tag in $TagItems) {
    $tone = if ($tag.tone) { " $($tag.tone)" } else { "" }
    $html += ('<span class="tag{0}">{1}</span>' -f $tone, (Html $tag.text))
  }
  $html -join "`n                "
}

function ActionLink($Action) {
  $tone = if ($Action.primary) { "" } else { " secondary" }
  $external = if ($Action.external) { ' target="_blank" rel="noopener noreferrer"' } else { "" }
  '<a class="button{0}" href="{1}"{2}><i class="{3}"></i> {4}</a>' -f $tone, (Html $Action.href), $external, (Html $Action.icon), (Html $Action.label)
}

function DisabledAction($Label, $Icon) {
  '<span class="button secondary is-disabled" aria-disabled="true"><i class="{0}"></i> {1}</span>' -f $Icon, (Html $Label)
}

function RenderActions($Actions, [bool]$Placeholders = $false) {
  if ((!$Actions -or $Actions.Count -eq 0) -and $Placeholders) {
    $demo = DisabledAction "暂无演示" "ri-external-link-line"
    $source = DisabledAction "源码待整理" "ri-github-line"
    return "$demo`n                $source"
  }
  $html = @()
  foreach ($action in $Actions) {
    $html += ActionLink $action
  }
  $html -join "`n                "
}

function Page($PageName, $Title, $Description, $Active, $Main, $Type = "website") {
  $head = Head $Title $Description $PageName $Type
  $nav = Nav $Active
  $footer = Footer
  $scripts = Scripts
@"
<!DOCTYPE html>
<html lang="zh-CN">
$head
<body>
  $nav

  <main>
$Main
  </main>

  $footer
  $scripts
</body>
</html>
"@
}

function HomeCard($Project) {
  $action = @($Project.actions | Where-Object { $_.primary })[0]
  $summary = if ($Project.homeSummary) { $Project.homeSummary } else { $Project.summary }
  $tags = Tags -TagItems $Project.tags
  $actionHtml = if ($action) { '<div class="actions">' + "`n                " + (ActionLink $action) + "`n              </div>" } else { "<!-- no primary action -->" }
@"
<article class="card">
            <div class="icon-field" aria-hidden="true">
              <i class="$(Html $Project.icon)"></i>
            </div>
            <div class="card-body">
              <h3>$(Html $Project.title)</h3>
              <p>$(Html $summary)</p>
              <div class="tags">
                $tags
              </div>
              $actionHtml
            </div>
          </article>
"@
}

function IndexMain {
  $cardItems = @()
  foreach ($project in $Projects) {
    if ($project.homeFeatured -and $cardItems.Count -lt 3) {
      $cardItems += HomeCard $project
    }
  }
  $cards = $cardItems -join "`n`n          "
@"
    <section class="hero">
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
          <p class="section-note">这里会逐步沉淀我的实验、工具和工程化笔记，项目摘要由 data/projects.json 统一生成。</p>
        </div>

        <div class="grid home-grid">
          $cards
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
    </section>
"@
}

function ProjectRow($Project) {
  $tags = Tags -TagItems $Project.tags
  $actions = RenderActions $Project.actions $true
@"
<article class="card project-card" data-detail-url="$(Html $Project.detailUrl)" tabindex="0" role="link" aria-label="查看$(Html $Project.title)详情">
            <div class="screenshot" aria-hidden="true">
              <i class="$(Html $Project.icon)"></i>
            </div>
            <div class="card-body">
              <h3>$(Html $Project.title)</h3>
              <p>$(Html $Project.summary)</p>
              <div class="tags">
                $tags
              </div>
              <div class="actions">
                $actions
              </div>
            </div>
          </article>
"@
}

function ProjectsMain {
  $rowItems = @()
  foreach ($project in $Projects) {
    $rowItems += ProjectRow $project
  }
  $rows = $rowItems -join "`n`n          "
@"
    <section class="page-hero">
      <div class="container">
        <p class="eyebrow"><i class="ri-archive-2-line"></i> Project Archive</p>
        <h1>项目档案</h1>
        <p>这里存放正在打磨的 Web 应用、工程工具、AI Agent 实验和长期笔记。</p>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <div class="grid project-grid">
          $rows
        </div>
      </div>
    </section>
"@
}

function AboutMain {
@"
    <section class="page-hero">
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
              <a href="https://github.com/zvn-212re" target="_blank" rel="noopener noreferrer"><i class="ri-github-line"></i> github.com/zvn-212re</a>
              <a href="mailto:xiechanghui9@gmail.com"><i class="ri-mail-line"></i> xiechanghui9@gmail.com</a>
              <a href="https://solaris.wiki" target="_blank" rel="noopener noreferrer"><i class="ri-global-line"></i> solaris.wiki</a>
            </div>
          </div>
        </div>
      </div>
    </section>
"@
}

function PomodoroMain {
@'
    <section class="page-hero">
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
    </section>
'@
}

function DetailMain($Project) {
  $detail = $Project.detail
  $tags = @($Project.tags) + @($detail.statusTag)
  $tagHtml = Tags -TagItems $tags
  $itemHtml = @()
  foreach ($item in $detail.items) {
    $itemHtml += ('<li>{0}</li>' -f (Html $item))
  }
  $items = $itemHtml -join "`n            "

  $rowHtml = @()
  foreach ($row in $detail.statusRows) {
    $rowHtml += ('<div class="detail-status-row"><span>{0}</span><strong>{1}</strong></div>' -f (Html $row[0]), (Html $row[1]))
  }
  $rows = $rowHtml -join "`n            "

  $actions = @($detail.actions) + @([pscustomobject]@{ label = "返回项目档案"; href = "projects.html"; icon = "ri-arrow-left-line"; primary = $false })
  $actionItems = @()
  foreach ($action in $actions) {
    $actionItems += ActionLink $action
  }
  $actionHtml = $actionItems -join "`n            "
@"
    <section class="page-hero">
      <div class="container">
        <p class="eyebrow"><i class="$(Html $Project.icon)"></i> Project Detail</p>
        <h1 class="project-title">$(Html $Project.title)</h1>
        <p>$(Html $Project.summary)</p>
      </div>
    </section>

    <section class="section">
      <div class="container detail-layout">
        <article class="detail-panel">
          <div class="detail-meta">
            $tagHtml
          </div>
          <h2>项目概览</h2>
          <p>$(Html $detail.overview)</p>
          <h2>$(Html $detail.listTitle)</h2>
          <ul class="detail-list">
            $items
          </ul>
        </article>

        <aside class="detail-side-panel">
          <div class="detail-visual" aria-hidden="true"><i class="$(Html $Project.icon)"></i></div>
          <div class="detail-status">
            $rows
          </div>
          <div class="detail-actions">
            $actionHtml
          </div>
        </aside>
      </div>
    </section>
"@
}

function NotFoundMain {
@'
    <section class="page-hero">
      <div class="container">
        <p class="eyebrow"><i class="ri-compass-3-line"></i> 404 Signal Lost</p>
        <h1>页面走丢了</h1>
        <p>这颗信号暂时没有被索拉里斯星档案收录。可以回到首页，或者继续翻项目档案。</p>
        <div class="actions">
          <a class="button" href="index.html"><i class="ri-home-4-line"></i> 回到首页</a>
          <a class="button secondary" href="projects.html"><i class="ri-archive-2-line"></i> 查看项目</a>
        </div>
      </div>
    </section>
'@
}

Write-Text "index.html" (Page "index.html" "首页" "Solaris Wiki - 索拉里斯星档案，记录 Vibe Coding、AI Agent 实验与工程数据工具。" "index" (IndexMain))
Write-Text "projects.html" (Page "projects.html" "项目档案" "Solaris Wiki 项目档案，展示 Vibe Coding、AI Agent 与工程数据工具项目。" "projects" (ProjectsMain))
Write-Text "about.html" (Page "about.html" "关于我" "关于 Solaris Wiki 作者，记录工程咨询、AI 探索、Vibe Coding 与科幻阅读。" "about" (AboutMain))
Write-Text "pomodoro.html" (Page "pomodoro.html" "番茄钟" "Solaris Wiki 番茄钟 Web 应用，支持 25 分钟专注、5 分钟短休息、进度环和番茄计数。" "projects" (PomodoroMain))
Write-Text "404.html" (Page "404.html" "404" "Solaris Wiki 404 页面。" "index" (NotFoundMain))

foreach ($project in $Projects) {
  Write-Text $project.detailUrl (Page $project.detailUrl $project.title $project.detail.description "projects" (DetailMain $project) "article")
}

$urls = @("index.html", "projects.html", "about.html", "pomodoro.html", "pomodoro-tool.html")
foreach ($project in $Projects) {
  $urls += $project.detailUrl
}

$sitemapItems = @()
foreach ($url in $urls) {
  $sitemapItems += "  <url><loc>$(Canonical $url)</loc></url>"
}
$sitemapUrls = $sitemapItems -join "`n"
Write-Text "sitemap.xml" ('<?xml version="1.0" encoding="UTF-8"?>' + "`n" + '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + "`n" + $sitemapUrls + "`n</urlset>`n")

Write-Host "Built $($Projects.Count + 5) pages and sitemap.xml"
