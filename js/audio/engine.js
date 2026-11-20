/**
 * Moteur audio Web Audio : graphe de mixage et primitives de synthèse.
 */

const MASTER_VOLUME = 0.75;
export const audio = { ctx: null, muted: false };

/** Crée le contexte audio au premier geste du joueur (exigé par les navigateurs). */
export function initAudio() {
  if (audio.ctx) { if (audio.ctx.state !== 'running') audio.ctx.resume(); return; }
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return;
  try {
    const c = audio.ctx = new AudioCtx();
    const comp = c.createDynamicsCompressor();
    comp.threshold.value = -14; comp.ratio.value = 5; comp.connect(c.destination);
    audio.master = c.createGain(); audio.master.gain.value = MASTER_VOLUME; audio.master.connect(comp);
    audio.sfx = c.createGain(); audio.sfx.gain.value = 0.9; audio.sfx.connect(audio.master);
    audio.mfilter = c.createBiquadFilter(); audio.mfilter.type = 'lowpass'; audio.mfilter.frequency.value = 18000;
    audio.music = c.createGain(); audio.music.gain.value = 0.55;
    audio.music.connect(audio.mfilter); audio.mfilter.connect(audio.master);
    audio.bassF = c.createBiquadFilter(); audio.bassF.type = 'lowpass'; audio.bassF.frequency.value = 520; audio.bassF.Q.value = 6;
    audio.bassF.connect(audio.music);
    const len = c.sampleRate, buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    audio.noiseBuf = buf;
    // boucle continue du rayon tracteur, rendue audible par setBeamSound
    audio.beamG = c.createGain(); audio.beamG.gain.value = 0; audio.beamG.connect(audio.sfx);
    const o1 = c.createOscillator(), o2 = c.createOscillator();
    o1.type = 'sine'; o2.type = 'triangle'; o1.frequency.value = 170; o2.frequency.value = 174.5;
    o1.connect(audio.beamG); o2.connect(audio.beamG); o1.start(); o2.start();
  } catch (e) { audio.ctx = null; }
}

export function tone(type, f1, f2, dur, vol, dest, when, attack) {
  if (!audio.ctx) return;
  const c = audio.ctx, t = when || c.currentTime, o = c.createOscillator(), g = c.createGain();
  o.type = type; o.frequency.setValueAtTime(f1, t);
  if (f2) o.frequency.exponentialRampToValueAtTime(Math.max(1, f2), t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(vol, t + (attack || 0.004));
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(dest || audio.sfx);
  o.start(t); o.stop(t + dur + 0.03);
}
export function noise(dur, vol, ftype, f1, f2, q, dest, when) {
  if (!audio.ctx) return;
  const c = audio.ctx, t = when || c.currentTime, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
  s.buffer = audio.noiseBuf; s.loop = true;
  f.type = ftype || 'lowpass'; f.Q.value = q || 0.8;
  f.frequency.setValueAtTime(f1, t);
  if (f2) f.frequency.exponentialRampToValueAtTime(Math.max(20, f2), t + dur);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(f); f.connect(g); g.connect(dest || audio.sfx);
  s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.03);
}

/** Assourdit la musique (menus de pause et de mutation). */
export function setMuffled(on) { if (audio.ctx) audio.mfilter.frequency.setTargetAtTime(on ? 480 : 18000, audio.ctx.currentTime, 0.12); }
export function setBeamSound(on) { if (audio.ctx) audio.beamG.gain.setTargetAtTime(on ? 0.07 : 0, audio.ctx.currentTime, 0.04); }
export function toggleMute() {
  audio.muted = !audio.muted;
  if (audio.ctx) audio.master.gain.setTargetAtTime(audio.muted ? 0 : MASTER_VOLUME, audio.ctx.currentTime, 0.03);
}
