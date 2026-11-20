/**
 * Soucoupe du joueur : visée automatique, déplacement, dash, tir, rayon tracteur, drones.
 */
import { COLORS, H, JOY_GAIN, JOY_MAX, W } from '../config.js';
import { angDiff, angTo, clamp, dist, rand, TAU } from '../utils/math.js';
import { dashTrail, enemies, enemyShots, game, input, particles, pickups, player, playerShots, stats } from '../state.js';
import { setBeamSound } from '../audio/engine.js';
import { SFX } from '../audio/sfx.js';
import { onScreen } from './arena.js';
import { clearBulletsNear, hurtEnemy } from './combat.js';
import { burst, ring, shake, spark } from './effects.js';
import { addScore } from './scoring.js';

export function updatePlayer(dt) {
  let ix = input.right - input.left, iy = input.down - input.up;
  let il = Math.hypot(ix, iy); if (il) { ix /= il; iy /= il; }
  let dirx = ix, diry = iy;
  if (!il) {
    // manette virtuelle : la vitesse du glissement sur le trackpad donne la direction et l'allure
    const jm = Math.hypot(input.joyx, input.joyy);
    if (jm > 60) { il = 1; dirx = input.joyx / jm; diry = input.joyy / jm; }
  }
  const keysMove = ix !== 0 || iy !== 0;
  // visée automatique : cible la plus proche (les humains d'abord quand le rayon est actif)
  const beamWant = (input.beamM || input.beamK) && game.beamUnlocked;
  let tgt = null, bd = 1e9;
  for (const e of enemies) {
    if (e.dead || !onScreen(e)) continue;
    let d = dist(player, e) - e.r;
    if (beamWant) { if (e.type !== 'soldier') d += 3000; }
    else if (e === player.target) d -= 70;
    if (d < bd) { bd = d; tgt = e; }
  }
  if (!beamWant) for (const b of enemyShots) {
    if (b.dead || !b.missile) continue;
    const d = dist(player, b) - 160;
    if (d < 180 && d < bd) { bd = d; tgt = b; }
  }
  player.target = tgt;
  let want = player.aim;
  if (tgt) {
    let tx = tgt.x, ty = tgt.y;
    if (!beamWant && dt > 0) {
      const tvx = tgt.missile ? tgt.vx : (tgt.x - (tgt.lx === undefined ? tgt.x : tgt.lx)) / dt;
      const tvy = tgt.missile ? tgt.vy : (tgt.y - (tgt.ly === undefined ? tgt.y : tgt.ly)) / dt;
      const tt = Math.min(0.5, dist(player, tgt) / stats.bulletSpeed);
      tx += tvx * tt; ty += tvy * tt;
    }
    want = Math.atan2(ty - player.y, tx - player.x);
  } else if (il) want = Math.atan2(diry, dirx);
  player.aim += clamp(angDiff(player.aim, want), -18 * dt, 18 * dt);
  for (const e of enemies) { e.lx = e.x; e.ly = e.y; }
  player.spin += dt * 3;
  if (player.inv > 0) player.inv -= dt;
  if (stats.shield && !player.shieldUp) { player.shieldT -= dt; if (player.shieldT <= 0) { player.shieldUp = true; ring(player.x, player.y, '#6bd6ff', 60, 0.3, 3); SFX.dashReady(); } }

  // recharge du dash
  if (player.charges < stats.dashMax) {
    player.dashRe += dt / stats.dashCd;
    if (player.dashRe >= 1) { player.charges++; player.dashRe = player.charges < stats.dashMax ? player.dashRe - 1 : 0; SFX.dashReady(); ring(player.x, player.y, COLORS.alien, 46, 0.25, 2); }
  } else player.dashRe = 0;

  // déclenchement du dash
  if (input.dash && player.charges > 0 && player.dash <= 0) {
    player.charges--; player.dash = 0.17;
    if (il) { player.ddx = dirx; player.ddy = diry; } else { player.ddx = Math.cos(player.aim); player.ddy = Math.sin(player.aim); }
    player.dashHit = new Set();
    SFX.dash(); shake(5);
    ring(player.x, player.y, COLORS.alien, 70, 0.25, 3);
  }
  input.dash = false;

  player.beaming = false;
  if (player.dash > 0) {
    player.dash -= dt;
    player.x += player.ddx * 2150 * dt; player.y += player.ddy * 2150 * dt;
    dashTrail.push({ x: player.x, y: player.y, life: 0.25 });
    for (let i = 0; i < 3; i++) particles.push({ x: player.x + rand(-14, 14), y: player.y + rand(-14, 14), vx: -player.ddx * rand(50, 300), vy: -player.ddy * rand(50, 300), life: 0.3, max: 0.3, size: rand(2, 5), color: COLORS.alien, drag: 2 });
    const da = Math.atan2(player.ddy, player.ddx);
    for (const e of enemies) {
      if (e.dead || player.dashHit.has(e)) continue;
      if (Math.hypot(e.x - player.x, e.y - player.y) < e.r + player.r + 12) { player.dashHit.add(e); hurtEnemy(e, stats.dashDmg * (1 + (stats.dmg - 1) * 0.5), da, 'dash'); shake(6); }
    }
    for (const b of enemyShots) {
      if (b.dead) continue;
      if (Math.hypot(b.x - player.x, b.y - player.y) < b.r + 46) { b.dead = true; spark(b.x, b.y, b.c, rand(0, TAU), 3); if (b.missile) { addScore(5); SFX.pop(); } }
    }
    if (player.dash <= 0) {
      player.inv = Math.max(player.inv, 0.28);
      player.vx = player.ddx * stats.speed; player.vy = player.ddy * stats.speed;
      if (stats.nova) {
        const R = stats.nova >= 2 ? 250 : 170;
        ring(player.x, player.y, '#ffb14a', R, 0.35, 7); burst(player.x, player.y, '#ffb14a', 30, 600, 5, 0.45); shake(12); SFX.boom(false);
        for (const e of enemies) if (!e.dead && Math.hypot(e.x - player.x, e.y - player.y) < R + e.r) hurtEnemy(e, 4 * stats.dmg, angTo(player, e), 'nova');
        clearBulletsNear(player.x, player.y, R);
      }
    }
  } else {
    player.beaming = (input.beamM || input.beamK) && game.beamUnlocked;
    const sp = stats.speed * (player.beaming ? 0.62 : 1);
    const k = Math.min(1, dt * 24);
    player.vx += (ix * sp - player.vx) * k; player.vy += (iy * sp - player.vy) * k;
    player.x += player.vx * dt; player.y += player.vy * dt;
    if (!keysMove && (input.mdx || input.mdy)) {
      // trackpad en prise directe : la soucoupe se déplace exactement comme le doigt, sans inertie
      const gain = JOY_GAIN * (stats.speed / 430) * (player.beaming ? 0.62 : 1) * (input.rawDt > 0 ? dt / input.rawDt : 1);
      let mx = input.mdx * gain, my = input.mdy * gain;
      const mm = Math.hypot(mx, my), cap = JOY_MAX * dt;
      if (mm > cap) { mx *= cap / mm; my *= cap / mm; }
      player.x += mx; player.y += my;
    }
    // tir
    player.fireCd -= dt;
    if ((input.fire || input.fireK) && !player.beaming && player.fireCd <= 0) {
      player.fireCd = 1 / stats.fireRate;
      const n = stats.multishot;
      for (let i = 0; i < n; i++) {
        const a = player.aim + (i - (n - 1) / 2) * 0.1 + rand(-0.012, 0.012);
        const crit = Math.random() < stats.crit;
        playerShots.push({ x: player.x + Math.cos(a) * 26, y: player.y + Math.sin(a) * 26, vx: Math.cos(a) * stats.bulletSpeed, vy: Math.sin(a) * stats.bulletSpeed, a, dmg: stats.dmg * (crit ? 3 : 1), crit, pierce: stats.pierce, life: 0.9, hit: null });
      }
      player.shotN++;
      if (stats.bomb && player.shotN % (7 - stats.bomb) === 0) {
        const a = player.aim, sp = 820;
        playerShots.push({ x: player.x + Math.cos(a) * 28, y: player.y + Math.sin(a) * 28, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, a, spd: sp, dmg: 0, crit: false, pierce: 0, life: 1.1, hit: null, bomb: true });
        SFX.bombShot();
      }
      spark(player.x + Math.cos(player.aim) * 28, player.y + Math.sin(player.aim) * 28, COLORS.shot, player.aim, 2);
      SFX.shoot();
    }
    // rayon tracteur
    if (player.beaming) {
      for (const e of enemies) {
        if (e.dead || e.type !== 'soldier') continue;
        const d = dist(player, e);
        if (d < stats.beamRange && Math.abs(angDiff(player.aim, angTo(player, e))) < stats.beamHalf) e.pulled = true;
      }
      for (const p of pickups) {
        const d = dist(player, p);
        if (d < stats.beamRange && Math.abs(angDiff(player.aim, angTo(player, p))) < stats.beamHalf) p.pull = true;
      }
      if (Math.random() < 0.6) {
        const a = player.aim + rand(-stats.beamHalf, stats.beamHalf), d = rand(60, stats.beamRange);
        particles.push({ x: player.x + Math.cos(a) * d, y: player.y + Math.sin(a) * d, vx: -Math.cos(a) * 260, vy: -Math.sin(a) * 260, life: 0.3, max: 0.3, size: 3, color: '#7dff7a', drag: 0 });
      }
    }
  }
  setBeamSound(player.beaming);
  player.x = clamp(player.x, player.r, W - player.r); player.y = clamp(player.y, player.r, H - player.r);

  // drones
  for (let i = 0; i < stats.drones; i++) {
    const a = game.time * 2.6 + i * TAU / stats.drones, dx = player.x + Math.cos(a) * 80, dy = player.y + Math.sin(a) * 80;
    for (const e of enemies) {
      if (e.dead || e.dcd > 0) continue;
      if (Math.hypot(e.x - dx, e.y - dy) < e.r + 13) { e.dcd = 0.35; hurtEnemy(e, 1.5 * stats.dmg, a, 'drone'); }
    }
    for (const b of enemyShots) if (!b.dead && Math.hypot(b.x - dx, b.y - dy) < b.r + 13) { b.dead = true; spark(b.x, b.y, b.c, rand(0, TAU), 2); }
  }
}
