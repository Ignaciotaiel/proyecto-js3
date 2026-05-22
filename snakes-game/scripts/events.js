// events.js
// módulo de control de teclado para el juego snake 1v1
// jugador 1: WASD | jugador 2: flechas del teclado

// dirección opuesta para evitar giros de 180°
const OPPOSITES = {
  UP: 'DOWN', DOWN: 'UP',
  LEFT: 'RIGHT', RIGHT: 'LEFT',
};

// cola de direcciones pendientes por jugador
let queue1 = [];
let queue2 = [];

let listening = false;

// mapeo de teclas a dirección
function getDirection(key) {
  const map = {
    'w': { player: 1, dir: 'UP' },
    'W': { player: 1, dir: 'UP' },
    'a': { player: 1, dir: 'LEFT' },
    'A': { player: 1, dir: 'LEFT' },
    's': { player: 1, dir: 'DOWN' },
    'S': { player: 1, dir: 'DOWN' },
    'd': { player: 1, dir: 'RIGHT' },
    'D': { player: 1, dir: 'RIGHT' },
    'ArrowUp':    { player: 2, dir: 'UP' },
    'ArrowLeft':  { player: 2, dir: 'LEFT' },
    'ArrowDown':  { player: 2, dir: 'DOWN' },
    'ArrowRight': { player: 2, dir: 'RIGHT' },
  };
  return map[key] || null;
}

// agrega una dirección a la cola del jugador correspondiente
function enqueue(player, dir, currentDir) {
  const queue = player === 1 ? queue1 : queue2;
  const lastDir = queue.length > 0 ? queue[queue.length - 1] : currentDir;

  // evitar la dirección opuesta a la última en cola
  if (dir === OPPOSITES[lastDir]) return;
  if (queue.length < 2) queue.push(dir);
}

// handler del evento keydown
function handleKey(e, snake1Dir, snake2Dir) {
  const result = getDirection(e.key);
  if (!result) return;

  // evitar scroll en flechas
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
    e.preventDefault();
  }

  enqueue(result.player, result.dir, result.player === 1 ? snake1Dir : snake2Dir);
}

// inicia la escucha de teclado con contexto de direcciones actuales
function startListening(getDirs) {
  if (listening) return;
  listening = true;

  document.addEventListener('keydown', (e) => {
    const { dir1, dir2 } = getDirs();
    handleKey(e, dir1, dir2);
  });
}

// detiene la escucha (para menú o pausa)
function stopListening() {
  listening = false;
}

// consume la siguiente dirección de la cola del jugador 1
function consumeDir1() {
  return queue1.length > 0 ? queue1.shift() : null;
}

// consume la siguiente dirección de la cola del jugador 2
function consumeDir2() {
  return queue2.length > 0 ? queue2.shift() : null;
}

// vacía ambas colas (al reiniciar)
function resetQueues() {
  queue1 = [];
  queue2 = [];
}

export { startListening, stopListening, consumeDir1, consumeDir2, resetQueues };
