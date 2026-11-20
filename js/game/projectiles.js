/**
 * Tirs : création des projectiles ennemis et déplacement de tous les tirs.
 */
import { COLORS, H, W } from '../config.js';
import { angDiff, clamp, dist, rand } from '../utils/math.js';
import { difficulty, enemies, enemyShots, player, playerShots, stats } from '../state.js';
import { SFX } from '../audio/sfx.js';
import { damagePlayer, destroyShot, explodeBomb, hurtEnemy } from './combat.js';
import { burst, emitParticle, floatText } from './effects.js';
import { addScore } from './scoring.js';

export function fireEnemyBullet(x, y, a, speed, r, c) {
  enemyShots.push({ x, y, vx: Math.cos(a) * speed * difficulty.bSpd, vy: Math.sin(a) * speed * difficulty.bSpd, r: r || 6, c: c || COLORS.enemyShots, life: 7 });
}
export function fireMissile(x, y, a) {
  enemyShots.push({ x, y, vx: Math.cos(a) * 200, vy: Math.sin(a) * 200, r: 9, c: COLORS.missile, life: 6.5, missile: true, a, speed: 300 * difficulty.bSpd, turn: 2.1 });
  SFX.missile();
}

export function updateBullets(dt) {
  // tirs du joueur
  for (const b of playerShots) {
    if (stats.homing > 0) {
      let bestE = null, bd = 380;
      for (const e of enemies) { if (e.dead) continue; const dd = dist(e, b); if (dd < bd && Math.abs(angDiff(b.a, Math.atan2(e.y - b.y, e.x - b.x))) < 1) { bd = dd; bestE = e; } }
      if (bestE) {
        b.a += clamp(angDiff(b.a, Math.atan2(bestE.y - b.y, bestE.x - b.x)), -stats.homing * dt, stats.homing * dt);
        const sp = b.spd || stats.bulletSpeed; b.vx = Math.cos(b.a) * sp; b.vy = Math.sin(b.a) * sp;
      }
    }
    b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
    if (b.bomb) {
      if (Math.random() < 0.8) emitParticle({ x: b.x, y: b.y, vx: rand(-40, 40), vy: rand(-40, 40), life: 0.3, size: 4, color: '#ffb14a', drag: 1 });
      if (b.life <= 0) { explodeBomb(b.x, b.y); b.dead = true; continue; }
    }
    if (b.life <= 0 || b.x < -30 || b.x > W + 30 || b.y < -30 || b.y > H + 30) { b.dead = true; continue; }
    for (const e of enemies) {
      if (e.dead || (b.hit && b.hit.has(e))) continue;
      const rr = e.r + 6;
      if (Math.abs(e.x - b.x) < rr && Math.abs(e.y - b.y) < rr && dist(e, b) < rr) {
        if (b.bomb) { explodeBomb(b.x, b.y); b.dead = true; break; }
        hurtEnemy(e, b.dmg, b.a, 'shot');
        if (b.crit) floatText(e.x, e.y - e.r - 6, 'CRIT', '#ff9ad5', 14);
        if (b.pierce > 0) { b.pierce--; (b.hit || (b.hit = new Set())).add(e); }
        else { b.dead = true; break; }
      }
    }
    if (b.dead) continue;
    for (const m of enemyShots) {
      if (m.dead || !m.missile) continue;
      if (dist(m, b) < m.r + 7) {
        if (b.bomb) { explodeBomb(b.x, b.y); b.dead = true; break; }
        m.dead = true; b.dead = true; burst(m.x, m.y, COLORS.missile, 10, 260, 4, 0.35); addScore(5); SFX.pop(); break;
      }
    }
  }
  // tirs ennemis
  for (const b of enemyShots) {
    if (b.dead) continue;
    if (b.missile) {
      if (!player.dead) b.a += clamp(angDiff(b.a, Math.atan2(player.y - b.y, player.x - b.x)), -b.turn * dt, b.turn * dt);
      const k = Math.min(1, dt * 3);
      b.vx += (Math.cos(b.a) * b.speed - b.vx) * k; b.vy += (Math.sin(b.a) * b.speed - b.vy) * k;
      if (Math.random() < 0.7) emitParticle({ x: b.x, y: b.y, vx: -b.vx * 0.2 + rand(-20, 20), vy: -b.vy * 0.2 + rand(-20, 20), life: 0.35, size: 3, color: COLORS.missile, drag: 1 });
    }
    b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
    if (b.life <= 0) { b.dead = true; if (b.missile) burst(b.x, b.y, COLORS.missile, 8, 200, 3, 0.3); continue; }
    if (!b.missile && (b.x < -40 || b.x > W + 40 || b.y < -40 || b.y > H + 40)) { b.dead = true; continue; }
    if (!player.dead && dist(b, player) < b.r + 12) {
      // pendant le dash le tir est détruit ; pendant l'invincibilité il traverse sans effet
      if (player.dash > 0) destroyShot(b, 3);
      else if (player.inv <= 0) { b.dead = true; damagePlayer(); }
    }
  }
}
