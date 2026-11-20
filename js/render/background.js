/**
 * Décor de fond (ville vue du ciel), dessiné une seule fois.
 */
import { H, W } from '../config.js';

/** Dessine le décor sur un canvas hors écran, réutilisé à chaque image. */
function createBackground() {
  const bg = document.createElement('canvas');
  bg.width = W; bg.height = H;
  const c = bg.getContext('2d');
  const g = c.createRadialGradient(W / 2, H / 2, 100, W / 2, H / 2, 1000);
  g.addColorStop(0, '#0a0d24'); g.addColorStop(1, '#03040b');
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  // pâtés de maisons vus du ciel
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  c.lineWidth = 1;
  for (let gx = 0; gx < W; gx += 200) for (let gy = 0; gy < H; gy += 150) {
    const n = 1 + ((rnd() * 4) | 0);
    for (let i = 0; i < n; i++) {
      const w = 30 + rnd() * 70, h = 24 + rnd() * 50, x = gx + 14 + rnd() * (172 - w), y = gy + 14 + rnd() * (122 - h);
      c.strokeStyle = 'rgba(90,115,230,' + (0.07 + rnd() * 0.09) + ')';
      c.strokeRect(x, y, w, h);
      if (rnd() < 0.35) { c.fillStyle = 'rgba(90,115,230,0.035)'; c.fillRect(x, y, w, h); }
    }
  }
  // routes
  c.strokeStyle = 'rgba(70,95,200,0.16)'; c.lineWidth = 2;
  for (let x = 0; x <= W; x += 200) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, H); c.stroke(); }
  for (let y = 0; y <= H; y += 150) { c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }
  c.strokeStyle = 'rgba(70,95,200,0.05)'; c.lineWidth = 1;
  for (let x = 0; x <= W; x += 50) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, H); c.stroke(); }
  for (let y = 0; y <= H; y += 50) { c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }
  // vignette
  const v = c.createRadialGradient(W / 2, H / 2, 380, W / 2, H / 2, 980);
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.6)');
  c.fillStyle = v; c.fillRect(0, 0, W, H);
  c.strokeStyle = 'rgba(92,255,200,0.25)'; c.lineWidth = 3; c.strokeRect(1.5, 1.5, W - 3, H - 3);
  return bg;
}

export const background = createBackground();
