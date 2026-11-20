/**
 * État mutable partagé par tous les modules.
 * Les objets et tableaux sont modifiés en place, jamais réassignés,
 * pour que chaque module garde la même référence.
 */

// Partie en cours et état de l'écran ('menu', 'play', 'upgrade', 'pause', 'outcome', 'end').
export const game = { state: 'menu', diff: 'hard', time: 0, boss: null };
// Soucoupe du joueur, ses statistiques (modifiées par les mutations) et la difficulté choisie.
export const player = {};
export const stats = {};
export const difficulty = {};

export const enemies = [];
export const playerShots = [];
export const enemyShots = [];
export const particles = [];
export const pickups = [];
export const floatingTexts = [];
export const rings = [];
export const dashTrail = [];

// Commandes du joueur, écrites par les modules d'entrée, lues par la logique de jeu.
export const input = {
  up: 0, down: 0, left: 0, right: 0, fire: false, fireK: false, beamM: false, beamK: false, dash: false,
  jx: 0, jy: 0, lastMove: 0, joyx: 0, joyy: 0, mdx: 0, mdy: 0, rawDt: 0
};

/** Remplace tout le contenu d'un objet sans changer sa référence. */
export function replaceContents(target, values) {
  for (const key of Object.keys(target)) delete target[key];
  Object.assign(target, values);
}

export function clearEntities() {
  for (const list of [enemies, playerShots, enemyShots, particles, pickups, floatingTexts, rings, dashTrail]) list.length = 0;
  game.boss = null;
}

export function resetInput() {
  input.up = input.down = input.left = input.right = 0;
  input.fire = input.fireK = input.beamM = input.beamK = input.dash = false;
  input.jx = input.jy = input.joyx = input.joyy = input.mdx = input.mdy = 0;
}
