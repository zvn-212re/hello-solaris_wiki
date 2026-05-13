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

const player = document.querySelector("[data-music-player]");
const toggle = document.querySelector("[data-music-toggle]");
const panel = document.querySelector("[data-music-panel]");
const playButton = document.querySelector("[data-music-play]");
const trackSelect = document.querySelector("[data-music-track]");
const volume = document.querySelector("[data-music-volume]");
const title = document.querySelector("[data-music-title]");
const led = document.querySelector("[data-music-led]");

let audioContext;
let masterGain;
let stepTimer;
let stepIndex = 0;
let isPlaying = false;

function createAudio() {
  if (audioContext) {
    return;
  }

  const AudioContext = window.AudioContext || window.webkitAudioContext;
  audioContext = new AudioContext();
  masterGain = audioContext.createGain();
  masterGain.gain.value = Number(volume.value) / 100;
  masterGain.connect(audioContext.destination);
}

function playTone(frequency, startTime, duration, type, gainValue) {
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, startTime);
  gain.gain.setValueAtTime(0.001, startTime);
  gain.gain.exponentialRampToValueAtTime(gainValue, startTime + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

  oscillator.connect(gain);
  gain.connect(masterGain);
  oscillator.start(startTime);
  oscillator.stop(startTime + duration + 0.03);
}

function playStep() {
  const track = tracks[trackSelect.value];
  const beatSeconds = 60 / track.bpm;
  const note = track.notes[stepIndex % track.notes.length];
  const bass = track.bass[stepIndex % track.bass.length];
  const now = audioContext.currentTime;

  playTone(noteMap[note], now, beatSeconds * 0.45, "square", 0.08);
  playTone(noteMap[bass], now, beatSeconds * 0.72, "triangle", 0.045);

  stepIndex += 1;
}

function startMusic() {
  createAudio();

  if (audioContext.state === "suspended") {
    audioContext.resume();
  }

  if (isPlaying) {
    return;
  }

  isPlaying = true;
  playButton.textContent = "Ⅱ";
  led.classList.add("is-playing");
  playStep();
  stepTimer = window.setInterval(playStep, (60 / tracks[trackSelect.value].bpm) * 1000);
}

function stopMusic() {
  isPlaying = false;
  playButton.textContent = "▶";
  led.classList.remove("is-playing");
  window.clearInterval(stepTimer);
}

function restartIfPlaying() {
  title.textContent = tracks[trackSelect.value].title;
  stepIndex = 0;

  if (!isPlaying) {
    return;
  }

  window.clearInterval(stepTimer);
  playStep();
  stepTimer = window.setInterval(playStep, (60 / tracks[trackSelect.value].bpm) * 1000);
}

if (player && toggle && panel && playButton && trackSelect && volume && title && led) {
  toggle.addEventListener("click", () => {
    const isOpen = panel.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(isOpen));
  });

  playButton.addEventListener("click", () => {
    if (isPlaying) {
      stopMusic();
    } else {
      startMusic();
    }
  });

  trackSelect.addEventListener("change", restartIfPlaying);

  volume.addEventListener("input", () => {
    if (masterGain) {
      masterGain.gain.value = Number(volume.value) / 100;
    }
  });
}
