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
const heroPortrait = document.querySelector("#heroPortrait");
let quoteIndex = 0;

const portraitImages = [
  {
    src: "images/3818c2c7aa04f65ddb23e7d25a159026522770383.png@360w_270h_1s.avif",
    blinkTop: "43%",
    blinkLeftX: "33%",
    blinkRightX: "56%",
  },
  {
    src: "images/5a9f84efd0e9330692924337312f8010522770383.png@360w_270h_1s.avif",
    blinkTop: "43%",
    blinkLeftX: "33%",
    blinkRightX: "56%",
  },
  {
    src: "images/c15235abe0c4bfa822d8890d292fd945522770383.png@360w_270h_1s.avif",
    blinkTop: "43%",
    blinkLeftX: "33%",
    blinkRightX: "56%",
  },
  {
    src: "images/fa787b524ba30d878e6b29161542bf03522770383.png@360w_270h_1s.avif",
    blinkTop: "43%",
    blinkLeftX: "33%",
    blinkRightX: "56%",
  },
];

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

if (heroPortrait) {
  const selectedPortrait = portraitImages[Math.floor(Math.random() * portraitImages.length)];
  heroPortrait.src = selectedPortrait.src;
  heroPortrait.closest(".portrait-screen")?.style.setProperty("--blink-top", selectedPortrait.blinkTop);
  heroPortrait.closest(".portrait-screen")?.style.setProperty("--blink-left-x", selectedPortrait.blinkLeftX);
  heroPortrait.closest(".portrait-screen")?.style.setProperty("--blink-right-x", selectedPortrait.blinkRightX);
}
