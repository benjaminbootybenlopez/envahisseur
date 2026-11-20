/**
 * Constantes du jeu : arène, couleurs, difficultés, vagues et réglages du trackpad.
 */

// Dimensions logiques de l'arène ; le canvas est mis à l'échelle de la fenêtre.
export const W = 1600;
export const H = 900;
export const FONT = '"Avenir Next","Segoe UI",system-ui,-apple-system,sans-serif';
// Dernière vague normale ; la vague suivante est celle du boss.
export const LAST_WAVE = 10;
export const STORAGE_KEY = 'envahisseur_best';

export const COLORS = {
  alien: '#5cffc8', shot: '#8affe0', soldier: '#ffb14a', tank: '#ff6a3d', heli: '#ffe14a',
  jet: '#ff4d8d', battery: '#b46bff', enemyShots: '#ff3b5c', missile: '#ff9a3d', boss: '#ff5c5c', shard: '#6bd6ff'
};

export const DIFFICULTIES = {
  easy: { name: 'Détendue', hp: 5, eHp: 0.8, bSpd: 0.8, fire: 1.3, inv: 1.8, count: 0.85, jetGap: 0.12, bossHp: 460 },
  hard: { name: 'Exigeante', hp: 3, eHp: 1, bSpd: 1, fire: 1, inv: 1.1, count: 1, jetGap: 0.085, bossHp: 620 }
};

export const WAVES = [
  null,
  { soldier: 12 },
  { soldier: 16, tank: 2 },
  { soldier: 16, tank: 2, heli: 3 },
  { soldier: 18, tank: 3, heli: 3, jet: 2 },
  { soldier: 16, tank: 4, heli: 3, battery: 2, jet: 2 },
  { soldier: 20, tank: 4, heli: 5, battery: 1, jet: 3 },
  { soldier: 18, tank: 5, heli: 4, battery: 2, jet: 4 },
  { soldier: 22, tank: 5, heli: 6, battery: 3, jet: 4 },
  { soldier: 22, tank: 6, heli: 6, battery: 3, jet: 5 },
  { soldier: 26, tank: 7, heli: 7, battery: 4, jet: 6 }
];
export const WAVE_NAMES = [
  '', 'Premier contact', 'La milice s’organise', 'Appui aérien', 'Frappe supersonique', 'Zone interdite',
  'Riposte générale', 'Ciel verrouillé', 'Mobilisation totale', 'Dernier rempart', 'Tout ce qu’il leur reste'
];

// Trackpad
export const JOY_SENS = 4;      // sert seulement à lire la direction du glissement (pour le dash)
export const JOY_GAIN = 2.1;    // sensibilité : déplacement de la soucoupe par pixel de glissement
export const JOY_MAX = 2400;    // vitesse plafond, pour ne pas se téléporter
