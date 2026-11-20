/**
 * Musique générative : un séquenceur dont l’intensité suit la partie.
 */
import { audio, noise, tone } from './engine.js';

const BPM_BY_INTENSITY = [100, 118, 124, 130, 142];
// intensité 0 = menu, 1 à 3 = vagues, 4 = boss
const seq = { intensity: 0, bpm: BPM_BY_INTENSITY[0], step: 0, next: 0 };
let timer = null;

export function setMusic(intensity) { seq.intensity = intensity; seq.bpm = BPM_BY_INTENSITY[intensity]; }

export function startMusic() { if (!timer) timer = setInterval(musicTick, 25); }

const nf = n => 55 * Math.pow(2, n / 12);
function musicTick() {
  const c = audio.ctx; if (!c || c.state !== 'running') return;
  const spb = 60 / seq.bpm / 4;
  if (seq.next < c.currentTime) seq.next = c.currentTime + 0.05;
  while (seq.next < c.currentTime + 0.14) {
    musicStep(seq.step, seq.next, spb);
    seq.next += spb; seq.step = (seq.step + 1) % 64;
  }
}
function musicStep(s, t, spb) {
  const I = seq.intensity, st = s % 16, bar = (s >> 4) % 4;
  const root = (I === 4 ? [0, 1, 0, -2] : [0, 0, -4, -2])[bar];
  const m = audio.music;
  if (I === 0) {
    if (st === 0) { tone('sine', nf(root + 12), 0, spb * 15, 0.16, m, t, 0.4); tone('triangle', nf(root + 19), 0, spb * 15, 0.07, m, t, 0.6); }
    if (st % 4 === 2) tone('triangle', nf(root + 24 + [0, 7, 12, 7][(s >> 2) % 4]), 0, spb * 3, 0.05, m, t, 0.01);
    return;
  }
  // grosse caisse
  if (st % 4 === 0) { tone('sine', 150, 42, 0.2, 0.5, m, t, 0.002); }
  // basse
  const bp = I >= 4 ? [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1] : I >= 3 ? [1, 0, 1, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 1, 1] : [1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 1, 1, 0, 0, 1, 0];
  if (bp[st]) {
    const oct = (st % 8 === 3 || st === 14) ? 12 : 0;
    tone('sawtooth', nf(root + 12 + oct), 0, spb * 0.95, 0.22, audio.bassF, t, 0.005);
  }
  if (I >= 2) {
    if (st === 4 || st === 12) { noise(0.14, 0.2, 'bandpass', 1900, 1100, 1.2, m, t); tone('triangle', 210, 120, 0.09, 0.12, m, t); }
    if (st % 4 === 2) noise(0.045, 0.1, 'highpass', 7500, 0, 1, m, t);
    const arp = I === 4 ? [0, 12, 1, 13, 7, 12, 1, 19] : [0, 7, 12, 19, 24, 19, 12, 7];
    if (I >= 3 || st % 2 === 0) {
      const n = arp[(I >= 3 ? st : st >> 1) % 8];
      tone('square', nf(root + 36 + n), 0, spb * 0.9, 0.028, m, t, 0.003);
    }
  }
  if (I >= 3) {
    if (st % 2 === 1) noise(0.03, 0.05, 'highpass', 9000, 0, 1, m, t);
    if (st === 0) {
      tone('sawtooth', nf(root + 24), 0, spb * 16, 0.035, m, t, 0.3);
      tone('sawtooth', nf(root + 31) * 1.004, 0, spb * 16, 0.03, m, t, 0.3);
    }
  }
  if (I === 4 && (st === 6 || st === 14)) noise(0.1, 0.14, 'bandpass', 2600, 900, 1.5, m, t);
}
