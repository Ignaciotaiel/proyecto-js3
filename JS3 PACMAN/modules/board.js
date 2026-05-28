/**
 * @module board
 * @description Define los mapas del juego PacMan (28×31) para los 6 niveles
 * y gestiona el estado de la grilla, incluyendo nuevos power-ups (congelación y x2).
 */

/** @enum {number} */
export const Cell = {
  EMPTY: 0,
  WALL: 1,
  DOT: 2,
  POWER: 3,
  GHOST_HOUSE: 4,
  GHOST_DOOR: 5,
  FREEZE: 6,
  DOUBLE: 7
};

export const COLS = 28;
export const ROWS = 31;

// Mapa Base Común (Nivel 1 y 2)
// 1=pared, 2=punto, 3=power-up clásico, 4=casa fantasma, 5=puerta, 6=hielo, 7=puntos x2, 0=vacío
const MAP_L1 = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,2,2,2,2,2,2,2,2,2,2,2,2,1,1,2,2,2,2,2,2,2,2,2,2,2,2,1],
  [1,2,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,2,1],
  [1,3,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,3,1],
  [1,2,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,2,1],
  [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
  [1,2,1,1,1,1,2,1,1,2,1,1,1,1,1,1,1,1,2,1,1,2,1,1,1,1,2,1],
  [1,2,1,1,1,1,2,1,1,2,1,1,1,1,1,1,1,1,2,1,1,2,1,1,1,1,2,1],
  [1,2,2,2,2,2,2,1,1,2,2,2,2,1,1,2,2,2,2,1,1,2,2,2,2,2,2,1],
  [1,1,1,1,1,1,2,1,1,1,1,1,0,1,1,0,1,1,1,1,1,2,1,1,1,1,1,1],
  [1,1,1,1,1,1,2,1,1,1,1,1,0,1,1,0,1,1,1,1,1,2,1,1,1,1,1,1],
  [1,1,1,1,1,1,2,1,1,0,0,0,0,0,0,0,0,0,0,1,1,2,1,1,1,1,1,1],
  [1,1,1,1,1,1,2,1,1,0,1,1,1,4,4,1,1,1,0,1,1,2,1,1,1,1,1,1],
  [1,1,1,1,1,1,2,1,1,0,1,4,4,4,4,4,4,1,0,1,1,2,1,1,1,1,1,1],
  [0,0,0,0,0,0,2,0,0,0,1,4,4,4,4,4,4,1,0,0,0,2,0,0,0,0,0,0],
  [1,1,1,1,1,1,2,1,1,0,1,5,5,5,5,5,5,1,0,1,1,2,1,1,1,1,1,1],
  [1,1,1,1,1,1,2,1,1,0,1,1,1,1,1,1,1,1,0,1,1,2,1,1,1,1,1,1],
  [1,1,1,1,1,1,2,1,1,0,0,0,0,0,0,0,0,0,0,1,1,2,1,1,1,1,1,1],
  [1,1,1,1,1,1,2,1,1,0,1,1,1,1,1,1,1,1,0,1,1,2,1,1,1,1,1,1],
  [1,1,1,1,1,1,2,1,1,0,1,1,1,1,1,1,1,1,0,1,1,2,1,1,1,1,1,1],
  [1,2,2,2,2,2,2,2,2,2,2,2,2,1,1,2,2,2,2,2,2,2,2,2,2,2,2,1],
  [1,2,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,2,1],
  [1,2,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,2,1],
  [1,3,2,2,1,1,2,2,2,2,2,2,2,0,0,2,2,2,2,2,2,2,1,1,2,2,3,1],
  [1,1,1,2,1,1,2,1,1,2,1,1,1,1,1,1,1,1,2,1,1,2,1,1,2,1,1,1],
  [1,1,1,2,1,1,2,1,1,2,1,1,1,1,1,1,1,1,2,1,1,2,1,1,2,1,1,1],
  [1,2,2,2,2,2,2,1,1,2,2,2,2,1,1,2,2,2,2,1,1,2,2,2,2,2,2,1],
  [1,2,1,1,1,1,1,1,1,1,1,1,2,1,1,2,1,1,1,1,1,1,1,1,1,1,2,1],
  [1,2,1,1,1,1,1,1,1,1,1,1,2,1,1,2,1,1,1,1,1,1,1,1,1,1,2,1],
  [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
];

// Nivel 2: Clásico con 1 Freeze y 1 Double en posiciones simétricas
const MAP_L2 = MAP_L1.map((row, r) => row.map((cell, c) => {
  if (r === 8 && c === 1) return Cell.FREEZE;
  if (r === 8 && c === 26) return Cell.DOUBLE;
  return cell;
}));

// Nivel 3: Pasillos más angostos (más paredes en los laterales)
const MAP_L3 = MAP_L1.map((row, r) => row.map((cell, c) => {
  // Añadimos paredes en los pasillos exteriores y cambiamos algunas celdas por congelar
  if ((r === 5 && (c === 8 || c === 19)) || (r === 20 && (c === 8 || c === 19))) return Cell.WALL;
  if (r === 3 && c === 1) return Cell.FREEZE;
  if (r === 3 && c === 26) return Cell.DOUBLE;
  return cell;
}));

// Nivel 4: Mapa Laberíntico (bloqueamos algunos caminos para crear laberintos con recovecos)
const MAP_L4 = MAP_L1.map((row, r) => row.map((cell, c) => {
  if ((r === 8 && (c === 5 || c === 22)) || (r === 23 && (c === 8 || c === 19))) return Cell.WALL;
  if (r === 1 && c === 1) return Cell.FREEZE;
  if (r === 29 && c === 26) return Cell.DOUBLE;
  return cell;
}));

// Nivel 5: Zonas Cerradas (grandes bloques de islas, eliminamos algunos pasillos internos)
const MAP_L5 = MAP_L1.map((row, r) => row.map((cell, c) => {
  if ((r === 5 && (c >= 10 && c <= 17)) || (r === 26 && (c >= 10 && c <= 17))) return Cell.WALL;
  if (r === 5 && c === 1) return Cell.FREEZE;
  if (r === 26 && c === 26) return Cell.DOUBLE;
  return cell;
}));

// Nivel 6: Mapa final desafiante (muros extra en las esquinas, máximo desafío)
const MAP_L6 = MAP_L1.map((row, r) => row.map((cell, c) => {
  if ((r === 2 && (c === 6 || c === 21)) || (r === 28 && (c === 6 || c === 21))) return Cell.WALL;
  if (r === 23 && c === 13) return Cell.FREEZE; // En el medio
  if (r === 23 && c === 14) return Cell.DOUBLE;
  return cell;
}));

export class Board {
  constructor() {
    /** @type {number[][]} Grilla de celdas actual */
    this.grid = [];
    this.currentLevel = 1;
    this.reset(1);
  }

  /**
   * Reinicia el tablero al estado inicial del nivel especificado.
   * @param {number} level
   * @returns {void}
   */
  reset(level = 1) {
    this.currentLevel = level;
    let baseMap;
    switch(level) {
      case 1: baseMap = MAP_L1; break;
      case 2: baseMap = MAP_L2; break;
      case 3: baseMap = MAP_L3; break;
      case 4: baseMap = MAP_L4; break;
      case 5: baseMap = MAP_L5; break;
      case 6: baseMap = MAP_L6; break;
      default: baseMap = MAP_L6; break;
    }
    this.grid = baseMap.map((row) => [...row]);
  }

  /**
   * Obtiene el valor de una celda.
   * @param {number} col - Columna
   * @param {number} row - Fila
   * @returns {number} Valor de la celda
   */
  getCell(col, row) {
    if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return Cell.WALL;
    return this.grid[row][col];
  }

  /**
   * Establece el valor de una celda.
   * @param {number} col
   * @param {number} row
   * @param {number} value
   * @returns {void}
   */
  setCell(col, row, value) {
    if (row >= 0 && row < ROWS && col >= 0 && col < COLS) {
      this.grid[row][col] = value;
    }
  }

  /**
   * Cuenta los puntos y power-ups restantes.
   * @returns {number} Cantidad de puntos restantes
   */
  getDotCount() {
    let count = 0;
    for (const row of this.grid) {
      for (const cell of row) {
        if (cell === Cell.DOT || cell === Cell.POWER || cell === Cell.FREEZE || cell === Cell.DOUBLE) {
          count++;
        }
      }
    }
    return count;
  }

  /**
   * Verifica si una posición es transitable para PacMan.
   * @param {number} col
   * @param {number} row
   * @returns {boolean}
   */
  isWalkable(col, row) {
    const cell = this.getCell(col, row);
    return cell !== Cell.WALL && cell !== Cell.GHOST_HOUSE && cell !== Cell.GHOST_DOOR;
  }

  /**
   * Verifica si una posición es transitable para fantasmas.
   * @param {number} col
   * @param {number} row
   * @returns {boolean}
   */
  isWalkableForGhost(col, row) {
    const cell = this.getCell(col, row);
    return cell !== Cell.WALL;
  }

  /**
   * Renderiza el tablero en el canvas.
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} cellSize
   * @param {number} tick
   * @returns {void}
   */
  draw(ctx, cellSize, tick) {
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const x = col * cellSize;
        const y = row * cellSize;
        const cell = this.grid[row][col];
        this._drawCell(ctx, x, y, cellSize, cell, tick);
      }
    }
  }

  /**
   * Dibuja una celda individual del tablero con colores neón.
   * @private
   */
  _drawCell(ctx, x, y, size, cell, tick) {
    ctx.fillStyle = '#000';
    ctx.fillRect(x, y, size, size);

    if (cell === Cell.WALL) {
      // Colores de pared diferenciados por nivel
      const colors = {
        1: ['#1a1aff', '#0000aa'], // Azul clásico
        2: ['#00e5ff', '#0099aa'], // Cian neón
        3: ['#ff00ff', '#aa00aa'], // Magenta neón
        4: ['#33ff33', '#11aa11'], // Verde neón
        5: ['#ff9900', '#aa5500'], // Naranja neón
        6: ['#ff0055', '#aa0033']  // Rojo/Fucsia neón
      };
      const [neonColor, darkColor] = colors[this.currentLevel] || colors[6];

      ctx.fillStyle = darkColor;
      ctx.fillRect(x + 1, y + 1, size - 2, size - 2);
      ctx.strokeStyle = neonColor;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x + 1, y + 1, size - 2, size - 2);

      // Efecto glow en las paredes
      ctx.shadowColor = neonColor;
      ctx.shadowBlur = 3;
      ctx.strokeRect(x + 1, y + 1, size - 2, size - 2);
      ctx.shadowBlur = 0; // reset shadow
    } else if (cell === Cell.DOT) {
      const r = size * 0.12;
      ctx.beginPath();
      ctx.arc(x + size / 2, y + size / 2, r, 0, Math.PI * 2);
      ctx.fillStyle = '#ffff99';
      ctx.fill();
      // Pequeño brillo en los puntos
      ctx.shadowColor = '#ffff99';
      ctx.shadowBlur = 4;
      ctx.fill();
      ctx.shadowBlur = 0;

    } else if (cell === Cell.POWER) {
      const blink = Math.floor(tick / 15) % 2 === 0;
      if (blink) {
        const r = size * 0.3;
        ctx.beginPath();
        ctx.arc(x + size / 2, y + size / 2, r, 0, Math.PI * 2);
        ctx.fillStyle = '#FFD700';
        ctx.fill();
        ctx.shadowColor = '#FFD700';
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    } else if (cell === Cell.GHOST_HOUSE) {
      ctx.fillStyle = '#050515';
      ctx.fillRect(x, y, size, size);
    } else if (cell === Cell.GHOST_DOOR) {
      ctx.fillStyle = '#ff69b4';
      ctx.fillRect(x, y + size * 0.4, size, size * 0.2);
    } else if (cell === Cell.FREEZE) {
      const blink = Math.floor(tick / 10) % 2 === 0;
      if (blink) {
        ctx.fillStyle = '#00FFFF';
        ctx.shadowColor = '#00FFFF';
        ctx.shadowBlur = 10;
        ctx.font = `${size * 0.8}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('❄️', x + size / 2, y + size / 2);
        ctx.shadowBlur = 0;
      }
    } else if (cell === Cell.DOUBLE) {
      const blink = Math.floor(tick / 10) % 2 === 0;
      if (blink) {
        ctx.fillStyle = '#FFFF00';
        ctx.shadowColor = '#FFFF00';
        ctx.shadowBlur = 10;
        ctx.font = `bold ${size * 0.6}px "Press Start 2P"`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('x2', x + size / 2, y + size / 2);
        ctx.shadowBlur = 0;
      }
    }
  }
}
