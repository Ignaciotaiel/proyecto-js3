// levels.js
// configuración de los 6 niveles del juego
// a mayor nivel, grilla más grande y velocidad mayor (ms menor)

const LEVELS = [
  { id: 1, label: 'Nivel 1', grid: 16, speed: 170, description: 'Grilla pequeña, ritmo lento. Ideal para empezar.' },
  { id: 2, label: 'Nivel 2', grid: 20, speed: 150, description: 'Un poco más de espacio, un poco más de prisa.' },
  { id: 3, label: 'Nivel 3', grid: 24, speed: 140, description: 'La grilla crece y el tiempo escasea.' },
  { id: 4, label: 'Nivel 4', grid: 28, speed: 120, description: 'Reflejos rápidos obligatorios.' },
  { id: 5, label: 'Nivel 5', grid: 32, speed: 100, description: 'Modo experto: reacción en décimas de segundo.' },
  { id: 6, label: 'Nivel 6', grid: 36, speed: 70,  description: '¡Caos total! Solo los mejores sobreviven.' },
];

const LEVEL_STORAGE_KEY = 'snakes-level';

// devuelve la configuración de un nivel por su id
function getLevelById(id) {
  return LEVELS.find(l => l.id === id) || null;
}

// guarda el nivel seleccionado en localStorage
function saveSelectedLevel(levelId) {
  localStorage.setItem(LEVEL_STORAGE_KEY, String(levelId));
}

// recupera el nivel seleccionado guardado
function getSelectedLevel() {
  const raw = localStorage.getItem(LEVEL_STORAGE_KEY);
  if (!raw) return null;
  return getLevelById(Number(raw));
}

// devuelve todos los niveles disponibles
function getAllLevels() {
  return LEVELS;
}

export { LEVELS, getLevelById, saveSelectedLevel, getSelectedLevel, getAllLevels };
