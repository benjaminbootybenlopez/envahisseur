/**
 * Clavier : flèches, tir, dash, rayon, pause, son et choix des mutations.
 */
import { game, input, resetInput } from '../state.js';
import { learnKeyLabel } from './key-labels.js';

const ARROWS = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' };
const UPGRADE_KEYS = { Digit1: 0, Digit2: 1, Digit3: 2, Numpad1: 0, Numpad2: 1, Numpad3: 2 };

/** Branche le clavier ; `actions` fournit les réactions de l'interface. */
export function bindKeyboard({ togglePause, toggleMute, chooseUpgrade }) {
  addEventListener('keydown', e => {
    if (ARROWS[e.code]) { input[ARROWS[e.code]] = 1; e.preventDefault(); }
    if (e.code === 'Space') { e.preventDefault(); if (game.state === 'play') input.fireK = true; }
    if (e.code === 'KeyZ') { learnKeyLabel(e.code, e.key); if (!e.repeat && game.state === 'play') input.dash = true; }
    if (e.code === 'KeyX') { learnKeyLabel(e.code, e.key); input.beamK = true; }
    if (e.repeat) return;
    if (e.code === 'Escape' || e.code === 'KeyP') togglePause();
    if (e.key && e.key.toLowerCase() === 'm') toggleMute();
    if (game.state === 'upgrade' && UPGRADE_KEYS[e.code] !== undefined) chooseUpgrade(UPGRADE_KEYS[e.code]);
  });
  addEventListener('keyup', e => {
    if (ARROWS[e.code]) input[ARROWS[e.code]] = 0;
    if (e.code === 'Space') input.fireK = false;
    if (e.code === 'KeyX') input.beamK = false;
  });
  // fenêtre quittée : on relâche tout et on met en pause
  addEventListener('blur', () => {
    resetInput();
    if (game.state === 'play' && game.endT < 0) togglePause();
  });
}
