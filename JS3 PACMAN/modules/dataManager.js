/**
 * @module dataManager
 * @description Gestiona la persistencia de jugadores y scores en data/players.json
 */

import { readFile, writeFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_PATH = join(__dirname, '../data/players.json');

/**
 * Lee y devuelve todos los jugadores del archivo de datos.
 * @returns {Promise<Array>} Lista de jugadores
 */
export async function getPlayers() {
  try {
    const raw = await readFile(DATA_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

/**
 * Persiste la lista completa de jugadores en el archivo de datos.
 * @param {Array} players - Lista de jugadores a guardar
 * @returns {Promise<void>}
 */
async function persistPlayers(players) {
  await writeFile(DATA_PATH, JSON.stringify(players, null, 2), 'utf-8');
}

/**
 * Guarda o actualiza un jugador. Si el nombre ya existe, solo actualiza
 * el score si el nuevo es mayor. Devuelve el jugador guardado.
 * @param {{ name: string, avatar: string, score: number, mode: string }} playerData
 * @returns {Promise<{ player: Object, created: boolean }>}
 */
export async function savePlayer(playerData) {
  const players = await getPlayers();
  const existingIndex = players.findIndex(
    (p) => p.name.toLowerCase() === playerData.name.toLowerCase()
  );
  if (existingIndex !== -1) {
    const existing = players[existingIndex];
    if (playerData.score > (existing.score || 0)) {
      players[existingIndex] = {
        ...existing,
        score: playerData.score,
        mode: playerData.mode,
        avatar: playerData.avatar || existing.avatar,
        updatedAt: new Date().toISOString(),
      };
    }
    await persistPlayers(players);
    return { player: players[existingIndex], created: false };
  }
  const newPlayer = {
    id: Date.now().toString(),
    name: playerData.name,
    avatar: playerData.avatar || '🎮',
    score: playerData.score || 0,
    mode: playerData.mode || 'solo',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  players.push(newPlayer);
  await persistPlayers(players);
  return { player: newPlayer, created: true };
}

/**
 * Registra un jugador sin score (para el registro previo al juego).
 * Si ya existe, lo devuelve sin modificar.
 * @param {{ name: string, avatar: string }} data
 * @returns {Promise<{ player: Object, created: boolean }>}
 */
export async function registerPlayer(data) {
  const players = await getPlayers();
  const existing = players.find(
    (p) => p.name.toLowerCase() === data.name.toLowerCase()
  );
  if (existing) {
    return { player: existing, created: false };
  }
  return savePlayer({ name: data.name, avatar: data.avatar, score: 0, mode: 'solo' });
}

/**
 * Devuelve los jugadores ordenados por score descendente.
 * Opcionalmente filtra por modo de juego.
 * @param {string|null} mode - Modo de juego para filtrar (opcional)
 * @returns {Promise<Array>} Ranking de jugadores
 */
export async function getRanking(mode = null) {
  const players = await getPlayers();
  const filtered = mode ? players.filter((p) => p.mode === mode) : players;
  return filtered
    .filter((p) => p.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 50);
}
