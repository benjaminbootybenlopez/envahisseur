/**
 * Canvas du jeu et mise à l’échelle selon la fenêtre.
 */
import { H, W } from '../config.js';

export const canvas = document.getElementById('game');
export const ctx = canvas.getContext('2d');
// facteur d'échelle de l'arène logique vers l'écran, et densité de pixels
export const view = { scale: 1, dpr: 1 };

export function resizeCanvas() {
  view.dpr = Math.min(window.devicePixelRatio || 1, 2);
  view.scale = Math.min(innerWidth / W, innerHeight / H);
  canvas.style.width = Math.round(W * view.scale) + 'px';
  canvas.style.height = Math.round(H * view.scale) + 'px';
  canvas.width = Math.max(1, Math.round(W * view.scale * view.dpr));
  canvas.height = Math.max(1, Math.round(H * view.scale * view.dpr));
}
