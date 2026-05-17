(function () {
  function normalize(value) {
    return String(value || "").toLowerCase();
  }

  function renderResults(root, records, query) {
    const list = root.querySelector("[data-search-results]");
    const empty = root.querySelector("[data-search-empty]");
    const count = root.querySelector("[data-search-count]");
    const terms = normalize(query).split(/\s+/).filter(Boolean);

    const results = terms.length
      ? records.filter((record) => {
          const haystack = normalize(
            [record.title, record.summary, record.type, ...(record.tags || [])].join(" ")
          );
          return terms.every((term) => haystack.includes(term));
        })
      : records;

    list.innerHTML = "";
    empty.hidden = results.length > 0;
    count.textContent = `${results.length} / ${records.length}`;

    results.slice(0, 40).forEach((record) => {
      const item = document.createElement("article");
      item.className = "guestbook-item search-result";

      const title = document.createElement("h3");
      const link = document.createElement("a");
      link.href = record.url;
      link.textContent = record.title;
      title.append(link);

      const summary = document.createElement("p");
      summary.className = "guestbook-message";
      summary.textContent = record.summary || "";

      const meta = document.createElement("p");
      meta.className = "guestbook-meta";
      meta.textContent = [record.type, ...(record.tags || [])].filter(Boolean).join(" / ");

      item.append(title, summary, meta);
      list.append(item);
    });
  }

  async function initSearch() {
    const root = document.querySelector("[data-search]");

    if (!root || root.dataset.bound === "true") {
      return;
    }

    const input = root.querySelector("[data-search-input]");
    const response = await fetch("data/search-index.json", { cache: "no-store" });
    const records = await response.json();

    input.addEventListener("input", () => renderResults(root, records, input.value));
    renderResults(root, records, input.value);
    root.dataset.bound = "true";
  }

  window.SolarisSearch = {
    init: initSearch,
  };

  initSearch().catch(() => {
    const status = document.querySelector("[data-search-empty]");
    if (status) {
      status.hidden = false;
      status.textContent = "搜索索引暂时不可用，请先运行 npm run build。";
    }
  });
})();
