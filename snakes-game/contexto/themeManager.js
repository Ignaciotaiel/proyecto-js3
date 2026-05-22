// themeManager.js
// módulo que gestiona el modo oscuro/claro con localStorage
// se importa en todas las páginas del juego

const STORAGE_KEY = 'snakes-theme';

// obtiene el tema guardado o usa oscuro por defecto
function getSavedTheme() {
  return localStorage.getItem(STORAGE_KEY) || 'dark';
}

// aplica el tema al documento y actualiza el ícono del botón
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const btn = document.getElementById('theme-toggle');
  if (!btn) return;
  btn.textContent = theme === 'dark' ? '☀️' : '🌙';
  btn.title = theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro';
}

// guarda el tema en localStorage
function saveTheme(theme) {
  localStorage.setItem(STORAGE_KEY, theme);
}

// alterna entre oscuro y claro
function toggleTheme() {
  const current = getSavedTheme();
  const next = current === 'dark' ? 'light' : 'dark';
  saveTheme(next);
  applyTheme(next);
}

// inicializa el tema al cargar la página
function initTheme() {
  const theme = getSavedTheme();
  applyTheme(theme);

  const btn = document.getElementById('theme-toggle');
  if (btn) {
    btn.addEventListener('click', toggleTheme);
  }
}

export { initTheme, toggleTheme, getSavedTheme, applyTheme };
