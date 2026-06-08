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

// Carga de imágenes temáticas FWC
const dotImage = new Image();
dotImage.src = '/assets/pelota-coins.png';

const powerImage = new Image();
powerImage.src = '/assets/worldcup-powerpellet.png';

const doubleImage = new Image();
doubleImage.src = '/assets/copa-bonus.png';

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
    if (row === 14 && (col < 0 || col >= COLS)) return true;
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
    if (row === 14 && (col < 0 || col >= COLS)) return true;
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
        this._drawCell(ctx, x, y, cellSize, cell, tick, col, row);
      }
    }
  }

  /**
   * Dibuja una celda individual del tablero con la temática FWC.
   * @private
   */
  _drawCell(ctx, x, y, size, cell, tick, col, row) {
    // 1. Dibuja el fondo de césped si es una celda transitable
    if (cell !== Cell.WALL && cell !== Cell.GHOST_HOUSE && cell !== Cell.GHOST_DOOR) {
      // Efecto de franjas de césped vertical alternado
      const stripe = Math.floor(col / 3) % 2;
      ctx.fillStyle = stripe === 0 ? '#1b4d22' : '#225e29';
      ctx.fillRect(x, y, size, size);
    } else {
      ctx.fillStyle = '#000';
      ctx.fillRect(x, y, size, size);
    }

    if (cell === Cell.WALL) {
      // Líneas de los estadios temáticos de la Copa del Mundo por nivel
      const colors = {
        1: ['#ffffff', '#1b4d22'], // Líneas de cal (blanco) sobre base verde
        2: ['#ffd700', '#255226'], // Dorado de la Copa del Mundo
        3: ['#75aadb', '#1e3d59'], // Albiceleste (Argentina)
        4: ['#009c3b', '#ffd700'], // Verde/Amarelo (Brasil)
        5: ['#da291c', '#0a5c36'], // Rojo/Verde (Portugal)
        6: ['#ffd700', '#111111']  // Oro y Negro (La gran final)
      };
      const [lineColor, wallBgColor] = colors[this.currentLevel] || colors[1];

      ctx.fillStyle = wallBgColor;
      ctx.fillRect(x, y, size, size);

      ctx.strokeStyle = lineColor;
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 1, y + 1, size - 2, size - 2);

      // Efecto glow de iluminación del estadio
      ctx.shadowColor = lineColor;
      ctx.shadowBlur = 4;
      ctx.strokeRect(x + 1, y + 1, size - 2, size - 2);
      ctx.shadowBlur = 0; // reset shadow
    } else if (cell === Cell.DOT) {
      if (dotImage.complete) {
        ctx.drawImage(dotImage, x + size * 0.1, y + size * 0.1, size * 0.8, size * 0.8);
      } else {
        const r = size * 0.12;
        ctx.beginPath();
        ctx.arc(x + size / 2, y + size / 2, r, 0, Math.PI * 2);
        ctx.fillStyle = '#ffff99';
        ctx.fill();
      }
    } else if (cell === Cell.POWER) {
      const blink = Math.floor(tick / 15) % 2 === 0;
      if (blink) {
        if (powerImage.complete) {
          ctx.drawImage(powerImage, x + size * 0.05, y + size * 0.05, size * 0.9, size * 0.9);
        } else {
          const r = size * 0.3;
          ctx.beginPath();
          ctx.arc(x + size / 2, y + size / 2, r, 0, Math.PI * 2);
          ctx.fillStyle = '#FFD700';
          ctx.fill();
        }
      }
    } else if (cell === Cell.GHOST_HOUSE) {
      ctx.fillStyle = '#0a1d10'; // Vestuario / Banco de suplentes verde oscuro
      ctx.fillRect(x, y, size, size);
    } else if (cell === Cell.GHOST_DOOR) {
      ctx.fillStyle = '#ff3333'; // Línea roja de meta/gol
      ctx.fillRect(x, y + size * 0.4, size, size * 0.2);
    } else if (cell === Cell.FREEZE) {
      const blink = Math.floor(tick / 10) % 2 === 0;
      if (blink) {
        ctx.fillStyle = '#00FFFF';
        ctx.font = `${size * 0.8}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('❄️', x + size / 2, y + size / 2);
      }
    } else if (cell === Cell.DOUBLE) {
      const blink = Math.floor(tick / 10) % 2 === 0;
      if (blink) {
        if (doubleImage.complete) {
          ctx.drawImage(doubleImage, x + size * 0.05, y + size * 0.05, size * 0.9, size * 0.9);
        } else {
          ctx.fillStyle = '#FFFF00';
          ctx.font = `bold ${size * 0.6}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('x2', x + size / 2, y + size / 2);
        }
      }
    }
  }
}
