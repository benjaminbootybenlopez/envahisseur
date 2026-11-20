/**
 * Effets sonores du jeu, synthétisés à la volée.
 */
import { rand } from '../utils/math.js';
import { audio, noise, tone } from './engine.js';

const lastPlayed = {};

/** Évite d'empiler le même son plusieurs fois dans un court intervalle. */
function throttled(name, ms) {
  const now = performance.now();
  if (lastPlayed[name] && now - lastPlayed[name] < ms) return true;
  lastPlayed[name] = now; return false;
}
export const SFX = {
  shoot() { if (throttled('shoot', 45)) return; tone('square', rand(820, 900), 380, 0.07, 0.035); },
  hit() { if (throttled('hit', 40)) return; tone('triangle', 420, 180, 0.05, 0.07); },
  boom(big) {
    if (throttled('boom' + (big ? 1 : 0), 50)) return;
    noise(big ? 0.55 : 0.26, big ? 0.38 : 0.2, 'lowpass', big ? 1800 : 1400, 120);
    tone('sine', big ? 130 : 180, 38, big ? 0.5 : 0.22, big ? 0.4 : 0.2);
  },
  pop() { if (throttled('pop', 35)) return; noise(0.1, 0.1, 'bandpass', 1600, 500, 2); tone('square', 300, 90, 0.08, 0.05); },
  bombShot() { tone('sine', 220, 70, 0.22, 0.2); noise(0.14, 0.12, 'lowpass', 900, 200); },
  dash() { noise(0.22, 0.26, 'bandpass', 500, 4200, 1.5); tone('sawtooth', 160, 720, 0.16, 0.09); },
  dashReady() { tone('sine', 880, 1320, 0.09, 0.05); },
  hurt() { tone('sawtooth', 240, 50, 0.5, 0.3); noise(0.45, 0.3, 'lowpass', 2600, 150); },
  shield() { tone('sine', 1200, 300, 0.3, 0.16); noise(0.2, 0.12, 'highpass', 3000, 6000); },
  pickup() { if (throttled('pick', 40)) return; tone('sine', 900, 1500, 0.07, 0.05); },
  abduct() { if (throttled('abd', 60)) return; tone('sine', 380, 1300, 0.2, 0.09); tone('triangle', 760, 2100, 0.2, 0.03); },
  heal() { [523, 659, 784, 1047].forEach((f, i) => tone('triangle', f, 0, 0.22, 0.09, null, audio.ctx ? audio.ctx.currentTime + i * 0.07 : 0)); },
  eshoot() { if (throttled('es', 70)) return; tone('square', 240, 150, 0.06, 0.025); },
  shell() { if (throttled('sh', 80)) return; tone('square', 150, 60, 0.16, 0.09); noise(0.12, 0.1, 'lowpass', 900, 200); },
  tele() { if (throttled('tele', 120)) return; tone('sawtooth', 640, 660, 0.12, 0.03); },
  jet() { noise(0.9, 0.14, 'bandpass', 300, 2600, 1.2); },
  missile() { if (throttled('mis', 90)) return; noise(0.3, 0.1, 'bandpass', 2400, 600, 2); tone('sawtooth', 320, 520, 0.2, 0.04); },
  laser() { tone('sawtooth', 82, 76, 2.6, 0.2, null, 0, 0.05); tone('square', 164, 150, 2.6, 0.07, null, 0, 0.05); noise(2.6, 0.1, 'highpass', 4000, 2500); },
  charge() { tone('sawtooth', 120, 900, 1.05, 0.08, null, 0, 0.4); },
  ui() { tone('sine', 660, 990, 0.08, 0.07); },
  upgrade() { [440, 554, 659, 880].forEach((f, i) => tone('square', f, 0, 0.16, 0.05, null, audio.ctx ? audio.ctx.currentTime + i * 0.06 : 0)); },
  clear() { [392, 494, 587, 784, 988].forEach((f, i) => tone('triangle', f, 0, 0.3, 0.09, null, audio.ctx ? audio.ctx.currentTime + i * 0.08 : 0)); },
  unlock() { [330, 440, 554, 659, 880, 1109].forEach((f, i) => tone('sine', f, 0, 0.35, 0.09, null, audio.ctx ? audio.ctx.currentTime + i * 0.09 : 0)); },
  win() { [523, 659, 784, 1047, 1319, 1568].forEach((f, i) => tone('triangle', f, 0, 0.6, 0.1, null, audio.ctx ? audio.ctx.currentTime + i * 0.13 : 0)); },
  lose() { [392, 330, 262, 196, 131].forEach((f, i) => tone('sawtooth', f, f * 0.94, 0.5, 0.08, null, audio.ctx ? audio.ctx.currentTime + i * 0.2 : 0)); }
};
