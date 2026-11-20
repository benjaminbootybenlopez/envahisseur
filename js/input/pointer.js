/**
 * Trackpad et souris : manette virtuelle en prise directe et capture du pointeur.
 */
import { JOY_SENS } from '../config.js';
import { game, input } from '../state.js';
import { canvas, view } from '../render/canvas.js';

/** Branche le trackpad et la souris ; `actions` fournit les réactions de l'interface. */
export function bindPointer({ togglePause }) {
  addEventListener('mousemove', e => {
    if (game.state !== 'play') return;
    input.jx += (e.movementX || 0) / view.scale; input.jy += (e.movementY || 0) / view.scale;
    if (e.movementX || e.movementY) input.lastMove = performance.now();
  });
  addEventListener('mousedown', e => {
    if (game.state !== 'play') return;
    if (e.button === 0) input.fire = true;
    if (e.button === 2) input.beamM = true;
  });
  addEventListener('mouseup', e => { if (e.button === 0) input.fire = false; if (e.button === 2) input.beamM = false; });
  addEventListener('contextmenu', e => e.preventDefault());
  // Échap libère le pointeur : on met alors la partie en pause
  document.addEventListener('pointerlockchange', () => {
    if (!document.pointerLockElement && game.state === 'play' && game.endT < 0) togglePause();
  });
}

/** Capture le pointeur pendant la partie, pour que le glissement ne bute jamais contre le bord de l'écran. */
export function setPointerLock(on) {
  try {
    if (on) {
      if (document.pointerLockElement !== canvas && canvas.requestPointerLock) {
        const request = canvas.requestPointerLock();
        if (request && request.catch) request.catch(() => {});
      }
    } else if (document.pointerLockElement && document.exitPointerLock) document.exitPointerLock();
  } catch (e) { /* capture refusée : le jeu reste jouable */ }
}

/**
 * Transforme le glissement accumulé depuis la dernière image en commande :
 * déplacement brut (mdx, mdy) et direction lissée (joyx, joyy), nulle dès que le doigt s'arrête.
 */
export function consumeTrackpad(rawDt) {
  if (rawDt <= 0) return;
  const k = 1 - Math.exp(-rawDt / 0.022);
  input.joyx += (input.jx / rawDt * JOY_SENS - input.joyx) * k;
  input.joyy += (input.jy / rawDt * JOY_SENS - input.joyy) * k;
  input.mdx = input.jx; input.mdy = input.jy; input.rawDt = rawDt;
  input.jx = 0; input.jy = 0;
  if (performance.now() - input.lastMove > 70) { input.joyx = 0; input.joyy = 0; }
}
