/**
 * Soucoupe du joueur : visée automatique, déplacement, dash, tir, rayon tracteur, drones.
 */
import { COLORS, DASH_TRAIL_LIFE, H, JOY_GAIN, JOY_MAX, W } from '../config.js';
import { angDiff, angTo, clamp, dist, rand, TAU } from '../utils/math.js';
import { dashTrail, enemies, enemyShots, game, input, pickups, player, playerShots, stats } from '../state.js';
import { setBeamSound } from '../audio/engine.js';
import { SFX } from '../audio/sfx.js';
import { onScreen } from './arena.js';
import { clearBulletsNear, destroyShot, hurtEnemy } from './combat.js';
import { burst, emitParticle, ring, shake, spark } from './effects.js';
import { addScore } from './scoring.js';

const DASH_DURATION = 0.17;
const DASH_SPEED = 2150;
const BEAM_SLOWDOWN = 0.62; // la soucoupe ralentit quand le rayon tracteur est actif

export function updatePlayer(dt) {
  const dir = readDirection();
  aimAutomatically(dt, dir);
  updateTimers(dt);
  rechargeDash(dt);
  if (input.dash && player.charges > 0 && player.dash <= 0) startDash(dir);
  input.dash = false;

  player.beaming = false;
  if (player.dash > 0) {
    updateDash(dt);
  } else {
    player.beaming = (input.beamM || input.beamK) && game.beamUnlocked;
    move(dt, dir);
    fire(dt);
    if (player.beaming) pullWithBeam();
  }
  setBeamSound(player.beaming);
  player.x = clamp(player.x, player.r, W - player.r); player.y = clamp(player.y, player.r, H - player.r);
  updateDrones();
}

/**
 * Direction demandée : flèches du clavier, sinon sens du glissement sur le trackpad.
 * ix/iy ne viennent que des flèches ; dirx/diry servent à orienter le dash et la visée.
 */
function readDirection() {
  let ix = input.right - input.left, iy = input.down - input.up;
  const len = Math.hypot(ix, iy);
  if (len) { ix /= len; iy /= len; }
  const dir = { ix, iy, dirx: ix, diry: iy, moving: len > 0, keys: len > 0 };
  if (!dir.moving) {
    const jm = Math.hypot(input.joyx, input.joyy);
    if (jm > 60) { dir.moving = true; dir.dirx = input.joyx / jm; dir.diry = input.joyy / jm; }
  }
  return dir;
}

/** Cible la plus proche ; avec le rayon actif, les fantassins passent en priorité. */
function findTarget(beamWanted) {
  let target = null, best = 1e9;
  for (const e of enemies) {
    if (e.dead || !onScreen(e)) continue;
    let d = dist(player, e) - e.r;
    if (beamWanted) { if (e.type !== 'soldier') d += 3000; }
    else if (e === player.target) d -= 70; // garde sa cible tant qu'une autre n'est pas nettement plus proche
    if (d < best) { best = d; target = e; }
  }
  if (!beamWanted) for (const b of enemyShots) {
    if (b.dead || !b.missile) continue;
    const d = dist(player, b) - 160;
    if (d < 180 && d < best) { best = d; target = b; }
  }
  return target;
}

/** Tourne le canon vers la cible, en anticipant son déplacement. */
function aimAutomatically(dt, dir) {
  const beamWanted = (input.beamM || input.beamK) && game.beamUnlocked;
  const target = player.target = findTarget(beamWanted);
  let want = player.aim;
  if (target) {
    let tx = target.x, ty = target.y;
    if (!beamWanted && dt > 0) {
      // vitesse de la cible : les missiles la portent, les unités gardent leur position précédente
      const tvx = target.missile ? target.vx : (target.x - (target.prevX ?? target.x)) / dt;
      const tvy = target.missile ? target.vy : (target.y - (target.prevY ?? target.y)) / dt;
      const tt = Math.min(0.5, dist(player, target) / stats.bulletSpeed);
      tx += tvx * tt; ty += tvy * tt;
    }
    want = Math.atan2(ty - player.y, tx - player.x);
  } else if (dir.moving) want = Math.atan2(dir.diry, dir.dirx);
  player.aim += clamp(angDiff(player.aim, want), -18 * dt, 18 * dt);
}

function updateTimers(dt) {
  player.spin += dt * 3;
  if (player.inv > 0) player.inv -= dt;
  if (stats.shield && !player.shieldUp) {
    player.shieldT -= dt;
    if (player.shieldT <= 0) { player.shieldUp = true; ring(player.x, player.y, '#6bd6ff', 60, 0.3, 3); SFX.dashReady(); }
  }
}

function rechargeDash(dt) {
  if (player.charges >= stats.dashMax) { player.dashRe = 0; return; }
  player.dashRe += dt / stats.dashCd;
  if (player.dashRe >= 1) {
    player.charges++;
    player.dashRe = player.charges < stats.dashMax ? player.dashRe - 1 : 0;
    SFX.dashReady(); ring(player.x, player.y, COLORS.alien, 46, 0.25, 2);
  }
}

function startDash(dir) {
  player.charges--; player.dash = DASH_DURATION;
  if (dir.moving) { player.ddx = dir.dirx; player.ddy = dir.diry; } else { player.ddx = Math.cos(player.aim); player.ddy = Math.sin(player.aim); }
  player.dashHit = new Set();
  SFX.dash(); shake(5);
  ring(player.x, player.y, COLORS.alien, 70, 0.25, 3);
}

/** Pendant le dash : la soucoupe fonce, blesse ce qu'elle traverse et détruit les tirs. */
function updateDash(dt) {
  player.dash -= dt;
  player.x += player.ddx * DASH_SPEED * dt; player.y += player.ddy * DASH_SPEED * dt;
  dashTrail.push({ x: player.x, y: player.y, life: DASH_TRAIL_LIFE });
  for (let i = 0; i < 3; i++) {
    emitParticle({ x: player.x + rand(-14, 14), y: player.y + rand(-14, 14), vx: -player.ddx * rand(50, 300), vy: -player.ddy * rand(50, 300), life: 0.3, size: rand(2, 5), color: COLORS.alien, drag: 2 });
  }
  const da = Math.atan2(player.ddy, player.ddx);
  for (const e of enemies) {
    if (e.dead || player.dashHit.has(e)) continue;
    if (dist(e, player) < e.r + player.r + 12) { player.dashHit.add(e); hurtEnemy(e, stats.dashDmg * (1 + (stats.dmg - 1) * 0.5), da, 'dash'); shake(6); }
  }
  for (const b of enemyShots) {
    if (b.dead || dist(b, player) >= b.r + 46) continue;
    destroyShot(b, 3);
    if (b.missile) { addScore(5); SFX.pop(); }
  }
  if (player.dash <= 0) endDash();
}

/** Fin du dash : courte invincibilité, et onde de choc si la mutation est prise. */
function endDash() {
  player.inv = Math.max(player.inv, 0.28);
  player.vx = player.ddx * stats.speed; player.vy = player.ddy * stats.speed;
  if (!stats.nova) return;
  const R = stats.nova >= 2 ? 250 : 170;
  ring(player.x, player.y, '#ffb14a', R, 0.35, 7); burst(player.x, player.y, '#ffb14a', 30, 600, 5, 0.45); shake(12); SFX.boom(false);
  for (const e of enemies) if (!e.dead && dist(e, player) < R + e.r) hurtEnemy(e, 4 * stats.dmg, angTo(player, e), 'nova');
  clearBulletsNear(player.x, player.y, R);
}

function move(dt, dir) {
  const slow = player.beaming ? BEAM_SLOWDOWN : 1;
  // flèches : vitesse avec un peu d'inertie
  const sp = stats.speed * slow, k = Math.min(1, dt * 24);
  player.vx += (dir.ix * sp - player.vx) * k; player.vy += (dir.iy * sp - player.vy) * k;
  player.x += player.vx * dt; player.y += player.vy * dt;
  // trackpad en prise directe : la soucoupe se déplace exactement comme le doigt, sans inertie
  if (!dir.keys && (input.mdx || input.mdy)) {
    const gain = JOY_GAIN * (stats.speed / 430) * slow * (input.rawDt > 0 ? dt / input.rawDt : 1);
    let mx = input.mdx * gain, my = input.mdy * gain;
    const mm = Math.hypot(mx, my), cap = JOY_MAX * dt;
    if (mm > cap) { mx *= cap / mm; my *= cap / mm; }
    player.x += mx; player.y += my;
  }
}

function fire(dt) {
  player.fireCd -= dt;
  if (!(input.fire || input.fireK) || player.beaming || player.fireCd > 0) return;
  player.fireCd = 1 / stats.fireRate;
  const n = stats.multishot;
  for (let i = 0; i < n; i++) {
    const a = player.aim + (i - (n - 1) / 2) * 0.1 + rand(-0.012, 0.012);
    const crit = Math.random() < stats.crit;
    playerShots.push({ x: player.x + Math.cos(a) * 26, y: player.y + Math.sin(a) * 26, vx: Math.cos(a) * stats.bulletSpeed, vy: Math.sin(a) * stats.bulletSpeed, a, dmg: stats.dmg * (crit ? 3 : 1), crit, pierce: stats.pierce, life: 0.9, hit: null });
  }
  // mutation « Bombes à plasma » : un tir sur 6, 5 ou 4 part en plus sous forme de bombe
  player.shotN++;
  if (stats.bomb && player.shotN % (7 - stats.bomb) === 0) {
    const a = player.aim, sp = 820;
    playerShots.push({ x: player.x + Math.cos(a) * 28, y: player.y + Math.sin(a) * 28, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, a, spd: sp, dmg: 0, crit: false, pierce: 0, life: 1.1, hit: null, bomb: true });
    SFX.bombShot();
  }
  spark(player.x + Math.cos(player.aim) * 28, player.y + Math.sin(player.aim) * 28, COLORS.shot, player.aim, 2);
  SFX.shoot();
}

/** Vrai si la cible est dans le cône du rayon tracteur. */
function inBeam(target) {
  return dist(player, target) < stats.beamRange && Math.abs(angDiff(player.aim, angTo(player, target))) < stats.beamHalf;
}

/** Marque les fantassins et fragments attirés par le rayon ; leur module les déplace. */
function pullWithBeam() {
  for (const e of enemies) if (!e.dead && e.type === 'soldier' && inBeam(e)) e.pulled = true;
  for (const p of pickups) if (inBeam(p)) p.pulled = true;
  if (Math.random() < 0.6) {
    const a = player.aim + rand(-stats.beamHalf, stats.beamHalf), d = rand(60, stats.beamRange);
    emitParticle({ x: player.x + Math.cos(a) * d, y: player.y + Math.sin(a) * d, vx: -Math.cos(a) * 260, vy: -Math.sin(a) * 260, life: 0.3, size: 3, color: '#7dff7a' });
  }
}

/** Drones en orbite : blessent les ennemis et bloquent les tirs qu'ils touchent. */
function updateDrones() {
  for (let i = 0; i < stats.drones; i++) {
    const a = game.time * 2.6 + i * TAU / stats.drones;
    const drone = { x: player.x + Math.cos(a) * 80, y: player.y + Math.sin(a) * 80 };
    for (const e of enemies) {
      if (e.dead || e.dcd > 0) continue;
      if (dist(e, drone) < e.r + 13) { e.dcd = 0.35; hurtEnemy(e, 1.5 * stats.dmg, a, 'drone'); }
    }
    for (const b of enemyShots) if (!b.dead && dist(b, drone) < b.r + 13) destroyShot(b);
  }
}
