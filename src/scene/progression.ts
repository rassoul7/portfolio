// Progression du récit (0 → 1), écrite par le défilement et lue par la scène à chaque image.
// Volontairement hors de React : elle change à chaque image et ne doit pas provoquer de rendu.
import { mouvementReduit } from "../etat";

// p : progression du récit (atelier → quatre piliers). q : passage vers la nuit, sur sa propre section (0 → 1).
export const recit = { p: 0, q: 0, survolObjet: null as string | null };

/** Monde de nuit atteint au milieu du passage, quand l'écran est presque uni. */
export const estNuit = () => recit.q >= 0.5;

/** Courbe douce entre a et b (0 avant a, 1 après b). */
export function etape(a: number, b: number, p = recit.p) {
  const x = Math.min(1, Math.max(0, (p - a) / (b - a)));
  return x * x * (3 - 2 * x);
}

/** Bornes des moments du récit. */
export const MOMENTS = {
  atelier: [0, 0.14],
  plongee: [0.14, 0.25],
  observer: [0.28, 0.44],
  securiser: [0.46, 0.6],
  construire: [0.62, 0.76],
  comprendre: [0.78, 0.92],
} as const;

export const BASCULE = 0.245; // instant où l'on passe de l'atelier au site industriel (masqué par l'éclair)
export const REDUIT = mouvementReduit();
