// levels-page.js
// lógica para la selección de niveles arcade

import { getAllLevels, saveSelectedLevel, getSelectedLevel } from '/scripts/levels.js';
import { getPlayers } from '/scripts/users.js';
import { startMenuMusic, playUIBloop } from '/modules/soundManager.js';

const levelsContainer = document.getElementById('levels-container');
const btnGoGame = document.getElementById('btn-go-game');
const levelError = document.getElementById('level-error');

function init() {
  const players = getPlayers();
  if (!players.player1 || !players.player2) {
    window.location.href = '/';
    return;
  }

  document.addEventListener('click', () => startMenuMusic(), { once: true });
  
  renderLevels();

  btnGoGame.addEventListener('click', () => {
    playUIBloop();
    const selectedId = getSelectedLevel()?.id;
    if (!selectedId) {
      levelError.textContent = '¡ELIGE UN NIVEL PRIMERO!';
      levelError.classList.remove('hidden');
      return;
    }
    window.location.href = '/game';
  });
}

function renderLevels() {
  const levels = getAllLevels();
  const currentSelectedId = getSelectedLevel()?.id || null;
  levelsContainer.innerHTML = '';

  levels.forEach(level => {
    const colWrapper = document.createElement('div');
    colWrapper.className = 'col-12 col-md-6 col-lg-4 d-flex align-items-stretch';

    const card = document.createElement('div');
    card.className = `stage-card ${currentSelectedId === level.id ? 'selected' : ''} w-100`;
    
    // Calcular segmentos de velocidad (nivel 1 a 6)
    let speedSegments = '';
    for (let i = 1; i <= 6; i++) {
      let colorClass = 'off';
      if (i <= level.id) {
        if (i <= 2) colorClass = 'green';
        else if (i <= 4) colorClass = 'yellow';
        else colorClass = 'red';
      }
      speedSegments += `<div class="speed-segment ${colorClass}"></div>`;
    }

    card.innerHTML = `
      <span class="stage-number">NIVEL ${level.id}</span>
      <div class="stage-speed" style="color: var(--accent-neutral);">GRILLA: ${level.grid}x${level.grid}</div>
      <div class="speed-meter-container" style="margin-top: clamp(0.5rem, 2vh, 1.5rem);">
        <div class="speed-meter-label">VELOCIDAD</div>
        <div class="speed-meter">
          ${speedSegments}
        </div>
      </div>
    `;

    card.addEventListener('mouseenter', playUIBloop);
    card.addEventListener('click', () => {
      playUIBloop();
      saveSelectedLevel(level.id);
      
      // actualizar UI
      document.querySelectorAll('.stage-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      
      // mostrar botón de start
      btnGoGame.classList.remove('hidden');
      levelError.classList.add('hidden');
    });

    colWrapper.appendChild(card);
    levelsContainer.appendChild(colWrapper);
  });

  if (currentSelectedId) {
    btnGoGame.classList.remove('hidden');
  }
}

init();
