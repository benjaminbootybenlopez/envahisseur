/**
 * Déroulement d’une partie : initialisation, vagues et apparition des ennemis.
 */
import { COLORS, DIFFICULTIES, H, LAST_WAVE, W, WAVE_NAMES, WAVES } from '../config.js';
import { clamp, rand, shuffle } from '../utils/math.js';
import { clearEntities, difficulty, enemies, game, player, replaceContents, stats } from '../state.js';
import { setMusic } from '../audio/music.js';
import { SFX } from '../audio/sfx.js';
import { showBanner } from './effects.js';
import { spawnBoss, spawnEnemy } from './spawn.js';
import { applyUpgrade, rollUpgrades } from './upgrades.js';
import { KEYS } from '../input/key-labels.js';

/** Réinitialise tout l'état pour une nouvelle partie et lance la première vague. */
export function startRun(diff, startWaveNum) {
  game.diff = diff;
  replaceContents(difficulty, DIFFICULTIES[diff]);
  Object.assign(game, {
    time: 0, runTime: 0, wave: 0, score: 0, chain: 0, chainT: 0, mult: 1, kills: 0, abducted: 0,
    shake: 0, freeze: 0, slow: 0, flash: 0, banner: null, queue: [], spawnT: 0, clearT: -1, endT: -1, bossSpawnT: 0,
    beamUnlocked: false, levels: {}, taken: [], waveTotal: 0, waveDone: 0, hintT: 0, won: false, newRecord: false
  });
  replaceContents(stats, {
    fireRate: 6, dmg: 1, multishot: 1, pierce: 0, speed: 430, dashMax: 1, dashCd: 2.6, dashDmg: 8, nova: 0,
    beamRange: 320, beamHalf: 0.36, humansPerHeal: 6, magnet: 120, drones: 0, crit: 0, shield: 0, homing: 0, bomb: 0, bulletSpeed: 1150
  });
  replaceContents(player, {
    x: W / 2, y: H / 2, vx: 0, vy: 0, r: 22, hp: difficulty.hp, maxHp: difficulty.hp, aim: 0, fireCd: 0, inv: 1.2,
    charges: 1, dashRe: 0, dash: 0, ddx: 0, ddy: 0, dashHit: null, beaming: false, bio: 0,
    shieldUp: false, shieldT: 0, dead: false, spin: 0, shotN: 0, target: null
  });
  clearEntities();
  // démarrage direct à une vague avancée (paramètre ?wave=) : mutations tirées au hasard
  const n = startWaveNum || 1;
  for (let i = 1; i < n; i++) { game.beamUnlocked = true; const offer = rollUpgrades(); if (offer.length) applyUpgrade(offer[0]); }
  startWave(n);
}

export function startWave(n) {
  game.wave = n; game.clearT = -1; game.waveDone = 0;
  let sub = WAVE_NAMES[n] || '';
  if (n >= 2 && !game.beamUnlocked) {
    game.beamUnlocked = true; SFX.unlock();
    showBanner('RAYON TRACTEUR DÉBLOQUÉ', 'Maintiens la touche ' + KEYS.beam + ' : aspire les humains pour réparer ta coque', 4.2, '#7dff7a');
    game.hintT = 0;
  } else if (n <= LAST_WAVE) {
    showBanner('VAGUE ' + n, sub, 2.4, COLORS.alien);
  }
  if (n <= LAST_WAVE) {
    const w = WAVES[n], heavy = [], q = [];
    for (const k in w) {
      const c = k === 'soldier' ? Math.round(w[k] * difficulty.count) : Math.max(1, Math.round(w[k] * difficulty.count));
      for (let i = 0; i < c; i++) (k === 'soldier' ? q : heavy).push(k);
    }
    shuffle(heavy);
    // les unités lourdes sont réparties au milieu des fantassins
    heavy.forEach((k, i) => { const pos = Math.min(q.length, 2 + Math.floor((i + rand(0.2, 0.9)) * (q.length / (heavy.length + 0.5)))); q.splice(pos, 0, k); });
    game.queue = q; game.waveTotal = q.length; game.spawnT = 1.4;
    setMusic(n <= 3 ? 1 : n <= 6 ? 2 : 3);
  } else {
    game.queue = []; game.waveTotal = 1;
    showBanner('ALERTE : LE BASTION', 'La dernière forteresse de l’humanité', 3.4, COLORS.boss);
    game.bossSpawnT = 2.2;
    setMusic(4);
  }
}

export function updateSpawns(dt) {
  if (game.wave > LAST_WAVE) {
    if (game.bossSpawnT > 0) { game.bossSpawnT -= dt; if (game.bossSpawnT <= 0) spawnBoss(); }
    return;
  }
  if (!game.queue.length) return;
  const alive = enemies.length, cap = 9 + game.wave * 2;
  game.spawnT -= dt * (alive < 2 ? 2 : 1);
  if (game.spawnT <= 0 && alive < cap) {
    spawnEnemy(game.queue.shift());
    game.spawnT = clamp(2.1 - game.wave * 0.11, 0.85, 2) * rand(0.7, 1.2);
  }
}
