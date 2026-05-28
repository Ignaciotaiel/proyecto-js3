/**
 * @module storage
 * @description Funciones async para comunicarse con la API REST del servidor.
 * Maneja jugadores y ranking.
 */

const API_BASE = '/api';

/**
 * Obtiene todos los jugadores registrados desde la API.
 * @returns {Promise<Array>} Lista de jugadores
 */
export async function fetchPlayers() {
  const res = await fetch(`${API_BASE}/players`);
  if (!res.ok) throw new Error(`Error ${res.status}: No se pudo obtener jugadores`);
  return res.json();
}

/**
 * Guarda o actualiza el score de un jugador.
 * @param {{ name: string, avatar: string, score: number, mode: string }} playerData
 * @returns {Promise<Object>} Jugador guardado
 */
export async function saveScore(playerData) {
  const res = await fetch(`${API_BASE}/players`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(playerData),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Error ${res.status}`);
  }
  return res.json();
}

/**
 * Registra un jugador nuevo antes de jugar (sin score).
 * @param {{ name: string, avatar: string }} data
 * @returns {Promise<Object>} Jugador registrado
 */
export async function registerPlayer(data) {
  const res = await fetch(`${API_BASE}/players/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Error ${res.status}`);
  }
  return res.json();
}

/**
 * Obtiene el ranking de jugadores, opcionalmente filtrado por modo.
 * @param {string|null} mode - Modo de juego para filtrar
 * @returns {Promise<Array>} Ranking de jugadores
 */
export async function fetchRanking(mode = null) {
  const url = mode
    ? `${API_BASE}/ranking?mode=${encodeURIComponent(mode)}`
    : `${API_BASE}/ranking`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Error ${res.status}: No se pudo obtener ranking`);
  return res.json();
}
