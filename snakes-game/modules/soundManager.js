// soundManager.js
// módulo para generar sonidos del juego usando Web Audio API
// sonidos avanzados: crunch, bloop, y música de fondo

const ctx = new (window.AudioContext || window.webkitAudioContext)();

function resume() {
  if (ctx.state === 'suspended') ctx.resume();
}

// --- Música de fondo procedural ---
let menuOsc = null;
let gameOsc = null;
let menuGain = null;
let gameGain = null;
let activeMusic = null;
let musicInterval = null;

function startMenuMusic() {
  resume();
  if (activeMusic === 'MENU') return;
  stopMusic();
  activeMusic = 'MENU';

  menuOsc = ctx.createOscillator();
  menuGain = ctx.createGain();
  menuOsc.connect(menuGain);
  menuGain.connect(ctx.destination);

  menuOsc.type = 'triangle';
  menuOsc.frequency.setValueAtTime(110, ctx.currentTime); // A2
  
  menuGain.gain.setValueAtTime(0, ctx.currentTime);
  menuGain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 2);
  
  menuOsc.start();

  musicInterval = setInterval(() => {
    if (!menuOsc) return;
    const now = ctx.currentTime;
    menuOsc.frequency.linearRampToValueAtTime(120, now + 2);
    menuOsc.frequency.linearRampToValueAtTime(110, now + 4);
  }, 4000);
}

function startGameMusic() {
  resume();
  if (activeMusic === 'GAME') return;
  stopMusic();
  activeMusic = 'GAME';

  gameOsc = ctx.createOscillator();
  gameGain = ctx.createGain();
  gameOsc.connect(gameGain);
  gameGain.connect(ctx.destination);

  gameOsc.type = 'sawtooth'; // Onda de sierra para más agresividad/energía
  gameOsc.frequency.setValueAtTime(110, ctx.currentTime);
  
  gameGain.gain.setValueAtTime(0, ctx.currentTime);
  gameGain.gain.linearRampToValueAtTime(0.04, ctx.currentTime + 0.1);
  
  gameOsc.start();

  let step = 0;
  // Secuencia de bajo retro rápida (A2, A2, A3, A2, E3, A2, G3, E3)
  const seq = [110, 110, 220, 110, 164.81, 110, 196.00, 164.81]; 
  musicInterval = setInterval(() => {
    if (!gameOsc) return;
    step = (step + 1) % seq.length;
    gameOsc.frequency.setValueAtTime(seq[step], ctx.currentTime);
    
    // Efecto de pulso (pluck) en cada nota para darle ritmo "bouncy"
    gameGain.gain.setValueAtTime(0.06, ctx.currentTime);
    gameGain.gain.exponentialRampToValueAtTime(0.02, ctx.currentTime + 0.1);
  }, 125); // Velocidad al doble (125ms = semicorcheas rápidas)
}

function stopMusic() {
  if (musicInterval) {
    clearInterval(musicInterval);
    musicInterval = null;
  }
  const now = ctx.currentTime;
  if (menuOsc && menuGain) {
    menuGain.gain.linearRampToValueAtTime(0.001, now + 0.5);
    setTimeout(() => { if(menuOsc) { menuOsc.stop(); menuOsc = null; } }, 500);
  }
  if (gameOsc && gameGain) {
    gameGain.gain.linearRampToValueAtTime(0.001, now + 0.5);
    setTimeout(() => { if(gameOsc) { gameOsc.stop(); gameOsc = null; } }, 500);
  }
  activeMusic = null;
}

// --- Efectos de Sonido Avanzados ---

// Bloop para UI (botones, inputs, seleccionar nivel)
function playUIBloop() {
  resume();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  
  osc.type = 'sine';
  osc.frequency.setValueAtTime(800, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.05);
  
  gain.gain.setValueAtTime(0, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
  
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.1);
}

// Generador de Ruido Blanco para el Crunch y Explosiones
function createNoiseBuffer(duration) {
  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

// Crunch satisfactorio al comer
function playEat() {
  resume();
  const now = ctx.currentTime;
  
  // Tono de percusión (bop)
  const osc = ctx.createOscillator();
  const gainOsc = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(300, now);
  osc.frequency.exponentialRampToValueAtTime(100, now + 0.1);
  osc.connect(gainOsc);
  gainOsc.connect(ctx.destination);
  gainOsc.gain.setValueAtTime(0, now);
  gainOsc.gain.linearRampToValueAtTime(0.4, now + 0.01);
  gainOsc.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
  osc.start(now);
  osc.stop(now + 0.1);

  // Crunch (ruido filtrado)
  const noiseSource = ctx.createBufferSource();
  noiseSource.buffer = createNoiseBuffer(0.15);
  const noiseFilter = ctx.createBiquadFilter();
  noiseFilter.type = 'highpass';
  noiseFilter.frequency.value = 1000;
  const noiseGain = ctx.createGain();
  
  noiseSource.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(ctx.destination);
  
  noiseGain.gain.setValueAtTime(0.6, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
  
  noiseSource.start(now);
}

// Bajada dramática al morir
function playDie() {
  resume();
  const now = ctx.currentTime;
  
  // Oscilador cayendo (Zaaaaap)
  const osc = ctx.createOscillator();
  const gainOsc = ctx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(250, now);
  osc.frequency.exponentialRampToValueAtTime(20, now + 0.6);
  
  osc.connect(gainOsc);
  gainOsc.connect(ctx.destination);
  
  gainOsc.gain.setValueAtTime(0, now);
  gainOsc.gain.linearRampToValueAtTime(0.7, now + 0.05);
  gainOsc.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
  
  osc.start(now);
  osc.stop(now + 0.6);

  // Explosión ruidosa
  const noiseSource = ctx.createBufferSource();
  noiseSource.buffer = createNoiseBuffer(0.6);
  const noiseFilter = ctx.createBiquadFilter();
  noiseFilter.type = 'lowpass';
  noiseFilter.frequency.setValueAtTime(2000, now);
  noiseFilter.frequency.linearRampToValueAtTime(100, now + 0.6);
  
  const noiseGain = ctx.createGain();
  noiseSource.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(ctx.destination);
  
  noiseGain.gain.setValueAtTime(0.8, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
  
  noiseSource.start(now);
}

// Tick percusivo de cambio de turno
function playTurnChange() {
  resume();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  
  osc.type = 'square';
  osc.frequency.setValueAtTime(150, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.05);
  
  gain.gain.setValueAtTime(0, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
  
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.05);
}

// Fanfarria de victoria
function playWin() {
  resume();
  const notes = [440, 554.37, 659.25, 880]; 
  const duration = 0.15;
  const now = ctx.currentTime;
  
  notes.forEach((freq, i) => {
    const time = now + (i * duration);
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, time);
    
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(0.3, time + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
    
    osc.start(time);
    osc.stop(time + duration);
  });
  
  const finalTime = now + (notes.length * duration);
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  
  osc.type = 'sine';
  osc.frequency.setValueAtTime(880, finalTime);
  
  gain.gain.setValueAtTime(0, finalTime);
  gain.gain.linearRampToValueAtTime(0.4, finalTime + 0.1);
  gain.gain.exponentialRampToValueAtTime(0.001, finalTime + 1.2);
  
  osc.start(finalTime);
  osc.stop(finalTime + 1.2);
}

function playLevelUp() {
  resume();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  
  osc.type = 'square';
  osc.frequency.setValueAtTime(440, ctx.currentTime);
  osc.frequency.linearRampToValueAtTime(880, ctx.currentTime + 0.2);
  
  gain.gain.setValueAtTime(0, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.1);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
  
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.3);
}

function playCoinSound() {
  resume();
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.type = 'sine';
  // Frecuencia dual clásica (salto B5 -> E6)
  osc.frequency.setValueAtTime(987.77, now);
  osc.frequency.setValueAtTime(1318.51, now + 0.1);

  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.5, now + 0.05);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

  osc.start(now);
  osc.stop(now + 0.5);
}

export { playEat, playDie, playTurnChange, playWin, playLevelUp, startMenuMusic, startGameMusic, stopMusic, playUIBloop, playCoinSound };
