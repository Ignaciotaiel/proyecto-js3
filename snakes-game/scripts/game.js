// game.js
// motor principal del juego snake con soporte para múltiples modos y controles táctiles
// usa canvas puro, sistema de turnos modular y módulos externos

import { initTheme } from '/contexto/themeManager.js';
import { getSelectedLevel } from '/scripts/levels.js';
import { getPlayers } from '/scripts/users.js';
import { getCurrentTurn, nextTurn, resetTurn, onTurnChangeCallback, PLAYER_ONE, PLAYER_TWO } from '/modules/turnSystem.js';
import { startListening, consumeDir1, consumeDir2, resetQueues } from '/scripts/events.js';
import { playEat, playDie, playTurnChange, playWin, startGameMusic, startMenuMusic, stopMusic, playUIBloop } from '/modules/soundManager.js';
import { flashCanvas, explodeAt, pulseElement, floatText } from '/modules/animationManager.js';

initTheme();

// --- elementos del DOM ---
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const statusMsg = document.getElementById('status-msg');
const scoreP1 = document.getElementById('score-p1');
const scoreP2 = document.getElementById('score-p2');
const nameP1 = document.getElementById('name-p1');
const nameP2 = document.getElementById('name-p2');
const overlay = document.getElementById('game-overlay');
const overlayTitle = document.getElementById('overlay-title');
const overlaySubtitle = document.getElementById('overlay-subtitle');
const btnStart = document.getElementById('btn-start');
const btnRestart = document.getElementById('btn-restart');
const canvasWrapper = document.getElementById('canvas-wrapper');
const levelDisplay = document.getElementById('level-display');

// --- estado del juego ---
let level = null;
let players = null;
let cellSize = 0;
let snake1 = [], snake2 = [];
let dir1 = 'RIGHT', dir2 = 'LEFT';
let food = null;
let scores = { 1: 0, 2: 0 };
let gameActive = false;
let gameLoop = null;

// --- variables de nuevos modos ---
let gameMode = 'solo';     // 'solo', 'bot', 'local', 'turn'
let currentRound = 1;      // Ronda actual para modo por turnos (1 o 2)
let round1Score = 0;       // Almacena puntaje J1 en modo turnos

// colores de cada serpiente
const COLORS = {
  snake1: { head: '#39ff14', body: '#2eb80f', gradient: ['#39ff14', '#1f8008'] },
  snake2: { head: '#ff073a', body: '#b8052a', gradient: ['#ff073a', '#80031d'] },
  food: '#f97316',
  bg: '#050508',
  grid: '#1a1a3a',
};

// --- inicialización ---
function init() {
  level = getSelectedLevel();
  players = getPlayers();
  gameMode = localStorage.getItem('snakes-mode') || 'solo';

  if (!level) {
    showError('NO SE SELECCIONÓ NIVEL. VUELVE A LA PANTALLA ANTERIOR.');
    return;
  }

  if (levelDisplay) levelDisplay.textContent = `NIVEL ${level.id} [${level.speed}MS]`;

  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || ('ontouchstart' in window);
  const centerScreen = document.querySelector('.center-screen');
  let maxWidth = window.innerWidth * 0.95;
  let maxHeight = window.innerHeight * 0.75;
  if (centerScreen) {
    const rect = centerScreen.getBoundingClientRect();
    maxWidth = rect.width * 0.98;
    maxHeight = isMobile ? rect.height * 0.42 : rect.height * 0.78; 
  }
  
  cellSize = Math.floor(Math.min(maxWidth, maxHeight) / level.grid);

  canvas.width = cellSize * level.grid;
  canvas.height = cellSize * level.grid;

  // Configurar HUD según el modo
  nameP1.textContent = players.player1 || 'J1';

  if (gameMode === 'solo') {
    nameP2.textContent = 'RÉCORD';
    scoreP2.textContent = localStorage.getItem('snakes-highscore') || '0';
  } else if (gameMode === 'bot') {
    nameP2.textContent = 'MÁQUINA';
  } else {
    nameP2.textContent = players.player2 || 'J2';
  }

  onTurnChangeCallback(handleTurnChange);
  startListening(() => ({ dir1, dir2 }));

  // Enlazar controles táctiles móviles
  initMobileControls();

  // Mostrar mensaje inicial adecuado
  if (gameMode === 'solo') {
    showOverlay('¡SNAKE SOLITARIO!', 'PRESIONA INICIO PARA COMENZAR', false);
  } else if (gameMode === 'bot') {
    showOverlay('¡VS BOT MÁQUINA!', 'PRESIONA INICIO PARA COMENZAR', false);
  } else if (gameMode === 'turn') {
    showOverlay('¡POR TURNOS (HOTSEAT)!', `RONDA 1: ${players.player1 || 'J1'} AL MANDO`, false);
  } else {
    showOverlay('¡SNAKE 1VS1!', 'PRESIONA INICIO PARA COMENZAR', false);
  }
}

// Configurar controles táctiles virtuales
function initMobileControls() {
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || ('ontouchstart' in window);
  
  if (isMobile) {
    const dpadContainer = document.getElementById('mobile-dpad-container');
    if (dpadContainer) dpadContainer.classList.remove('d-none');

    // Función sintética para despachar teclas e integrarse con events.js
    const dispatchKey = (keyName) => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: keyName }));
    };

    const pressDpad = (dir) => {
      if (gameMode === 'turn' && currentRound === 2) {
        // En ronda 2 de por turnos controlamos a J2 con las Flechas
        const map = { UP: 'ArrowUp', DOWN: 'ArrowDown', LEFT: 'ArrowLeft', RIGHT: 'ArrowRight' };
        dispatchKey(map[dir]);
      } else {
        // En solitario, bot, 1v1 local y ronda 1 controlamos a J1 con WASD
        const map = { UP: 'w', DOWN: 's', LEFT: 'a', RIGHT: 'd' };
        dispatchKey(map[dir]);
      }
    };

    // Agregar listeners tanto para toques (celular) como clicks (pruebas en desktop con responsive)
    const registerButton = (id, direction) => {
      const btn = document.getElementById(id);
      if (!btn) return;
      
      btn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        pressDpad(direction);
      });
      btn.addEventListener('mousedown', (e) => {
        pressDpad(direction);
      });
    };

    registerButton('dpad-up', 'UP');
    registerButton('dpad-down', 'DOWN');
    registerButton('dpad-left', 'LEFT');
    registerButton('dpad-right', 'RIGHT');
  }
}

function showOverlay(title, subtitle, showRestart = true) {
  overlayTitle.textContent = title;
  overlaySubtitle.textContent = subtitle;
  overlay.classList.remove('hidden');
  btnRestart.classList.toggle('hidden', !showRestart);
  btnStart.classList.toggle('hidden', showRestart);
}

function hideOverlay() {
  overlay.classList.add('hidden');
}

function showError(msg) {
  statusMsg.textContent = msg;
  statusMsg.className = 'alert-arcade';
  statusMsg.classList.remove('hidden');
}

// --- lógica de serpiente ---
function buildSnake(startX, startY, dir, length = 3) {
  const body = [];
  for (let i = 0; i < length; i++) {
    const offset = dir === 'RIGHT' ? -i : (dir === 'LEFT' ? i : 0);
    body.push({ x: startX + offset, y: startY });
  }
  return body;
}

function spawnFood(grid) {
  let pos;
  do {
    pos = {
      x: Math.floor(Math.random() * grid),
      y: Math.floor(Math.random() * grid),
    };
  } while (
    (snake1 && snake1.some(s => s.x === pos.x && s.y === pos.y)) ||
    (snake2 && snake2.some(s => s.x === pos.x && s.y === pos.y))
  );
  return pos;
}

function moveSnake(snake, dir) {
  if (!snake || snake.length === 0) return { ate: false, died: false };
  
  const head = { ...snake[0] };

  if (dir === 'UP')    head.y -= 1;
  if (dir === 'DOWN')  head.y += 1;
  if (dir === 'LEFT')  head.x -= 1;
  if (dir === 'RIGHT') head.x += 1;

  if (head.x < 0 || head.x >= level.grid || head.y < 0 || head.y >= level.grid) {
    return { ate: false, died: true };
  }

  snake.unshift(head);
  const ate = head.x === food.x && head.y === food.y;
  
  if (!ate) snake.pop();
  
  return { ate, died: false };
}

function checkCollision(snake, other) {
  if (!snake || snake.length === 0) return false;
  const head = snake[0];
  const selfCrash = snake.slice(1).some(s => s.x === head.x && s.y === head.y);
  const enemyCrash = other ? other.some(s => s.x === head.x && s.y === head.y) : false;
  return selfCrash || enemyCrash;
}

// --- Renderizado Clásico ---
function drawGrid() {
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = COLORS.grid;
  ctx.lineWidth = 0.5;
  for (let i = 0; i <= level.grid; i++) {
    ctx.beginPath();
    ctx.moveTo(i * cellSize, 0);
    ctx.lineTo(i * cellSize, canvas.height);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i * cellSize);
    ctx.lineTo(canvas.width, i * cellSize);
    ctx.stroke();
  }
}

function drawSnake(snake, colors) {
  if (!snake || snake.length === 0) return;
  snake.forEach((seg, i) => {
    const isHead = i === 0;
    const x = seg.x * cellSize;
    const y = seg.y * cellSize;
    const size = cellSize - 2;

    ctx.save();
    ctx.fillStyle = isHead ? colors.head : colors.body;
    ctx.shadowColor = isHead ? colors.head : 'transparent';
    ctx.shadowBlur = isHead ? 12 : 0;
    ctx.beginPath();
    ctx.roundRect(x + 1, y + 1, size, size, isHead ? size * 0.3 : size * 0.15);
    ctx.fill();
    ctx.restore();
  });
}

function drawFood() {
  if (!food) return;
  const x = food.x * cellSize + cellSize / 2;
  const y = food.y * cellSize + cellSize / 2;
  const r = cellSize * 0.38;

  ctx.save();
  ctx.shadowColor = COLORS.food;
  ctx.shadowBlur = 10;
  ctx.fillStyle = COLORS.food;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(249,115,22,0.4)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, r + 3, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function render() {
  drawGrid();
  drawSnake(snake2, COLORS.snake2);
  drawSnake(snake1, COLORS.snake1);
  drawFood();
}

// --- Lógica de turno ---
function handleTurnChange(newTurn, count) {
  // Sin sonido en cada avance
}

function stepGame() {
  if (!gameActive) return;

  // LÓGICA MODO 1 JUGADOR (SOLO O TURNOS HOTSEAT)
  if (gameMode === 'solo' || gameMode === 'turn') {
    const isP1Active = (gameMode === 'solo') || (gameMode === 'turn' && currentRound === 1);

    if (isP1Active) {
      const nextDir = consumeDir1();
      if (nextDir) dir1 = nextDir;

      const moveResult = moveSnake(snake1, dir1);

      if (moveResult.died || checkCollision(snake1, [])) {
        handleDeath(PLAYER_ONE);
        return;
      }

      if (moveResult.ate) {
        scores[1]++;
        scoreP1.textContent = scores[1];
        playEat();
        floatText(canvas, '+1', snake1[0].x * cellSize + cellSize / 2, snake1[0].y * cellSize, COLORS.snake1.head);
        food = spawnFood(level.grid);

        if (gameMode === 'solo') {
          const highScore = Number(localStorage.getItem('snakes-highscore') || '0');
          if (scores[1] > highScore) {
            localStorage.setItem('snakes-highscore', String(scores[1]));
            scoreP2.textContent = scores[1];
          }
        }
      }
    } else {
      // Ronda 2 del Modo por Turnos (Jugador 2 activo)
      const nextDir = consumeDir2();
      if (nextDir) dir2 = nextDir;

      const moveResult = moveSnake(snake2, dir2);

      if (moveResult.died || checkCollision(snake2, [])) {
        handleDeath(PLAYER_TWO);
        return;
      }

      if (moveResult.ate) {
        scores[2]++;
        scoreP2.textContent = scores[2];
        playEat();
        floatText(canvas, '+1', snake2[0].x * cellSize + cellSize / 2, snake2[0].y * cellSize, COLORS.snake2.head);
        food = spawnFood(level.grid);
      }
    }

    render();
    return;
  }

  // LÓGICA MODO MULTIJUGADOR EN TIEMPO REAL (1V1 LOCAL O BOT IA)
  const turn = getCurrentTurn();

  if (turn === PLAYER_ONE) {
    const nextDir = consumeDir1();
    if (nextDir) dir1 = nextDir;

    const moveResult = moveSnake(snake1, dir1);

    if (moveResult.died || checkCollision(snake1, snake2)) {
      handleDeath(PLAYER_ONE);
      return;
    }

    if (moveResult.ate) {
      scores[1]++;
      scoreP1.textContent = scores[1];
      playEat();
      floatText(canvas, '+1', snake1[0].x * cellSize + cellSize / 2, snake1[0].y * cellSize, COLORS.snake1.head);
      food = spawnFood(level.grid);
    }
  } else {
    // Turno del Jugador 2 (Humano o Bot IA)
    if (gameMode === 'bot') {
      // --- Inteligencia Artificial Básica (Dodge & Target) ---
      const head = snake2[0];
      const possibleDirs = ['UP', 'DOWN', 'LEFT', 'RIGHT'];
      const opposites = { UP: 'DOWN', DOWN: 'UP', LEFT: 'RIGHT', RIGHT: 'LEFT' };
      const validDirs = possibleDirs.filter(d => d !== opposites[dir2]);

      // Filtrar direcciones que nos causen chocar inmediatamente
      const safeDirs = validDirs.filter(d => {
        const nextPos = { ...head };
        if (d === 'UP') nextPos.y -= 1;
        if (d === 'DOWN') nextPos.y += 1;
        if (d === 'LEFT') nextPos.x -= 1;
        if (d === 'RIGHT') nextPos.x += 1;

        // Comprobación de límites de grilla
        if (nextPos.x < 0 || nextPos.x >= level.grid || nextPos.y < 0 || nextPos.y >= level.grid) {
          return false;
        }

        // Colisiones con cuerpos
        const selfCrash = snake2.some(s => s.x === nextPos.x && s.y === nextPos.y);
        const enemyCrash = snake1.some(s => s.x === nextPos.x && s.y === nextPos.y);

        return !selfCrash && !enemyCrash;
      });

      // Elegir el movimiento más seguro que nos acerque a la comida
      if (safeDirs.length > 0) {
        let bestDir = safeDirs[0];
        let minDistance = Infinity;

        safeDirs.forEach(d => {
          const nextPos = { ...head };
          if (d === 'UP') nextPos.y -= 1;
          if (d === 'DOWN') nextPos.y += 1;
          if (d === 'LEFT') nextPos.x -= 1;
          if (d === 'RIGHT') nextPos.x += 1;

          const dist = Math.abs(nextPos.x - food.x) + Math.abs(nextPos.y - food.y);
          if (dist < minDistance) {
            minDistance = dist;
            bestDir = d;
          }
        });
        dir2 = bestDir;
      } else {
        // Sin salida segura, elegir la primera válida para morir con honor
        if (validDirs.length > 0) dir2 = validDirs[0];
      }
    } else {
      // Jugador Humano J2
      const nextDir = consumeDir2();
      if (nextDir) dir2 = nextDir;
    }

    const moveResult = moveSnake(snake2, dir2);

    if (moveResult.died || checkCollision(snake2, snake1)) {
      handleDeath(PLAYER_TWO);
      return;
    }

    if (moveResult.ate) {
      scores[2]++;
      scoreP2.textContent = scores[2];
      playEat();
      floatText(canvas, '+1', snake2[0].x * cellSize + cellSize / 2, snake2[0].y * cellSize, COLORS.snake2.head);
      food = spawnFood(level.grid);
    }
  }

  render();
  nextTurn();
}

function handleDeath(loserPlayer) {
  gameActive = false;
  clearInterval(gameLoop);
  stopMusic();

  const loserSnake = loserPlayer === PLAYER_ONE ? snake1 : snake2;
  const head = loserSnake[0];
  const winnerPlayer = loserPlayer === PLAYER_ONE ? PLAYER_TWO : PLAYER_ONE;
  
  playDie();
  explodeAt(canvas, head.x * cellSize + cellSize / 2, head.y * cellSize + cellSize / 2,
    loserPlayer === PLAYER_ONE ? COLORS.snake1.head : COLORS.snake2.head);
  canvasWrapper.classList.remove('playing');
  
  setTimeout(() => {
    // --- Modo por Turnos (Hotseat) Ronda 1 ---
    if (gameMode === 'turn') {
      if (currentRound === 1) {
        round1Score = scores[1];
        currentRound = 2;
        playWin();
        
        showOverlay(
          `¡RONDA 1 COMPLETADA!`, 
          `${players.player1 || 'J1'} logró ${round1Score} PTS. ¡Turno de ${players.player2 || 'J2'}!`, 
          true
        );
        
        btnRestart.textContent = 'INICIAR J2';
        btnStart.textContent = 'INICIAR J2';
        startMenuMusic();
      } else {
        // --- Modo por Turnos (Hotseat) Ronda 2 (Cierre) ---
        playWin();
        let title = '';
        let subtitle = '';
        
        const scoreJ1 = round1Score;
        const scoreJ2 = scores[2];
        const nameJ1 = players.player1 || 'J1';
        const nameJ2 = players.player2 || 'J2';

        if (scoreJ1 > scoreJ2) {
          title = `🏆 ¡${nameJ1} GANA!`;
        } else if (scoreJ2 > scoreJ1) {
          title = `🏆 ¡${nameJ2} GANA!`;
        } else {
          title = '¡EMPATE ARCADE!';
        }
        
        subtitle = `${nameJ1}: ${scoreJ1} PTS | ${nameJ2}: ${scoreJ2} PTS`;
        showOverlay(title, subtitle, true);
        
        btnRestart.textContent = 'INSERTA FICHA';
        btnStart.textContent = 'PRESIONA INICIO';
        currentRound = 1;
        startMenuMusic();
      }
    } else if (gameMode === 'solo') {
      // --- Modo Solitario ---
      playWin();
      const highScore = localStorage.getItem('snakes-highscore') || '0';
      showOverlay('🏆 FIN DE JUEGO', `LOGRADO: ${scores[1]} PTS | RÉCORD: ${highScore} PTS`, true);
      startMenuMusic();
    } else {
      // --- Modos Clásico o Bot ---
      playWin();
      const winnerName = winnerPlayer === PLAYER_ONE ? nameP1.textContent : nameP2.textContent;
      const winnerScore = winnerPlayer === PLAYER_ONE ? scores[1] : scores[2];
      showOverlay(`🏆 ¡${winnerName} GANA!`, `PUNTAJE: ${winnerScore}`, true);
      startMenuMusic();
    }
  }, 1000);
}

// --- Controles externos ---
function startGame() {
  resetTurn();
  resetQueues();
  scores = { 1: 0, 2: 0 };
  scoreP1.textContent = '0';
  
  if (gameMode === 'solo') {
    scoreP2.textContent = localStorage.getItem('snakes-highscore') || '0';
  } else {
    scoreP2.textContent = '0';
  }

  const mid = Math.floor(level.grid / 2);
  dir1 = 'RIGHT';
  dir2 = 'LEFT';

  // Configuración del LED de dirección del D-Pad táctil
  const dpad = document.getElementById('retro-dpad');
  if (dpad) {
    dpad.className = 'retro-dpad turn-p1';
  }

  const p1HudElement = document.querySelector('.left-panel .side-hud');
  const p2HudElement = document.querySelector('.right-panel .side-hud');

  if (gameMode === 'solo') {
    snake1 = buildSnake(Math.floor(level.grid / 4), mid, 'RIGHT');
    snake2 = [];
    food = spawnFood(level.grid);
    
    if (p1HudElement) p1HudElement.classList.remove('hud-dim', 'hud-highlight');
    if (p2HudElement) p2HudElement.classList.remove('hud-dim', 'hud-highlight');
  } else if (gameMode === 'turn') {
    if (currentRound === 1) {
      snake1 = buildSnake(Math.floor(level.grid / 4), mid, 'RIGHT');
      snake2 = [];
      food = spawnFood(level.grid);

      if (p1HudElement) { p1HudElement.classList.remove('hud-dim'); p1HudElement.classList.add('hud-highlight'); }
      if (p2HudElement) { p2HudElement.classList.add('hud-dim'); p2HudElement.classList.remove('hud-highlight'); }
      if (dpad) dpad.className = 'retro-dpad turn-p1';
    } else {
      snake1 = [];
      snake2 = buildSnake(Math.floor(level.grid * 3 / 4), mid, 'LEFT');
      food = spawnFood(level.grid);

      if (p2HudElement) { p2HudElement.classList.remove('hud-dim'); p2HudElement.classList.add('hud-highlight'); }
      if (p1HudElement) { p1HudElement.classList.add('hud-dim'); p1HudElement.classList.remove('hud-highlight'); }
      if (dpad) dpad.className = 'retro-dpad turn-p2';
    }
  } else {
    // Normal 1v1 o Bot
    snake1 = buildSnake(Math.floor(level.grid / 4), mid, 'RIGHT');
    snake2 = buildSnake(Math.floor(level.grid * 3 / 4), mid, 'LEFT');
    food = spawnFood(level.grid);

    if (p1HudElement) p1HudElement.classList.remove('hud-dim', 'hud-highlight');
    if (p2HudElement) p2HudElement.classList.remove('hud-dim', 'hud-highlight');
  }

  hideOverlay();
  gameActive = true;
  if (canvasWrapper) canvasWrapper.classList.add('playing');

  startGameMusic();

  render();
  gameLoop = setInterval(stepGame, level.speed);
}

function restartGame() {
  gameActive = false;
  clearInterval(gameLoop);
  startGame();
}

// --- Eventos ---
btnStart.addEventListener('click', () => {
  playUIBloop();
  startGame();
});
btnRestart.addEventListener('click', () => {
  playUIBloop();
  restartGame();
});

// --- Arrancar ---
init();
