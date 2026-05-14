(function () {
  const STORAGE_KEY = "solarisMusicPlayer";

  const tracks = {
    signal: {
      title: "8-bit 海面信号",
      bpm: 118,
      notes: ["E4", "G4", "B4", "G4", "E5", "B4", "G4", "D4"],
      bass: ["E2", "E2", "C3", "C3", "G2", "G2", "D3", "D3"],
    },
    orbit: {
      title: "像素轨道巡航",
      bpm: 132,
      notes: ["C4", "E4", "G4", "B4", "C5", "B4", "G4", "E4"],
      bass: ["C2", "C2", "G2", "G2", "A2", "A2", "F2", "F2"],
    },
    terminal: {
      title: "终端夜航",
      bpm: 96,
      notes: ["A3", "C4", "E4", "C4", "G3", "B3", "D4", "B3"],
      bass: ["A2", "A2", "F2", "F2", "G2", "G2", "E2", "E2"],
    },
  };

  const noteMap = {
    C2: 65.41,
    D2: 73.42,
    E2: 82.41,
    F2: 87.31,
    G2: 98.0,
    A2: 110.0,
    C3: 130.81,
    D3: 146.83,
    A3: 220.0,
    B3: 246.94,
    C4: 261.63,
    D4: 293.66,
    E4: 329.63,
    G3: 196.0,
    G4: 392.0,
    B4: 493.88,
    C5: 523.25,
    E5: 659.25,
  };

  const state = {
    audioContext: null,
    masterGain: null,
    stepTimer: null,
    stepIndex: 0,
    isPlaying: false,
    track: "signal",
    volume: 36,
    panelOpen: false,
    bound: false,
  };

  function readStoredState() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    } catch {
      return {};
    }
  }

  function saveState() {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          track: state.track,
          volume: state.volume,
          panelOpen: state.panelOpen,
          wasPlaying: state.isPlaying,
        })
      );
    } catch {
      // Local storage may be unavailable in privacy modes.
    }
  }

  function getElements() {
    return {
      player: document.querySelector("[data-music-player]"),
      toggle: document.querySelector("[data-music-toggle]"),
      panel: document.querySelector("[data-music-panel]"),
      playButton: document.querySelector("[data-music-play]"),
      trackSelect: document.querySelector("[data-music-track]"),
      volume: document.querySelector("[data-music-volume]"),
      title: document.querySelector("[data-music-title]"),
      led: document.querySelector("[data-music-led]"),
    };
  }

  function hasRequiredElements(elements) {
    return Object.values(elements).every(Boolean);
  }

  function createAudio(elements) {
    if (state.audioContext) {
      return;
    }

    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) {
      elements.title.textContent = "当前浏览器不支持音频";
      return;
    }

    state.audioContext = new AudioContext();
    state.masterGain = state.audioContext.createGain();
    state.masterGain.gain.value = state.volume / 100;
    state.masterGain.connect(state.audioContext.destination);
  }

  function playTone(frequency, startTime, duration, type, gainValue) {
    if (!state.audioContext || !state.masterGain || !frequency) {
      return;
    }

    const oscillator = state.audioContext.createOscillator();
    const gain = state.audioContext.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, startTime);
    gain.gain.setValueAtTime(0.001, startTime);
    gain.gain.exponentialRampToValueAtTime(gainValue, startTime + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    oscillator.connect(gain);
    gain.connect(state.masterGain);
    oscillator.start(startTime);
    oscillator.stop(startTime + duration + 0.03);
  }

  function playStep() {
    const track = tracks[state.track] || tracks.signal;
    const beatSeconds = 60 / track.bpm;
    const note = track.notes[state.stepIndex % track.notes.length];
    const bass = track.bass[state.stepIndex % track.bass.length];
    const now = state.audioContext.currentTime;

    playTone(noteMap[note], now, beatSeconds * 0.45, "square", 0.08);
    playTone(noteMap[bass], now, beatSeconds * 0.72, "triangle", 0.045);

    state.stepIndex += 1;
  }

  function render(elements = getElements()) {
    if (!hasRequiredElements(elements)) {
      return;
    }

    elements.trackSelect.value = state.track;
    elements.volume.value = String(state.volume);
    elements.title.textContent = tracks[state.track]?.title || tracks.signal.title;
    elements.playButton.textContent = state.isPlaying ? "PAUSE" : "PLAY";
    elements.led.classList.toggle("is-playing", state.isPlaying);
    elements.panel.classList.toggle("is-open", state.panelOpen);
    elements.toggle.setAttribute("aria-expanded", String(state.panelOpen));
  }

  async function startMusic() {
    const elements = getElements();
    if (!hasRequiredElements(elements)) {
      return;
    }

    createAudio(elements);

    if (!state.audioContext) {
      return;
    }

    if (state.audioContext.state === "suspended") {
      await state.audioContext.resume();
    }

    if (state.isPlaying) {
      return;
    }

    state.isPlaying = true;
    window.clearInterval(state.stepTimer);
    playStep();
    state.stepTimer = window.setInterval(
      playStep,
      (60 / tracks[state.track].bpm) * 1000
    );
    render(elements);
    saveState();
  }

  function stopMusic() {
    state.isPlaying = false;
    window.clearInterval(state.stepTimer);
    state.stepTimer = null;
    render();
    saveState();
  }

  function restartIfPlaying() {
    state.stepIndex = 0;
    window.clearInterval(state.stepTimer);

    if (!state.isPlaying) {
      render();
      saveState();
      return;
    }

    playStep();
    state.stepTimer = window.setInterval(
      playStep,
      (60 / tracks[state.track].bpm) * 1000
    );
    render();
    saveState();
  }

  function bind() {
    const elements = getElements();
    if (!hasRequiredElements(elements) || state.bound) {
      render(elements);
      return;
    }

    const stored = readStoredState();
    if (tracks[stored.track]) {
      state.track = stored.track;
    }
    if (Number.isFinite(Number(stored.volume))) {
      state.volume = Number(stored.volume);
    }
    state.panelOpen = Boolean(stored.panelOpen);
    state.bound = true;

    elements.toggle.addEventListener("click", () => {
      state.panelOpen = !state.panelOpen;
      render(elements);
      saveState();
    });

    elements.playButton.addEventListener("click", () => {
      if (state.isPlaying) {
        stopMusic();
      } else {
        startMusic();
      }
    });

    elements.trackSelect.addEventListener("change", () => {
      state.track = elements.trackSelect.value;
      restartIfPlaying();
    });

    elements.volume.addEventListener("input", () => {
      state.volume = Number(elements.volume.value);
      if (state.masterGain) {
        state.masterGain.gain.value = state.volume / 100;
      }
      saveState();
    });

    render(elements);
  }

  window.SolarisMusic = {
    init: bind,
    render,
    isPlaying: () => state.isPlaying,
  };

  bind();
})();
