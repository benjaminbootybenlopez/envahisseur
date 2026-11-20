/**
 * Pas de simulation : fait avancer la partie d’une image.
 */
import { COLORS, LAST_WAVE } from '../config.js';
import { compact } from '../utils/math.js';
import { dashTrail, enemies, enemyShots, floatingTexts, game, particles, pickups, player, playerShots, rings } from '../state.js';
import { SFX } from '../audio/sfx.js';
import { destroyShot } from './combat.js';
import { showBanner, updateEffects } from './effects.js';
import { updateEnemies } from './enemies.js';
import { updatePickups } from './pickups.js';
import { updatePlayer } from './player.js';
import { updateBullets } from './projectiles.js';
import { updateSpawns } from './run.js';

function removeDead() {
  for (const list of [pickups, particles, rings, floatingTexts, dashTrail, playerShots, enemyShots]) compact(list);
  for (const e of enemies) if (e.dead && !e.add && e.type !== 'boss') game.waveDone++;
  compact(enemies);
}

/**
 * Avance la partie de rawDt secondes.
 * Renvoie 'upgrade' quand une vague est terminée, 'end' quand la partie est finie, sinon null.
 */
export function updateGame(rawDt) {
  game.time += rawDt;
  if (game.banner) { game.banner.t -= rawDt; if (game.banner.t <= 0) game.banner = null; }
  if (game.shake > 0) game.shake = Math.max(0, game.shake - rawDt * 55);
  if (game.flash > 0) game.flash = Math.max(0, game.flash - rawDt * 2.6);
  if (game.state !== 'play') return null;
  if (game.freeze > 0) { game.freeze -= rawDt; return null; }
  let dt = rawDt;
  if (game.slow > 0) { game.slow -= rawDt; dt *= 0.32; }
  game.runTime += dt; game.hintT += dt;
  if (game.chainT > 0) { game.chainT -= dt; if (game.chainT <= 0) { game.chain = 0; game.mult = 1; } }

  if (!player.dead) updatePlayer(dt);
  if (!game.won) updateSpawns(dt);
  updateEnemies(dt);
  updateBullets(dt);
  updatePickups(dt);
  updateEffects(dt);
  removeDead();

  // fin de vague
  if (!player.dead && !game.won && game.wave <= LAST_WAVE && game.clearT < 0 && !game.queue.length && !enemies.length) {
    game.clearT = 1.5;
    for (const b of enemyShots) destroyShot(b);
    showBanner('VAGUE ' + game.wave + ' NETTOYÉE', '', 1.5, COLORS.alien);
    SFX.clear();
  }
  let event = null;
  if (game.clearT >= 0) { game.clearT -= rawDt; if (game.clearT < 0 && !player.dead) event = 'upgrade'; }
  if (game.endT >= 0) { game.endT -= rawDt; if (game.endT < 0) { game.endT = -1; event = 'end'; } }
  return event;
}
