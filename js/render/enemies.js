/**
 * Dessin des unités ennemies et de leurs signaux d’attaque.
 */
import { COLORS } from '../config.js';
import { clamp, TAU } from '../utils/math.js';
import { enemies, game } from '../state.js';
import { ctx } from './canvas.js';
import { glow, poly } from './shapes.js';

export function drawEnemy(e) {
  const c = e.flash > 0 ? '#ffffff' : e.c;
  ctx.save();
  ctx.translate(e.x, e.y);
  ctx.strokeStyle = c; ctx.fillStyle = c; ctx.lineWidth = 2.5;
  glow(e.c, 14);
  switch (e.type) {
    case 'soldier': {
      const s = e.pulled ? 0.8 : 1;
      ctx.rotate(e.a);
      ctx.globalAlpha = 0.25; ctx.beginPath(); ctx.arc(0, 0, e.r * s, 0, TAU); ctx.fill();
      ctx.globalAlpha = 1; ctx.beginPath(); ctx.arc(0, 0, e.r * s, 0, TAU); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(4, 0); ctx.lineTo(e.r + 6, 0); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 0, 3, 0, TAU); ctx.fill();
      break;
    }
    case 'tank': {
      ctx.save(); ctx.rotate(e.a);
      ctx.globalAlpha = 0.18; ctx.fillRect(-e.r, -e.r * 0.8, e.r * 2, e.r * 1.6);
      ctx.globalAlpha = 1; ctx.strokeRect(-e.r, -e.r * 0.8, e.r * 2, e.r * 1.6);
      ctx.strokeRect(-e.r, -e.r * 0.8 - 5, e.r * 2, 5); ctx.strokeRect(-e.r, e.r * 0.8, e.r * 2, 5);
      ctx.restore();
      ctx.rotate(e.ta);
      if (e.tele > 0) { ctx.strokeStyle = '#fff'; ctx.fillStyle = '#fff'; glow('#ffb14a', 24); }
      ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(38, 0); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 0, 11, 0, TAU); ctx.fill();
      break;
    }
    case 'heli': {
      ctx.save(); ctx.rotate(e.a);
      ctx.globalAlpha = 0.2; ctx.beginPath(); ctx.ellipse(0, 0, e.r, e.r * 0.62, 0, 0, TAU); ctx.fill();
      ctx.globalAlpha = 1; ctx.beginPath(); ctx.ellipse(0, 0, e.r, e.r * 0.62, 0, 0, TAU); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-e.r, 0); ctx.lineTo(-e.r - 14, 0); ctx.stroke();
      ctx.restore();
      ctx.rotate(e.t * 22); ctx.lineWidth = 2; ctx.globalAlpha = 0.8;
      ctx.beginPath(); ctx.moveTo(-26, 0); ctx.lineTo(26, 0); ctx.moveTo(0, -26); ctx.lineTo(0, 26); ctx.stroke();
      break;
    }
    case 'jet': {
      if (e.state !== 'fly') break;
      ctx.rotate(e.a);
      ctx.beginPath(); ctx.moveTo(24, 0); ctx.lineTo(-16, -17); ctx.lineTo(-8, 0); ctx.lineTo(-16, 17); ctx.closePath();
      ctx.globalAlpha = 0.3; ctx.fill(); ctx.globalAlpha = 1; ctx.stroke();
      break;
    }
    case 'battery': {
      poly(0, 0, e.r, 6, e.state === 'on' ? e.t * 0.6 : e.a);
      ctx.globalAlpha = 0.18; ctx.fill(); ctx.globalAlpha = 1; ctx.stroke();
      const k = e.state === 'on' ? clamp(1 - e.cd / 1, 0, 1) : 0;
      for (let i = 0; i < 3; i++) { const a = e.t * 0.6 + i * TAU / 3; ctx.beginPath(); ctx.arc(Math.cos(a) * 11, Math.sin(a) * 11, 4 + k * 2, 0, TAU); ctx.fill(); }
      break;
    }
    case 'boss': {
      ctx.lineWidth = 4; glow(e.c, 30);
      poly(0, 0, e.r, 8, e.a);
      ctx.globalAlpha = 0.16; ctx.fill(); ctx.globalAlpha = 1; ctx.stroke();
      poly(0, 0, e.r * 0.72, 8, -e.a * 1.6); ctx.lineWidth = 2; ctx.stroke();
      for (let i = 0; i < 4; i++) { const a = e.a + i * TAU / 4 + TAU / 16; ctx.beginPath(); ctx.arc(Math.cos(a) * e.r * 0.86, Math.sin(a) * e.r * 0.86, 9, 0, TAU); ctx.fill(); }
      const pulse = 0.75 + Math.sin(e.t * 6) * 0.25;
      ctx.fillStyle = e.flash > 0 ? '#fff' : (e.phase === 3 ? '#ffd27a' : '#ff8a8a');
      glow(ctx.fillStyle, 40);
      ctx.beginPath(); ctx.arc(0, 0, 22 * pulse + (e.atk && e.atk.k === 'laser' ? 8 : 0), 0, TAU); ctx.fill();
      break;
    }
  }
  ctx.restore();
  // barre de vie des unités blessées
  if (e.type !== 'boss' && e.type !== 'soldier' && e.hp < e.maxHp && !(e.type === 'jet' && e.state !== 'fly')) {
    ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(e.x - 18, e.y - e.r - 14, 36, 4);
    ctx.fillStyle = e.c; ctx.fillRect(e.x - 18, e.y - e.r - 14, 36 * clamp(e.hp / e.maxHp, 0, 1), 4);
  }
}

export function drawTelegraphs() {
  for (const e of enemies) {
    if (e.type === 'jet' && e.state === 'tele') {
      const k = 1 - e.st / 0.95;
      ctx.save();
      ctx.strokeStyle = COLORS.jet; ctx.globalAlpha = 0.25 + 0.5 * k * (0.6 + 0.4 * Math.sin(game.time * 40));
      ctx.lineWidth = 2 + k * 3; ctx.setLineDash([22, 14]); ctx.lineDashOffset = -game.time * 300;
      ctx.beginPath(); ctx.moveTo(e.sx, e.sy); ctx.lineTo(e.sx + e.dx * 2700, e.sy + e.dy * 2700); ctx.stroke();
      ctx.restore();
    } else if (e.type === 'tank' && e.tele > 0) {
      ctx.save();
      ctx.strokeStyle = '#ffb14a'; ctx.globalAlpha = 0.5 * (1 - e.tele / 0.6) + 0.15; ctx.lineWidth = 2;
      ctx.setLineDash([8, 10]);
      ctx.beginPath(); ctx.moveTo(e.x + Math.cos(e.ta) * 38, e.y + Math.sin(e.ta) * 38); ctx.lineTo(e.x + Math.cos(e.ta) * 900, e.y + Math.sin(e.ta) * 900); ctx.stroke();
      ctx.restore();
    } else if (e.type === 'boss' && e.atk && e.atk.k === 'laser') {
      const c = Math.cos(e.la), s = Math.sin(e.la), at = e.atk;
      ctx.save();
      if (at.t < 1.1) {
        const k = at.t / 1.1;
        ctx.strokeStyle = '#ffd27a'; ctx.globalAlpha = 0.2 + 0.6 * k; ctx.lineWidth = 1 + k * 3; ctx.setLineDash([16, 12]);
        ctx.beginPath(); ctx.moveTo(e.x, e.y); ctx.lineTo(e.x + c * 2200, e.y + s * 2200); ctx.stroke();
      } else {
        ctx.globalCompositeOperation = 'lighter';
        const w = 30 + Math.sin(game.time * 60) * 5;
        ctx.strokeStyle = 'rgba(255,90,60,0.5)'; ctx.lineWidth = w + 22; glow('#ff5c3c', 40);
        ctx.beginPath(); ctx.moveTo(e.x, e.y); ctx.lineTo(e.x + c * 2200, e.y + s * 2200); ctx.stroke();
        ctx.strokeStyle = '#ffe9c0'; ctx.lineWidth = w * 0.5;
        ctx.beginPath(); ctx.moveTo(e.x, e.y); ctx.lineTo(e.x + c * 2200, e.y + s * 2200); ctx.stroke();
      }
      ctx.restore();
    }
  }
}
