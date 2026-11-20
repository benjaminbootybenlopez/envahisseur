/**
 * Comportement du Bastion, le boss final, et de ses trois phases.
 */
import { COLORS, H, W } from '../config.js';
import { angDiff, clamp, pick, rand, TAU } from '../utils/math.js';
import { enemies, game, player } from '../state.js';
import { SFX } from '../audio/sfx.js';
import { clearBulletsNear, damagePlayer, inContact } from './combat.js';
import { burst, emitParticle, ring, shake, showBanner } from './effects.js';
import { fireEnemyBullet, fireMissile } from './projectiles.js';
import { spawnEnemy } from './spawn.js';

// attaques possibles selon la phase ; le laser est deux fois plus fréquent en phase 3
const ATTACK_POOL = {
  1: ['spiral', 'fan', 'troops'],
  2: ['spiral', 'fan', 'troops', 'missiles', 'rings'],
  3: ['spiral', 'fan', 'missiles', 'rings', 'laser', 'laser']
};
const ATTACK_DURATION = { spiral: 3, fan: 1.9, troops: 0.8, missiles: 1.3, rings: 2.5, laser: 3.9 };
const LASER_CHARGE = 1.1; // secondes de visée avant le tir du laser

function callReinforcements(count, withHeli) {
  for (let i = 0; i < count; i++) spawnEnemy('soldier', undefined, undefined, true);
  if (withHeli) spawnEnemy('heli', undefined, undefined, true);
}

function enterPhase(e, ph) {
  e.phase = ph; e.atk = null; e.rest = 1.3;
  ring(e.x, e.y, '#fff', 500, 0.7, 8); burst(e.x, e.y, COLORS.boss, 50, 700, 6, 0.9); shake(22); SFX.boom(true);
  clearBulletsNear(e.x, e.y, 2000);
  showBanner('PHASE ' + ph, ph === 2 ? 'Le Bastion ouvre ses silos' : 'Canon principal armé', 2, COLORS.boss);
  callReinforcements(3 + ph, ph === 3);
}

function move(e, dt, ph) {
  e.moveT -= dt;
  if (e.moveT <= 0) { e.moveT = rand(3, 5); e.tx = rand(320, W - 320); e.ty = rand(200, H - 200); }
  if (e.atk && e.atk.k === 'laser') return; // immobile pendant le laser
  const ta = Math.atan2(e.ty - e.y, e.tx - e.x), dd = Math.hypot(e.tx - e.x, e.ty - e.y), sp = ph === 3 ? 105 : 70;
  if (dd > 8) { e.x += Math.cos(ta) * sp * dt; e.y += Math.sin(ta) * sp * dt; }
}

/** Choisit une attaque différente de la précédente et la prépare. */
function startAttack(e, ph, a) {
  let k; do { k = pick(ATTACK_POOL[ph]); } while (k === e.last);
  e.last = k;
  e.atk = { k, t: 0, dur: ATTACK_DURATION[k], n: 0, acc: 0 };
  if (k === 'laser') { e.la = a; e.ld = Math.random() < 0.5 ? -1 : 1; SFX.charge(); }
  if (k === 'troops') {
    callReinforcements(3 + ph + (enemies.length < 6 ? 1 : 0), ph >= 2);
    ring(e.x, e.y, COLORS.soldier, 200, 0.5, 4); SFX.tele();
  }
}

// Chaque attaque reçoit le boss, son attaque en cours, le pas de temps, la phase et l'angle vers la soucoupe.
const ATTACKS = {
  /** Spirale continue de tirs, à deux ou trois bras. */
  spiral(e, at, dt, ph) {
    at.acc += dt;
    const gap = ph === 3 ? 0.06 : 0.075, arms = ph === 1 ? 2 : 3;
    while (at.acc >= gap) {
      at.acc -= gap; e.sa += 0.21 * e.ld;
      for (let i = 0; i < arms; i++) fireEnemyBullet(e.x, e.y, e.sa + i * TAU / arms, 260, 6);
      SFX.eshoot();
    }
  },
  /** Trois éventails de tirs lourds vers la soucoupe. */
  fan(e, at, dt, ph, a) {
    if (at.t < 0.3 + at.n * 0.5 || at.n >= 3) return;
    at.n++;
    const c = ph === 1 ? 5 : 7;
    for (let i = 0; i < c; i++) fireEnemyBullet(e.x, e.y, a + (i - (c - 1) / 2) * 0.16, 410, 8, '#ff7a3d');
    SFX.shell(); shake(4);
  },
  /** Salve de missiles à tête chercheuse. */
  missiles(e, at, dt, ph) {
    if (at.t >= 0.15 + at.n * 0.25 && at.n < (ph === 3 ? 5 : 4)) { at.n++; fireMissile(e.x, e.y, e.a + at.n * 1.5); }
  },
  /** Trois anneaux de tirs décalés. */
  rings(e, at) {
    if (at.t < at.n * 0.8 || at.n >= 3) return;
    at.n++;
    const c = 22, off = at.n * 0.14;
    for (let i = 0; i < c; i++) fireEnemyBullet(e.x, e.y, off + i * TAU / c, 230, 6, '#ff5cb0');
    ring(e.x, e.y, '#ff5cb0', 140, 0.3, 3); SFX.shell();
  },
  /** Les renforts sont appelés au lancement de l'attaque : rien à faire ensuite. */
  troops() {},
  /** Laser : vise pendant la charge, puis balaie lentement l'arène. */
  laser(e, at, dt, ph, a) {
    if (at.t < LASER_CHARGE) { e.la += clamp(angDiff(e.la, a), -0.9 * dt, 0.9 * dt); return; }
    if (!at.fired) { at.fired = true; SFX.laser(); shake(10); }
    e.la += e.ld * 0.5 * dt * (game.diff === 'easy' ? 0.75 : 1);
    shake(3);
    const dx = player.x - e.x, dy = player.y - e.y, c = Math.cos(e.la), s = Math.sin(e.la);
    if (dx * c + dy * s > e.r * 0.4 && Math.abs(-dx * s + dy * c) < 20) damagePlayer();
    if (Math.random() < 0.8) {
      const dd = rand(e.r, 1500);
      emitParticle({ x: e.x + c * dd, y: e.y + s * dd, vx: rand(-80, 80), vy: rand(-80, 80), life: 0.3, size: 4, color: '#ffd27a', drag: 1 });
    }
  }
};

export function updateBoss(e, dt, d, a, alive) {
  e.a += dt * 0.5;
  const ph = e.hp > e.maxHp * 0.66 ? 1 : e.hp > e.maxHp * 0.33 ? 2 : 3;
  if (ph !== e.phase) enterPhase(e, ph);
  move(e, dt, ph);
  if (alive && inContact(e, d, 0.9)) {
    damagePlayer();
    player.vx = -Math.cos(a) * 600; player.vy = -Math.sin(a) * 600; // repousse la soucoupe
  }
  if (e.y < 60 || !alive) return; // n'attaque qu'une fois entré dans l'arène

  if (!e.atk) {
    e.rest -= dt;
    if (e.rest <= 0) startAttack(e, ph, a);
    return;
  }
  const at = e.atk; at.t += dt;
  ATTACKS[at.k](e, at, dt, ph, a);
  if (at.t >= at.dur) { e.atk = null; e.rest = (ph === 3 ? 0.55 : 0.95) * (game.diff === 'easy' ? 1.35 : 1); }
}
