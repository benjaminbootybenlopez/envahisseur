/**
 * Meilleurs scores, sauvegardés dans le navigateur.
 */
import { STORAGE_KEY } from './config.js';

export const best = { easy: 0, hard: 0 };

export function loadBest() {
  try { Object.assign(best, JSON.parse(localStorage.getItem(STORAGE_KEY))); } catch (e) { /* stockage indisponible */ }
}

export function saveBest() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(best)); } catch (e) { /* stockage indisponible */ }
}
