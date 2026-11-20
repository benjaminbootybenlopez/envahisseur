/**
 * Lettres affichées pour le dash et le rayon selon le clavier du joueur.
 * Les touches sont liées à leur position physique : Z/X en QWERTY, W/X en AZERTY, Y/X en QWERTZ.
 */

export const KEYS = { dash: 'Z', beam: 'X' };
const ACTION_BY_CODE = { KeyZ: 'dash', KeyX: 'beam' };
let onChange = () => {};

/** Retient la lettre réelle d'une touche physique et prévient l'interface si elle change. */
export function learnKeyLabel(code, label) {
  const action = ACTION_BY_CODE[code];
  if (!action || !label || label.length !== 1) return;
  KEYS[action] = label.toUpperCase();
  onChange(KEYS);
}

/** Détecte la disposition du clavier quand le navigateur le permet (Chrome, Edge). */
export function watchKeyLabels(callback) {
  onChange = callback;
  if (!navigator.keyboard || !navigator.keyboard.getLayoutMap) return;
  navigator.keyboard.getLayoutMap()
    .then(map => { learnKeyLabel('KeyZ', map.get('KeyZ')); learnKeyLabel('KeyX', map.get('KeyX')); })
    .catch(() => {});
}
