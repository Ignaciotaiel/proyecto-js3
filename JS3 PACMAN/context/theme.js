/**
 * @module theme
 * @description Gestiona el tema oscuro/claro de la aplicación.
 * Aplica `data-bs-theme` al elemento `<html>` y persiste la preferencia en localStorage.
 */

const STORAGE_KEY = 'pacman-theme';

/**
 * Activa el modo oscuro en el documento.
 * @returns {void}
 */
export function enableDarkMode() {
  document.documentElement.setAttribute('data-bs-theme', 'dark');
  localStorage.setItem(STORAGE_KEY, 'dark');
  updateToggleIcon('dark');
}

/**
 * Activa el modo claro en el documento.
 * @returns {void}
 */
export function enableLightMode() {
  document.documentElement.setAttribute('data-bs-theme', 'light');
  localStorage.setItem(STORAGE_KEY, 'light');
  updateToggleIcon('light');
}

/**
 * Alterna entre modo oscuro y claro.
 * @returns {void}
 */
export function toggleTheme() {
  const current = document.documentElement.getAttribute('data-bs-theme');
  if (current === 'dark') {
    enableLightMode();
  } else {
    enableDarkMode();
  }
}

/**
 * Lee la preferencia guardada en localStorage y la aplica.
 * Si no hay preferencia, usa modo oscuro por defecto.
 * @returns {string} El tema aplicado ('dark' o 'light')
 */
export function getSavedTheme() {
  const saved = localStorage.getItem(STORAGE_KEY) || 'dark';
  if (saved === 'light') {
    enableLightMode();
  } else {
    enableDarkMode();
  }
  return saved;
}

/**
 * Actualiza el ícono del botón toggle en el navbar, si existe.
 * @param {'dark'|'light'} theme - Tema actual
 * @returns {void}
 */
function updateToggleIcon(theme) {
  const btn = document.getElementById('theme-toggle');
  if (!btn) return;
  btn.innerHTML = theme === 'dark'
    ? '<i class="bi bi-sun-fill"></i>'
    : '<i class="bi bi-moon-fill"></i>';
  btn.setAttribute('title', theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro');
}
