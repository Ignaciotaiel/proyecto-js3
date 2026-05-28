/**
 * @module bot
 * @description IA que controla un segundo PacMan automáticamente.
 * Usa BFS para encontrar el punto (o power-up) más cercano.
 */

import { Cell } from './board.js';

/**
 * BFS para encontrar la celda más cercana de un tipo dado.
 * @param {{ col: number, row: number }} from - Posición de inicio
 * @param {import('./board.js').Board} board - Tablero actual
 * @param {number[]} targetCells - Tipos de celda objetivo
 * @returns {{ dc: number, dr: number }|null} Primera dirección del camino
 */
function bfsToNearest(from, board, targetCells) {
  const startCol = Math.round(from.col);
  const startRow = Math.round(from.row);
  const visited = new Set([`${startCol},${startRow}`]);
  const queue = [{ col: startCol, row: startRow, firstDir: null }];
  const dirs = [
    { dc: 0, dr: -1 },
    { dc: 0, dr:  1 },
    { dc: -1, dr: 0 },
    { dc:  1, dr: 0 },
  ];
  while (queue.length > 0) {
    const cur = queue.shift();
    for (const dir of dirs) {
      const nc = cur.col + dir.dc;
      const nr = cur.row + dir.dr;
      const key = `${nc},${nr}`;
      if (visited.has(key)) continue;
      if (!board.isWalkable(nc, nr) && board.getCell(nc, nr) !== Cell.DOT &&
          board.getCell(nc, nr) !== Cell.POWER) {
        if (!board.isWalkable(nc, nr)) continue;
      }
      visited.add(key);
      const firstDir = cur.firstDir ?? dir;
      if (targetCells.includes(board.getCell(nc, nr))) {
        return firstDir;
      }
      queue.push({ col: nc, row: nr, firstDir });
    }
  }
  return null;
}

/**
 * Clase Bot — controla un PacMan de forma automática.
 */
export class Bot {
  constructor() {
    /** @type {number} Ticks entre decisiones */
    this.decisionInterval = 7;
    /** @type {number} Contador hasta la próxima decisión */
    this._tick = 0;
  }

  /**
   * Calcula la dirección óptima para el bot y la aplica al PacMan dado.
   * @param {import('./board.js').Board} board - Tablero actual
   * @param {import('./pacman.js').PacMan} pacman - El PacMan controlado por el bot
   * @param {Array} ghosts - Lista de fantasmas activos
   * @returns {void}
   */
  tick(board, pacman, ghosts = []) {
    this._tick++;
    if (this._tick < this.decisionInterval) return;
    this._tick = 0;
    const dir = this._decideDirection(board, pacman, ghosts);
    if (dir) pacman.setDirection(dir);
  }

  /**
   * Decide la dirección óptima usando BFS.
   * Prioriza power-ups si hay fantasmas cerca, sino el punto más cercano.
   * @param {import('./board.js').Board} board
   * @param {import('./pacman.js').PacMan} pacman
   * @param {Array} ghosts
   * @returns {'left'|'right'|'up'|'down'|null}
   * @private
   */
  _decideDirection(board, pacman, ghosts) {
    const ghostNear = ghosts.some((g) => {
      const dist = Math.abs(g.col - pacman.col) + Math.abs(g.row - pacman.row);
      return dist < 5 && g.state !== 'frightened' && g.state !== 'eaten';
    });
    const targets = ghostNear
      ? [Cell.POWER, Cell.DOT]
      : [Cell.DOT, Cell.POWER];
    let step = bfsToNearest(pacman, board, targets);
    if (!step) {
      step = bfsToNearest(pacman, board, [Cell.DOT, Cell.POWER]);
    }
    if (!step) return null;
    const dirMap = [
      { dc: 0, dr: -1, name: 'up' },
      { dc: 0, dr:  1, name: 'down' },
      { dc: -1, dr: 0, name: 'left' },
      { dc:  1, dr: 0, name: 'right' },
    ];
    const match = dirMap.find((d) => d.dc === step.dc && d.dr === step.dr);
    return match ? match.name : null;
  }
}
