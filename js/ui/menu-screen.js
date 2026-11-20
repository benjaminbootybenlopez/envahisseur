/**
 * Écran titre : records et lettres des touches.
 */
import { fmt } from '../utils/format.js';
import { best } from '../storage.js';
import { byId } from './dom.js';

export function showBest() {
  byId('best-easy').textContent = 'RECORD ' + (best.easy ? fmt(best.easy) : '—');
  byId('best-hard').textContent = 'RECORD ' + (best.hard ? fmt(best.hard) : '—');
}

/** Affiche les lettres réelles du clavier ; l'aide AZERTY devient alors inutile. */
export function renderKeyLabels(keys) {
  byId('key-dash').textContent = keys.dash;
  byId('key-beam').textContent = keys.beam;
  byId('key-note').hidden = true;
  byId('key-note2').hidden = true;
}
