(function () {
  const WORK_SECONDS = 25 * 60;
  const BREAK_SECONDS = 5 * 60;
  const STORAGE_KEY = "solarisPomodoroCount";
  const circumference = 2 * Math.PI * 96;

  const state = {
    mode: "work",
    remaining: WORK_SECONDS,
    running: false,
    timerId: null,
    tomatoes: readStoredTomatoes(),
    root: null,
  };

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

  function getElements() {
    const root = document.querySelector("[data-pomodoro-root]");

    return {
      root,
      timeText: root?.querySelector("#timeText"),
      modeLabel: root?.querySelector("#modeLabel"),
      statusText: root?.querySelector("#statusText"),
      toggleButton: root?.querySelector("#toggleButton"),
      resetButton: root?.querySelector("#resetButton"),
      completionMessage: root?.querySelector("#completionMessage"),
      tomatoCount: root?.querySelector("#tomatoCount"),
      tomatoRow: root?.querySelector("#tomatoRow"),
      modeTabs: root ? Array.from(root.querySelectorAll(".mode-tab")) : [],
      progressBar: root?.querySelector(".progress-bar"),
    };
  }

  function hasRequiredElements(elements) {
    return Boolean(
      elements.root &&
        elements.timeText &&
        elements.modeLabel &&
        elements.statusText &&
        elements.toggleButton &&
        elements.resetButton &&
        elements.completionMessage &&
        elements.tomatoCount &&
        elements.tomatoRow &&
        elements.progressBar
    );
  }

  function stopTimer() {
    state.running = false;
    window.clearInterval(state.timerId);
    state.timerId = null;
  }

  function getDuration() {
    return state.mode === "work" ? WORK_SECONDS : BREAK_SECONDS;
  }

  function formatTime(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
    const seconds = (totalSeconds % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
  }

  function updateProgress(elements) {
    const duration = getDuration();
    const elapsed = duration - state.remaining;
    const progress = elapsed / duration;
    elements.progressBar.style.strokeDasharray = `${circumference}`;
    elements.progressBar.style.strokeDashoffset = `${circumference * (1 - progress)}`;
  }

  function renderTomatoes(elements) {
    elements.tomatoCount.textContent = state.tomatoes;
    elements.tomatoRow.innerHTML = "";

    if (state.tomatoes === 0) {
      const empty = document.createElement("span");
      empty.className = "empty-tomato";
      empty.textContent = "还没有完成的番茄";
      elements.tomatoRow.append(empty);
      return;
    }

    const visibleCount = Math.min(state.tomatoes, 12);
    for (let index = 0; index < visibleCount; index += 1) {
      const tomato = document.createElement("span");
      tomato.className = "tomato-dot";
      tomato.title = `第 ${index + 1} 个番茄`;
      tomato.innerHTML = '<i class="ri-checkbox-circle-fill"></i>';
      elements.tomatoRow.append(tomato);
    }

    if (state.tomatoes > visibleCount) {
      const more = document.createElement("span");
      more.className = "tomato-more";
      more.textContent = `+${state.tomatoes - visibleCount}`;
      elements.tomatoRow.append(more);
    }
  }

  function render(elements = getElements()) {
    if (!hasRequiredElements(elements)) {
      return;
    }

    const isWork = state.mode === "work";
    elements.timeText.textContent = formatTime(state.remaining);
    elements.modeLabel.textContent = isWork ? "专注中" : "短休息";
    elements.statusText.textContent = state.running ? "计时进行中" : "准备开始";
    elements.toggleButton.querySelector("span").textContent = state.running ? "暂停" : "开始";
    elements.toggleButton.querySelector("i").className = state.running ? "ri-pause-fill" : "ri-play-fill";

    if (document.querySelector("[data-pomodoro-root]")) {
      document.title = `${formatTime(state.remaining)} | ${isWork ? "专注" : "休息"} | Solaris Wiki`;
    }

    elements.modeTabs.forEach((tab) => {
      const active = tab.dataset.mode === state.mode;
      tab.classList.toggle("active", active);
      tab.setAttribute("aria-pressed", String(active));
    });

    updateProgress(elements);
    renderTomatoes(elements);
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
    const elements = getElements();
    state.mode = mode;
    state.remaining = mode === "work" ? WORK_SECONDS : BREAK_SECONDS;
    stopTimer();

    if (hasRequiredElements(elements)) {
      elements.completionMessage.textContent = message;
    }

    render(elements);
  }

  function completeCurrentMode() {
    stopTimer();
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
    const elements = getElements();
    if (!hasRequiredElements(elements)) {
      return;
    }

    elements.completionMessage.textContent = "";

    if (state.running) {
      stopTimer();
      render(elements);
      return;
    }

    state.running = true;
    state.timerId = window.setInterval(tick, 1000);
    render(elements);
  }

  function resetTimer() {
    const elements = getElements();
    if (!hasRequiredElements(elements)) {
      return;
    }

    stopTimer();
    state.remaining = getDuration();
    elements.completionMessage.textContent = "已重置当前计时。";
    render(elements);
  }

  function initPomodoro() {
    const elements = getElements();

    if (!hasRequiredElements(elements)) {
      stopTimer();
      state.root = null;
      return;
    }

    if (state.root === elements.root && elements.root.dataset.pomodoroBound === "true") {
      render(elements);
      return;
    }

    state.root = elements.root;
    elements.root.dataset.pomodoroBound = "true";
    elements.progressBar.style.strokeDasharray = `${circumference}`;

    elements.toggleButton.addEventListener("click", toggleTimer);
    elements.resetButton.addEventListener("click", resetTimer);

    elements.modeTabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        switchMode(tab.dataset.mode);
      });
    });

    render(elements);
  }

  window.SolarisPomodoro = {
    init: initPomodoro,
    render,
    stop: stopTimer,
  };

  initPomodoro();
})();
