/**
 * @module players
 * @description Script de la página de jugadores.
 * Maneja el formulario de registro, validación en tiempo real y selección de jugador.
 */

import { getSavedTheme, toggleTheme } from '../context/theme.js';
import { fetchPlayers, registerPlayer } from '../modules/storage.js';

// ─── Inicializar tema ─────────────────────────────────────────────────────────
getSavedTheme();

/** Regex para validar nombre */
const NAME_REGEX = /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s_-]+$/;

/** Avatar seleccionado actualmente */
let selectedAvatar = '🎮';
/** Jugador seleccionado de la lista */
let selectedPlayer = null;

// ─── Referencias DOM ──────────────────────────────────────────────────────────
const nameInput = document.getElementById('player-name-input');
const registerBtn = document.getElementById('register-btn');
const validationMsg = document.getElementById('name-validation-msg');
const avatarPreview = document.getElementById('avatar-preview');
const emojiGrid = document.getElementById('emoji-grid');
const playerList = document.getElementById('player-list');
const selectedPlayerDisplay = document.getElementById('selected-player-display');
const selectedPlayerName = document.getElementById('selected-player-name');
const playBtn = document.getElementById('play-btn');

// ─── Validación de nombre en tiempo real ─────────────────────────────────────

/**
 * Valida el nombre del input y actualiza la UI de feedback.
 * @returns {boolean} true si el nombre es válido
 */
function validateName() {
  const val = nameInput.value.trim();
  if (val.length === 0) {
    validationMsg.textContent = '';
    validationMsg.className = 'validation-msg';
    registerBtn.disabled = true;
    return false;
  }
  if (val.length < 2) {
    validationMsg.textContent = '⚠ Mínimo 2 caracteres';
    validationMsg.className = 'validation-msg invalid';
    registerBtn.disabled = true;
    return false;
  }
  if (val.length > 20) {
    validationMsg.textContent = '⚠ Máximo 20 caracteres';
    validationMsg.className = 'validation-msg invalid';
    registerBtn.disabled = true;
    return false;
  }
  if (!NAME_REGEX.test(val)) {
    validationMsg.textContent = '⚠ Solo letras, números, _ y -';
    validationMsg.className = 'validation-msg invalid';
    registerBtn.disabled = true;
    return false;
  }
  validationMsg.textContent = '✓ Nombre válido';
  validationMsg.className = 'validation-msg valid';
  registerBtn.disabled = false;
  return true;
}

if (nameInput) {
  nameInput.addEventListener('input', validateName);
}

// ─── Selector de emojis ───────────────────────────────────────────────────────

/**
 * Actualiza la selección visual de emoji y el preview.
 * @param {string} emoji
 * @returns {void}
 */
function selectEmoji(emoji) {
  selectedAvatar = emoji;
  if (avatarPreview) avatarPreview.textContent = emoji;
  document.querySelectorAll('.emoji-option').forEach((btn) => {
    btn.classList.toggle('selected', btn.dataset.emoji === emoji);
  });
}

if (emojiGrid) {
  emojiGrid.addEventListener('click', (e) => {
    const btn = e.target.closest('.emoji-option');
    if (btn?.dataset.emoji) selectEmoji(btn.dataset.emoji);
  });
}

// ─── Registrar jugador ────────────────────────────────────────────────────────

/**
 * Envía el formulario de registro a la API.
 * @returns {Promise<void>}
 */
async function handleRegister() {
  if (!validateName()) return;
  const name = nameInput.value.trim();
  registerBtn.disabled = true;
  registerBtn.textContent = 'GUARDANDO...';
  try {
    const player = await registerPlayer({ name, avatar: selectedAvatar });
    showSuccessModal(player.name, player.avatar);
    nameInput.value = '';
    validationMsg.textContent = '';
    validationMsg.className = 'validation-msg';
    await loadPlayers();
    autoSelectPlayer(player);
  } catch (err) {
    showRegisterFeedback(`Error: ${err.message}`, 'danger');
  } finally {
    registerBtn.disabled = false;
    registerBtn.textContent = 'REGISTRAR JUGADOR';
  }
}

if (registerBtn) {
  registerBtn.addEventListener('click', handleRegister);
}
if (nameInput) {
  nameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleRegister();
  });
}

/**
 * Muestra el modal de éxito con el nombre registrado.
 * @param {string} name
 * @param {string} avatar
 * @returns {void}
 */
function showSuccessModal(name, avatar) {
  const textEl = document.getElementById('success-modal-text');
  if (textEl) textEl.textContent = `${avatar} ${name} registrado!`;
  const modal = new bootstrap.Modal(document.getElementById('success-modal'));
  modal.show();
}

/**
 * Muestra feedback de error en el formulario.
 * @param {string} msg
 * @param {'danger'|'success'} type
 * @returns {void}
 */
function showRegisterFeedback(msg, type) {
  const el = document.getElementById('register-feedback');
  if (!el) return;
  el.innerHTML = `<div class="alert alert-${type} py-2 mt-1"
    style="font-family:'Press Start 2P',monospace; font-size:0.4rem;">${msg}</div>`;
  setTimeout(() => { el.innerHTML = ''; }, 3000);
}

// ─── Lista de jugadores ───────────────────────────────────────────────────────

/**
 * Carga la lista de jugadores desde la API y la renderiza.
 * @returns {Promise<void>}
 */
async function loadPlayers() {
  if (!playerList) return;
  playerList.innerHTML = '<div class="text-center py-3" id="players-loading">' +
    '<div class="spinner-border spinner-border-sm text-warning" role="status">' +
    '<span class="visually-hidden">Cargando...</span></div></div>';
  try {
    const players = await fetchPlayers();
    renderPlayerList(players);
  } catch {
    playerList.innerHTML = '<div class="empty-state"><div class="empty-state-icon">⚠️</div>' +
      '<div class="empty-state-text">Error al cargar jugadores</div></div>';
  }
}

/**
 * Renderiza la lista de jugadores en el DOM.
 * @param {Array} players
 * @returns {void}
 */
function renderPlayerList(players) {
  if (!playerList) return;
  if (players.length === 0) {
    playerList.innerHTML = '<div class="empty-state">' +
      '<div class="empty-state-icon">👤</div>' +
      '<div class="empty-state-text">SIN JUGADORES AÚN</div></div>';
    return;
  }
  playerList.innerHTML = '';
  players.forEach((player, i) => {
    const item = document.createElement('div');
    item.className = 'player-item';
    item.style.animationDelay = `${i * 0.05}s`;
    item.dataset.player = JSON.stringify(player);
    item.innerHTML = `
      <div class="player-avatar">${player.avatar || '🎮'}</div>
      <div class="player-info">
        <div class="player-name">${escapeHtml(player.name)}</div>
        <div class="player-score-label">Score: ${player.score || 0}</div>
      </div>
      <div class="player-select-badge">✓</div>
    `;
    item.addEventListener('click', () => selectPlayerFromList(player, item));
    playerList.appendChild(item);
  });
}

/**
 * Selecciona un jugador de la lista y lo guarda en sessionStorage.
 * @param {Object} player
 * @param {HTMLElement} itemEl
 * @returns {void}
 */
function selectPlayerFromList(player, itemEl) {
  selectedPlayer = player;
  document.querySelectorAll('.player-item').forEach((el) =>
    el.classList.remove('selected-player')
  );
  itemEl.classList.add('selected-player');
  sessionStorage.setItem('active-player', JSON.stringify({ name: player.name, avatar: player.avatar }));
  if (selectedPlayerDisplay) selectedPlayerDisplay.style.display = 'block';
  if (selectedPlayerName) selectedPlayerName.textContent = `${player.avatar} ${player.name}`;
  if (playBtn) playBtn.href = '/index.html';
}

/**
 * Selecciona automáticamente un jugador recién registrado.
 * @param {Object} player
 * @returns {void}
 */
function autoSelectPlayer(player) {
  setTimeout(() => {
    const items = document.querySelectorAll('.player-item');
    for (const item of items) {
      const data = JSON.parse(item.dataset.player || '{}');
      if (data.name === player.name) {
        selectPlayerFromList(player, item);
        break;
      }
    }
  }, 100);
}

/**
 * Escapa HTML para prevenir XSS.
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ─── Refresh button ───────────────────────────────────────────────────────────
const refreshBtn = document.getElementById('refresh-btn');
if (refreshBtn) {
  refreshBtn.addEventListener('click', loadPlayers);
}

// ─── Toggle tema ──────────────────────────────────────────────────────────────
const themeToggle = document.getElementById('theme-toggle');
if (themeToggle) {
  themeToggle.addEventListener('click', toggleTheme);
}

// ─── Restaurar jugador activo del sessionStorage ──────────────────────────────

/**
 * Restaura el jugador activo guardado (si existe) al cargar la página.
 * @returns {void}
 */
function restoreActivePlayer() {
  const raw = sessionStorage.getItem('active-player');
  if (!raw) return;
  try {
    const player = JSON.parse(raw);
    if (selectedPlayerDisplay) selectedPlayerDisplay.style.display = 'block';
    if (selectedPlayerName) selectedPlayerName.textContent = `${player.avatar} ${player.name}`;
  } catch {
    /* ignorar */
  }
}

// ─── Init ─────────────────────────────────────────────────────────────────────
loadPlayers().then(restoreActivePlayer);
