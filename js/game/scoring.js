/**
 * Score et multiplicateur de combo.
 */
import { fmt } from '../utils/format.js';
import { game } from '../state.js';
import { floatText } from './effects.js';

export function addScore(base, x, y, color) {
  const v = base * game.mult;
  game.score += v;
  if (x !== undefined && base >= 40) floatText(x, y - 14, '+' + fmt(v), color || '#fff', 16);
}
export function bumpChain() {
  game.chain++; game.chainT = 3.2;
  game.mult = Math.min(8, 1 + Math.floor(game.chain / 5));
}
