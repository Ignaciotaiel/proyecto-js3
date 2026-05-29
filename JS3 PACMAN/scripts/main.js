/**
 * @module main
 * @description Script del landing (Flujo Arcade Puro)
 */

import { fetchPlayers } from '../modules/storage.js';
import { initAudio, playInsertCoin, playMenuMove, playMenuSelect } from '../modules/audio.js';

const EMOJIS = ['👾','🐱','🦊','🐸','🤖','👻','💀','🔥'];

function getActivePlayer() {
  const raw = sessionStorage.getItem('active-player');
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function startGame(mode, level, skin) {
  sessionStorage.setItem('game-mode', mode);
  sessionStorage.setItem('pacman-start-level', level);
  localStorage.setItem('pacman-selected-skin', skin);
  
  if (mode === 'two_players' || mode === 'turns') {
    const p2Item = document.querySelectorAll('#menu-avatar-p2 li')[selectedAvatarP2Idx];
    if (p2Item) {
      const name = p2Item.dataset.name;
      const avatar = p2Item.dataset.avatar;
      sessionStorage.setItem('player2', JSON.stringify({ name, avatar }));
    }
  } else {
    sessionStorage.removeItem('player2');
  }

  window.location.href = '/game.html';
}

const SKINS = [
  { color: '#FFD700', name: 'AMARILLO' },
  { color: '#FF3333', name: 'ROJO' },
  { color: '#3333FF', name: 'AZUL' },
  { color: '#33FF33', name: 'VERDE' }
];

let currentScreen = 0; // 0: Title, 1: Mode, 2: Skin P1, 3: Avatar P2, 4: Skin P2, 5: Level
const screens = ['screen-title', 'screen-mode', 'screen-skin', 'screen-avatar-p2', 'screen-skin-p2', 'screen-level'];

// Selections
let selectedModeIdx = 0;
let selectedSkinIdx = 0;
let selectedAvatarP2Idx = 0;
let selectedSkinP2Idx = 2; // Default azul para P2
let selectedLevelIdx = 0;

function updateScreen() {
  screens.forEach((id, idx) => {
    const el = document.getElementById(id);
    if (idx === currentScreen) {
      el.classList.remove('d-none');
    } else {
      el.classList.add('d-none');
    }
  });
}

function getUnlockedLevels() {
  return parseInt(localStorage.getItem('pacman-unlocked-levels') || '1', 10);
}

function updateMenu(menuId, selectedIdx) {
  const menu = document.getElementById(menuId);
  if (!menu) return;
  const items = menu.querySelectorAll('li');
  const unlocked = getUnlockedLevels();
  items.forEach((item, idx) => {
    // Para el menú de niveles, aplicar estilos de bloqueo
    if (menuId === 'menu-level') {
      const level = parseInt(item.dataset.level || '1', 10);
      if (level > unlocked) {
        item.classList.add('locked');
        item.style.opacity = '0.3';
        if (!item.innerHTML.includes('🔒')) item.innerHTML = `🔒 ${item.innerHTML}`;
      } else if (level < unlocked) {
        if (!item.innerHTML.includes('✓')) item.innerHTML = `✓ ${item.innerHTML}`;
      }
    }

    if (idx === selectedIdx) {
      item.classList.add('selected');
    } else {
      item.classList.remove('selected');
    }
  });
}

function updateSkinDisplay() {
  const preview = document.getElementById('active-skin-preview');
  const name = document.getElementById('active-skin-name');
  if (preview && name) {
    preview.style.background = SKINS[selectedSkinIdx].color;
    name.textContent = SKINS[selectedSkinIdx].name;
  }

  const previewP2 = document.getElementById('active-skin-p2-preview');
  const nameP2 = document.getElementById('active-skin-p2-name');
  if (previewP2 && nameP2) {
    previewP2.style.background = SKINS[selectedSkinP2Idx].color;
    nameP2.textContent = SKINS[selectedSkinP2Idx].name;
  }
}

document.addEventListener('keydown', (e) => {
  initAudio();
  const p1 = getActivePlayer();

  if (currentScreen === 0) {
    if (!p1) {
      playInsertCoin();
      setTimeout(() => { window.location.href = '/players.html'; }, 200);
      return;
    }
    playInsertCoin();
    currentScreen = 1;
    updateScreen();
    updateMenu('menu-mode', selectedModeIdx);
    return;
  }

  if (!p1 && currentScreen > 0) {
    window.location.href = '/players.html';
    return;
  }

  if (currentScreen === 1) {
    const items = document.querySelectorAll('#menu-mode li');
    if (e.key === 'w' || e.key === 'ArrowUp') {
      selectedModeIdx = (selectedModeIdx - 1 + items.length) % items.length;
      updateMenu('menu-mode', selectedModeIdx);
      playMenuMove();
    } else if (e.key === 's' || e.key === 'ArrowDown') {
      selectedModeIdx = (selectedModeIdx + 1) % items.length;
      updateMenu('menu-mode', selectedModeIdx);
      playMenuMove();
    } else if (e.key === 'Enter' || e.key === ' ') {
      playMenuSelect();
      currentScreen = 2;
      updateScreen();
      updateSkinDisplay();
    }
    return;
  }

  if (currentScreen === 2) {
    if (e.key === 'a' || e.key === 'ArrowLeft') {
      selectedSkinIdx = (selectedSkinIdx - 1 + SKINS.length) % SKINS.length;
      updateSkinDisplay();
      playMenuMove();
    } else if (e.key === 'd' || e.key === 'ArrowRight') {
      selectedSkinIdx = (selectedSkinIdx + 1) % SKINS.length;
      updateSkinDisplay();
      playMenuMove();
    } else if (e.key === 'Enter' || e.key === ' ') {
      playMenuSelect();
      const mode = document.querySelectorAll('#menu-mode li')[selectedModeIdx].dataset.mode;
      if (mode === 'two_players' || mode === 'turns') {
        currentScreen = 3; // Avatar P2
        updateScreen();
        updateMenu('menu-avatar-p2', selectedAvatarP2Idx);
      } else {
        currentScreen = 5; // Level
        updateScreen();
        updateMenu('menu-level', selectedLevelIdx);
      }
    }
    return;
  }

  if (currentScreen === 3) {
    const items = document.querySelectorAll('#menu-avatar-p2 li');
    if (items.length > 0) {
      if (e.key === 'w' || e.key === 'ArrowUp') {
        selectedAvatarP2Idx = (selectedAvatarP2Idx - 1 + items.length) % items.length;
        updateMenu('menu-avatar-p2', selectedAvatarP2Idx);
        playMenuMove();
      } else if (e.key === 's' || e.key === 'ArrowDown') {
        selectedAvatarP2Idx = (selectedAvatarP2Idx + 1) % items.length;
        updateMenu('menu-avatar-p2', selectedAvatarP2Idx);
        playMenuMove();
      } else if (e.key === 'Enter' || e.key === ' ') {
        playMenuSelect();
        currentScreen = 4; // Skin P2
        updateScreen();
        updateSkinDisplay();
      }
    }
    return;
  }

  if (currentScreen === 4) {
    if (e.key === 'a' || e.key === 'ArrowLeft') {
      selectedSkinP2Idx = (selectedSkinP2Idx - 1 + SKINS.length) % SKINS.length;
      updateSkinDisplay();
      playMenuMove();
    } else if (e.key === 'd' || e.key === 'ArrowRight') {
      selectedSkinP2Idx = (selectedSkinP2Idx + 1) % SKINS.length;
      updateSkinDisplay();
      playMenuMove();
    } else if (e.key === 'Enter' || e.key === ' ') {
      playMenuSelect();
      currentScreen = 5; // Level
      updateScreen();
      updateMenu('menu-level', selectedLevelIdx);
    }
    return;
  }

  if (currentScreen === 5) {
    const items = document.querySelectorAll('#menu-level li');
    const unlocked = getUnlockedLevels();

    if (e.key === 'w' || e.key === 'ArrowUp') {
      do {
        selectedLevelIdx = (selectedLevelIdx - 1 + items.length) % items.length;
      } while (parseInt(items[selectedLevelIdx].dataset.level, 10) > unlocked);
      updateMenu('menu-level', selectedLevelIdx);
      playMenuMove();
    } else if (e.key === 's' || e.key === 'ArrowDown') {
      do {
        selectedLevelIdx = (selectedLevelIdx + 1) % items.length;
      } while (parseInt(items[selectedLevelIdx].dataset.level, 10) > unlocked);
      updateMenu('menu-level', selectedLevelIdx);
      playMenuMove();
    } else if (e.key === 'Enter' || e.key === ' ') {
      playMenuSelect();
      const mode = document.querySelectorAll('#menu-mode li')[selectedModeIdx].dataset.mode;
      const level = document.querySelectorAll('#menu-level li')[selectedLevelIdx].dataset.level;
      if (parseInt(level, 10) <= unlocked) {
        const skin = SKINS[selectedSkinIdx].color;
        const skinP2 = SKINS[selectedSkinP2Idx].color;
        localStorage.setItem('pacman-selected-skin-p2', skinP2);
        startGame(mode, level, skin);
      }
    }
    return;
  }
});

document.addEventListener('DOMContentLoaded', async () => {
  // Si venimos de players.html habiendo seleccionado un jugador, saltear la pantalla de título
  if (sessionStorage.getItem('skip-title') === 'true' && getActivePlayer()) {
    sessionStorage.removeItem('skip-title');
    currentScreen = 1;
    updateScreen();
    updateMenu('menu-mode', selectedModeIdx);
  } else if (getActivePlayer()) {
    // Si ya hay jugador, en vez de INSERT COIN mostramos PRESS START
    const prompt = document.querySelector('.insert-coin-prompt');
    if (prompt) {
      prompt.innerHTML = `PRESS START<br><br><span style="font-size:0.5em; opacity:0.8;">(PRESS ANY KEY)</span>`;
    }
  }

  // Cargar jugadores para P2
  try {
    const players = await fetchPlayers();
    const menuP2 = document.getElementById('menu-avatar-p2');
    if (menuP2 && players.length > 0) {
      menuP2.innerHTML = ''; // Limpiar fallback
      players.forEach((p, idx) => {
        const li = document.createElement('li');
        li.dataset.name = p.name;
        li.dataset.avatar = p.avatar;
        li.textContent = `${p.avatar} ${p.name}`;
        if (idx === 0) li.classList.add('selected');
        li.addEventListener('click', (e) => {
          e.stopPropagation();
          selectedAvatarP2Idx = idx;
          updateMenu('menu-avatar-p2', selectedAvatarP2Idx);
          currentScreen = 4; // Ir a elegir skin p2
          updateScreen();
          updateSkinDisplay();
        });
        menuP2.appendChild(li);
      });
    }
  } catch (err) {
    console.warn("No se pudieron cargar los jugadores:", err);
  }

  const savedSkin = localStorage.getItem('pacman-selected-skin');
  if (savedSkin) {
    const idx = SKINS.findIndex(s => s.color === savedSkin);
    if (idx !== -1) selectedSkinIdx = idx;
  }

  document.getElementById('arcade-screen').addEventListener('click', () => {
    initAudio();
    if (currentScreen === 0) {
      const p1 = getActivePlayer();
      if (!p1) {
        playInsertCoin();
        setTimeout(() => { window.location.href = '/players.html'; }, 200);
        return;
      }
      playInsertCoin();
      currentScreen = 1;
      updateScreen();
      updateMenu('menu-mode', selectedModeIdx);
    }
  });

  const modeItems = document.querySelectorAll('#menu-mode li');
  modeItems.forEach((li, idx) => {
    li.addEventListener('click', (e) => {
      e.stopPropagation();
      initAudio();
      playMenuSelect();
      selectedModeIdx = idx;
      updateMenu('menu-mode', selectedModeIdx);
      currentScreen = 2;
      updateScreen();
      updateSkinDisplay();
    });
  });

  document.getElementById('skin-prev').addEventListener('click', (e) => {
    e.stopPropagation();
    initAudio();
    playMenuMove();
    selectedSkinIdx = (selectedSkinIdx - 1 + SKINS.length) % SKINS.length;
    updateSkinDisplay();
  });

  document.getElementById('skin-next').addEventListener('click', (e) => {
    e.stopPropagation();
    initAudio();
    playMenuMove();
    selectedSkinIdx = (selectedSkinIdx + 1) % SKINS.length;
    updateSkinDisplay();
  });

  document.getElementById('active-skin-preview').addEventListener('click', (e) => {
    e.stopPropagation();
    initAudio();
    playMenuSelect();
    const mode = document.querySelectorAll('#menu-mode li')[selectedModeIdx].dataset.mode;
    if (mode === 'two_players' || mode === 'turns') {
      currentScreen = 3; // Avatar P2
      updateScreen();
      updateMenu('menu-avatar-p2', selectedAvatarP2Idx);
    } else {
      currentScreen = 5; // Level
      updateScreen();
      updateMenu('menu-level', selectedLevelIdx);
    }
  });

  const skinP2Prev = document.getElementById('skin-p2-prev');
  if (skinP2Prev) {
    skinP2Prev.addEventListener('click', (e) => {
      e.stopPropagation();
      initAudio();
      playMenuMove();
      selectedSkinP2Idx = (selectedSkinP2Idx - 1 + SKINS.length) % SKINS.length;
      updateSkinDisplay();
    });
  }

  const skinP2Next = document.getElementById('skin-p2-next');
  if (skinP2Next) {
    skinP2Next.addEventListener('click', (e) => {
      e.stopPropagation();
      initAudio();
      playMenuMove();
      selectedSkinP2Idx = (selectedSkinP2Idx + 1) % SKINS.length;
      updateSkinDisplay();
    });
  }

  const skinP2Preview = document.getElementById('active-skin-p2-preview');
  if (skinP2Preview) {
    skinP2Preview.addEventListener('click', (e) => {
      e.stopPropagation();
      initAudio();
      playMenuSelect();
      currentScreen = 5; // Level
      updateScreen();
      updateMenu('menu-level', selectedLevelIdx);
    });
  }

  const levelItems = document.querySelectorAll('#menu-level li');
  levelItems.forEach((li, idx) => {
    li.addEventListener('click', (e) => {
      e.stopPropagation();
      initAudio();
      const unlocked = getUnlockedLevels();
      const level = parseInt(li.dataset.level, 10);
      if (level <= unlocked) {
        playMenuSelect();
        selectedLevelIdx = idx;
        updateMenu('menu-level', selectedLevelIdx);
        const mode = document.querySelectorAll('#menu-mode li')[selectedModeIdx].dataset.mode;
        const skin = SKINS[selectedSkinIdx].color;
        const skinP2 = SKINS[selectedSkinP2Idx].color;
        localStorage.setItem('pacman-selected-skin-p2', skinP2);
        startGame(mode, level.toString(), skin);
      }
    });
  });
});
