/**
 * Géométrie de l’arène : bords et zone visible.
 */
import { H, W } from '../config.js';
import { rand } from '../utils/math.js';

export const onScreen = e => e.x > 0 && e.x < W && e.y > 0 && e.y < H;

/** Point d’apparition juste hors de l’arène, sur un bord au hasard. */
export function edgePoint(m) {
  const s = (Math.random() * 4) | 0;
  if (s === 0) return { x: rand(0, W), y: -m };
  if (s === 1) return { x: W + m, y: rand(0, H) };
  if (s === 2) return { x: rand(0, W), y: H + m };
  return { x: -m, y: rand(0, H) };
}
