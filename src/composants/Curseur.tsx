// Curseur « viseur » : un point et un anneau qui devient un cadre de visée sur ce qui est cliquable
// (liens, boutons, objets du toit). Les éléments .magnet suivent légèrement la souris.
// Seulement avec une souris (pointer: fine) et sans réduction des animations.
import { useEffect, useRef } from "react";
import { mouvementReduit } from "../etat";
import { recit } from "../scene/progression";

export default function Curseur({ libelleObjet }: { libelleObjet: string }) {
  const point = useRef<HTMLDivElement>(null);
  const anneau = useRef<HTMLDivElement>(null);
  const etiquette = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!matchMedia("(pointer: fine)").matches || mouvementReduit()) return;
    const html = document.documentElement;
    html.classList.add("curseur-perso");
    let x = -100, y = -100, ax = x, ay = y, raf = 0, visible = false;
    let aimant: HTMLElement | null = null;

    const relacher = () => { if (aimant) { aimant.style.transform = ""; aimant = null; } };
    const bouger = (e: PointerEvent) => {
      x = e.clientX; y = e.clientY;
      if (!visible) { visible = true; html.classList.add("curseur-visible"); ax = x; ay = y; }
      const cible = (e.target as Element | null)?.closest<HTMLElement>("a, button, [data-curseur], [tabindex='0']");
      anneau.current?.classList.toggle("survol", !!cible);
      const texte = cible?.dataset.curseur ?? "";
      const m = (e.target as Element | null)?.closest<HTMLElement>(".magnet") ?? null;
      if (m !== aimant) relacher();
      if (m) {
        aimant = m;
        const r = m.getBoundingClientRect();
        m.style.transform = `translate(${(x - r.left - r.width / 2) * 0.22}px, ${(y - r.top - r.height / 2) * 0.32}px)`;
      }
      if (etiquette.current && !recit.survolObjet) etiquette.current.textContent = texte;
    };
    const sortir = () => { visible = false; html.classList.remove("curseur-visible"); relacher(); };
    const presser = () => anneau.current?.classList.add("presse");
    const lacher = () => anneau.current?.classList.remove("presse");

    let avant = performance.now();
    const boucle = (maintenant: number) => {
      // Rattrapage indépendant du nombre d'images par seconde.
      const k = 1 - Math.exp(-Math.min(0.1, (maintenant - avant) / 1000) * 14);
      avant = maintenant;
      ax += (x - ax) * k; ay += (y - ay) * k;
      if (point.current) point.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      if (anneau.current) {
        anneau.current.style.transform = `translate3d(${ax}px, ${ay}px, 0)`;
        const objet = !!recit.survolObjet;
        anneau.current.classList.toggle("cadre", objet);
        if (objet && etiquette.current) etiquette.current.textContent = libelleObjet;
      }
      raf = requestAnimationFrame(boucle);
    };
    raf = requestAnimationFrame(boucle);
    addEventListener("pointermove", bouger, { passive: true });
    document.addEventListener("pointerleave", sortir);
    addEventListener("pointerdown", presser);
    addEventListener("pointerup", lacher);
    return () => {
      cancelAnimationFrame(raf); relacher();
      removeEventListener("pointermove", bouger);
      document.removeEventListener("pointerleave", sortir);
      removeEventListener("pointerdown", presser);
      removeEventListener("pointerup", lacher);
      html.classList.remove("curseur-perso", "curseur-visible");
    };
  }, [libelleObjet]);

  return (
    <>
      <div ref={anneau} className="curseur-anneau" aria-hidden="true">
        <i className="c1" /><i className="c2" /><i className="c3" /><i className="c4" />
        <span ref={etiquette} className="curseur-texte" />
      </div>
      <div ref={point} className="curseur-point" aria-hidden="true" />
    </>
  );
}
