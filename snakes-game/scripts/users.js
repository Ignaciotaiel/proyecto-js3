// users.js
// gestión de usuarios con localStorage
// soporta registro, login y recuperación de jugadores para modo 1v1

const STORAGE_KEY = 'snakes-users';
const SESSION_KEY = 'snakes-session';
const PLAYERS_KEY = 'snakes-players';

// obtiene todos los usuarios registrados
function getAllUsers() {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : {};
}

// guarda el mapa de usuarios en localStorage
function saveUsers(users) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
}

// registra un nuevo usuario con nombre y contraseña
// devuelve { ok, message }
function registerUser(name, password) {
  if (!name || !name.trim()) {
    return { ok: false, message: 'el nombre no puede estar vacío.' };
  }
  if (!password || password.length < 3) {
    return { ok: false, message: 'la contraseña debe tener al menos 3 caracteres.' };
  }

  const users = getAllUsers();
  const key = name.trim().toLowerCase();

  if (users[key]) {
    return { ok: false, message: 'ese nombre de usuario ya existe.' };
  }

  users[key] = { name: name.trim(), password };
  saveUsers(users);
  return { ok: true, message: 'usuario registrado correctamente.' };
}

// inicia sesión si el usuario y contraseña son correctos
// devuelve { ok, message, name }
function loginUser(name, password) {
  if (!name || !name.trim()) {
    return { ok: false, message: 'ingresá tu nombre de usuario.' };
  }

  const users = getAllUsers();
  const key = name.trim().toLowerCase();
  const user = users[key];

  if (!user) {
    return { ok: false, message: 'usuario no encontrado.' };
  }

  if (user.password !== password) {
    return { ok: false, message: 'contraseña incorrecta.' };
  }

  // guardar sesión del jugador actual
  const session = getSessionData();
  if (!session.player1) {
    session.player1 = user.name;
  } else {
    session.player2 = user.name;
  }
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));

  return { ok: true, message: `bienvenido, ${user.name}!`, name: user.name };
}

// obtiene el objeto de sesión actual
function getSessionData() {
  const raw = localStorage.getItem(SESSION_KEY);
  return raw ? JSON.parse(raw) : {};
}

// devuelve los dos jugadores configurados para la partida
function getPlayers() {
  const session = getSessionData();
  return {
    player1: session.player1 || null,
    player2: session.player2 || null,
  };
}

// guarda directamente los nombres de los dos jugadores (modo rápido)
function setPlayers(player1Name, player2Name) {
  const session = { player1: player1Name, player2: player2Name };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

// limpia la sesión actual (logout)
function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

export { registerUser, loginUser, getPlayers, setPlayers, clearSession, getSessionData };
