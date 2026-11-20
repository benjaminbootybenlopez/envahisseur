/**
 * Interface en jeu : coque, biomasse, vague, score, aides et bannières.
 */
import { COLORS, FONT, H, LAST_WAVE, W } from '../config.js';
import { fmt } from '../utils/format.js';
import { clamp } from '../utils/math.js';
import { game, player, stats } from '../state.js';
import { ctx } from './canvas.js';
import { glow, poly } from './shapes.js';
import { KEYS } from '../input/key-labels.js';

export function drawHud() {
  ctx.save();
  ctx.textBaseline = 'middle';
  // coque
  for (let i = 0; i < player.maxHp; i++) {
    const x = 44 + i * 36, y = 44, on = i < player.hp;
    ctx.lineWidth = 2.5; ctx.strokeStyle = on ? COLORS.alien : 'rgba(92,255,200,0.25)';
    if (on) { glow(COLORS.alien, 12); ctx.fillStyle = 'rgba(92,255,200,0.85)'; } else ctx.shadowBlur = 0;
    poly(x, y, 14, 6, Math.PI / 6);
    if (on) ctx.fill(); ctx.stroke();
  }
  ctx.shadowBlur = 0;
  // biomasse
  if (game.beamUnlocked) {
    ctx.font = '700 11px ' + FONT; ctx.fillStyle = '#7dff7a'; ctx.textAlign = 'left';
    ctx.fillText('BIOMASSE', 30, 78);
    for (let i = 0; i < stats.humansPerHeal; i++) {
      ctx.fillStyle = i < player.bio ? '#7dff7a' : 'rgba(125,255,122,0.18)';
      ctx.fillRect(104 + i * 16, 73, 12, 9);
    }
  }
  // vague
  ctx.textAlign = 'center';
  if (game.wave <= LAST_WAVE) {
    ctx.font = '800 18px ' + FONT; ctx.fillStyle = '#e8f0ff';
    ctx.fillText('VAGUE ' + game.wave + ' / ' + LAST_WAVE, W / 2, 36);
    const w = 260, k = game.waveTotal ? clamp(game.waveDone / game.waveTotal, 0, 1) : 0;
    ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(W / 2 - w / 2, 54, w, 5);
    ctx.fillStyle = COLORS.alien; ctx.fillRect(W / 2 - w / 2, 54, w * k, 5);
  } else if (game.boss) {
    const boss = game.boss;
    const w = 760, k = clamp(boss.hp / boss.maxHp, 0, 1);
    ctx.font = '800 16px ' + FONT; ctx.fillStyle = COLORS.boss; glow(COLORS.boss, 10);
    ctx.fillText('LE BASTION', W / 2, 30);
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(W / 2 - w / 2, 46, w, 12);
    ctx.fillStyle = boss.flash > 0 ? '#fff' : COLORS.boss; ctx.fillRect(W / 2 - w / 2, 46, w * k, 12);
    ctx.fillStyle = '#03040b'; ctx.fillRect(W / 2 - w / 2 + w * 0.33 - 1, 46, 3, 12); ctx.fillRect(W / 2 - w / 2 + w * 0.66 - 1, 46, 3, 12);
  }
  // score
  ctx.textAlign = 'right'; ctx.fillStyle = '#e8f0ff'; ctx.font = '800 30px ' + FONT;
  ctx.fillText(fmt(game.score), W - 34, 42);
  if (game.mult > 1) {
    ctx.font = '800 20px ' + FONT; ctx.fillStyle = '#ffe14a'; glow('#ffe14a', 10);
    ctx.fillText('×' + game.mult, W - 34, 76);
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255,225,74,0.25)'; ctx.fillRect(W - 154, 72, 70, 5);
    ctx.fillStyle = '#ffe14a'; ctx.fillRect(W - 154, 72, 70 * clamp(game.chainT / 3.2, 0, 1), 5);
  }
  // aide de départ
  if (game.wave === 1 && game.hintT < 9) {
    ctx.globalAlpha = clamp(Math.min(game.hintT, 9 - game.hintT), 0, 1) * 0.9;
    ctx.textAlign = 'center'; ctx.font = '600 17px ' + FONT; ctx.fillStyle = '#b9c3e0';
    ctx.fillText('Glisse sur le trackpad pour bouger  ·  ESPACE pour tirer  ·  ' + KEYS.dash + ' pour dasher à travers les ennemis', W / 2, H - 46);
  } else if (game.wave === 2 && game.hintT < 12) {
    ctx.globalAlpha = clamp(Math.min(game.hintT - 3, 12 - game.hintT), 0, 1) * 0.9;
    ctx.textAlign = 'center'; ctx.font = '600 17px ' + FONT; ctx.fillStyle = '#7dff7a';
    ctx.fillText('Touche ' + KEYS.beam + ' maintenue : le rayon vise les humains tout seul. ' + stats.humansPerHeal + ' humains aspirés = +1 coque', W / 2, H - 46);
  }
  ctx.restore();
  // bannière
  if (game.banner) {
    const b = game.banner, k = clamp(Math.min((b.max - b.t) * 4, b.t * 2.5), 0, 1);
    ctx.save(); ctx.globalAlpha = k; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = '800 ' + (b.title.length > 20 ? 50 : 68) + 'px ' + FONT;
    ctx.fillStyle = b.c; glow(b.c, 30);
    const y = H * 0.3 - (1 - k) * 14;
    ctx.fillText(b.title.split('').join(' '), W / 2, y);
    if (b.sub) { ctx.shadowBlur = 0; ctx.font = '600 20px ' + FONT; ctx.fillStyle = '#d5ddf5'; ctx.fillText(b.sub, W / 2, y + 54); }
    ctx.restore();
  }
}
