/**
 * @module pacman
 * @description Clase PacMan: movimiento, animación de boca, colisiones y score.
 */

import { Cell, COLS, ROWS } from './board.js';

// Carga de la imagen del jugador temático FWC
const playerImage = new Image();
playerImage.src = '/assets/jugador.png';

/** Posición de spawn de PacMan (columna, fila) */
const SPAWN_COL = 13;
const SPAWN_ROW = 23;

/** Vectores de dirección */
const DIRECTIONS = {
  left:  { dc: -1, dr: 0,  angle: Math.PI },
  right: { dc:  1, dr: 0,  angle: 0 },
  up:    { dc:  0, dr: -1, angle: -Math.PI / 2 },
  down:  { dc:  0, dr:  1, angle: Math.PI / 2 },
};

/**
 * Clase que representa un PacMan jugable.
 */
export class PacMan {
  /**
   * @param {number} [spawnCol] - Columna inicial
   * @param {number} [spawnRow] - Fila inicial
   * @param {string} [color] - Color del PacMan en canvas
   */
  constructor(spawnCol = SPAWN_COL, spawnRow = SPAWN_ROW, color = '#FFD700') {
    this.spawnCol = spawnCol;
    this.spawnRow = spawnRow;
    this.color = color;
    /** @type {string} Dirección actual */
    this.direction = 'right';
    /** @type {string} Próxima dirección solicitada */
    this.nextDirection = 'right';
    /** @type {number} Posición en columna (puede ser decimal durante movimiento) */
    this.col = spawnCol;
    /** @type {number} Posición en fila */
    this.row = spawnRow;
    /** @type {number} Score del jugador */
    this.score = 0;
    /** @type {number} Vidas restantes */
    this.lives = 3;
    /** @type {number} Ángulo de la boca (0 = cerrada, 0.25 = abierta) */
    this.mouthAngle = 0.25;
    /** @type {number} Dirección de la animación de boca (1 = abriendo, -1 = cerrando) */
    this._mouthDir = -1;
    
    // Variables para movimiento continuo
    this.targetCol = spawnCol;
    this.targetRow = spawnRow;
    this.isTransitioning = false;
    this.baseSpeed = 6.0; // celdas por segundo
    
    /** @type {number} Posición pixel x (para render suave) */
    this.pixelX = spawnCol;
    /** @type {number} Posición pixel y */
    this.pixelY = spawnRow;

    // Variables de muerte animada
    this.isDying = false;
    this.deathAngle = 0;
  }

  /**
   * Reinicia PacMan a su posición y estado inicial.
   * @returns {void}
   */
  reset() {
    this.col = this.spawnCol;
    this.row = this.spawnRow;
    this.targetCol = this.spawnCol;
    this.targetRow = this.spawnRow;
    this.isTransitioning = false;
    this.pixelX = this.spawnCol;
    this.pixelY = this.spawnRow;
    this.direction = 'right';
    this.nextDirection = 'right';
    this.mouthAngle = 0.25;
    this._mouthDir = -1;
    this.isDying = false;
    this.deathAngle = 0;
  }

  /**
   * Reinicia completamente (incluyendo score y vidas).
   * @returns {void}
   */
  fullReset() {
    this.reset();
    this.score = 0;
    this.lives = 3;
  }

  /**
   * Solicita un cambio de dirección.
   * @param {'left'|'right'|'up'|'down'} dir
   * @returns {void}
   */
  setDirection(dir) {
    if (DIRECTIONS[dir]) this.nextDirection = dir;
  }

  /**
   * Actualiza la posición de PacMan y come lo que hay en la celda.
   * @param {import('./board.js').Board} board - Tablero actual
   * @param {number} dt - Delta time
   * @param {number} [speedMultiplier=1] - Multiplicador de velocidad del nivel
   * @returns {{ ate: string|null }} Qué comió ('dot', 'power', o null)
   */
  update(board, dt, speedMultiplier = 1.0) {
    if (this.isDying) {
      this.deathAngle += 360 * dt; // Rotar 360 grados por segundo
      return { ate: null };
    }
    this._animateMouth();


    const speed = this.baseSpeed * speedMultiplier * dt;

    if (!this.isTransitioning) {
      // Intentar aplicar la dirección solicitada
      const { dc: ndc, dr: ndr } = DIRECTIONS[this.nextDirection];
      const nextTargetCol = Math.round(this.col) + ndc;
      const nextTargetRow = Math.round(this.row) + ndr;
      if (board.isWalkable(nextTargetCol, nextTargetRow)) {
        this.direction = this.nextDirection;
        this.targetCol = nextTargetCol;
        this.targetRow = nextTargetRow;
        this.isTransitioning = true;
      } else {
        // Seguir en la dirección actual
        const { dc: cdc, dr: cdr } = DIRECTIONS[this.direction];
        const currentTargetCol = Math.round(this.col) + cdc;
        const currentTargetRow = Math.round(this.row) + cdr;
        if (board.isWalkable(currentTargetCol, currentTargetRow)) {
          this.targetCol = currentTargetCol;
          this.targetRow = currentTargetRow;
          this.isTransitioning = true;
        }
      }
    }

    let ateResult = { ate: null };

    if (this.isTransitioning) {
      const dc = this.targetCol - this.col;
      const dr = this.targetRow - this.row;
      const dist = Math.hypot(dc, dr);

      if (dist <= speed) {
        // Llegó al centro de la celda objetivo
        this.col = this.targetCol;
        this.row = this.targetRow;
        this.isTransitioning = false;

        // Túneles laterales de wrap-around
        if (this.col < 0) { this.col = COLS - 1; this.targetCol = COLS - 1; }
        if (this.col >= COLS) { this.col = 0; this.targetCol = 0; }

        ateResult = this._eat(board);
      } else {
        // Moverse hacia la celda objetivo
        this.col += (dc / dist) * speed;
        this.row += (dr / dist) * speed;
      }
    }

    this.pixelX = this.col;
    this.pixelY = this.row;

    return ateResult;
  }

  /**
   * Come el elemento en la celda actual.
   * @param {import('./board.js').Board} board
   * @returns {{ ate: string|null }}
   * @private
   */
  _eat(board) {
    const cell = board.getCell(this.col, this.row);
    if (cell === Cell.DOT) {
      board.setCell(this.col, this.row, Cell.EMPTY);
      this.score += 10;
      return { ate: 'dot' };
    }
    if (cell === Cell.POWER) {
      board.setCell(this.col, this.row, Cell.EMPTY);
      this.score += 50;
      return { ate: 'power' };
    }
    if (cell === Cell.FREEZE) {
      board.setCell(this.col, this.row, Cell.EMPTY);
      this.score += 100;
      return { ate: 'freeze' };
    }
    if (cell === Cell.DOUBLE) {
      board.setCell(this.col, this.row, Cell.EMPTY);
      this.score += 100;
      return { ate: 'double' };
    }
    return { ate: null };
  }

  /**
   * Anima el ángulo de la boca de PacMan.
   * @private
   * @returns {void}
   */
  _animateMouth() {
    this.mouthAngle += this._mouthDir * 0.05;
    if (this.mouthAngle <= 0.02) this._mouthDir = 1;
    if (this.mouthAngle >= 0.25) this._mouthDir = -1;
  }

  /**
   * Verifica si PacMan colisiona con un fantasma.
   * @param {{ col: number, row: number }} ghost
   * @returns {boolean}
   */
  collidesWith(ghost) {
    return (
      Math.abs(this.col - ghost.col) < 0.8 &&
      Math.abs(this.row - ghost.row) < 0.8
    );
  }

  /**
   * Dibuja PacMan en el canvas.
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} cellSize
   * @returns {void}
   */
  draw(ctx, cellSize) {
    const x = this.col * cellSize + cellSize / 2;
    const y = this.row * cellSize + cellSize / 2;
    const r = cellSize * 0.42;

    ctx.save();
    ctx.translate(x, y);

    if (this.isDying) {
      // Girar y encogerse durante la muerte
      ctx.rotate((this.deathAngle * Math.PI) / 180);
      const shrink = Math.max(0.01, 1 - this.deathAngle / 720);
      if (playerImage.complete) {
        ctx.drawImage(playerImage, -cellSize * shrink / 2, -cellSize * shrink / 2, cellSize * shrink, cellSize * shrink);
      } else {
        const mouth = this.mouthAngle * Math.PI;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, r * shrink, mouth, Math.PI * 2 - mouth);
        ctx.closePath();
        ctx.fillStyle = this.color;
        ctx.fill();
      }
    } else {
      // 1. Dibujar anillo indicador del jugador (estilo FIFA/PES cursors)
      ctx.beginPath();
      ctx.ellipse(0, cellSize * 0.35, cellSize * 0.35, cellSize * 0.15, 0, 0, Math.PI * 2);
      ctx.fillStyle = this.color + '55'; // Color del jugador traslúcido
      ctx.fill();
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // 2. Dibujar sprite del jugador o fallback vectorial
      if (playerImage.complete) {
        // Reflejar la imagen horizontalmente si se mueve a la izquierda
        if (this.direction === 'left') {
          ctx.scale(-1, 1);
        }
        ctx.drawImage(playerImage, -cellSize / 2, -cellSize / 2, cellSize, cellSize);
      } else {
        const angle = DIRECTIONS[this.direction]?.angle ?? 0;
        ctx.rotate(angle);
        const mouth = this.mouthAngle * Math.PI;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, r, mouth, Math.PI * 2 - mouth);
        ctx.closePath();
        ctx.fillStyle = this.color;
        ctx.fill();

        // Ojo
        ctx.beginPath();
        ctx.arc(r * 0.35, -r * 0.35, r * 0.12, 0, Math.PI * 2);
        ctx.fillStyle = '#000';
        ctx.fill();
      }
    }

    ctx.restore();
  }
}
