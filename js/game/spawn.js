/**
 * Création des unités ennemies et du boss.
 */
import { COLORS, H, LAST_WAVE, W } from '../config.js';
import { clamp, rand, TAU } from '../utils/math.js';
import { difficulty, enemies, game, player } from '../state.js';
import { SFX } from '../audio/sfx.js';
import { edgePoint } from './arena.js';

export function spawnEnemy(type, x, y, add) {
  const hs = (1 + 0.07 * (Math.min(game.wave, LAST_WAVE) - 1)) * difficulty.eHp;
  const e = { type, x, y, vx: 0, vy: 0, t: 0, flash: 0, a: 0, side: Math.random() < 0.5 ? -1 : 1, add: !!add, dcd: 0 };
  if (x === undefined) { const p = edgePoint(50); e.x = p.x; e.y = p.y; }
  const hp = b => Math.max(1, Math.round(b * hs));
  switch (type) {
    case 'soldier': e.r = 11; e.hp = hp(1); e.speed = rand(85, 110); e.range = rand(220, 320); e.cd = rand(1.5, 3.5); e.score = 10; e.c = COLORS.soldier; break;
    case 'tank': e.r = 28; e.hp = hp(7); e.speed = 55; e.range = rand(340, 420); e.cd = rand(1.8, 3); e.ta = 0; e.tele = 0; e.score = 60; e.c = COLORS.tank; break;
    case 'heli': e.r = 18; e.hp = hp(3); e.speed = 240; e.orb = rand(0, TAU); e.cd = rand(1.5, 2.8); e.burst = 0; e.bt = 0; e.score = 45; e.c = COLORS.heli; break;
    case 'jet': e.r = 17; e.hp = hp(2); e.passes = 0; e.score = 70; e.c = COLORS.jet; planPass(e); break;
    case 'battery': {
      e.r = 26; e.hp = hp(6); e.speed = 95; e.cd = rand(1.5, 2.5); e.score = 70; e.c = COLORS.battery; e.state = 'move';
      e.tx = clamp(e.x, 130, W - 130); e.ty = clamp(e.y, 130, H - 130);
      break;
    }
  }
  e.maxHp = e.hp;
  enemies.push(e);
  return e;
}
/** Prépare le prochain passage d’un chasseur, annoncé par une ligne pointillée. */
export function planPass(e) {
  const a = rand(0, TAU);
  const px = clamp(player.x + rand(-160, 160), 200, W - 200), py = clamp(player.y + rand(-160, 160), 150, H - 150);
  e.dx = Math.cos(a); e.dy = Math.sin(a); e.a = a;
  e.x = px - e.dx * 1350; e.y = py - e.dy * 1350;
  e.sx = e.x; e.sy = e.y;
  e.trav = 0; e.state = 'tele'; e.st = 0.95; e.emit = 0;
  SFX.tele();
}
export function spawnBoss() {
  const hp = difficulty.bossHp;
  game.boss = {
    type: 'boss', x: W / 2, y: -150, vx: 0, vy: 0, r: 86, hp, maxHp: hp, t: 0, flash: 0, a: 0, side: 1, dcd: 0,
    tx: W / 2, ty: 250, moveT: 4, atk: null, rest: 2.2, last: '', phase: 1, score: 5000, c: COLORS.boss, sa: 0, la: 0, ld: 1
  };
  enemies.push(game.boss);
}
