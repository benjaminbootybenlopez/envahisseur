/**
 * Point d’entrée : branche les entrées et l’interface, puis lance la boucle de jeu.
 */
import { LAST_WAVE } from './config.js';
import { clamp } from './utils/math.js';
import { enemies, enemyShots, game, input, player, stats } from './state.js';
import { loadBest } from './storage.js';
import { initAudio, toggleMute } from './audio/engine.js';
import { startMusic } from './audio/music.js';
import { SFX } from './audio/sfx.js';
import { updateMenuAmbience } from './game/effects.js';
import { startWave } from './game/run.js';
import { spawnEnemy } from './game/spawn.js';
import { updateGame } from './game/update.js';
import { resizeCanvas } from './render/canvas.js';
import { render } from './render/renderer.js';
import { watchKeyLabels } from './input/key-labels.js';
import { bindKeyboard } from './input/keyboard.js';
import { bindPointer, consumeTrackpad } from './input/pointer.js';
import { byId } from './ui/dom.js';
import { showEnd } from './ui/end-screen.js';
import { renderKeyLabels, showBest } from './ui/menu-screen.js';
import { setState, startGame, togglePause } from './ui/screens.js';
import { chooseUpgrade, openUpgrade } from './ui/upgrade-screen.js';

const params = new URLSearchParams(location.search);
// ?wave=7 démarre directement à la vague 7 (LAST_WAVE + 1 = boss), pratique pour tester
const devWave = params.has('wave') ? clamp(parseInt(params.get('wave'), 10) || 1, 1, LAST_WAVE + 1) : 0;

loadBest();
showBest();
resizeCanvas();
addEventListener('resize', resizeCanvas);
watchKeyLabels(renderKeyLabels);

const actions = { togglePause, toggleMute, chooseUpgrade };
bindKeyboard(actions);
bindPointer(actions);

const click = handler => () => { SFX.ui(); handler(); };
document.querySelectorAll('[data-diff]').forEach(button => button.addEventListener('click', () => {
  initAudio(); startMusic(); SFX.ui();
  startGame(button.dataset.diff, devWave);
}));
byId('btn-resume').addEventListener('click', togglePause);
byId('btn-restart').addEventListener('click', click(() => startGame(game.diff)));
byId('btn-again').addEventListener('click', click(() => startGame(game.diff)));
byId('btn-quit').addEventListener('click', click(() => setState('menu')));
byId('btn-menu').addEventListener('click', click(() => setState('menu')));

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.034, Math.max(0, (now - last) / 1000));
  last = now;
  if (game.state === 'menu') {
    game.time += dt;
    updateMenuAmbience(dt);
  } else {
    if (game.state === 'play') consumeTrackpad(dt);
    const event = updateGame(dt);
    if (event === 'upgrade') openUpgrade();
    else if (event === 'end') showEnd(game.won);
  }
  render();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// ?debug expose l'état du jeu dans la console, pour les tests
if (params.has('debug')) {
  window.__game = {
    game, player, stats, input, enemies, enemyShots, startGame, startWave, spawnEnemy, updateGame, render, openUpgrade, chooseUpgrade, consumeTrackpad,
    step(n, dt = 1 / 60) { for (let i = 0; i < n; i++) { if (game.state === 'play') consumeTrackpad(dt); const ev = updateGame(dt); if (ev === 'upgrade') openUpgrade(); else if (ev === 'end') showEnd(game.won); } render(); }
  };
}
