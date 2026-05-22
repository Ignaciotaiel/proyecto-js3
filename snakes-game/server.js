// servidor principal de snakes-game
// sirve archivos estáticos y define rutas para las páginas del juego

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 8001;

// servir archivos estáticos desde cada carpeta del proyecto
app.use('/scripts', express.static(path.join(__dirname, 'scripts')));
app.use('/styles', express.static(path.join(__dirname, 'styles')));
app.use('/modules', express.static(path.join(__dirname, 'modules')));
app.use('/contexto', express.static(path.join(__dirname, 'contexto')));
app.use('/pages', express.static(path.join(__dirname, 'pages')));

// rutas principales del juego
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'pages', 'index.html'));
});

app.get('/game', (req, res) => {
  res.sendFile(path.join(__dirname, 'pages', 'game.html'));
});

app.get('/levels', (req, res) => {
  res.sendFile(path.join(__dirname, 'pages', 'levels.html'));
});

// iniciar servidor
app.listen(PORT, () => {
  console.log(`snakes-game corriendo en http://localhost:${PORT}`);
});
