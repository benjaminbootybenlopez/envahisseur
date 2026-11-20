/**
 * Écran de choix d’une mutation entre deux vagues.
 */
import { game, player } from '../state.js';
import { SFX } from '../audio/sfx.js';
import { startWave } from '../game/run.js';
import { applyUpgrade, rollUpgrades } from '../game/upgrades.js';
import { byId } from './dom.js';
import { setState } from './screens.js';

let choices = [];

function createCard(upgrade, index) {
  const level = game.levels[upgrade.id] || 0;
  const card = document.createElement('button');
  card.className = 'card';
  card.style.setProperty('--c', upgrade.color);
  card.innerHTML = '<div class="key"></div><div class="ico"></div><div class="name"></div><div class="desc"></div><div class="lvl"></div>';
  card.querySelector('.key').textContent = 'TOUCHE ' + (index + 1);
  card.querySelector('.ico').textContent = upgrade.icon;
  card.querySelector('.name').textContent = upgrade.name;
  card.querySelector('.desc').textContent = upgrade.desc;
  card.querySelector('.lvl').textContent = upgrade.repeatable ? 'RÉPARATION' : 'NIVEAU ' + (level + 1) + ' / ' + upgrade.max;
  card.addEventListener('click', () => chooseUpgrade(index));
  return card;
}

export function openUpgrade() {
  choices = rollUpgrades();
  if (!choices.length) { startWave(game.wave + 1); return; }
  byId('up-title').textContent = 'VAGUE ' + game.wave + ' NETTOYÉE';
  byId('up-cards').replaceChildren(...choices.map(createCard));
  setState('upgrade');
}

export function chooseUpgrade(index) {
  if (game.state !== 'upgrade' || !choices[index]) return;
  applyUpgrade(choices[index]);
  SFX.upgrade();
  setState('play');
  player.inv = Math.max(player.inv, 1);
  startWave(game.wave + 1);
}
