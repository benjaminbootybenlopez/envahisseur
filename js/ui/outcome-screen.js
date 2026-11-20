/**
 * Écran GAME OVER / YOU WIN, entre la fin de partie et l'écran des scores.
 * Il passe seul aux scores après quelques secondes, ou plus tôt sur Espace, Entrée ou clic.
 */
import { game } from '../state.js';
import { setMusic, MUSIC_SILENT } from '../audio/music.js';
import { SFX } from '../audio/sfx.js';
import { byId } from './dom.js';
import { showEnd } from './end-screen.js';
import { setState } from './screens.js';

const DURATION_MS = 3500;
// délai avant de pouvoir passer : le joueur tient souvent encore Espace (le tir) au moment de la fin
const SKIP_DELAY_MS = 800;
const TEXTS = {
  win: { title: 'YOU WIN', sub: 'La Terre est à toi.' },
  lose: { title: 'GAME OVER', sub: 'L’humanité a tenu bon… pour cette fois.' }
};

let timer = null;
let shownAt = 0;

export function showOutcome(won) {
  const text = won ? TEXTS.win : TEXTS.lose;
  const screen = byId('outcome');
  screen.classList.toggle('win', won);
  screen.style.setProperty('--duration', DURATION_MS + 'ms');
  byId('outcome-title').textContent = text.title;
  byId('outcome-sub').textContent = text.sub;

  game.banner = null; // une bannière de vague ne doit pas apparaître derrière le titre
  setState('outcome');
  setMusic(MUSIC_SILENT);
  if (won) SFX.victory(); else SFX.gameOver();

  shownAt = performance.now();
  clearTimeout(timer);
  timer = setTimeout(continueToScores, DURATION_MS);
}

/** Passe à l'écran des scores ; ignoré si l'écran n'est pas affiché ou vient d'apparaître. */
export function skipOutcome() {
  if (game.state !== 'outcome' || performance.now() - shownAt < SKIP_DELAY_MS) return;
  continueToScores();
}

function continueToScores() {
  clearTimeout(timer);
  if (game.state === 'outcome') showEnd(game.won);
}

byId('outcome').addEventListener('click', skipOutcome);
