/**
 * @module server
 * @description Servidor Express que sirve la aplicación PacMan.
 * Proporciona archivos estáticos y una API REST para jugadores y ranking.
 */

import express from 'express';
import cors from 'cors';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { getPlayers, savePlayer, registerPlayer, getRanking } from './modules/dataManager.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;
const app = express();

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// Servir archivos estáticos de cada carpeta del proyecto
app.use(express.static(join(__dirname, 'pages')));
app.use('/scripts', express.static(join(__dirname, 'scripts')));
app.use('/styles', express.static(join(__dirname, 'styles')));
app.use('/modules', express.static(join(__dirname, 'modules')));
app.use('/context', express.static(join(__dirname, 'context')));

// ─── Helpers de validación ────────────────────────────────────────────────────

/**
 * Valida que un nombre de jugador cumpla con los requisitos.
 * @param {string} name - Nombre a validar
 * @returns {{ valid: boolean, error?: string }}
 */
function validateName(name) {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: 'El nombre es requerido.' };
  }
  const trimmed = name.trim();
  if (trimmed.length < 2) {
    return { valid: false, error: 'El nombre debe tener al menos 2 caracteres.' };
  }
  if (trimmed.length > 20) {
    return { valid: false, error: 'El nombre no puede superar 20 caracteres.' };
  }
  if (!/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s_-]+$/.test(trimmed)) {
    return { valid: false, error: 'El nombre contiene caracteres no permitidos.' };
  }
  return { valid: true };
}

// ─── Rutas API ────────────────────────────────────────────────────────────────

/**
 * GET /api/players — Devuelve todos los jugadores registrados.
 */
app.get('/api/players', async (req, res) => {
  try {
    const players = await getPlayers();
    res.json(players);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener jugadores.', detail: err.message });
  }
});

/**
 * POST /api/players — Registra un jugador nuevo o actualiza su score.
 * Body: { name, avatar, score?, mode? }
 */
app.post('/api/players', async (req, res) => {
  try {
    const { name, avatar, score, mode } = req.body || {};
    const validation = validateName(name);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }
    const result = await savePlayer({
      name: name.trim(),
      avatar: avatar || '🎮',
      score: typeof score === 'number' ? score : 0,
      mode: mode || 'solo',
    });
    const status = result.created ? 201 : 200;
    res.status(status).json(result.player);
  } catch (err) {
    res.status(500).json({ error: 'Error al guardar jugador.', detail: err.message });
  }
});

/**
 * POST /api/players/register — Registra un jugador sin score (antes de jugar).
 * Body: { name, avatar }
 */
app.post('/api/players/register', async (req, res) => {
  try {
    const { name, avatar } = req.body || {};
    const validation = validateName(name);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }
    const result = await registerPlayer({ name: name.trim(), avatar: avatar || '🎮' });
    const status = result.created ? 201 : 200;
    res.status(status).json(result.player);
  } catch (err) {
    res.status(500).json({ error: 'Error al registrar jugador.', detail: err.message });
  }
});

/**
 * GET /api/ranking — Devuelve el ranking de jugadores ordenado por score.
 * Query: ?mode=solo|two_players|vs_bot|turns
 */
app.get('/api/ranking', async (req, res) => {
  try {
    const { mode } = req.query;
    const ranking = await getRanking(mode || null);
    res.json(ranking);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener ranking.', detail: err.message });
  }
});

// ─── Ruta raíz y fallback ─────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.sendFile(join(__dirname, 'pages', 'index.html'));
});

app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada.' });
});

// ─── Iniciar servidor ─────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🎮 PacMan server running at http://localhost:${PORT}`);
});
