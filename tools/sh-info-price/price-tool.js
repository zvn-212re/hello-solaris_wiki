(function () {
  const PAGE_SIZE = 50;
  const SVG_NS = "http://www.w3.org/2000/svg";
  const SOLARIS_PROXY_DATA_URL = "/api/price-data?path={path}";
  const VERCEL_DATA_BASE_URL = "https://sh-info-price.vercel.app/data/";
  const DATA_REQUEST_TIMEOUT = 8000;
  const runtimeConfig = window.SolarisPriceConfig || {};
  const dataSources = buildDataSources();
  let activeDataSourceIndex = 0;
  const state = {
    manifest: null,
    latest: [],
    materials: [],
    matched: [],
    historyCache: new Map(),
    selectedHistory: [],
    selectedKey: "",
    keyword: "水泥",
    page: 1,
    monthA: "",
    monthB: "",
    loadToken: 0
  };

  const root = document.querySelector("[data-price-app]");
  if (!root) {
    return;
  }

  const els = {
    status: root.querySelector("[data-price-status]"),
    keyword: root.querySelector("[data-price-keyword]"),
    exportButton: root.querySelector("[data-price-export]"),
    latestPeriod: root.querySelector("[data-stat-latest-period]"),
    matches: root.querySelector("[data-stat-matches]"),
    periods: root.querySelector("[data-stat-periods]"),
    total: root.querySelector("[data-stat-total]"),
    pageSummary: root.querySelector("[data-price-page-summary]"),
    range: root.querySelector("[data-price-range]"),
    results: root.querySelector("[data-price-results]"),
    previous: root.querySelector("[data-page-prev]"),
    next: root.querySelector("[data-page-next]"),
    detailTitle: root.querySelector("[data-detail-title]"),
    detailSpec: root.querySelector("[data-detail-spec]"),
    chart: root.querySelector("[data-price-chart]"),
    monthA: root.querySelector("[data-month-a]"),
    monthB: root.querySelector("[data-month-b]"),
    compareALabel: root.querySelector("[data-compare-a-label]"),
    compareBLabel: root.querySelector("[data-compare-b-label]"),
    compareA: root.querySelector("[data-compare-a]"),
    compareB: root.querySelector("[data-compare-b]"),
    compareDiff: root.querySelector("[data-compare-diff]"),
    comparePercent: root.querySelector("[data-compare-percent]"),
    compareDiffCard: root.querySelector("[data-compare-diff-card]")
  };

  function normalizeBaseUrl(value) {
    if (String(value || "").includes("{path}")) {
      return String(value).trim();
    }

    return value ? String(value).replace(/\/?$/, "/") : "";
  }

  function uniqueSources(sources) {
    const seen = new Set();

    return sources
      .map((source) => normalizeBaseUrl(source))
      .filter((source) => {
        if (seen.has(source)) {
          return false;
        }

        seen.add(source);
        return true;
      });
  }

  function buildDataSources() {
    const configuredSources = Array.isArray(runtimeConfig.dataBaseUrls)
      ? runtimeConfig.dataBaseUrls
      : [];

    return uniqueSources([
      runtimeConfig.dataBaseUrl || "",
      ...configuredSources,
      SOLARIS_PROXY_DATA_URL,
      VERCEL_DATA_BASE_URL
    ]);
  }

  function dataUrl(path, baseUrl) {
    if (baseUrl.includes("{path}")) {
      const normalizedPath = path.replace(/^data\//, "");
      return new URL(baseUrl.replace("{path}", encodeURIComponent(normalizedPath)), window.location.href).toString();
    }

    const normalizedPath = baseUrl ? path.replace(/^data\//, "") : path;
    return new URL(normalizedPath, baseUrl || window.location.href).toString();
  }

  async function fetchWithTimeout(url, options) {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), DATA_REQUEST_TIMEOUT);

    try {
      return await fetch(url, { ...options, signal: controller.signal });
    } finally {
      window.clearTimeout(timeout);
    }
  }

  async function readJson(path) {
    for (let offset = 0; offset < dataSources.length; offset += 1) {
      const index = (activeDataSourceIndex + offset) % dataSources.length;
      const source = dataSources[index];
      const usedRemote = Boolean(source);

      try {
        const response = await fetchWithTimeout(dataUrl(path, source), {
          cache: usedRemote ? "default" : "no-store"
        });

        if (!response.ok) {
          continue;
        }

        activeDataSourceIndex = index;
        return response.json();
      } catch {
        // Try the next source. The UI reports a single readable error after all sources fail.
      }
    }

    throw new Error(`读取数据失败：${path}`);
  }

  function setStatus(message, tone) {
    if (!els.status) {
      return;
    }

    els.status.textContent = message;
    els.status.classList.toggle("is-error", tone === "error");
    els.status.classList.toggle("is-ok", tone === "ok");
  }

  function formatInteger(value) {
    return Number(value || 0).toLocaleString("zh-CN");
  }

  function formatPrice(value) {
    if (value === null || value === undefined || Number.isNaN(Number(value))) {
      return "--";
    }

    return Number(value).toLocaleString("zh-CN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  function formatPercent(value) {
    if (value === null || value === undefined || Number.isNaN(Number(value))) {
      return "--";
    }

    return `${Number(value).toFixed(2)}%`;
  }

  function recordText(record) {
    return [
      record.text,
      record.materialCode,
      record.materialName,
      record.spec,
      record.unit,
      record.period
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
  }

  function recordMatches(record, keyword) {
    const normalized = keyword.trim().toLowerCase();

    if (!normalized) {
      return true;
    }

    return recordText(record).includes(normalized);
  }

  function sortByMaterial(records) {
    return [...records].sort((left, right) => {
      const byName = String(left.materialName || "").localeCompare(String(right.materialName || ""), "zh-CN");
      if (byName !== 0) return byName;

      const bySpec = String(left.spec || "").localeCompare(String(right.spec || ""), "zh-CN");
      if (bySpec !== 0) return bySpec;

      return String(left.materialCode || "").localeCompare(String(right.materialCode || ""), "zh-CN");
    });
  }

  function selectedRecord() {
    return (
      state.matched.find((record) => record.materialKey === state.selectedKey) ||
      state.materials.find((record) => record.materialKey === state.selectedKey) ||
      state.matched[0] ||
      null
    );
  }

  function totalPages() {
    return Math.max(1, Math.ceil(state.matched.length / PAGE_SIZE));
  }

  function currentPageRows() {
    const start = (state.page - 1) * PAGE_SIZE;
    return state.matched.slice(start, start + PAGE_SIZE);
  }

  function fillText(element, value) {
    if (element) {
      element.textContent = value;
    }
  }

  function renderStats() {
    fillText(els.latestPeriod, state.manifest?.latestPeriod || "--");
    fillText(els.matches, formatInteger(state.matched.length));
    fillText(els.periods, formatInteger(state.manifest?.periods?.length || 0));
    fillText(els.total, formatInteger(state.manifest?.totalRecords || state.materials.length));
  }

  function appendCell(row, value, muted) {
    const cell = document.createElement("td");

    if (Array.isArray(value)) {
      const strong = document.createElement("strong");
      const span = document.createElement("span");
      strong.textContent = value[0] || "--";
      span.textContent = value[1] || "";
      cell.append(strong, span);
    } else {
      cell.textContent = value || "--";
    }

    if (muted) {
      const span = document.createElement("span");
      span.textContent = muted;
      cell.append(span);
    }

    row.append(cell);
  }

  function renderResults() {
    const rows = currentPageRows();
    const selected = selectedRecord();
    const pages = totalPages();
    state.page = Math.min(state.page, pages);

    fillText(els.pageSummary, `共 ${formatInteger(state.matched.length)} 条，第 ${state.page} / ${pages} 页`);
    fillText(
      els.range,
      rows.length
        ? `当前显示 ${(state.page - 1) * PAGE_SIZE + 1}-${Math.min(state.page * PAGE_SIZE, state.matched.length)} 条`
        : "没有匹配结果"
    );

    if (els.previous) {
      els.previous.disabled = state.page <= 1;
    }

    if (els.next) {
      els.next.disabled = state.page >= pages;
    }

    if (!els.results) {
      return;
    }

    els.results.replaceChildren();

    if (!rows.length) {
      const empty = document.createElement("tr");
      empty.className = "is-empty";
      const cell = document.createElement("td");
      cell.colSpan = 5;
      cell.textContent = "没有找到匹配材料";
      empty.append(cell);
      els.results.append(empty);
      return;
    }

    for (const record of rows) {
      const row = document.createElement("tr");
      row.classList.toggle("is-selected", record.materialKey === selected?.materialKey);
      row.addEventListener("click", () => selectRecord(record.materialKey));
      appendCell(row, [record.materialName, record.materialCode]);
      appendCell(row, record.spec);
      appendCell(row, record.unit);
      appendCell(row, formatPrice(record.taxIncludedPrice));
      appendCell(row, record.period);
      els.results.append(row);
    }
  }

  function fillMonthOptions() {
    const periods = state.manifest?.periods || [];
    const fragmentA = document.createDocumentFragment();
    const fragmentB = document.createDocumentFragment();

    for (const period of periods) {
      const optionA = document.createElement("option");
      const optionB = document.createElement("option");
      optionA.value = period;
      optionA.textContent = period;
      optionB.value = period;
      optionB.textContent = period;
      fragmentA.append(optionA);
      fragmentB.append(optionB);
    }

    els.monthA?.replaceChildren(fragmentA);
    els.monthB?.replaceChildren(fragmentB);

    if (els.monthA) {
      els.monthA.value = state.monthA;
    }

    if (els.monthB) {
      els.monthB.value = state.monthB;
    }
  }

  function svgElement(tag, attributes = {}) {
    const element = document.createElementNS(SVG_NS, tag);

    Object.entries(attributes).forEach(([key, value]) => {
      element.setAttribute(key, String(value));
    });

    return element;
  }

  function renderEmptyChart(message) {
    if (!els.chart) {
      return;
    }

    const text = svgElement("text", { x: 360, y: 130, "text-anchor": "middle" });
    text.textContent = message;
    els.chart.replaceChildren(text);
  }

  function renderChart(records) {
    if (!els.chart) {
      return;
    }

    if (!records.length) {
      renderEmptyChart("暂无历史趋势数据");
      return;
    }

    const width = 720;
    const height = 260;
    const margin = { top: 22, right: 24, bottom: 46, left: 72 };
    const plotWidth = width - margin.left - margin.right;
    const plotHeight = height - margin.top - margin.bottom;
    const prices = records.map((record) => Number(record.taxIncludedPrice)).filter(Number.isFinite);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const padding = Math.max((max - min) * 0.12, 1);
    const yMin = min - padding;
    const yMax = max + padding;

    function x(index) {
      if (records.length === 1) {
        return margin.left + plotWidth / 2;
      }

      return margin.left + (plotWidth * index) / (records.length - 1);
    }

    function y(value) {
      if (yMax === yMin) {
        return margin.top + plotHeight / 2;
      }

      return margin.top + plotHeight - ((Number(value) - yMin) / (yMax - yMin)) * plotHeight;
    }

    const grid = [];
    for (let index = 0; index <= 4; index += 1) {
      const currentY = margin.top + (plotHeight * index) / 4;
      const value = yMax - ((yMax - yMin) * index) / 4;
      grid.push(svgElement("line", {
        class: "grid-line",
        x1: margin.left,
        x2: width - margin.right,
        y1: currentY,
        y2: currentY
      }));

      const label = svgElement("text", {
        x: margin.left - 12,
        y: currentY + 5,
        "text-anchor": "end"
      });
      label.textContent = formatPrice(value);
      grid.push(label);
    }

    const points = records.map((record, index) => [x(index), y(record.taxIncludedPrice)]);
    const line = svgElement("polyline", {
      class: "trend-line",
      points: points.map(([pointX, pointY]) => `${pointX},${pointY}`).join(" ")
    });

    const axisX = svgElement("line", {
      class: "axis",
      x1: margin.left,
      x2: width - margin.right,
      y1: height - margin.bottom,
      y2: height - margin.bottom
    });
    const axisY = svgElement("line", {
      class: "axis",
      x1: margin.left,
      x2: margin.left,
      y1: margin.top,
      y2: height - margin.bottom
    });

    const labels = [];
    const labelEvery = Math.max(1, Math.ceil(records.length / 6));
    records.forEach((record, index) => {
      const [pointX, pointY] = points[index];
      const point = svgElement("circle", {
        class: "trend-point",
        cx: pointX,
        cy: pointY,
        r: 4
      });
      labels.push(point);

      if (index % labelEvery === 0 || index === records.length - 1) {
        const label = svgElement("text", {
          x: pointX,
          y: height - 18,
          "text-anchor": "middle"
        });
        label.textContent = record.period;
        labels.push(label);
      }
    });

    els.chart.replaceChildren(...grid, axisX, axisY, line, ...labels);
  }

  function compareRecords(base, target) {
    if (!base || !target) {
      return { base, target, diff: null, percent: null };
    }

    const diff = Number(target.taxIncludedPrice) - Number(base.taxIncludedPrice);
    const percent = Number(base.taxIncludedPrice) === 0 ? null : (diff / Number(base.taxIncludedPrice)) * 100;
    return { base, target, diff, percent };
  }

  function renderCompare() {
    const base = state.selectedHistory.find((record) => record.period === state.monthA);
    const target = state.selectedHistory.find((record) => record.period === state.monthB);
    const compare = compareRecords(base, target);

    fillText(els.compareALabel, state.monthA || "月份 A");
    fillText(els.compareBLabel, state.monthB || "月份 B");
    fillText(els.compareA, formatPrice(compare.base?.taxIncludedPrice));
    fillText(els.compareB, formatPrice(compare.target?.taxIncludedPrice));
    fillText(els.compareDiff, formatPrice(compare.diff));
    fillText(els.comparePercent, formatPercent(compare.percent));

    if (els.compareDiffCard) {
      els.compareDiffCard.classList.toggle("is-up", compare.diff !== null && compare.diff >= 0);
      els.compareDiffCard.classList.toggle("is-down", compare.diff !== null && compare.diff < 0);
    }
  }

  function renderDetail() {
    const record = selectedRecord();

    fillText(els.detailTitle, record?.materialName || "请选择材料");
    fillText(els.detailSpec, record?.spec || "--");
    renderChart(state.selectedHistory);
    renderCompare();
  }

  async function loadHistory(record) {
    const token = (state.loadToken += 1);

    if (!record) {
      state.selectedHistory = [];
      renderDetail();
      return;
    }

    if (!record.historyFile) {
      state.selectedHistory = [record];
      renderDetail();
      return;
    }

    const cached = state.historyCache.get(record.materialKey);
    if (cached) {
      state.selectedHistory = cached;
      renderDetail();
      return;
    }

    renderEmptyChart("正在加载历史趋势...");

    try {
      const history = await readJson(`data/${record.historyFile}`);
      if (token !== state.loadToken) {
        return;
      }

      state.historyCache.set(record.materialKey, history);
      state.selectedHistory = history;
      renderDetail();
    } catch {
      if (token !== state.loadToken) {
        return;
      }

      state.selectedHistory = [record];
      renderDetail();
    }
  }

  function selectRecord(materialKey) {
    if (state.selectedKey === materialKey) {
      return;
    }

    state.selectedKey = materialKey;
    renderResults();
    loadHistory(selectedRecord());
  }

  function applySearch() {
    state.keyword = els.keyword?.value || "";
    state.matched = sortByMaterial(state.materials.filter((record) => recordMatches(record, state.keyword)));
    state.page = 1;

    if (!state.matched.some((record) => record.materialKey === state.selectedKey)) {
      state.selectedKey = state.matched[0]?.materialKey || "";
    }

    renderStats();
    renderResults();
    loadHistory(selectedRecord());
  }

  function csvEscape(value) {
    const text = String(value ?? "");
    return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
  }

  function exportCsv() {
    const headers = ["月份", "材料编码", "材料名称", "规格型号", "单位", "信息价含税", "发布日期"];
    const rows = state.matched.map((record) => [
      record.period,
      record.materialCode,
      record.materialName,
      record.spec,
      record.unit,
      record.taxIncludedPrice,
      record.publishDate
    ]);
    const csv = `\uFEFF${[headers, ...rows].map((row) => row.map(csvEscape).join(",")).join("\r\n")}`;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `上海信息价查询结果-${state.manifest?.latestPeriod || "latest"}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  function bindEvents() {
    els.keyword?.addEventListener("input", () => applySearch());
    els.previous?.addEventListener("click", () => {
      state.page = Math.max(1, state.page - 1);
      renderResults();
    });
    els.next?.addEventListener("click", () => {
      state.page = Math.min(totalPages(), state.page + 1);
      renderResults();
    });
    els.monthA?.addEventListener("change", (event) => {
      state.monthA = event.target.value;
      renderCompare();
    });
    els.monthB?.addEventListener("change", (event) => {
      state.monthB = event.target.value;
      renderCompare();
    });
    els.exportButton?.addEventListener("click", exportCsv);
  }

  async function init() {
    bindEvents();

    try {
      const [manifest, latest, materials] = await Promise.all([
        readJson("data/manifest.json"),
        readJson("data/latest.json"),
        readJson("data/search-index.json")
      ]);
      const periods = manifest.periods || [];

      state.manifest = manifest;
      state.latest = latest;
      state.materials = materials;
      state.monthA = periods[periods.length - 2] || manifest.latestPeriod || "";
      state.monthB = manifest.latestPeriod || periods[periods.length - 1] || "";
      state.selectedKey = materials[0]?.materialKey || latest[0]?.materialKey || "";
      fillMonthOptions();
      setStatus(`已加载 ${formatInteger(manifest.totalRecords)} 条记录，最新期 ${manifest.latestPeriod}。`, "ok");
      applySearch();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "数据加载失败", "error");
      renderEmptyChart("数据加载失败");
    }
  }

  init();
})();
