// animationManager.js
// módulo para efectos visuales sobre el canvas del juego
// maneja partículas, flashes y transiciones de turno

// flash de color sobre el canvas al cambiar de turno
function flashCanvas(canvas, color, duration = 300) {
  const ctx = canvas.getContext('2d');
  const { width, height } = canvas;

  let opacity = 0.4;
  const step = 0.4 / (duration / 16);

  const fade = () => {
    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
    opacity -= step;
    if (opacity > 0) requestAnimationFrame(fade);
  };

  requestAnimationFrame(fade);
}

// partículas de explosión al morir la serpiente
function explodeAt(canvas, x, y, color) {
  const ctx = canvas.getContext('2d');
  const particles = [];

  for (let i = 0; i < 18; i++) {
    const angle = (Math.PI * 2 * i) / 18;
    const speed = 2 + Math.random() * 3;
    particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      alpha: 1,
      radius: 4 + Math.random() * 4,
    });
  }

  const animate = () => {
    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= 0.04;
      p.vx *= 0.95;
      p.vy *= 0.95;

      if (p.alpha <= 0) return;

      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    if (particles.some(p => p.alpha > 0)) {
      requestAnimationFrame(animate);
    }
  };

  requestAnimationFrame(animate);
}

// animación de pulso en un elemento del DOM (inicio de turno)
function pulseElement(selector) {
  const el = document.querySelector(selector);
  if (!el) return;
  el.classList.remove('turn-pulse');
  void el.offsetWidth; // forzar reflow para reiniciar animación
  el.classList.add('turn-pulse');
}

// dibuja texto flotante sobre el canvas
function floatText(canvas, text, x, y, color = '#fff') {
  const ctx = canvas.getContext('2d');
  let posY = y;
  let alpha = 1;

  const draw = () => {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.font = 'bold 16px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(text, x, posY);
    ctx.restore();
    posY -= 1.5;
    alpha -= 0.025;
    if (alpha > 0) requestAnimationFrame(draw);
  };

  requestAnimationFrame(draw);
}

export { flashCanvas, explodeAt, pulseElement, floatText };
