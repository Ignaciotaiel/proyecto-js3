// main.js
// script de la pantalla de inicio (index.html) arcade

import { setPlayers } from '/scripts/users.js';
import { startMenuMusic, playUIBloop, playCoinSound } from '/modules/soundManager.js';

const namesForm = document.getElementById('names-form');
const feedbackNames = document.getElementById('feedback-names');

// Elementos de Selección de Modo
const btnSolo = document.getElementById('btn-mode-solo');
const btnBot = document.getElementById('btn-mode-bot');
const btnLocal = document.getElementById('btn-mode-local');
const btnTurn = document.getElementById('btn-mode-turn');
const modeButtons = [btnSolo, btnBot, btnLocal, btnTurn];

const colP1 = document.getElementById('col-p1');
const colVs = document.getElementById('col-vs');
const colP2 = document.getElementById('col-p2');
const inputP1 = document.getElementById('name-p1');
const inputP2 = document.getElementById('name-p2');

// Detección de dispositivo móvil
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || ('ontouchstart' in window);

function showFeedback(msg) {
  if (!feedbackNames) return;
  feedbackNames.textContent = msg;
  feedbackNames.classList.remove('hidden');
  setTimeout(() => feedbackNames.classList.add('hidden'), 3000);
}

// Configurar modo de juego y actualizar UI de nombres
function setGameMode(mode) {
  // Guardar en localStorage
  localStorage.setItem('snakes-mode', mode);

  // Limpiar clases active
  modeButtons.forEach(btn => {
    if (btn) btn.classList.remove('active');
  });

  // Activar botón seleccionado
  const activeBtn = document.getElementById(`btn-mode-${mode}`);
  if (activeBtn) activeBtn.classList.add('active');

  // Ajustar inputs según el modo
  if (mode === 'solo' || mode === 'bot') {
    // Modo un solo jugador (o contra el bot): ocultar J2
    if (colVs) colVs.classList.add('d-none');
    if (colP2) colP2.classList.add('d-none');
    if (inputP2) {
      inputP2.removeAttribute('required');
      inputP2.value = mode === 'bot' ? 'MÁQUINA' : '';
    }
    
    if (colP1) {
      colP1.className = 'col-12 col-md-8 player-col text-center';
    }
  } else {
    // Modos 2 jugadores: mostrar J2
    if (colVs) colVs.classList.remove('d-none');
    if (colP2) colP2.classList.remove('d-none');
    if (inputP2) {
      inputP2.setAttribute('required', 'true');
      if (inputP2.value === 'MÁQUINA') inputP2.value = '';
    }
    
    if (colP1) {
      colP1.className = 'col-12 col-md-5 player-col text-center';
    }
  }
}

// Inicialización de la Pantalla de Inicio
function initHome() {
  // Ajuste si es móvil
  if (isMobile && btnLocal) {
    btnLocal.classList.add('disabled-mode');
    const smallTag = btnLocal.querySelector('small');
    if (smallTag) smallTag.textContent = 'PC NECESARIO';
  }

  // Escuchar clicks de los modos de juego
  modeButtons.forEach(btn => {
    if (!btn) return;
    btn.addEventListener('click', () => {
      playUIBloop();
      const mode = btn.getAttribute('data-mode');
      
      if (mode === 'local' && isMobile) {
        showFeedback('MODO 1V1 REQUIERE TECLADO FÍSICO. ELIGE OTRO MODO.');
        return;
      }
      
      setGameMode(mode);
    });
  });

  // Establecer modo por defecto (solo o el último seleccionado)
  const savedMode = localStorage.getItem('snakes-mode') || 'solo';
  if (isMobile && savedMode === 'local') {
    setGameMode('solo');
  } else {
    setGameMode(savedMode);
  }

  // Sonidos de inputs
  document.querySelectorAll('input').forEach(input => {
    input.addEventListener('input', playUIBloop);
  });

  // Evento submit del formulario
  if (namesForm) {
    namesForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const currentMode = localStorage.getItem('snakes-mode') || 'solo';
      const nameP1 = inputP1.value.trim() || 'P1';
      let nameP2 = 'P2';
      
      if (currentMode === 'solo') {
        nameP2 = '---';
      } else if (currentMode === 'bot') {
        nameP2 = 'BOT MÁQUINA';
      } else {
        nameP2 = inputP2.value.trim() || 'P2';
      }

      playCoinSound();
      setPlayers(nameP1, nameP2);
      startMenuMusic();
      
      showFeedback('FICHA INSERTADA...');
      setTimeout(() => {
        window.location.href = '/levels';
      }, 800);
    });
  }
}

// Arrancar
initHome();

