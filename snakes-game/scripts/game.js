// game.js
// motor principal del juego snake 1v1 con movimiento clásico de grilla
// usa canvas puro, sistema de turnos y módulos externos

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

  if (!level) {
    showError('NO SE SELECCIONÓ NIVEL. VUELVE A LA PANTALLA ANTERIOR.');
    return;
  }

  if (levelDisplay) levelDisplay.textContent = `NIVEL ${level.id} [${level.speed}MS]`;

  const centerScreen = document.querySelector('.center-screen');
  let maxWidth = window.innerWidth * 0.95;
  let maxHeight = window.innerHeight * 0.75;
  if (centerScreen) {
    const rect = centerScreen.getBoundingClientRect();
    maxWidth = rect.width * 0.98;
    maxHeight = rect.height * 0.78; // Reducido levemente para no cortar el Free Play
  }
  
  cellSize = Math.floor(Math.min(maxWidth, maxHeight) / level.grid);

  canvas.width = cellSize * level.grid;
  canvas.height = cellSize * level.grid;

  nameP1.textContent = players.player1 || 'J1';
  nameP2.textContent = players.player2 || 'J2';

  onTurnChangeCallback(handleTurnChange);
  startListening(() => ({ dir1, dir2 }));

  showOverlay('¡SNAKE 1VS1!', 'PRESIONA INICIO PARA COMENZAR', false);
  
  document.addEventListener('click', () => {
    if (!gameActive && !btnRestart.classList.contains('hidden')) {
      // Opcional: iniciar música de menú al perder
    }
  }, { once: true });
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
    snake1.some(s => s.x === pos.x && s.y === pos.y) ||
    snake2.some(s => s.x === pos.x && s.y === pos.y)
  );
  return pos;
}

function moveSnake(snake, dir) {
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
  const head = snake[0];
  const selfCrash = snake.slice(1).some(s => s.x === head.x && s.y === head.y);
  const enemyCrash = other.some(s => s.x === head.x && s.y === head.y);
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
    const nextDir = consumeDir2();
    if (nextDir) dir2 = nextDir;

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
    playWin();
    const winnerName = winnerPlayer === PLAYER_ONE ? nameP1.textContent : nameP2.textContent;
    const winnerScore = winnerPlayer === PLAYER_ONE ? scores[1] : scores[2];
    showOverlay(`🏆 ¡${winnerName} GANA!`, `PUNTAJE: ${winnerScore}`, true);
    startMenuMusic();
  }, 1000);
}

// --- Controles externos ---
function startGame() {
  resetTurn();
  resetQueues();
  scores = { 1: 0, 2: 0 };
  scoreP1.textContent = '0';
  scoreP2.textContent = '0';

  const mid = Math.floor(level.grid / 2);
  snake1 = buildSnake(Math.floor(level.grid / 4), mid, 'RIGHT');
  snake2 = buildSnake(Math.floor(level.grid * 3 / 4), mid, 'LEFT');
  dir1 = 'RIGHT';
  dir2 = 'LEFT';
  food = spawnFood(level.grid);

  hideOverlay();
  gameActive = true;
  if(canvasWrapper) canvasWrapper.classList.add('playing');

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
