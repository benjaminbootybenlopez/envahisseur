/**
 * Petites aides de dessin partagées.
 */
import { TAU } from '../utils/math.js';
import { ctx } from './canvas.js';

export function glow(c, b) { ctx.shadowColor = c; ctx.shadowBlur = b; }
export function poly(x, y, r, n, rot) {
  ctx.beginPath();
  for (let i = 0; i < n; i++) { const a = rot + i * TAU / n; if (i) ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); else ctx.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r); }
  ctx.closePath();
}
