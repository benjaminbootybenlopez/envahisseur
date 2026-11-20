/**
 * Mutations proposées entre les vagues et leur effet.
 */
import { shuffle } from '../utils/math.js';
import { game, player, stats } from '../state.js';

export const UPGRADES = [
  { id: 'rate', name: 'Canons surcadencés', desc: 'Cadence de tir +25 %', max: 4, icon: '≫', color: '#8affe0', apply() { stats.fireRate *= 1.25; } },
  { id: 'dmg', name: 'Plasma concentré', desc: 'Dégâts des tirs +40 %', max: 4, icon: '✦', color: '#ff9ad5', apply() { stats.dmg *= 1.4; } },
  { id: 'multi', name: 'Canon jumelé', desc: '+1 projectile par salve', max: 3, icon: '⫶', color: '#8affe0', apply() { stats.multishot++; } },
  { id: 'pierce', name: 'Tirs perforants', desc: 'Chaque tir traverse 1 ennemi de plus', max: 3, icon: '➤', color: '#ffe14a', apply() { stats.pierce++; } },
  { id: 'bomb', name: 'Bombes à plasma', desc: 'Un tir sur six devient une bombe qui explose en zone. Chaque niveau : plus fréquente, plus large, plus forte', max: 3, icon: '✹', color: '#ffb14a', apply() { stats.bomb++; } },
  { id: 'dashc', name: 'Saut quantique', desc: '+1 charge de dash', max: 2, icon: '◈', color: '#5cffc8', apply() { stats.dashMax++; player.charges++; } },
  { id: 'dashr', name: 'Réacteur de phase', desc: 'Le dash se recharge 30 % plus vite', max: 3, icon: '↻', color: '#5cffc8', apply() { stats.dashCd *= 0.7; } },
  { id: 'nova', name: 'Onde de choc', desc: 'Le dash explose à l’arrivée et balaie les tirs', max: 2, icon: '✺', color: '#ffb14a', apply() { stats.nova++; } },
  { id: 'hull', name: 'Coque renforcée', desc: '+1 point de coque maximum, et réparation', max: 3, icon: '⬢', color: '#5cffc8', apply() { player.maxHp++; player.hp++; } },
  { id: 'heal', name: 'Nanoréparation', desc: 'Répare 2 points de coque', max: 99, icon: '✚', color: '#7dff7a', available: () => player.hp < player.maxHp, apply() { player.hp = Math.min(player.maxHp, player.hp + 2); } },
  { id: 'beam', name: 'Rayon élargi', desc: 'Rayon tracteur : portée et largeur +35 %', max: 2, icon: '◭', color: '#7dff7a', available: () => game.beamUnlocked, apply() { stats.beamRange *= 1.35; stats.beamHalf *= 1.35; } },
  { id: 'bio', name: 'Assimilation', desc: '2 humains de moins pour réparer la coque', max: 2, icon: '❖', color: '#7dff7a', available: () => game.beamUnlocked, apply() { stats.humansPerHeal -= 2; } },
  { id: 'drone', name: 'Drone orbital', desc: 'Un drone tourne autour de toi, blesse les ennemis et bloque les tirs', max: 3, icon: '◉', color: '#6bd6ff', apply() { stats.drones++; } },
  { id: 'crit', name: 'Surcharge', desc: '+15 % de chance de triple dégât', max: 3, icon: '✸', color: '#ff9ad5', apply() { stats.crit += 0.15; } },
  { id: 'shield', name: 'Bouclier', desc: 'Absorbe un coup, puis se recharge', max: 2, icon: '◯', color: '#6bd6ff', apply() { stats.shield++; player.shieldUp = true; } },
  { id: 'homing', name: 'Tirs guidés', desc: 'Les tirs dévient vers les cibles proches', max: 2, icon: '⤳', color: '#ffe14a', apply() { stats.homing += 2.2; } }
];
/** Tire trois mutations encore disponibles. */
export function rollUpgrades() {
  const pool = UPGRADES.filter(u => (game.levels[u.id] || 0) < u.max && (!u.available || u.available()));
  return shuffle(pool).slice(0, 3);
}
export function applyUpgrade(u) {
  game.levels[u.id] = (game.levels[u.id] || 0) + 1;
  u.apply();
  game.taken.push(u.name);
}
