/**
 * Composition d’une image complète, dans l’ordre des calques.
 */
import { COLORS, FONT, H, W } from '../config.js';
import { clamp, rand, TAU } from '../utils/math.js';
import { enemies, enemyShots, floatingTexts, game, particles, pickups, player, playerShots, rings } from '../state.js';
import { audio } from '../audio/engine.js';
import { background } from './background.js';
import { ctx, view } from './canvas.js';
import { drawEnemy, drawTelegraphs } from './enemies.js';
import { drawHud } from './hud.js';
import { drawBeam, drawPlayer } from './player.js';
import { glow, poly } from './shapes.js';

export function render() {
  ctx.setTransform(view.scale * view.dpr, 0, 0, view.scale * view.dpr, 0, 0);
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.shadowBlur = 0;
  ctx.fillStyle = '#02030a'; ctx.fillRect(0, 0, W, H);
  const sx = game.shake ? rand(-game.shake, game.shake) : 0, sy = game.shake ? rand(-game.shake, game.shake) : 0;
  ctx.save(); ctx.translate(sx, sy);
  ctx.drawImage(background, 0, 0);

  // ondes
  for (const r of rings) {
    ctx.globalAlpha = r.life / r.max; ctx.strokeStyle = r.color; ctx.lineWidth = r.width;
    ctx.beginPath(); ctx.arc(r.x, r.y, r.r, 0, TAU); ctx.stroke();
  }
  ctx.globalAlpha = 1;
  // débris
  for (const p of pickups) {
    ctx.globalAlpha = p.life < 2 ? 0.4 + 0.6 * Math.abs(Math.sin(game.time * 12)) : 1;
    ctx.fillStyle = COLORS.shard; glow(COLORS.shard, 10);
    poly(p.x, p.y, 7, 4, p.a); ctx.fill();
  }
  ctx.globalAlpha = 1; ctx.shadowBlur = 0;
  drawBeam();
  drawTelegraphs();
  for (const e of enemies) drawEnemy(e);
  ctx.shadowBlur = 0;

  // projectiles
  ctx.globalCompositeOperation = 'lighter';
  ctx.lineCap = 'round';
  for (const b of playerShots) {
    if (b.bomb) {
      ctx.globalAlpha = 0.4; ctx.fillStyle = '#ffb14a'; ctx.beginPath(); ctx.arc(b.x, b.y, 20 + Math.sin(game.time * 30) * 3, 0, TAU); ctx.fill();
      ctx.globalAlpha = 1; ctx.beginPath(); ctx.arc(b.x, b.y, 10, 0, TAU); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(b.x, b.y, 5, 0, TAU); ctx.fill();
      continue;
    }
    ctx.strokeStyle = b.crit ? '#ff9ad5' : COLORS.shot; ctx.lineWidth = b.crit ? 6 : 4; ctx.globalAlpha = 0.95;
    ctx.beginPath(); ctx.moveTo(b.x - b.vx * 0.022, b.y - b.vy * 0.022); ctx.lineTo(b.x, b.y); ctx.stroke();
  }
  ctx.lineCap = 'butt';
  for (const b of enemyShots) {
    ctx.globalAlpha = 0.35; ctx.fillStyle = b.c;
    ctx.beginPath(); ctx.arc(b.x, b.y, b.r * 2.1, 0, TAU); ctx.fill();
    ctx.globalAlpha = 1;
    ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, TAU); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(b.x, b.y, b.r * 0.45, 0, TAU); ctx.fill();
  }
  // particules
  for (const p of particles) {
    ctx.globalAlpha = clamp(p.life / p.max, 0, 1); ctx.fillStyle = p.color;
    ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
  }
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';

  if (game.state !== 'menu') drawPlayer();

  // textes flottants
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const t of floatingTexts) {
    ctx.globalAlpha = clamp(t.life / t.max * 1.6, 0, 1); ctx.fillStyle = t.color; ctx.font = '800 ' + t.size + 'px ' + FONT;
    ctx.fillText(t.txt, t.x, t.y);
  }
  ctx.globalAlpha = 1;
  ctx.restore();

  if (game.state !== 'menu') drawHud();

  // flash de dégâts
  if (game.flash > 0) {
    const g = ctx.createRadialGradient(W / 2, H / 2, 200, W / 2, H / 2, 950);
    g.addColorStop(0, 'rgba(255,59,92,0)'); g.addColorStop(1, 'rgba(255,59,92,' + (0.55 * game.flash) + ')');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  }
  // réticule de la cible visée automatiquement
  if (game.state === 'play' && !player.dead) {
    const t = player.target;
    if (t && !t.dead) {
      const c = player.beaming ? '#7dff7a' : '#ffffff', rr = (t.r || 9) + 10 + Math.sin(game.time * 8) * 2, rot = game.time * 2.5;
      ctx.strokeStyle = c; ctx.lineWidth = 2; ctx.globalAlpha = 0.85; glow(c, 8);
      for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(t.x, t.y, rr, rot + i * TAU / 4, rot + i * TAU / 4 + 0.7); ctx.stroke(); }
      ctx.globalAlpha = 1; ctx.shadowBlur = 0;
    }
  }
  if (audio.muted) { ctx.font = '700 13px ' + FONT; ctx.fillStyle = '#8b96b8'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText('SON COUPÉ (M)', 30, H - 26); }
}
