/**
 * Navigation entre les écrans et effets de chaque changement d’état.
 */
import { LAST_WAVE } from '../config.js';
import { clearEntities, difficulty, game, resetInput } from '../state.js';
import { setBeamSound, setMuffled } from '../audio/engine.js';
import { setMusic } from '../audio/music.js';
import { SFX } from '../audio/sfx.js';
import { startRun } from '../game/run.js';
import { canvas } from '../render/canvas.js';
import { setPointerLock } from '../input/pointer.js';
import { byId } from './dom.js';
import { showBest } from './menu-screen.js';

const SCREENS = { menu: byId('menu'), upgrade: byId('upgrade'), pause: byId('pause'), end: byId('end') };
let lastPauseToggle = 0;

export function setState(state) {
  game.state = state;
  for (const name in SCREENS) SCREENS[name].classList.toggle('on', name === state);
  canvas.style.cursor = state === 'play' ? 'none' : 'default';
  setMuffled(state === 'upgrade' || state === 'pause');
  setPointerLock(state === 'play');
  resetInput();
  if (state !== 'play') setBeamSound(false);
  if (state === 'menu') {
    setMusic(0); showBest(); clearEntities();
    game.banner = null; game.flash = 0; game.shake = 0;
  }
}

export function startGame(diff, firstWave) {
  startRun(diff, firstWave);
  setState('play');
}

export function togglePause() {
  // Échap déclenche à la fois la touche et la libération du pointeur : on ignore le doublon
  const now = performance.now();
  if (now - lastPauseToggle < 300) return;
  lastPauseToggle = now;
  if (game.state === 'play' && game.endT < 0) {
    const where = game.wave <= LAST_WAVE ? 'Vague ' + game.wave + ' / ' + LAST_WAVE : 'Le Bastion';
    byId('pause-sub').textContent = where + ' · ' + difficulty.name;
    setState('pause'); SFX.ui();
  } else if (game.state === 'pause') {
    setState('play'); SFX.ui();
  }
}
