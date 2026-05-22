// main.js
// script de la pantalla de inicio (index.html) arcade

import { setPlayers } from '/scripts/users.js';
import { startMenuMusic, playUIBloop, playCoinSound } from '/modules/soundManager.js';

const namesForm = document.getElementById('names-form');
const feedbackNames = document.getElementById('feedback-names');

function showFeedback(msg) {
  if (!feedbackNames) return;
  feedbackNames.textContent = msg;
  feedbackNames.classList.remove('hidden');
  setTimeout(() => feedbackNames.classList.add('hidden'), 3000);
}

if (namesForm) {
  document.querySelectorAll('input').forEach(input => {
    input.addEventListener('input', playUIBloop);
  });

  namesForm.addEventListener('submit', (e) => {
    e.preventDefault();
    playCoinSound();
    const nameP1 = document.getElementById('name-p1').value.trim() || 'P1';
    const nameP2 = document.getElementById('name-p2').value.trim() || 'P2';

    setPlayers(nameP1, nameP2);
    startMenuMusic();
    
    // Simular un retraso arcade corto
    showFeedback('FICHA INSERTADA...');
    setTimeout(() => {
      window.location.href = '/levels';
    }, 800);
  });
}
