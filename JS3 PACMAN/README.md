# 👾 PacMan JS3

Juego clásico de PacMan implementado con **Vanilla JavaScript**, **Node.js + Express** y **Bootstrap 5**. Arquitectura modular con ES Modules, canvas HTML5 y API REST para persistencia de scores.

---

## 📁 Estructura del proyecto

```
pacman/
├── pages/
│   ├── index.html        # Landing con selector de modo
│   ├── game.html         # Canvas del juego + panel lateral
│   ├── players.html      # Registro y selección de jugadores
│   └── ranking.html      # Tabla de top scores filtrable
├── scripts/
│   ├── main.js           # Lógica del landing
│   ├── game.js           # Game loop principal
│   ├── players.js        # Formulario y lista de jugadores
│   └── ranking.js        # Tabla de ranking
├── styles/
│   ├── main.css          # Estilos globales y animaciones
│   ├── game.css          # Canvas, panel lateral, D-pad
│   └── players.css       # Formulario y lista de jugadores
├── modules/
│   ├── pacman.js         # Clase PacMan (movimiento, animación, colisión)
│   ├── ghost.js          # 4 fantasmas con IA (BFS, scatter, frighten)
│   ├── board.js          # Mapa 28×31, puntos, paredes, power-ups
│   ├── storage.js        # Cliente HTTP para la API REST
│   ├── gameMode.js       # GameSession: modos, turnos, input routing
│   ├── bot.js            # IA del bot (BFS hacia punto más cercano)
│   └── dataManager.js    # Lectura/escritura de data/players.json
├── context/
│   └── theme.js          # Dark/light mode con localStorage
├── data/
│   └── players.json      # Persistencia de jugadores y scores
├── server.js             # Servidor Express + API REST
├── package.json
└── README.md
```

---

## 🚀 Instalación y ejecución

```bash
# 1. Instalar dependencias
npm install

# 2. Iniciar el servidor
node server.js

# O en modo desarrollo (con auto-reload)
npm run dev
```

El servidor levanta en **http://localhost:3000** por defecto.

Para cambiar el puerto:
```bash
PORT=8080 node server.js
```

---

## 🎮 Modos de juego

| Modo | Descripción | Controles |
|------|-------------|-----------|
| **Solo** | Modo clásico, 1 jugador | `WASD` o `↑↓←→` |
| **2 Jugadores** | Pantallas independientes, compiten por score | P1: `WASD` · P2: `↑↓←→` |
| **Vs Bot** | Jugador humano vs PacMan con IA (BFS) | `WASD` o `↑↓←→` |
| **Por Turnos** | 2 jugadores alternando cada 30 segundos | `WASD` o `↑↓←→` según turno |

### Mecánicas

- 🟡 Puntos: **+10** cada uno
- ⭐ Power-up: **+50** · fantasmas asustados 8 segundos
- 👻 Comer fantasma: **+200 / +400 / +800 / +1600** (combo)
- ❤️ 3 vidas · siguiente nivel al limpiar el mapa
- Velocidad aumenta **~10%** por nivel

### IA de los fantasmas

| Fantasma | Color | Comportamiento |
|----------|-------|----------------|
| **Blinky** | 🔴 Rojo | Persigue directamente a PacMan |
| **Pinky** | 🩷 Rosa | Anticipa 4 celdas adelante de PacMan |
| **Inky** | 🔵 Cyan | Comportamiento vectorial usando posición de Blinky |
| **Clyde** | 🟠 Naranja | Persigue si está lejos, huye si está a < 8 celdas |

---

## 🌐 API REST

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/players` | Lista todos los jugadores |
| `POST` | `/api/players` | Guarda/actualiza score de un jugador |
| `POST` | `/api/players/register` | Registra jugador nuevo (sin score) |
| `GET` | `/api/ranking` | Ranking ordenado por score (`?mode=solo\|two_players\|vs_bot\|turns`) |

### Ejemplo de jugador

```json
{
  "id": "1700000000000",
  "name": "PacFan",
  "avatar": "🎮",
  "score": 4200,
  "mode": "solo",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T12:00:00.000Z"
}
```

---

## 🎨 Tecnologías

- **Node.js 18+** con ES Modules (`"type": "module"`)
- **Express 4** — servidor HTTP y API REST
- **Bootstrap 5.3** — UI, modales, tablas, formularios
- **Bootstrap Icons** — iconografía
- **Canvas HTML5** — render del juego (28×31 celdas)
- **Press Start 2P** (Google Fonts) — tipografía retro arcade
- **Vanilla CSS** — animaciones y estilos custom
- **localStorage** — preferencia de tema dark/light
- **sessionStorage** — jugador activo y modo seleccionado

---

## 🗺️ Flujo de uso

1. Abrir **http://localhost:3000** → Landing con los 4 modos
2. Ir a **Jugadores** → Registrar nombre + avatar emoji
3. Seleccionar jugador de la lista → Volver al landing
4. Elegir modo de juego → Jugar
5. Al terminar → Score guardado automáticamente → Ver en **Ranking**
