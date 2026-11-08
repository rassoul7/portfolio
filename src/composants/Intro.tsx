// Ouverture : compte de démarrage, puis l'écran s'ouvre comme un diaphragme centré sur le soleil.
// Jouée une fois par session, jamais en vue recruteur ni si le visiteur a réduit les animations.
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { lireEtat, mouvementReduit } from "../etat";
import { T } from "../textes";

const deja = () => { try { return sessionStorage.getItem("intro") === "1"; } catch { return false; } };

/** Vrai si l'ouverture va être jouée à ce chargement (calculé une fois, lu par App pour décaler l'apparition du nom). */
export const INTRO = !mouvementReduit() && !lireEtat().recruteur && !deja();
export const DUREE_INTRO = INTRO ? 2.5 : 0;

export default function Intro() {
  const [fini, setFini] = useState(!INTRO);
  const racine = useRef<HTMLDivElement>(null);
  const compteur = useRef<HTMLSpanElement>(null);
  const tl = useRef<gsap.core.Timeline | null>(null);
  const t = T[lireEtat().langue].intro;

  useEffect(() => {
    if (fini) return;
    const html = document.documentElement;
    html.style.overflow = "hidden";
    // Lenis écoute la molette sur window : on l'arrête en phase de capture, avant lui.
    const bloquer = (e: Event) => { e.preventDefault(); e.stopPropagation(); };
    const opts = { capture: true, passive: false } as const;
    addEventListener("wheel", bloquer, opts);
    addEventListener("touchmove", bloquer, opts);
    const debloquer = () => { removeEventListener("wheel", bloquer, opts); removeEventListener("touchmove", bloquer, opts); };
    const fin = () => {
      debloquer();
      html.style.overflow = "";
      try { sessionStorage.setItem("intro", "1"); } catch { /* sans conséquence */ }
      setFini(true);
    };
    const n = { v: 0 };
    const ligne = gsap.timeline({ onComplete: fin });
    ligne.to(n, { v: 100, duration: 1.4, ease: "power2.inOut",
      onUpdate: () => { if (compteur.current) compteur.current.textContent = String(Math.round(n.v)).padStart(3, "0"); } })
      .to(".ouverture-ligne", { opacity: 1, y: 0, stagger: 0.12, duration: 0.5, ease: "power2.out" }, 0.1)
      .to(".ouverture-contenu", { opacity: 0, scale: 0.96, duration: 0.3, ease: "power2.in" }, 1.45)
      .to(racine.current, { "--r": "150vmax", duration: 1.0, ease: "expo.inOut" }, 1.5);
    tl.current = ligne;
    const passer = () => ligne.progress(1);
    addEventListener("keydown", passer, { once: true });
    return () => { ligne.kill(); debloquer(); removeEventListener("keydown", passer); html.style.overflow = ""; };
  }, [fini]);

  if (fini) return null;
  return (
    <div ref={racine} className="ouverture" aria-hidden="true" onClick={() => tl.current?.progress(1)}>
      <div className="ouverture-contenu">
        <p className="ouverture-ligne mono">RN · {t.systeme}</p>
        <p className="ouverture-compte"><span ref={compteur}>000</span></p>
        <p className="ouverture-ligne mono">14.69°N · 17.44°W · DAKAR</p>
        <p className="ouverture-ligne mono ouverture-doux">{t.passer}</p>
      </div>
    </div>
  );
}
