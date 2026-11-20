/**
 * Écran de fin de partie : résultat, statistiques et record.
 */
import { LAST_WAVE } from '../config.js';
import { fmt } from '../utils/format.js';
import { difficulty, game } from '../state.js';
import { best, saveBest } from '../storage.js';
import { setMusic } from '../audio/music.js';
import { byId } from './dom.js';
import { setState } from './screens.js';

function createStat(value, label) {
  const tile = document.createElement('div');
  tile.className = 'stat';
  tile.innerHTML = '<div class="v"></div><div class="l"></div>';
  tile.firstChild.textContent = value;
  tile.lastChild.textContent = label;
  return tile;
}

function formatDuration(seconds) {
  return Math.floor(seconds / 60) + ':' + String(Math.floor(seconds % 60)).padStart(2, '0');
}

export function showEnd(won) {
  game.newRecord = game.score > (best[game.diff] || 0);
  if (game.newRecord) { best[game.diff] = Math.round(game.score); saveBest(); }

  const screen = byId('end');
  screen.classList.toggle('win', won);
  screen.classList.toggle('lose', !won);
  byId('end-title').textContent = won ? 'LA TERRE EST À TOI' : 'SOUCOUPE DÉTRUITE';
  const outcome = won ? 'Invasion réussie' : game.wave <= LAST_WAVE ? 'Abattue à la vague ' + game.wave : 'Abattue par le Bastion';
  byId('end-sub').textContent = outcome + ' · ' + difficulty.name;
  byId('end-record').textContent = game.newRecord ? '★ NOUVEAU RECORD ★' : '';

  byId('end-stats').replaceChildren(
    createStat(fmt(game.score), 'Score'),
    createStat(game.wave <= LAST_WAVE ? game.wave + ' / ' + LAST_WAVE : 'Boss', 'Vague atteinte'),
    createStat(formatDuration(game.runTime), 'Durée'),
    createStat(fmt(game.kills), 'Ennemis éliminés'),
    createStat(fmt(game.abducted), 'Humains aspirés'),
    createStat(fmt(best[game.diff] || 0), 'Record')
  );

  const counts = {};
  for (const name of game.taken) counts[name] = (counts[name] || 0) + 1;
  const list = Object.keys(counts).map(name => name + (counts[name] > 1 ? ' ×' + counts[name] : ''));
  byId('end-taken').textContent = list.length ? 'Mutations : ' + list.join(' · ') : 'Aucune mutation';

  setState('end');
  setMusic(0);
}
