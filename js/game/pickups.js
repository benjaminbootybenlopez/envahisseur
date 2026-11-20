/**
 * Fragments lâchés par les unités détruites.
 */
import { COLORS } from '../config.js';
import { angTo, dist, rand, TAU } from '../utils/math.js';
import { game, pickups, player, stats } from '../state.js';
import { SFX } from '../audio/sfx.js';
import { spark } from './effects.js';
import { addScore } from './scoring.js';

export function updatePickups(dt) {
  for (const p of pickups) {
    p.life -= dt; p.a += dt * 4;
    const d = dist(p, player);
    const pulled = !player.dead && (p.pull || d < stats.magnet || game.clearT >= 0);
    if (pulled) { const a = angTo(p, player), s = p.pull || game.clearT >= 0 ? 700 : 420; p.vx = Math.cos(a) * s; p.vy = Math.sin(a) * s; }
    else { p.vx *= Math.exp(-3 * dt); p.vy *= Math.exp(-3 * dt); }
    p.pull = false;
    p.x += p.vx * dt; p.y += p.vy * dt;
    if (!player.dead && d < player.r + 10) { p.dead = true; addScore(5); if (player.charges < stats.dashMax) player.dashRe += 0.07; SFX.pickup(); spark(p.x, p.y, COLORS.shard, rand(0, TAU), 3); }
    if (p.life <= 0) p.dead = true;
  }
}
