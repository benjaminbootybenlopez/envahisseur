/**
 * Dégâts, éliminations, enlèvements et explosions.
 */
import { COLORS } from '../config.js';
import { fmt } from '../utils/format.js';
import { rand, TAU } from '../utils/math.js';
import { difficulty, enemies, enemyShots, game, particles, pickups, player, stats } from '../state.js';
import { setBeamSound } from '../audio/engine.js';
import { SFX } from '../audio/sfx.js';
import { burst, floatText, ring, shake, spark } from './effects.js';
import { addScore, bumpChain } from './scoring.js';

export function hurtEnemy(e, dmg, fromA, how) {
  if (e.dead) return;
  e.hp -= dmg; e.flash = 0.09;
  spark(e.x, e.y, e.c, fromA + Math.PI, how === 'dash' ? 8 : 3);
  if (e.hp <= 0) killEnemy(e, how); else SFX.hit();
}
export function killEnemy(e, how) {
  if (e.dead) return;
  e.dead = true; game.kills++;
  bumpChain();
  if (player.charges < stats.dashMax) player.dashRe += 0.2;
  if (e.type === 'boss') { bossDeath(e); return; }
  addScore(e.score, e.x, e.y, e.c);
  const big = e.r > 20;
  burst(e.x, e.y, e.c, big ? 34 : 14, big ? 520 : 340, big ? 6 : 4, big ? 0.7 : 0.45);
  burst(e.x, e.y, '#ffffff', big ? 10 : 4, 260, 3, 0.3);
  ring(e.x, e.y, e.c, big ? 110 : 55, 0.35, big ? 4 : 2);
  shake(big ? 9 : 3);
  if (big) SFX.boom(false); else SFX.pop();
  if (how === 'dash') game.freeze = Math.max(game.freeze, big ? 0.07 : 0.035);
  if (e.type !== 'soldier') {
    const n = e.type === 'tank' || e.type === 'battery' ? 3 : 2;
    for (let i = 0; i < n; i++) { const a = rand(0, TAU), s = rand(60, 200); pickups.push({ x: e.x, y: e.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 9, a: rand(0, TAU) }); }
  }
}
export function abduct(e) {
  e.dead = true; e.abducted = true; game.abducted++; game.kills++;
  bumpChain();
  addScore(15);
  SFX.abduct();
  for (let i = 0; i < 8; i++) { const a = rand(0, TAU); particles.push({ x: player.x + Math.cos(a) * 26, y: player.y + Math.sin(a) * 26, vx: -Math.cos(a) * 90, vy: -Math.sin(a) * 90, life: 0.3, max: 0.3, size: 3, color: '#7dff7a', drag: 0 }); }
  player.bio++;
  if (player.bio >= stats.humansPerHeal) {
    player.bio = 0;
    if (player.hp < player.maxHp) { player.hp++; floatText(player.x, player.y - 40, '+1 COQUE', '#7dff7a', 22); ring(player.x, player.y, '#7dff7a', 90, 0.5, 4); SFX.heal(); }
    else { addScore(150); floatText(player.x, player.y - 40, 'BIOMASSE +' + fmt(150 * game.mult), '#7dff7a', 18); SFX.pickup(); }
  }
}
export function clearBulletsNear(x, y, r) {
  for (const b of enemyShots) if (!b.dead && Math.hypot(b.x - x, b.y - y) < r) { b.dead = true; spark(b.x, b.y, b.c, rand(0, TAU), 2); }
}
export function damagePlayer() {
  if (player.dead || player.inv > 0 || player.dash > 0) return;
  if (stats.shield && player.shieldUp) {
    player.shieldUp = false; player.shieldT = stats.shield >= 2 ? 9 : 14; player.inv = 0.7;
    ring(player.x, player.y, '#6bd6ff', 130, 0.4, 5); clearBulletsNear(player.x, player.y, 150); shake(8); SFX.shield();
    return;
  }
  player.hp--; player.inv = difficulty.inv; game.chain = 0; game.mult = 1;
  shake(20); game.slow = 0.4; game.flash = 1; SFX.hurt();
  burst(player.x, player.y, COLORS.enemyShots, 26, 480, 5, 0.6);
  ring(player.x, player.y, COLORS.enemyShots, 240, 0.45, 6);
  clearBulletsNear(player.x, player.y, 240);
  if (player.hp <= 0) {
    player.dead = true; game.endT = 1.7; game.slow = 1.2; setBeamSound(false);
    burst(player.x, player.y, COLORS.alien, 70, 700, 7, 1.1); burst(player.x, player.y, '#ffffff', 30, 420, 4, 0.8);
    ring(player.x, player.y, COLORS.alien, 320, 0.8, 8); shake(34); SFX.boom(true);
  }
}
function bossDeath(e) {
  game.won = true; game.endT = 3.4; game.slow = 2.2; game.freeze = 0.12;
  addScore(e.score, e.x, e.y, '#fff');
  game.score += player.hp * 500;
  for (const o of enemies) if (!o.dead && o !== e) { o.dead = true; burst(o.x, o.y, o.c, 12, 300, 4, 0.5); }
  for (const b of enemyShots) b.dead = true;
  for (let i = 0; i < 9; i++) {
    const a = rand(0, TAU), d = rand(0, 90);
    burst(e.x + Math.cos(a) * d, e.y + Math.sin(a) * d, i % 2 ? COLORS.boss : '#ffd27a', 30, 800, 8, 1.4);
  }
  burst(e.x, e.y, '#ffffff', 60, 900, 6, 1.2);
  ring(e.x, e.y, '#ffffff', 700, 1.2, 10); ring(e.x, e.y, COLORS.boss, 420, 0.9, 8);
  shake(40); game.flash = 1; SFX.boom(true);
  game.banner = { title: 'LA TERRE EST À TOI', sub: '', t: 3.4, max: 3.4, c: COLORS.alien };
  game.boss = null;
}

export function explodeBomb(x, y) {
  const R = 90 + stats.bomb * 30, dmg = stats.dmg * (3 + stats.bomb);
  ring(x, y, '#ffb14a', R, 0.4, 7); ring(x, y, '#ffffff', R * 0.6, 0.25, 3);
  burst(x, y, '#ffb14a', 28, 560, 6, 0.5); burst(x, y, '#fff3c4', 10, 300, 4, 0.3);
  shake(9); SFX.boom(false);
  for (const e of enemies) if (!e.dead && Math.hypot(e.x - x, e.y - y) < R + e.r) hurtEnemy(e, dmg, Math.atan2(e.y - y, e.x - x), 'bomb');
  for (const b of enemyShots) {
    if (b.dead) continue;
    const d = Math.hypot(b.x - x, b.y - y);
    if (d < (b.missile ? R : R * 0.6)) { b.dead = true; spark(b.x, b.y, b.c, rand(0, TAU), 2); if (b.missile) addScore(5); }
  }
}
