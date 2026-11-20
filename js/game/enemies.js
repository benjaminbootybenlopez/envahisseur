/**
 * Comportement de chaque type d’unité humaine.
 * Chaque fonction reçoit l'unité, le pas de temps, sa distance et son angle vers la soucoupe,
 * et si la soucoupe est encore en vie.
 */
import { COLORS, H, W } from '../config.js';
import { angDiff, angTo, clamp, dist, rand } from '../utils/math.js';
import { difficulty, enemies, player } from '../state.js';
import { SFX } from '../audio/sfx.js';
import { onScreen } from './arena.js';
import { updateBoss } from './boss.js';
import { abduct, damagePlayer, inContact } from './combat.js';
import { emitParticle, ring, spark } from './effects.js';
import { fireEnemyBullet, fireMissile } from './projectiles.js';
import { planPass } from './spawn.js';

/** Fantassin : avance à portée de tir puis tourne autour de la soucoupe ; peut être aspiré. */
function updateSoldier(e, dt, d, a, alive) {
  if (e.pulled && alive) {
    e.x += Math.cos(a) * 430 * dt; e.y += Math.sin(a) * 430 * dt; e.a += dt * 14;
    if (d < player.r + 8) abduct(e);
    e.pulled = false;
    return;
  }
  if (d > e.range) { e.x += Math.cos(a) * e.speed * dt; e.y += Math.sin(a) * e.speed * dt; }
  else { e.x += Math.cos(a + Math.PI / 2) * e.side * e.speed * 0.6 * dt; e.y += Math.sin(a + Math.PI / 2) * e.side * e.speed * 0.6 * dt; if (Math.random() < dt * 0.3) e.side *= -1; }
  e.a = a;
  e.cd -= dt;
  if (e.cd <= 0 && onScreen(e) && alive) { fireEnemyBullet(e.x, e.y, a + rand(-0.08, 0.08), 250, 5); e.cd = rand(2.3, 3.6) * difficulty.fire; SFX.eshoot(); }
}

/** Tank : lent, tourne sa tourelle et tire un obus après un signal lumineux. */
function updateTank(e, dt, d, a, alive) {
  if (d > e.range) { e.x += Math.cos(a) * e.speed * dt; e.y += Math.sin(a) * e.speed * dt; e.a = a; }
  if (e.tele <= 0) e.ta += clamp(angDiff(e.ta, a), -1.6 * dt, 1.6 * dt);
  if (e.tele > 0) {
    e.tele -= dt;
    if (e.tele <= 0) {
      fireEnemyBullet(e.x + Math.cos(e.ta) * 34, e.y + Math.sin(e.ta) * 34, e.ta, 560, 9, '#ff7a3d');
      spark(e.x + Math.cos(e.ta) * 36, e.y + Math.sin(e.ta) * 36, '#ffb14a', e.ta, 6);
      e.cd = rand(2.6, 3.6) * difficulty.fire; SFX.shell();
    }
  } else {
    e.cd -= dt;
    if (e.cd <= 0 && onScreen(e) && alive) { e.tele = 0.6; SFX.tele(); }
  }
  if (alive && inContact(e, d)) damagePlayer();
}

/** Hélicoptère : orbite autour de la soucoupe et tire en rafales de trois. */
function updateHeli(e, dt, d, a, alive) {
  e.orb += e.side * 0.9 * dt;
  const tx = player.x + Math.cos(e.orb) * 300, ty = player.y + Math.sin(e.orb) * 300;
  const ta = Math.atan2(ty - e.y, tx - e.x), k = Math.min(1, dt * 2.5);
  e.vx += (Math.cos(ta) * e.speed - e.vx) * k; e.vy += (Math.sin(ta) * e.speed - e.vy) * k;
  e.x += e.vx * dt; e.y += e.vy * dt; e.a = a;
  if (e.burst > 0) {
    e.bt -= dt;
    if (e.bt <= 0) { e.burst--; e.bt = 0.13; fireEnemyBullet(e.x, e.y, a + rand(-0.1, 0.1), 360, 5, '#ff5c7a'); SFX.eshoot(); }
  } else {
    e.cd -= dt;
    if (e.cd <= 0 && onScreen(e) && alive) { e.burst = 3; e.bt = 0; e.cd = rand(2.4, 3.4) * difficulty.fire; }
  }
  if (alive && inContact(e, d)) damagePlayer();
}

/** Chasseur : trois passages en ligne droite, annoncés, en semant des tirs sur les côtés. */
function updateJet(e, dt, d, a, alive) {
  if (e.state === 'tele') { e.st -= dt; if (e.st <= 0) { e.state = 'fly'; SFX.jet(); } return; }
  if (e.state !== 'fly') { e.st -= dt; if (e.st <= 0) planPass(e); return; }
  const v = 1150 * dt; e.x += e.dx * v; e.y += e.dy * v; e.trav += v;
  if (onScreen(e)) {
    e.emit -= dt;
    if (e.emit <= 0) {
      e.emit = difficulty.jetGap;
      fireEnemyBullet(e.x, e.y, e.a + Math.PI / 2, 190, 5, COLORS.jet);
      fireEnemyBullet(e.x, e.y, e.a - Math.PI / 2, 190, 5, COLORS.jet);
    }
    if (Math.random() < 0.7) emitParticle({ x: e.x, y: e.y, vx: -e.dx * 100, vy: -e.dy * 100, life: 0.35, size: 4, color: COLORS.jet, drag: 1 });
    if (alive && inContact(e, d, 1)) damagePlayer();
  }
  if (e.trav > 2700) { e.passes++; if (e.passes >= 3) e.dead = true; else { e.state = 'wait'; e.st = rand(1.2, 2.2); } }
}

/** Batterie : s'installe près du bord puis lance des missiles à tête chercheuse. */
function updateBattery(e, dt, d, a, alive) {
  if (e.state === 'move') {
    const ta = Math.atan2(e.ty - e.y, e.tx - e.x), dd = Math.hypot(e.tx - e.x, e.ty - e.y);
    if (dd < 6) { e.state = 'on'; ring(e.x, e.y, e.c, 60, 0.3, 2); }
    else { e.x += Math.cos(ta) * e.speed * dt; e.y += Math.sin(ta) * e.speed * dt; e.a = ta; }
  } else {
    e.cd -= dt;
    if (e.cd <= 0 && alive) { fireMissile(e.x, e.y, a + rand(-0.6, 0.6)); e.cd = rand(3.4, 4.6) * difficulty.fire; }
  }
  if (alive && inContact(e, d)) damagePlayer();
}

const UPDATE_BY_TYPE = {
  soldier: updateSoldier, tank: updateTank, heli: updateHeli, jet: updateJet, battery: updateBattery, boss: updateBoss
};

const isGroundUnit = e => e.type === 'soldier' || e.type === 'tank';

/** Écarte doucement les unités au sol qui se chevauchent ; les tanks bougent moins. */
function separateGroundUnits() {
  for (let i = 0; i < enemies.length; i++) {
    const a = enemies[i]; if (a.dead || !isGroundUnit(a)) continue;
    for (let j = i + 1; j < enemies.length; j++) {
      const b = enemies[j]; if (b.dead || !isGroundUnit(b)) continue;
      const dx = b.x - a.x, dy = b.y - a.y, dd = Math.hypot(dx, dy), min = a.r + b.r + 4;
      if (dd > 0.01 && dd < min) {
        const push = (min - dd) * 0.5, nx = dx / dd, ny = dy / dd;
        const wa = a.type === 'tank' ? 0.2 : 1, wb = b.type === 'tank' ? 0.2 : 1;
        a.x -= nx * push * wa; a.y -= ny * push * wa; b.x += nx * push * wb; b.y += ny * push * wb;
      }
    }
  }
}

export function updateEnemies(dt) {
  for (const e of enemies) {
    if (e.dead) continue;
    e.t += dt; if (e.flash > 0) e.flash -= dt; if (e.dcd > 0) e.dcd -= dt;
    e.prevX = e.x; e.prevY = e.y; // sert à estimer la vitesse de l'unité (visée anticipée)
    UPDATE_BY_TYPE[e.type](e, dt, dist(e, player), angTo(e, player), !player.dead);
    // les unités au sol restent dans l'arène une fois entrées
    if (isGroundUnit(e) && e.t > 3) { e.x = clamp(e.x, e.r, W - e.r); e.y = clamp(e.y, e.r, H - e.r); }
  }
  separateGroundUnits();
}
