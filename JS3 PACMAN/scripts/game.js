/**
 * @module game
 * @description Game loop principal del PacMan Arcade. 
 * Implementa delta time, IA de fantasmas mejorada, y estética retro.
 */

import { getSavedTheme, toggleTheme } from '../context/theme.js';
import { Board, Cell } from '../modules/board.js';
import { Blinky, Pinky, Inky, Clyde, GhostState } from '../modules/ghost.js';
import { GameSession, GameMode } from '../modules/gameMode.js';
import { saveScore } from '../modules/storage.js';
import { initAudio, playWaka, playPowerPellet, playEatGhost, playDeath, playGameStart, playGameOver, playLevelUp, playFreeze, playDoublePoints } from '../modules/audio.js';

// ─── Configuración inicial ───────────────────────────────────────────────────
getSavedTheme();

const themeToggle = document.getElementById('theme-toggle');
if (themeToggle) themeToggle.addEventListener('click', toggleTheme);

function readSession(key) {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

const player1 = readSession('active-player');
const player2 = readSession('player2');
const mode = sessionStorage.getItem('game-mode') || GameMode.SOLO;

// Si no hay jugador, redirigir
if (!player1) {
  window.location.href = '/players.html';
}

// Aplicar skin
const selectedSkin = localStorage.getItem('pacman-selected-skin') || '#FFD700';
player1.color = selectedSkin;

// ─── Canvas setup ─────────────────────────────────────────────────────────────
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
let cellSize = 20;

function resizeCanvas() {
  const section = document.getElementById('canvas-section');
  if (!section) return;
  const maxW = section.clientWidth - 40; // Margen para el gabinete
  let maxH = section.clientHeight - 40;

  // En móviles, permitimos que el alto fluya según el ancho
  if (window.innerWidth <= 768) {
    maxH = 9999;
  }

  const COLS = 28;
  const ROWS = 31;
  cellSize = Math.floor(Math.min(maxW / COLS, maxH / ROWS));
  canvas.width = cellSize * COLS;
  canvas.height = cellSize * ROWS;
}

window.addEventListener('resize', () => {
  resizeCanvas();
  draw();
});
resizeCanvas();

// ─── Estado del juego ─────────────────────────────────────────────────────────
let board = new Board();
let ghosts = [new Blinky(), new Pinky(), new Inky(), new Clyde()];
let session = new GameSession(mode, [player1, player2].filter(Boolean));

let level = parseInt(sessionStorage.getItem('pacman-start-level'), 10) || 1;
// Inicializar el tablero en el nivel seleccionado
board.reset(level);

let tick = 0;
let paused = false;
let gameOver = false;
let gameStarted = false;
let startTicksLeft = 0;
let ghostCombo = 0;
let wakaToggle = true;
let freezeTimer = 0;
let doublePointsTimer = 0;
let rafId = null;
let lastTime = 0;
let floatingScores = [];

let personalHighScore = parseInt(localStorage.getItem('pacman-highscore') || '0', 10);

// ─── Lógica de Juego ─────────────────────────────────────────────────────────

function getLevelSpeedMultiplier(lvl) {
  const speeds = [1.0, 1.1, 1.2, 1.35, 1.5, 1.7];
  return speeds[lvl - 1] || 1.7;
}

function getFrightenedDuration(lvl) {
  const durations = [8.0, 7.0, 6.0, 5.0, 4.0, 3.0];
  return durations[lvl - 1] || 3.0;
}

function startGameSequence() {
  if (gameStarted) return;
  initAudio();
  playGameStart();
  gameStarted = true;
  startTicksLeft = 2.0; // 2 segundos de READY!
}

function update(dt) {
  if (!gameStarted) return;
  
  if (startTicksLeft > 0) {
    startTicksLeft -= dt;
    return;
  }

  tick++;

  // Si alguien se está muriendo, solo actualizar la animación de muerte
  const someoneDying = session.pacmans.some(pm => pm.isDying);
  if (someoneDying) {
    session.pacmans.forEach(pm => {
      if (pm.isDying) {
        pm.update(board, dt, getLevelSpeedMultiplier(level));
        if (pm.deathAngle >= 360) handleDeath(pm);
      }
    });
    return;
  }

  // Power-ups
  if (freezeTimer > 0) {
    freezeTimer -= dt;
    if (freezeTimer <= 0) ghosts.forEach(g => g.isFrozen = false);
  }
  if (doublePointsTimer > 0) doublePointsTimer -= dt;

  const speedMult = getLevelSpeedMultiplier(level);

  // IA Bot
  session.tickBot(board, ghosts);

  // Fantasmas
  const blinky = ghosts.find(g => g instanceof Blinky) || ghosts[0];
  ghosts.forEach(ghost => {
    if (level === 1 && (ghost.name === 'INKY' || ghost.name === 'CLYDE')) return;
    ghost.update(board, session.pacmans[0], blinky, dt, speedMult);
  });

  // Floating scores
  for (let i = floatingScores.length - 1; i >= 0; i--) {
    floatingScores[i].timer -= dt;
    floatingScores[i].y -= 30 * dt;
    if (floatingScores[i].timer <= 0) floatingScores.splice(i, 1);
  }

  // PacMans
  session.pacmans.forEach(pm => {
    const result = pm.update(board, dt, speedMult);
    if (result.ate) {
      if (result.ate === 'dot') {
        playWaka(wakaToggle);
        wakaToggle = !wakaToggle;
        if (doublePointsTimer > 0) pm.score += 10;
      } else if (result.ate === 'power') {
        playPowerPellet();
        ghostCombo = 0;
        ghosts.forEach(g => g.frighten(getFrightenedDuration(level)));
        if (doublePointsTimer > 0) pm.score += 50;
      } else if (result.ate === 'freeze') {
        playFreeze();
        freezeTimer = 5.0;
        ghosts.forEach(g => g.isFrozen = true);
        if (doublePointsTimer > 0) pm.score += 100;
      } else if (result.ate === 'double') {
        playDoublePoints();
        doublePointsTimer = 6.0;
        if (doublePointsTimer > 0) pm.score += 100;
      }
      
      if (board.getDotCount() === 0) handleLevelUp();
      updateScoreUI();
    }

    // Colisiones
    ghosts.forEach(ghost => {
      if (pm.collidesWith(ghost)) {
        if (ghost.state === GhostState.FRIGHTENED) {
          eatGhost(pm, ghost);
        } else if (ghost.state === GhostState.CHASE || ghost.state === GhostState.SCATTER) {
          if (!pm.isDying) {
            pm.isDying = true;
            playDeath();
          }
        }
      }
    });
  });

  // Modos por turnos
  if (mode === GameMode.TURNS) {
    const turnResult = session.updateTurns();
    const timerEl = document.getElementById('turn-timer');
    if (timerEl) {
      const secs = session.getTurnSecondsLeft();
      timerEl.textContent = secs;
      timerEl.classList.toggle('warning', secs <= 5);
    }
    if (turnResult.switched) showTurnSwitch(turnResult.playerIndex);
  }
}

function eatGhost(pm, ghost) {
  ghostCombo++;
  let points = 200 * Math.pow(2, ghostCombo - 1);
  if (doublePointsTimer > 0) points *= 2;
  pm.score += points;

  floatingScores.push({
    x: ghost.col * cellSize + cellSize / 2,
    y: ghost.row * cellSize,
    text: `+${points}`,
    timer: 1.5
  });

  playEatGhost();
  ghost.eat();
  updateScoreUI();
}

function handleDeath(pm) {
  pm.lives--;
  if (pm.lives <= 0) {
    if (session.pacmans.every(p => p.lives <= 0) || mode !== GameMode.TWO_PLAYERS) {
      triggerGameOver();
      return;
    }
  }
  
  if (mode === GameMode.TURNS) {
    const nextIdx = session.switchTurn();
    showTurnSwitch(nextIdx);
  }

  pm.reset();
  ghosts.forEach(g => g.reset());
  ghostCombo = 0;
  startTicksLeft = 1.5;
  updateScoreUI();
}

function handleLevelUp() {
  const currentUnlocked = parseInt(localStorage.getItem('pacman-unlocked-levels') || '1', 10);
  if (level + 1 > currentUnlocked && level + 1 <= 6) {
    localStorage.setItem('pacman-unlocked-levels', (level + 1).toString());
  }

  level++;
  if (level > 6) {
    triggerGameOver(true);
    return;
  }
  
  paused = true;
  playLevelUp();
  
  const levelText = document.getElementById('levelup-text');
  if (levelText) levelText.textContent = `¡NIVEL ${level - 1} COMPLETADO!`;
  
  const modal = new bootstrap.Modal(document.getElementById('levelup-modal'));
  modal.show();
  
  setTimeout(() => {
    modal.hide();
    board.reset(level);
    session.resetPositions();
    ghosts.forEach(g => g.reset());
    ghostCombo = 0;
    startTicksLeft = 2.0;
    paused = false;
    updateScoreUI();
  }, 2500);
}

function triggerGameOver(win = false) {
  gameOver = true;
  paused = true;
  playGameOver();
  const result = session.getResult();
  if (win) result.winner = "¡CAMPEÓN ARCADE! 🏆";
  showGameOverModal(result);
  persistScores();
}

// ─── Renderizado ─────────────────────────────────────────────────────────────

function draw() {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  board.draw(ctx, cellSize, tick);
  ghosts.forEach(g => {
    if (level === 1 && (g.name === 'INKY' || g.name === 'CLYDE')) return;
    g.draw(ctx, cellSize, tick);
  });
  session.pacmans.forEach(pm => pm.draw(ctx, cellSize));

  // Floating Scores
  ctx.save();
  ctx.font = `bold ${cellSize * 0.6}px "Press Start 2P"`;
  ctx.textAlign = 'center';
  floatingScores.forEach(fs => {
    ctx.fillStyle = `rgba(255, 255, 255, ${fs.timer})`;
    ctx.fillText(fs.text, fs.x, fs.y);
  });
  ctx.restore();

  // Overlays
  if (!gameStarted) {
    drawOverlay('PRESS ANY KEY', 'READY!', 'var(--pac-neon-cyan)', 'var(--pac-yellow)');
  } else if (startTicksLeft > 0) {
    drawOverlay('', 'READY!', '', 'var(--pac-yellow)');
  } else if (paused) {
    drawOverlay('', 'PAUSED', '', 'var(--pac-neon-pink)');
  }
}

function drawOverlay(sub, main, subCol, mainCol) {
  ctx.save();
  if (sub) {
    ctx.fillStyle = subCol;
    ctx.font = `${cellSize * 0.7}px "Press Start 2P"`;
    ctx.textAlign = 'center';
    ctx.fillText(sub, canvas.width / 2, canvas.height / 2);
  }
  if (main) {
    ctx.fillStyle = mainCol;
    ctx.font = `bold ${cellSize * 1.5}px "Press Start 2P"`;
    ctx.textAlign = 'center';
    ctx.shadowColor = mainCol;
    ctx.shadowBlur = 15;
    ctx.fillText(main, canvas.width / 2, canvas.height / 2 + cellSize * 2);
  }
  ctx.restore();
}

// ─── Loop & UI ────────────────────────────────────────────────────────────────

function loop(time) {
  if (!lastTime) lastTime = time;
  const dt = (time - lastTime) / 1000;
  lastTime = time;

  if (!paused && !gameOver) update(Math.min(dt, 0.1));
  draw();
  rafId = requestAnimationFrame(loop);
}

function initUI() {
  const modeBadge = document.getElementById('mode-badge');
  const labels = session.getPlayerLabels();
  
  if (modeBadge) {
    const labelsMap = { [GameMode.SOLO]: 'SOLO', [GameMode.TWO_PLAYERS]: '2 PLAYERS', [GameMode.VS_BOT]: 'VS BOT', [GameMode.TURNS]: 'TURNS' };
    modeBadge.textContent = labelsMap[mode] || mode.toUpperCase();
  }

  document.getElementById('p1-name').textContent = `${player1.avatar} ${labels[0]}`;
  if (player2 || mode === GameMode.VS_BOT) {
    document.getElementById('player2-section').classList.remove('d-none');
    document.getElementById('p2-name').textContent = mode === GameMode.VS_BOT ? `🤖 BOT` : `${player2.avatar} ${labels[1]}`;
  }
  
  if (mode === GameMode.TURNS) document.getElementById('turn-section').classList.remove('d-none');
  
  updateScoreUI();
}

function updateScoreUI() {
  const p1 = session.pacmans[0];
  const p2 = session.pacmans[1];
  
  document.getElementById('p1-score').textContent = p1.score.toLocaleString();
  if (p2) document.getElementById('p2-score').textContent = p2.score.toLocaleString();
  document.getElementById('level-display').textContent = level;

  const currentMax = Math.max(p1.score, p2 ? p2.score : 0);
  if (currentMax > personalHighScore) {
    personalHighScore = currentMax;
    localStorage.setItem('pacman-highscore', personalHighScore.toString());
  }
  document.getElementById('high-score-val').textContent = personalHighScore.toLocaleString();

  updateLivesDisplay('p1-lives', p1.lives);
  if (p2) updateLivesDisplay('p2-lives', p2.lives);
}

function updateLivesDisplay(id, lives) {
  const container = document.getElementById(id);
  if (!container) return;
  container.innerHTML = '';
  for (let i = 0; i < 3; i++) {
    const span = document.createElement('span');
    span.className = 'life-icon' + (i >= lives ? ' lost' : '');
    span.textContent = '😮';
    span.style.color = i < lives ? selectedSkin : 'rgba(255,255,255,0.1)';
    container.appendChild(span);
  }
}

function togglePause() {
  if (gameOver) return;
  paused = !paused;
  const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById('pause-modal'));
  paused ? modal.show() : modal.hide();
}

function showTurnSwitch(idx) {
  paused = true;
  const labels = session.getPlayerLabels();
  document.getElementById('turn-switch-name').textContent = labels[idx];
  const modal = new bootstrap.Modal(document.getElementById('turn-switch-modal'));
  modal.show();
  document.getElementById('turn-switch-ok').onclick = () => {
    modal.hide();
    paused = false;
  };
}

function showGameOverModal(result) {
  document.getElementById('gameover-winner').textContent = result.winner;
  const body = document.getElementById('gameover-scores-body');
  body.innerHTML = result.scores.map(s => `
    <tr>
      <td>${s.name}</td>
      <td class="text-neon-yellow">${s.score.toLocaleString()}</td>
    </tr>
  `).join('');
  new bootstrap.Modal(document.getElementById('gameover-modal')).show();
}

async function persistScores() {
  for (let i = 0; i < session.pacmans.length; i++) {
    if (mode === GameMode.VS_BOT && i === 1) continue;
    const p = i === 0 ? player1 : player2;
    await saveScore({ name: p.name, avatar: p.avatar, score: session.pacmans[i].score, mode }).catch(() => {});
  }
}

// ─── Eventos ──────────────────────────────────────────────────────────────────

window.addEventListener('keydown', (e) => {
  if (!gameStarted) {
    startGameSequence();
    return;
  }
  if (e.key === 'Escape') {
    togglePause();
    return;
  }
  if (!paused && !gameOver) session.handleInput(e.key);
});

document.getElementById('pause-btn').onclick = togglePause;
document.getElementById('resume-btn').onclick = togglePause;
document.getElementById('restart-btn').onclick = () => window.location.reload();

// D-pad
['up', 'down', 'left', 'right'].forEach(dir => {
  const btn = document.getElementById(`dpad-${dir}`);
  if (btn) {
    btn.onclick = () => {
      if (!gameStarted) startGameSequence();
      else if (!paused && !gameOver) session.handleInput({ up:'w', down:'s', left:'a', right:'d' }[dir]);
    };
  }
});

// ─── Inicio ──────────────────────────────────────────────────────────────────
initUI();
rafId = requestAnimationFrame(loop);
