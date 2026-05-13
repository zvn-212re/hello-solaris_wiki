const quotes = [
  {
    text: "“We don't need other worlds, we need mirrors.”",
    meta: "Stanisław Lem, Solaris",
  },
  {
    text: "“把每一次实验，存成一颗可回看的星。”",
    meta: "Solaris Wiki / 站点札记",
  },
  {
    text: "“代码像潮汐，Agent 像海面上短暂的回声。”",
    meta: "Solaris Wiki / Vibe Coding",
  },
  {
    text: "“今天也在纸面网格里，调试一小片宇宙。”",
    meta: "Solaris Wiki / Debug Log",
  },
];

const quoteButton = document.querySelector("#quoteRotator");
const quoteText = document.querySelector("#quoteText");
const quoteMeta = document.querySelector("#quoteMeta");
let quoteIndex = 0;

function showQuote(nextIndex) {
  quoteIndex = nextIndex % quotes.length;
  quoteButton.classList.add("is-switching");

  window.setTimeout(() => {
    quoteText.textContent = quotes[quoteIndex].text;
    quoteMeta.textContent = quotes[quoteIndex].meta;
    quoteButton.classList.remove("is-switching");
  }, 120);
}

function nextQuote() {
  showQuote(quoteIndex + 1);
}

if (quoteButton && quoteText && quoteMeta) {
  quoteButton.addEventListener("click", nextQuote);

  if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    window.setInterval(nextQuote, 6800);
  }
}
