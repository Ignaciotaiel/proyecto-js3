// turnSystem.js
// módulo que gestiona el sistema de turnos del juego 1v1
// determina qué jugador mueve, controla cambios y condiciones de fin

// jugadores disponibles
const PLAYER_ONE = 1;
const PLAYER_TWO = 2;

// estado del turno
let currentTurn = PLAYER_ONE;
let turnCount = 0;
let onTurnChange = null; // callback externo al cambiar turno

// registra un callback que se llama cuando cambia el turno
function onTurnChangeCallback(fn) {
  onTurnChange = fn;
}

// devuelve el jugador actual
function getCurrentTurn() {
  return currentTurn;
}

// devuelve el número de turno total
function getTurnCount() {
  return turnCount;
}

// cambia al siguiente jugador y dispara el callback
function nextTurn() {
  currentTurn = currentTurn === PLAYER_ONE ? PLAYER_TWO : PLAYER_ONE;
  turnCount++;
  if (typeof onTurnChange === 'function') {
    onTurnChange(currentTurn, turnCount);
  }
}

// reinicia el sistema al inicio de una nueva partida
function resetTurn() {
  currentTurn = PLAYER_ONE;
  turnCount = 0;
}

// verifica si el jugador dado es el actual
function isCurrentPlayer(player) {
  return currentTurn === player;
}

export {
  PLAYER_ONE,
  PLAYER_TWO,
  getCurrentTurn,
  getTurnCount,
  nextTurn,
  resetTurn,
  isCurrentPlayer,
  onTurnChangeCallback,
};
