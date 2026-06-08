/**
 * @module ghost
 * @description Clases de fantasmas de PacMan con IA (BFS), modos scatter/chase/frightened/eaten.
 * Los 4 fantasmas: Blinky, Pinky, Inky, Clyde con comportamientos distintos.
 */

import { COLS, ROWS } from './board.js';

// Carga de la imagen del árbitro temático FWC
const refereeImage = new Image();
refereeImage.src = '/assets/arbitro.png';

/** @enum {string} Estados posibles de un fantasma */
export const GhostState = {
  CHASE: 'chase',
  SCATTER: 'scatter',
  FRIGHTENED: 'frightened',
  EATEN: 'eaten',
};

const DIRECTIONS = [
  { dc: 0, dr: -1 },
  { dc: 0, dr: 1 },
  { dc: -1, dr: 0 },
  { dc: 1, dr: 0 },
];

/**
 * BFS para encontrar el próximo paso hacia un destino.
 * Incorpora un fallback al nodo transitable más cercano en caso de objetivos inaccesibles.
 * @param {{ col: number, row: number }} from - Posición origen
 * @param {{ col: number, row: number }} to - Posición destino
 * @param {import('./board.js').Board} board - Tablero actual
 * @returns {{ dc: number, dr: number }|null} Dirección del próximo paso
 */
function bfsNextStep(from, to, board) {
  const startCol = Math.round(from.col);
  const startRow = Math.round(from.row);
  let targetCol = Math.round(to.col);
  let targetRow = Math.round(to.row);
  
  // Clampear coordenadas de destino para evitar objetivos fuera de la grilla (ej. Pinky o Inky)
  targetCol = Math.max(0, Math.min(COLS - 1, targetCol));
  targetRow = Math.max(0, Math.min(ROWS - 1, targetRow));
  
  if (startCol === targetCol && startRow === targetRow) return null;
  
  const visited = new Set();
  const queue = [{ col: startCol, row: startRow, path: [] }];
  visited.add(`${startCol},${startRow}`);
  
  let closestNode = null;
  let minDistance = Infinity;
  
  while (queue.length > 0) {
    const current = queue.shift();
    
    // Rastrear el nodo visitado más cercano al objetivo (Distancia Manhattan)
    const dist = Math.abs(current.col - targetCol) + Math.abs(current.row - targetRow);
    if (dist < minDistance) {
      minDistance = dist;
      closestNode = current;
    }
    
    // Priorizar direcciones para evitar trabones y hacer giros más limpios
    for (const dir of DIRECTIONS) {
      const nc = current.col + dir.dc;
      const nr = current.row + dir.dr;
      
      // Wrap around para el BFS (túneles)
      let wrappedCol = nc;
      if (wrappedCol < 0) wrappedCol = COLS - 1;
      if (wrappedCol >= COLS) wrappedCol = 0;
      
      const key = `${wrappedCol},${nr}`;
      if (visited.has(key)) continue;
      if (!board.isWalkableForGhost(wrappedCol, nr)) continue;
      
      const newPath = [...current.path, dir];
      if (wrappedCol === targetCol && nr === targetRow) {
        return newPath[0];
      }
      
      visited.add(key);
      queue.push({ col: wrappedCol, row: nr, path: newPath });
    }
  }
  
  // Si no se pudo llegar exactamente (ej. es una pared), ir hacia el nodo transitable más cercano
  if (closestNode && closestNode.path.length > 0) {
    return closestNode.path[0];
  }
  
  return null;
}

/**
 * Elige una dirección aleatoria válida para el fantasma.
 * @param {{ col: number, row: number }} pos
 * @param {import('./board.js').Board} board
 * @returns {{ dc: number, dr: number }}
 */
function randomDirection(pos, board) {
  const shuffled = [...DIRECTIONS].sort(() => Math.random() - 0.5);
  for (const dir of shuffled) {
    if (board.isWalkableForGhost(Math.round(pos.col) + dir.dc, Math.round(pos.row) + dir.dr)) {
      return dir;
    }
  }
  return { dc: 0, dr: 0 };
}

/**
 * Clase base para todos los fantasmas.
 */
export class Ghost {
  /**
   * @param {number} col - Columna inicial
   * @param {number} row - Fila inicial
   * @param {string} color - Color del fantasma
   * @param {{ col: number, row: number }} scatterTarget - Esquina de scatter
   * @param {string} name - Nombre del fantasma
   * @param {number} spawnDelay - Ticks a esperar antes de salir
   */
  constructor(col, row, color, scatterTarget, name, spawnDelay = 0) {
    this.spawnCol = col;
    this.spawnRow = row;
    this.col = col;
    this.row = row;
    this.color = color;
    this.scatterTarget = scatterTarget;
    this.name = name;
    /** @type {string} Estado actual */
    this.state = GhostState.SCATTER;
    /** @type {number} Segundos restantes de modo asustado */
    this.frightenedTicks = 0;
    
    // Variables de movimiento continuo
    this.targetCol = col;
    this.targetRow = row;
    this.isTransitioning = false;
    this.baseSpeed = 5.2; // celdas por segundo
    this.isFrozen = false;
    
    /** @type {number} Delay inicial de spawn en segundos */
    this.spawnDelay = spawnDelay / 60.0;
    /** @type {number} Delay restante actual en segundos */
    this.currentDelay = spawnDelay / 60.0;
  }

  /**
   * Reinicia el fantasma a su estado inicial.
   * @returns {void}
   */
  reset() {
    this.col = this.spawnCol;
    this.row = this.spawnRow;
    this.targetCol = this.spawnCol;
    this.targetRow = this.spawnRow;
    this.isTransitioning = false;
    this.state = GhostState.SCATTER;
    this.frightenedTicks = 0;
    this.isFrozen = false;
    this.currentDelay = this.spawnDelay;
  }

  /**
   * Activa el modo asustado por N segundos.
   * @param {number} seconds
   * @returns {void}
   */
  frighten(seconds) {
    if (this.state !== GhostState.EATEN) {
      this.state = GhostState.FRIGHTENED;
      this.frightenedTicks = seconds;
    }
  }

  /**
   * Marca el fantasma como comido (vuelve a casa).
   * @returns {void}
   */
  eat() {
    this.state = GhostState.EATEN;
    this.frightenedTicks = 0;
  }

  /**
   * Calcula el objetivo de movimiento según el modo del fantasma.
   * Debe ser sobrescrito por subclases.
   * @param {import('./pacman.js').PacMan} pacman
   * @param {Ghost|null} blinky
   * @returns {{ col: number, row: number }}
   */
  getChaseTarget(pacman, blinky) {
    return { col: pacman.col, row: pacman.row };
  }

  /**
   * Actualiza la posición del fantasma.
   * @param {import('./board.js').Board} board
   * @param {import('./pacman.js').PacMan} pacman
   * @param {Ghost|null} blinky
   * @param {number} dt
   * @param {number} [speedMultiplier=1]
   * @returns {void}
   */
  update(board, pacman, blinky = null, dt, speedMultiplier = 1.0) {
    if (this.currentDelay > 0) {
      this.currentDelay -= dt;
      return;
    }
    if (this.state === GhostState.FRIGHTENED) {
      this.frightenedTicks -= dt;
      if (this.frightenedTicks <= 0) this.state = GhostState.CHASE;
    }

    if (this.isFrozen) {
      return; // No se mueve si está congelado
    }

    let currentSpeed = this.baseSpeed * speedMultiplier;
    if (this.state === GhostState.FRIGHTENED) {
      currentSpeed *= 0.55;
    } else if (this.state === GhostState.EATEN) {
      currentSpeed *= 3.0; // Los ojos vuelven rápido a casa
    }

    const speed = currentSpeed * dt;

    if (!this.isTransitioning) {
      this._chooseNextTarget(board, pacman, blinky);
      this.isTransitioning = true;
    }

    if (this.isTransitioning) {
      const dc = this.targetCol - this.col;
      const dr = this.targetRow - this.row;
      const dist = Math.hypot(dc, dr);

      if (dist <= speed) {
        this.col = this.targetCol;
        this.row = this.targetRow;
        this.isTransitioning = false;

        // Túneles wrap-around
        if (this.col < 0) { this.col = COLS - 1; this.targetCol = COLS - 1; }
        if (this.col >= COLS) { this.col = 0; this.targetCol = 0; }

        if (this.state === GhostState.EATEN && Math.abs(this.col - this.spawnCol) < 0.5 && Math.abs(this.row - this.spawnRow) < 0.5) {
          this.col = this.spawnCol;
          this.row = this.spawnRow;
          this.targetCol = this.spawnCol;
          this.targetRow = this.spawnRow;
          this.state = GhostState.SCATTER;
        }
      } else {
        this.col += (dc / dist) * speed;
        this.row += (dr / dist) * speed;
      }
    }
  }

  /**
   * Elige la siguiente celda destino basándose en el estado y pathfinding.
   * @private
   */
  _chooseNextTarget(board, pacman, blinky) {
    let target;
    if (this.state === GhostState.EATEN) {
      target = { col: this.spawnCol, row: this.spawnRow };
      const step = bfsNextStep(this, target, board);
      if (step) {
        this.targetCol = Math.round(this.col) + step.dc;
        this.targetRow = Math.round(this.row) + step.dr;
      }
      return;
    }
    if (this.state === GhostState.FRIGHTENED) {
      const dir = randomDirection(this, board);
      this.targetCol = Math.round(this.col) + dir.dc;
      this.targetRow = Math.round(this.row) + dir.dr;
      return;
    }
    target = this.state === GhostState.SCATTER
      ? this.scatterTarget
      : this.getChaseTarget(pacman, blinky);

    const step = bfsNextStep(this, target, board);
    if (step) {
      this.targetCol = Math.round(this.col) + step.dc;
      this.targetRow = Math.round(this.row) + step.dr;
    } else {
      const dir = randomDirection(this, board);
      this.targetCol = Math.round(this.col) + dir.dc;
      this.targetRow = Math.round(this.row) + dir.dr;
    }
  }

  /**
   * Dibuja el fantasma en el canvas.
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} cellSize
   * @param {number} tick
   * @returns {void}
   */
  /**
   * Dibuja el fantasma (árbitro) en el canvas con temática FWC.
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} cellSize
   * @param {number} tick
   * @returns {void}
   */
  draw(ctx, cellSize, tick) {
    if (this.currentDelay > 0) return;
    const x = this.col * cellSize + cellSize / 2;
    const y = this.row * cellSize + cellSize / 2;

    ctx.save();
    ctx.translate(x, y);

    // 1. Dibujar anillo indicador de color del árbitro en los pies (estilo FIFA/PES cursor)
    if (this.state !== GhostState.EATEN) {
      ctx.beginPath();
      ctx.ellipse(0, cellSize * 0.35, cellSize * 0.35, cellSize * 0.15, 0, 0, Math.PI * 2);
      ctx.fillStyle = this.color + '55'; // Color traslúcido
      ctx.fill();
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // 2. Dibujar cuerpo o eyes
    if (this.state === GhostState.EATEN) {
      const r = cellSize * 0.4;
      this._drawEyes(ctx, r, false);
    } else {
      if (refereeImage.complete) {
        // Filtros de estado asustado o congelado
        if (this.state === GhostState.FRIGHTENED) {
          const isWarning = this.frightenedTicks < 2.0;
          const blink = Math.floor(tick / 10) % 2 === 0;
          if (isWarning && blink) {
            ctx.filter = 'invert(1) grayscale(1) brightness(2)'; // Parpadeo blanco
          } else {
            ctx.filter = 'hue-rotate(200deg) brightness(0.7) saturate(2)'; // Azul marino neón
          }
        } else if (this.isFrozen) {
          ctx.filter = 'hue-rotate(160deg) brightness(1.2) saturate(2)'; // Cian congelado
        }

        ctx.drawImage(refereeImage, -cellSize / 2, -cellSize / 2, cellSize, cellSize);
        ctx.filter = 'none'; // reset

        // Si está asustado dibujamos además los ojos "x_x" por encima del árbitro
        if (this.state === GhostState.FRIGHTENED) {
          const r = cellSize * 0.4;
          this._drawEyes(ctx, r, true);
        }
      } else {
        // Fallback vectorial clásico
        const r = cellSize * 0.4;
        if (this.state === GhostState.FRIGHTENED) {
          const isWarning = this.frightenedTicks < 2.0;
          const blink = Math.floor(tick / 10) % 2 === 0;
          let ghostColor = '#0000BB';
          if (isWarning && blink) ghostColor = '#FFFFFF';
          this._drawGhostBody(ctx, r, ghostColor);
          this._drawEyes(ctx, r, true);
        } else {
          let bodyColor = this.color;
          if (this.isFrozen) bodyColor = '#00FFFF';
          this._drawGhostBody(ctx, r, bodyColor);
          this._drawEyes(ctx, r, false);
        }
      }
    }

    ctx.restore();
  }

  /**
   * Dibuja el cuerpo del fantasma centrado en (0,0).
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} r - Radio
   * @param {string} color
   * @private
   */
  _drawGhostBody(ctx, r, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(0, -r * 0.1, r, Math.PI, 0);
    ctx.lineTo(r, r * 0.9);
    const waves = 3;
    for (let i = 0; i <= waves; i++) {
      const step = (i / waves) * 2 - 1;
      const wx = -r * step;
      const wy = r * 0.9 - (i % 2 === 0 ? 0 : r * 0.2);
      ctx.lineTo(wx, wy);
    }
    ctx.lineTo(-r, r * 0.9);
    ctx.closePath();
    ctx.fill();
  }

  /**
   * Dibuja los ojos del fantasma.
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} r - Radio
   * @param {boolean} isFrightened
   * @private
   */
  _drawEyes(ctx, r, isFrightened) {
    if (isFrightened) {
      ctx.fillStyle = '#fff';
      ctx.font = `bold ${r * 0.8}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('x_x', 0, 0);
      return;
    }
    [ -0.5, 0.5 ].forEach((ox) => {
      ctx.beginPath();
      ctx.arc(ox * r, -r * 0.3, r * 0.3, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(ox * r + r * 0.1, -r * 0.3, r * 0.15, 0, Math.PI * 2);
      ctx.fillStyle = '#00f';
      ctx.fill();
    });
  }
}

// ─── Subclases de fantasmas ───────────────────────────────────────────────────

/**
 * Blinky (Rojo): Persigue directamente a PacMan.
 */
export class Blinky extends Ghost {
  constructor() {
    super(13, 14, '#FF0000', { col: COLS - 1, row: 0 }, 'BLINKY', 0);
  }
  getChaseTarget(pacman) {
    return { col: pacman.col, row: pacman.row };
  }
}

/**
 * Pinky (Rosa): Intenta emboscar a PacMan (4 celdas adelante).
 */
export class Pinky extends Ghost {
  constructor() {
    super(14, 14, '#FFB8FF', { col: 0, row: 0 }, 'PINKY', 30);
  }
  getChaseTarget(pacman) {
    const dirMap = {
      up:    { dc: 0, dr: -4 },
      down:  { dc: 0, dr: 4 },
      left:  { dc: -4, dr: 0 },
      right: { dc: 4, dr: 0 },
    };
    const offset = dirMap[pacman.direction] || { dc: 0, dr: 0 };
    return {
      col: pacman.col + offset.dc,
      row: pacman.row + offset.dr
    };
  }
}

/**
 * Inky (Cian): Movimiento impredecible (alterna entre perseguir y aleatorio).
 */
export class Inky extends Ghost {
  constructor() {
    super(13, 15, '#00FFFF', { col: COLS - 1, row: ROWS - 1 }, 'INKY', 60);
    this.randomMode = false;
    this.modeTimer = 0;
  }
  getChaseTarget(pacman, blinky) {
    // Inky alterna su lógica cada 5 segundos
    if (this.randomMode) {
      return this.scatterTarget;
    }
    // Lógica simplificada de Inky: usa la posición de Blinky para "rodear"
    if (!blinky) return { col: pacman.col, row: pacman.row };
    const targetX = pacman.col + (pacman.col - blinky.col);
    const targetY = pacman.row + (pacman.row - blinky.row);
    return { col: targetX, row: targetY };
  }

  update(board, pacman, blinky, dt, speedMultiplier) {
    this.modeTimer += dt;
    if (this.modeTimer > 5) {
      this.randomMode = !this.randomMode;
      this.modeTimer = 0;
    }
    super.update(board, pacman, blinky, dt, speedMultiplier);
  }
}

/**
 * Clyde (Naranja): Cobarde. Persigue si está lejos, huye si está cerca.
 */
export class Clyde extends Ghost {
  constructor() {
    super(14, 15, '#FFB852', { col: 0, row: ROWS - 1 }, 'CLYDE', 90);
  }
  getChaseTarget(pacman) {
    const dist = Math.hypot(this.col - pacman.col, this.row - pacman.row);
    if (dist > 8) {
      return { col: pacman.col, row: pacman.row };
    } else {
      return this.scatterTarget;
    }
  }
}
