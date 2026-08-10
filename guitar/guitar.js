(() => {
  "use strict";

  const NOTES = ["C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯", "A", "A♯", "B"];
  const INTERVALS = ["1", "♭2", "2", "♭3", "3", "4", "♭5", "5", "♭6", "6", "♭7", "7"];
  const SCALES = {
    "自然大调": [0, 2, 4, 5, 7, 9, 11],
    "自然小调": [0, 2, 3, 5, 7, 8, 10],
    "大调五声音阶": [0, 2, 4, 7, 9],
    "小调五声音阶": [0, 3, 5, 7, 10],
    "布鲁斯音阶": [0, 3, 5, 6, 7, 10],
    "多利亚调式": [0, 2, 3, 5, 7, 9, 10]
  };
  const STRINGS = [
    { number: 1, name: "E4", midi: 64 },
    { number: 2, name: "B3", midi: 59 },
    { number: 3, name: "G3", midi: 55 },
    { number: 4, name: "D3", midi: 50 },
    { number: 5, name: "A2", midi: 45 },
    { number: 6, name: "E2", midi: 40 }
  ];
  const SESSION_LENGTH = 10;
  const STORAGE_KEY = "solaris-fretwise-v1";

  const rootSelect = document.querySelector("[data-root]");
  const scaleSelect = document.querySelector("[data-scale]");
  const board = document.querySelector("[data-fretboard]");
  const trainButton = document.querySelector("[data-train]");
  const feedback = document.querySelector("[data-feedback]");
  const roundLabel = document.querySelector("[data-round]");
  const targetLabel = document.querySelector("[data-target]");
  const targetOrb = document.querySelector("[data-target-orb]");
  const targetNote = document.querySelector("[data-target-note]");
  const scaleLabel = document.querySelector("[data-current-scale]");
  const accuracyLabel = document.querySelector("[data-accuracy]");
  const bestLabel = document.querySelector("[data-best]");
  const totalLabel = document.querySelector("[data-total]");
  const themeToggle = document.querySelector("[data-theme-toggle]");

  let audioContext = null;
  let nextTimer = null;
  let state = {
    root: 0,
    scale: "自然大调",
    mode: "音名",
    best: 0,
    totalCorrect: 0,
    totalAttempts: 0,
    selected: "",
    training: null
  };

  function mod(value, base = 12) {
    return ((value % base) + base) % base;
  }

  function restore() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (!saved) return;
      if (Number.isInteger(saved.root) && saved.root >= 0 && saved.root < 12) state.root = saved.root;
      if (saved.scale in SCALES) state.scale = saved.scale;
      if (["音名", "级数", "音程"].includes(saved.mode)) state.mode = saved.mode;
      state.best = Math.max(0, Number(saved.best) || 0);
      state.totalCorrect = Math.max(0, Number(saved.totalCorrect) || 0);
      state.totalAttempts = Math.max(0, Number(saved.totalAttempts) || 0);
    } catch {}
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        root: state.root,
        scale: state.scale,
        mode: state.mode,
        best: state.best,
        totalCorrect: state.totalCorrect,
        totalAttempts: state.totalAttempts
      }));
    } catch {}
  }

  function currentIntervals() {
    return SCALES[state.scale];
  }

  function pitchAt(openMidi, fret) {
    return mod(openMidi + fret);
  }

  function intervalFromRoot(pitch) {
    return mod(pitch - state.root);
  }

  function inScale(pitch) {
    return currentIntervals().includes(intervalFromRoot(pitch));
  }

  function noteLabel(pitch) {
    if (state.mode === "音名") return NOTES[pitch];
    const interval = intervalFromRoot(pitch);
    if (state.mode === "音程") return INTERVALS[interval];
    const degree = currentIntervals().indexOf(interval);
    return degree === -1 ? "" : String(degree + 1);
  }

  function accuracy(correct, attempts) {
    return attempts ? `${Math.round((correct / attempts) * 100)}%` : "—";
  }

  function renderStats() {
    const training = state.training;
    accuracyLabel.textContent = training
      ? accuracy(training.correct, training.attempts)
      : accuracy(state.totalCorrect, state.totalAttempts);
    bestLabel.textContent = state.best || "—";
    totalLabel.textContent = state.totalCorrect;
    scaleLabel.textContent = `${NOTES[state.root]} · ${state.scale}`;
  }

  function renderModes() {
    document.querySelectorAll("[data-mode]").forEach((button) => {
      const active = button.dataset.mode === state.mode;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
  }

  function renderBoard() {
    const markerFrets = new Set([3, 5, 7, 9, 12, 15, 17, 19, 21, 24]);
    const numberCells = Array.from({ length: 25 }, (_, fret) => `<span>${fret}</span>`).join("");
    const strings = STRINGS.map((string, stringIndex) => {
      const cells = Array.from({ length: 25 }, (_, fret) => {
        const pitch = pitchAt(string.midi, fret);
        const root = intervalFromRoot(pitch) === 0;
        const scale = inScale(pitch);
        const selected = state.selected === `${stringIndex}-${fret}`;
        const classes = ["fret-cell", root ? "is-root" : "", scale ? "in-scale" : "out-scale", selected ? "is-selected" : ""].filter(Boolean).join(" ");
        const label = noteLabel(pitch);
        return `<button class="${classes}" type="button" data-string="${stringIndex}" data-fret="${fret}" aria-label="${string.number} 弦 ${fret} 品，${NOTES[pitch]}"><span>${label}</span></button>`;
      }).join("");
      return `<div class="fret-row string-row"><div class="string-label"><b>${string.number}</b><span>${string.name}</span></div>${cells}</div>`;
    }).join("");
    const markers = Array.from({ length: 25 }, (_, fret) => `<span>${markerFrets.has(fret) ? (fret === 12 || fret === 24 ? "••" : "•") : ""}</span>`).join("");
    board.innerHTML = `<div class="fret-row fret-numbers"><div class="string-label">弦 / 品</div>${numberCells}</div>${strings}<div class="fret-row fret-markers"><div class="string-label"></div>${markers}</div>`;
  }

  function renderTraining() {
    const training = state.training;
    trainButton.textContent = training ? "结束训练" : "开始 10 题训练";
    trainButton.classList.toggle("is-stop", Boolean(training));
    targetOrb.hidden = !training;
    if (!training) return;
    roundLabel.textContent = `第 ${training.round} / ${SESSION_LENGTH} 题`;
    targetLabel.textContent = `找到指板上的 ${NOTES[training.target]}`;
    targetNote.textContent = NOTES[training.target];
  }

  function renderAll() {
    rootSelect.value = String(state.root);
    scaleSelect.value = state.scale;
    renderModes();
    renderBoard();
    renderStats();
    renderTraining();
    save();
  }

  function playMidi(midi) {
    const Context = window.AudioContext || window.webkitAudioContext;
    if (!Context) {
      feedback.textContent = "当前浏览器不支持音频播放，请换用新版浏览器。";
      return;
    }
    audioContext ||= new Context();
    if (audioContext.state === "suspended") audioContext.resume();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const now = audioContext.currentTime;
    oscillator.type = "triangle";
    oscillator.frequency.setValueAtTime(440 * 2 ** ((midi - 69) / 12), now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.18, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.8);
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.85);
  }

  function trainingPool() {
    return currentIntervals().map((interval) => mod(state.root + interval));
  }

  function pickTarget(previous = null) {
    const candidates = trainingPool();
    const pool = candidates.length > 1 ? candidates.filter((note) => note !== previous) : candidates;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  function stopTraining(message = "训练已结束，随时可以再来一轮。") {
    clearTimeout(nextTimer);
    state.training = null;
    roundLabel.textContent = "自由练习";
    targetLabel.textContent = "点击任意音符试听";
    feedback.textContent = message;
    renderTraining();
    renderStats();
    save();
  }

  function startTraining() {
    clearTimeout(nextTimer);
    state.selected = "";
    state.training = { target: pickTarget(), round: 1, correct: 0, attempts: 0, streak: 0, locked: false };
    feedback.textContent = `第 1 题：在指板上找到 ${NOTES[state.training.target]}`;
    renderAll();
  }

  function handleNote(stringIndex, fret) {
    const string = STRINGS[stringIndex];
    const midi = string.midi + fret;
    const pitch = pitchAt(string.midi, fret);
    state.selected = `${stringIndex}-${fret}`;
    playMidi(midi);

    const training = state.training;
    if (!training) {
      feedback.textContent = `${NOTES[pitch]} · ${string.number} 弦 ${fret} 品 · MIDI ${midi}`;
      renderBoard();
      return;
    }
    if (training.locked) return;

    training.attempts += 1;
    state.totalAttempts += 1;
    if (pitch !== training.target) {
      training.streak = 0;
      feedback.textContent = `${NOTES[pitch]} 不是目标音，再找找 ${NOTES[training.target]}。`;
      renderBoard();
      renderStats();
      save();
      return;
    }

    training.correct += 1;
    training.streak += 1;
    training.locked = true;
    state.totalCorrect += 1;
    state.best = Math.max(state.best, training.streak);

    if (training.round >= SESSION_LENGTH) {
      const result = accuracy(training.correct, training.attempts);
      feedback.textContent = `完成！本轮答对 ${training.correct}/${SESSION_LENGTH}，准确率 ${result}。`;
      state.training = null;
      roundLabel.textContent = "训练完成";
      targetLabel.textContent = "做得不错，再来一轮巩固吧";
      renderAll();
      return;
    }

    feedback.textContent = `答对了，${NOTES[pitch]}！准备下一题…`;
    renderBoard();
    renderStats();
    nextTimer = setTimeout(() => {
      const previous = training.target;
      training.target = pickTarget(previous);
      training.round += 1;
      training.locked = false;
      state.selected = "";
      feedback.textContent = `第 ${training.round} 题：在指板上找到 ${NOTES[training.target]}`;
      renderAll();
    }, 520);
  }

  restore();
  NOTES.forEach((note, index) => rootSelect.add(new Option(note, String(index))));
  Object.keys(SCALES).forEach((name) => scaleSelect.add(new Option(name, name)));

  rootSelect.addEventListener("change", () => {
    state.root = Number(rootSelect.value);
    stopTraining("根音已更新。试听指板，或开始一轮新训练。 ");
    renderAll();
  });
  scaleSelect.addEventListener("change", () => {
    state.scale = scaleSelect.value;
    stopTraining("音阶已更新。试听指板，或开始一轮新训练。 ");
    renderAll();
  });
  document.querySelector("[data-display-modes]").addEventListener("click", (event) => {
    const button = event.target.closest("[data-mode]");
    if (!button) return;
    state.mode = button.dataset.mode;
    renderAll();
  });
  board.addEventListener("click", (event) => {
    const button = event.target.closest("[data-string][data-fret]");
    if (!button) return;
    handleNote(Number(button.dataset.string), Number(button.dataset.fret));
  });
  trainButton.addEventListener("click", () => state.training ? stopTraining() : startTraining());
  themeToggle.addEventListener("click", () => {
    const night = document.documentElement.dataset.theme !== "night";
    document.documentElement.dataset.theme = night ? "night" : "";
    themeToggle.setAttribute("aria-pressed", String(night));
    try { localStorage.setItem("solarisTheme", night ? "night" : "day"); } catch {}
  });
  themeToggle.setAttribute("aria-pressed", String(document.documentElement.dataset.theme === "night"));
  renderAll();
})();
