/**
 * @module audio
 * @description Síntesis de sonido retro usando Web Audio API. Sin archivos externos.
 */

const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx;

/**
 * Inicializa el contexto de audio. Se debe llamar tras el primer gesto del usuario.
 * @returns {void}
 */
export function initAudio() {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

/**
 * Función base para crear un oscilador y reproducir un tono.
 * @param {string} type - Tipo de onda (square, sawtooth, sine, triangle)
 * @param {number} freq - Frecuencia en Hz
 * @param {number} dur - Duración en segundos
 * @param {number} vol - Volumen base (0.0 a 1.0)
 * @param {number} freqSlide - Desplazamiento de frecuencia (opcional)
 * @returns {void}
 */
function playTone(type, freq, dur, vol = 0.1, freqSlide = 0) {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
  if (freqSlide !== 0) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(freq + freqSlide, 10), audioCtx.currentTime + dur);
  }

  gain.gain.setValueAtTime(vol, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + dur);

  osc.connect(gain);
  gain.connect(audioCtx.destination);

  osc.start();
  osc.stop(audioCtx.currentTime + dur);
}

/**
 * Sonido clásico de "waka waka" al comer un punto.
 */
export function playWaka(isHigh) {
  const freq = isHigh ? 300 : 250;
  playTone('triangle', freq, 0.1, 0.15, -50);
}

/** Sonido al comer un power pellet (sirena aguda/ruido). */
export function playPowerPellet() {
  playTone('sawtooth', 400, 0.3, 0.1, 400);
}

/** Sonido al comer un fantasma asustado. */
export function playEatGhost() {
  playTone('square', 800, 0.4, 0.2, -600);
}

/** Sonido de muerte de PacMan. */
export function playDeath() {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(300, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(30, audioCtx.currentTime + 1.5);
  gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
  gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 1.5);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + 1.5);
}

/** Melodía de inicio de juego (simplificada). */
export function playGameStart() {
  if (!audioCtx) return;
  const t = audioCtx.currentTime;
  const vol = 0.1;
  const notes = [
    { f: 493.88, d: 0.15, s: 0 },   // B4
    { f: 987.77, d: 0.15, s: 0.15 },// B5
    { f: 740.00, d: 0.15, s: 0.3 }, // F#5
    { f: 622.25, d: 0.15, s: 0.45 },// D#5
    { f: 987.77, d: 0.15, s: 0.6 }, // B5
    { f: 740.00, d: 0.15, s: 0.75 },// F#5
    { f: 622.25, d: 0.3,  s: 0.9 }, // D#5
  ];

  notes.forEach((n) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'square';
    osc.frequency.value = n.f;
    gain.gain.setValueAtTime(vol, t + n.s);
    gain.gain.exponentialRampToValueAtTime(0.01, t + n.s + n.d);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(t + n.s);
    osc.stop(t + n.s + n.d);
  });
}

/** Sonido de Game Over. */
export function playGameOver() {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(200, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 2);
  gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
  gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 2);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + 2);
}

/** Melodía retro para cuando se sube de nivel (Level Up). */
export function playLevelUp() {
  if (!audioCtx) return;
  const t = audioCtx.currentTime;
  const vol = 0.12;
  const notes = [
    { f: 523.25, d: 0.1 }, // C5
    { f: 587.33, d: 0.1 }, // D5
    { f: 659.25, d: 0.1 }, // E5
    { f: 698.46, d: 0.1 }, // F5
    { f: 783.99, d: 0.1 }, // G5
    { f: 880.00, d: 0.1 }, // A5
    { f: 987.77, d: 0.1 }, // B5
    { f: 1046.50, d: 0.3 } // C6
  ];
  notes.forEach((n, i) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'square';
    osc.frequency.value = n.f;
    const startTime = t + i * 0.1;
    gain.gain.setValueAtTime(vol, startTime);
    gain.gain.exponentialRampToValueAtTime(0.01, startTime + n.d);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(startTime);
    osc.stop(startTime + n.d);
  });
}

/** Sonido al agarrar el power-up de congelamiento. */
export function playFreeze() {
  playTone('sine', 600, 0.4, 0.15, -300);
}

/** Sonido al agarrar el power-up de puntos dobles. */
export function playDoublePoints() {
  playTone('triangle', 300, 0.5, 0.15, 600);
}

/* --- NUEVOS SONIDOS PARA MENÚS --- */

/** Sonido de "Insert Coin" (campaneo agudo tipo arcade). */
export function playInsertCoin() {
  if (!audioCtx) return;
  const t = audioCtx.currentTime;
  const vol = 0.2;
  const notes = [
    { f: 987.77, d: 0.1, s: 0 },   // B5
    { f: 1318.51, d: 0.4, s: 0.1 } // E6
  ];
  notes.forEach((n) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = n.f;
    gain.gain.setValueAtTime(vol, t + n.s);
    gain.gain.exponentialRampToValueAtTime(0.01, t + n.s + n.d);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(t + n.s);
    osc.stop(t + n.s + n.d);
  });
}

/** Sonido al mover la selección en el menú (blip corto). */
export function playMenuMove() {
  playTone('square', 440, 0.05, 0.05, 0);
}

/** Sonido al confirmar o seleccionar en el menú (bloop agudo). */
export function playMenuSelect() {
  playTone('square', 880, 0.1, 0.08, 200);
}
