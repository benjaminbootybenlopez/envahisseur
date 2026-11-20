/**
 * Fonctions mathématiques et de tableaux sans état.
 */

export const TAU = Math.PI * 2;
export const rand = (a, b) => a + Math.random() * (b - a);
export const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
export const lerp = (a, b, t) => a + (b - a) * t;
export const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
export const angTo = (a, b) => Math.atan2(b.y - a.y, b.x - a.x);
export const angDiff = (a, b) => Math.atan2(Math.sin(b - a), Math.cos(b - a));
export const pick = arr => arr[(Math.random() * arr.length) | 0];
export function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; }
/** Retire en place les éléments marqués `dead`. */
export function compact(arr) { let j = 0; for (let i = 0; i < arr.length; i++) if (!arr[i].dead) arr[j++] = arr[i]; arr.length = j; }
