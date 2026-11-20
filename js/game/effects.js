/**
 * Effets visuels : particules, ondes, textes flottants, tremblements.
 */
import { COLORS, H, W } from '../config.js';
import { compact, lerp, pick, rand, TAU } from '../utils/math.js';
import { dashTrail, floatingTexts, game, particles, rings } from '../state.js';

export function burst(x, y, color, n, speed, size, life) {
  for (let i = 0; i < n; i++) {
    if (particles.length > 1400) break;
    const a = rand(0, TAU), s = speed * rand(0.2, 1);
    particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: life * rand(0.5, 1), max: life, size: size * rand(0.5, 1.2), color, drag: 3 });
  }
}
export function spark(x, y, color, a, n) {
  for (let i = 0; i < n; i++) {
    if (particles.length > 1400) break;
    const aa = a + rand(-0.6, 0.6), s = rand(150, 480);
    particles.push({ x, y, vx: Math.cos(aa) * s, vy: Math.sin(aa) * s, life: rand(0.12, 0.3), max: 0.3, size: rand(2, 4), color, drag: 4 });
  }
}
export function ring(x, y, color, maxR, life, width) { rings.push({ x, y, r: 6, maxR, life, max: life, color, width: width || 3 }); }
export function floatText(x, y, txt, color, size) { floatingTexts.push({ x, y, txt, color, life: 0.9, max: 0.9, size: size || 18 }); }
export function shake(v) { game.shake = Math.max(game.shake, v); }

export function updateEffects(dt) {
  for (const p of particles) {
    p.life -= dt; if (p.life <= 0) { p.dead = true; continue; }
    const k = Math.exp(-p.drag * dt); p.vx *= k; p.vy *= k; p.x += p.vx * dt; p.y += p.vy * dt;
  }
  for (const r of rings) { r.life -= dt; if (r.life <= 0) r.dead = true; else r.r = lerp(r.maxR, 6, Math.pow(r.life / r.max, 2)); }
  for (const t of floatingTexts) { t.life -= dt; t.y -= 36 * dt; if (t.life <= 0) t.dead = true; }
  for (const g of dashTrail) { g.life -= dt; if (g.life <= 0) g.dead = true; }
}

/** Particules qui dérivent derrière l'écran titre. */
export function updateMenuAmbience(dt) {
  if (Math.random() < dt * 14 && particles.length < 160) {
    particles.push({ x: rand(0, W), y: H + 10, vx: rand(-20, 20), vy: rand(-140, -40), life: rand(4, 8), max: 8, size: rand(2, 4), color: pick([COLORS.alien, '#6bd6ff', '#b46bff']), drag: 0 });
  }
  for (const p of particles) { p.life -= dt; if (p.life <= 0) p.dead = true; p.x += p.vx * dt; p.y += p.vy * dt; }
  compact(particles);
}
