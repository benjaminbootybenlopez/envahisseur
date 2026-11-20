/**
 * Dessin de la soucoupe, de son rayon, de son bouclier et de ses drones.
 */
import { COLORS } from '../config.js';
import { TAU } from '../utils/math.js';
import { dashTrail, game, player, stats } from '../state.js';
import { ctx } from './canvas.js';
import { glow, poly } from './shapes.js';

export function drawBeam() {
  if (player.dead || !player.beaming) return;
  const R = stats.beamRange, h = stats.beamHalf;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createRadialGradient(player.x, player.y, 20, player.x, player.y, R);
  g.addColorStop(0, 'rgba(125,255,122,0.42)'); g.addColorStop(1, 'rgba(125,255,122,0.02)');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.moveTo(player.x, player.y); ctx.arc(player.x, player.y, R, player.aim - h, player.aim + h); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(125,255,122,0.5)'; ctx.lineWidth = 2;
  for (let i = 0; i < 4; i++) {
    const rr = R * (1 - ((game.time * 1.6 + i / 4) % 1));
    ctx.globalAlpha = 0.6 * (rr / R);
    ctx.beginPath(); ctx.arc(player.x, player.y, rr, player.aim - h, player.aim + h); ctx.stroke();
  }
  ctx.restore();
}

export function drawPlayer() {
  if (player.dead) return;
  // traînée du dash
  for (const g of dashTrail) {
    ctx.globalAlpha = g.life / 0.25 * 0.45;
    ctx.strokeStyle = COLORS.alien; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(g.x, g.y, player.r, 0, TAU); ctx.stroke();
  }
  ctx.globalAlpha = 1;
  if (player.inv > 0 && player.dash <= 0 && Math.floor(game.time * 22) % 2 === 0) ctx.globalAlpha = 0.35;
  ctx.save(); ctx.translate(player.x, player.y);
  const c = player.dash > 0 ? '#ffffff' : COLORS.alien;
  glow(COLORS.alien, 22);
  ctx.strokeStyle = c; ctx.fillStyle = c; ctx.lineWidth = 3;
  ctx.save(); ctx.globalAlpha *= 0.18; ctx.beginPath(); ctx.arc(0, 0, player.r, 0, TAU); ctx.fill(); ctx.restore();
  ctx.beginPath(); ctx.arc(0, 0, player.r, 0, TAU); ctx.stroke();
  ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, player.r * 0.48, 0, TAU); ctx.stroke();
  for (let i = 0; i < 6; i++) { const a = player.spin + i * TAU / 6; ctx.beginPath(); ctx.arc(Math.cos(a) * player.r * 0.76, Math.sin(a) * player.r * 0.76, 2.6, 0, TAU); ctx.fill(); }
  // canon
  ctx.rotate(player.aim); ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(player.r * 0.5, 0); ctx.lineTo(player.r + 8, 0); ctx.stroke();
  ctx.restore();
  // charges de dash autour de la soucoupe
  ctx.lineWidth = 3; ctx.lineCap = 'round';
  const n = stats.dashMax, span = 0.9;
  for (let i = 0; i < n; i++) {
    const a0 = Math.PI / 2 + (i - n / 2) * span + 0.08, a1 = a0 + span - 0.16;
    ctx.strokeStyle = 'rgba(92,255,200,0.2)'; ctx.shadowBlur = 0;
    ctx.beginPath(); ctx.arc(player.x, player.y, player.r + 11, a0, a1); ctx.stroke();
    const f = i < player.charges ? 1 : i === player.charges ? player.dashRe : 0;
    if (f > 0) {
      ctx.strokeStyle = f >= 1 ? COLORS.alien : 'rgba(92,255,200,0.6)'; if (f >= 1) glow(COLORS.alien, 10);
      ctx.beginPath(); ctx.arc(player.x, player.y, player.r + 11, a0, a0 + (a1 - a0) * f); ctx.stroke();
    }
  }
  ctx.lineCap = 'butt'; ctx.shadowBlur = 0;
  // bouclier
  if (stats.shield && player.shieldUp) {
    ctx.strokeStyle = '#6bd6ff'; ctx.lineWidth = 2; ctx.globalAlpha = 0.55 + Math.sin(game.time * 5) * 0.2; glow('#6bd6ff', 14);
    poly(player.x, player.y, player.r + 20, 6, game.time * 0.8); ctx.stroke();
  }
  ctx.globalAlpha = 1; ctx.shadowBlur = 0;
  // drones
  for (let i = 0; i < stats.drones; i++) {
    const a = game.time * 2.6 + i * TAU / stats.drones, dx = player.x + Math.cos(a) * 80, dy = player.y + Math.sin(a) * 80;
    ctx.fillStyle = '#6bd6ff'; glow('#6bd6ff', 14);
    poly(dx, dy, 9, 3, a * 2); ctx.fill();
  }
  ctx.shadowBlur = 0;
}
