// État partagé minimal (langue, mode recruteur, élément actif) sans bibliothèque externe.
import { useSyncExternalStore } from "react";

export type Langue = "en" | "fr";
type Etat = { langue: Langue; recruteur: boolean; actif: string; survol: string | null };

const lire = (cle: string, defaut: string) => {
  try { return localStorage.getItem(cle) ?? defaut; } catch { return defaut; }
};

let etat: Etat = {
  langue: (lire("langue", navigator.language.startsWith("fr") ? "fr" : "en") as Langue),
  recruteur: lire("recruteur", "0") === "1",
  actif: "accueil",
  survol: null,
};
const abonnes = new Set<() => void>();

export function maj(partiel: Partial<Etat>) {
  etat = { ...etat, ...partiel };
  try {
    localStorage.setItem("langue", etat.langue);
    localStorage.setItem("recruteur", etat.recruteur ? "1" : "0");
  } catch { /* stockage indisponible : sans conséquence */ }
  abonnes.forEach((f) => f());
}

export function lireEtat() { return etat; }

export function useEtat() {
  return useSyncExternalStore(
    (f) => { abonnes.add(f); return () => abonnes.delete(f); },
    () => etat,
  );
}

export const mouvementReduit = () =>
  typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
