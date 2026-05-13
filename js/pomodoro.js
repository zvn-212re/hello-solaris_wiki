const WORK_SECONDS = 25 * 60;
const BREAK_SECONDS = 5 * 60;
const STORAGE_KEY = "solarisPomodoroCount";

function readStoredTomatoes() {
  try {
    return Number(localStorage.getItem(STORAGE_KEY) || 0);
  } catch {
    return 0;
  }
}

function saveStoredTomatoes(value) {
  try {
    localStorage.setItem(STORAGE_KEY, String(value));
  } catch {
    // 计时器仍可正常使用，只是不保存刷新后的计数。
  }
}

const state = {
  mode: "work",
  remaining: WORK_SECONDS,
  running: false,
  timerId: null,
  tomatoes: readStoredTomatoes(),
};

const timeText = document.querySelector("#timeText");
const modeLabel = document.querySelector("#modeLabel");
const statusText = document.querySelector("#statusText");
const toggleButton = document.querySelector("#toggleButton");
const resetButton = document.querySelector("#resetButton");
const completionMessage = document.querySelector("#completionMessage");
const tomatoCount = document.querySelector("#tomatoCount");
const tomatoRow = document.querySelector("#tomatoRow");
const modeTabs = document.querySelectorAll(".mode-tab");
const progressBar = document.querySelector(".progress-bar");

const circumference = 2 * Math.PI * 96;
progressBar.style.strokeDasharray = `${circumference}`;

function getDuration() {
  return state.mode === "work" ? WORK_SECONDS : BREAK_SECONDS;
}

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function updateProgress() {
  const duration = getDuration();
  const elapsed = duration - state.remaining;
  const progress = elapsed / duration;
  progressBar.style.strokeDashoffset = `${circumference * (1 - progress)}`;
}

function renderTomatoes() {
  tomatoCount.textContent = state.tomatoes;
  tomatoRow.innerHTML = "";

  if (state.tomatoes === 0) {
    const empty = document.createElement("span");
    empty.className = "empty-tomato";
    empty.textContent = "还没有完成的番茄";
    tomatoRow.append(empty);
    return;
  }

  const visibleCount = Math.min(state.tomatoes, 12);
  for (let index = 0; index < visibleCount; index += 1) {
    const tomato = document.createElement("span");
    tomato.className = "tomato-dot";
    tomato.title = `第 ${index + 1} 个番茄`;
    tomato.innerHTML = '<i class="ri-checkbox-circle-fill"></i>';
    tomatoRow.append(tomato);
  }

  if (state.tomatoes > visibleCount) {
    const more = document.createElement("span");
    more.className = "tomato-more";
    more.textContent = `+${state.tomatoes - visibleCount}`;
    tomatoRow.append(more);
  }
}

function render() {
  const isWork = state.mode === "work";
  timeText.textContent = formatTime(state.remaining);
  modeLabel.textContent = isWork ? "专注中" : "短休息";
  statusText.textContent = state.running ? "计时进行中" : "准备开始";
  toggleButton.querySelector("span").textContent = state.running ? "暂停" : "开始";
  toggleButton.querySelector("i").className = state.running ? "ri-pause-fill" : "ri-play-fill";
  document.title = `${formatTime(state.remaining)} | ${isWork ? "专注" : "休息"} | Solaris Wiki`;

  modeTabs.forEach((tab) => {
    const active = tab.dataset.mode === state.mode;
    tab.classList.toggle("active", active);
    tab.setAttribute("aria-pressed", String(active));
  });

  updateProgress();
  renderTomatoes();
}

function playCompletionSound() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) {
    return;
  }

  const context = new AudioContext();
  const oscillator = context.createOscillator();
  const gain = context.createGain();

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(720, context.currentTime);
  oscillator.frequency.setValueAtTime(540, context.currentTime + 0.18);
  gain.gain.setValueAtTime(0.001, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.18, context.currentTime + 0.03);
  gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.45);

  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + 0.48);
}

function switchMode(mode, message = "") {
  state.mode = mode;
  state.remaining = mode === "work" ? WORK_SECONDS : BREAK_SECONDS;
  state.running = false;
  clearInterval(state.timerId);
  completionMessage.textContent = message;
  render();
}

function completeCurrentMode() {
  clearInterval(state.timerId);
  state.running = false;
  playCompletionSound();

  if (state.mode === "work") {
    state.tomatoes += 1;
    saveStoredTomatoes(state.tomatoes);
    switchMode("break", "专注完成！现在进入 5 分钟短休息。");
  } else {
    switchMode("work", "短休息结束，可以开始下一轮专注。");
  }
}

function tick() {
  if (state.remaining <= 1) {
    state.remaining = 0;
    render();
    completeCurrentMode();
    return;
  }

  state.remaining -= 1;
  render();
}

function toggleTimer() {
  completionMessage.textContent = "";

  if (state.running) {
    state.running = false;
    clearInterval(state.timerId);
    render();
    return;
  }

  state.running = true;
  state.timerId = setInterval(tick, 1000);
  render();
}

function resetTimer() {
  clearInterval(state.timerId);
  state.running = false;
  state.remaining = getDuration();
  completionMessage.textContent = "已重置当前计时。";
  render();
}

toggleButton.addEventListener("click", toggleTimer);
resetButton.addEventListener("click", resetTimer);

modeTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    switchMode(tab.dataset.mode);
  });
});

render();
