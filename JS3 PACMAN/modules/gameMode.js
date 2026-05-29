/**
 * @module gameMode
 * @description Define los modos de juego y gestiona el estado de la sesión.
 */

import { PacMan } from './pacman.js';
import { Bot } from './bot.js';

/** @enum {string} Modos de juego disponibles */
export const GameMode = {
  SOLO: 'solo',
  TWO_PLAYERS: 'two_players',
  VS_BOT: 'vs_bot',
  TURNS: 'turns',
};

/** Duración de un turno en ticks (30 segundos a ~60fps) */
const TURN_DURATION = 30 * 60;

/**
 * Clase que gestiona la sesión de juego según el modo activo.
 */
export class GameSession {
  /**
   * @param {string} mode - Modo de juego (usar GameMode enum)
   * @param {{ name: string, avatar: string }[]} players - Datos de jugadores
   */
  constructor(mode, players) {
    this.mode = mode;
    this.players = players;
    /** @type {PacMan[]} Lista de PacMans activos */
    this.pacmans = [];
    /** @type {Bot|null} Bot para modo VS_BOT */
    this.bot = null;
    /** @type {number} Índice del jugador activo (para modo TURNS) */
    this.activeTurnIndex = 0;
    /** @type {number} Ticks restantes del turno actual */
    this.turnTicksLeft = TURN_DURATION;
    /** @type {boolean} La partida está activa */
    this.running = false;
    this._initPacmans();
  }

  /**
   * Inicializa los PacMans según el modo de juego.
   * @private
   * @returns {void}
   */
  _initPacmans() {
    const playerSkin = localStorage.getItem('pacman-selected-skin') || '#FFD700';
    const player2Skin = localStorage.getItem('pacman-selected-skin-p2') || '#3333FF';

    if (this.mode === GameMode.SOLO || this.mode === GameMode.TURNS) {
      this.pacmans = [new PacMan(13, 23, playerSkin)];
    } else if (this.mode === GameMode.TWO_PLAYERS) {
      this.pacmans = [
        new PacMan(13, 23, playerSkin),
        new PacMan(14, 23, player2Skin),
      ];
    } else if (this.mode === GameMode.VS_BOT) {
      this.pacmans = [
        new PacMan(13, 23, playerSkin),
        new PacMan(14, 23, '#00FF88'),
      ];
      this.bot = new Bot();
    }
  }

  /**
   * Devuelve los nombres para mostrar en el panel de score.
   * @returns {string[]}
   */
  getPlayerLabels() {
    if (this.mode === GameMode.SOLO) {
      return [this.players[0]?.name || 'Jugador 1'];
    }
    if (this.mode === GameMode.TWO_PLAYERS) {
      return [
        this.players[0]?.name || 'Jugador 1',
        this.players[1]?.name || 'Jugador 2',
      ];
    }
    if (this.mode === GameMode.VS_BOT) {
      return [this.players[0]?.name || 'Jugador', 'BOT 🤖'];
    }
    if (this.mode === GameMode.TURNS) {
      return [
        this.players[0]?.name || 'Jugador 1',
        this.players[1]?.name || 'Jugador 2',
      ];
    }
    return [];
  }

  /**
   * Devuelve el PacMan que controla el jugador humano (índice 0).
   * @returns {PacMan}
   */
  getHumanPacman1() {
    return this.pacmans[0];
  }

  /**
   * Devuelve el segundo PacMan (jugador 2 o bot), si existe.
   * @returns {PacMan|null}
   */
  getHumanPacman2() {
    if (this.mode === GameMode.VS_BOT || this.mode === GameMode.TURNS) return null;
    return this.pacmans[1] || null;
  }

  /**
   * Devuelve el PacMan activo en el modo por turnos.
   * @returns {PacMan}
   */
  getActivePacman() {
    if (this.mode !== GameMode.TURNS) return this.pacmans[0];
    return this.pacmans[0];
  }

  /**
   * Aplica la entrada del teclado al PacMan correcto según el modo.
   * @param {string} key - Tecla presionada
   * @returns {void}
   */
  handleInput(key) {
    const p1 = this.pacmans[0];
    const p2 = this.pacmans[1];
    const keyToDir = {
      ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down',
      a: 'left', d: 'right', w: 'up', s: 'down',
      A: 'left', D: 'right', W: 'up', S: 'down',
    };
    const p2KeyToDir = {
      ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down',
    };
    if (this.mode === GameMode.SOLO || this.mode === GameMode.VS_BOT || this.mode === GameMode.TURNS) {
      const dir = keyToDir[key] || p2KeyToDir[key];
      if (dir && p1) p1.setDirection(dir);
    } else if (this.mode === GameMode.TWO_PLAYERS) {
      const wasd = { a: 'left', d: 'right', w: 'up', s: 'down', A: 'left', D: 'right', W: 'up', S: 'down' };
      const arrows = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' };
      if (wasd[key] && p1) p1.setDirection(wasd[key]);
      if (arrows[key] && p2) p2.setDirection(arrows[key]);
    }
  }

  /**
   * Actualiza el temporizador de turnos y alterna si es necesario.
   * @returns {{ switched: boolean, playerIndex: number }}
   */
  updateTurns() {
    if (this.mode !== GameMode.TURNS) return { switched: false, playerIndex: 0 };
    this.turnTicksLeft--;
    if (this.turnTicksLeft <= 0) {
      this.activeTurnIndex = this.activeTurnIndex === 0 ? 1 : 0;
      this.turnTicksLeft = TURN_DURATION;
      return { switched: true, playerIndex: this.activeTurnIndex };
    }
    return { switched: false, playerIndex: this.activeTurnIndex };
  }

  /**
   * Alterna el turno inmediatamente (por pérdida de vida).
   * @returns {number} Índice del nuevo jugador activo
   */
  switchTurn() {
    if (this.mode !== GameMode.TURNS) return 0;
    this.activeTurnIndex = this.activeTurnIndex === 0 ? 1 : 0;
    this.turnTicksLeft = TURN_DURATION;
    return this.activeTurnIndex;
  }

  /**
   * Obtiene el tiempo restante del turno en segundos.
   * @returns {number}
   */
  getTurnSecondsLeft() {
    return Math.ceil(this.turnTicksLeft / 60);
  }

  /**
   * Reinicia todas las posiciones de PacMans.
   * @returns {void}
   */
  resetPositions() {
    for (const pm of this.pacmans) pm.reset();
  }

  /**
   * Ejecuta el tick del bot si está activo.
   * @param {import('./board.js').Board} board
   * @param {Array} ghosts
   * @returns {void}
   */
  tickBot(board, ghosts) {
    if (this.bot && this.pacmans[1]) {
      this.bot.tick(board, this.pacmans[1], ghosts);
    }
  }

  /**
   * Determina el ganador al final de la partida.
   * @returns {{ winner: string, scores: Array }}
   */
  getResult() {
    const labels = this.getPlayerLabels();
    const scores = this.pacmans.map((pm, i) => ({
      name: labels[i],
      score: pm.score,
    }));
    scores.sort((a, b) => b.score - a.score);
    return { winner: scores[0]?.name || 'Nadie', scores };
  }
}
