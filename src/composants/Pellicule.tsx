// THRUFRAME en pellicule de cinéma : bandes noires de format large, puis défilement horizontal des photogrammes.
// Les photos viennent de src/assets/thruframe/ (ordre alphabétique des noms de fichiers). Tant qu'il n'y en a pas,
// chaque photogramme est typographique (un thème du projet photo) : aucune image n'est inventée.
import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { mouvementReduit } from "../etat";

const fichiers = import.meta.glob("../assets/thruframe/*.{jpg,jpeg,png,webp,avif}", {
  eager: true, query: "?url", import: "default",
}) as Record<string, string>;
const PHOTOS = Object.keys(fichiers).sort().map((k) => fichiers[k]);

type Textes = { titre: string; texte: string; lien: string; themes: readonly string[]; pellicule: string; fin: string };

export default function Pellicule({ t, immersif }: { t: Textes; immersif: boolean }) {
  const racine = useRef<HTMLElement>(null);
  const bande = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!immersif || mouvementReduit() || !matchMedia("(min-width: 901px)").matches) return;
    const ctx = gsap.context(() => {
      const distance = () => (bande.current?.scrollWidth ?? 0) - innerWidth;
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: ".pellicule-scene", start: "top top", end: () => `+=${distance() + innerHeight * 0.6}`,
          pin: true, scrub: 0.6, invalidateOnRefresh: true, refreshPriority: 1,
          onToggle: (s) => document.documentElement.classList.toggle("cinema", s.isActive),
        },
      });
      tl.to(".cinema-barre", { scaleY: 1, duration: 0.12, ease: "power2.out" }, 0)
        .to(bande.current, { x: () => -distance(), ease: "none", duration: 1 }, 0.08)
        .to(".photogramme .pg-image", { xPercent: 10, ease: "none", duration: 1 }, 0.08);
    }, racine);
    return () => { ctx.revert(); document.documentElement.classList.remove("cinema"); };
  }, [immersif]);

  const cadres = PHOTOS.length
    ? PHOTOS.map((src, i) => ({ cle: src, src, theme: "", n: i + 1 }))
    : t.themes.map((theme, i) => ({ cle: theme, src: "", theme, n: i + 1 }));

  return (
    <section ref={racine} id="photo" className={immersif ? "pellicule" : "pellicule statique"} aria-label={t.titre}>
      <div className="pellicule-scene">
        <span className="cinema-barre haut" aria-hidden="true" />
        <span className="cinema-barre bas" aria-hidden="true" />
        <div ref={bande} className="pellicule-bande">
          <header className="pellicule-titre">
            <p className="mono rec">● REC · {t.pellicule}</p>
            <h3 className="thruframe" aria-label="THRUFRAME">THRU<span>FRAME</span></h3>
            <p className="pellicule-texte">{t.texte}</p>
            <a className="bouton magnet" href="https://www.instagram.com/thru_frame/" target="_blank" rel="noreferrer" data-curseur="@thru_frame">{t.lien} ↗</a>
          </header>
          {cadres.map((c, i) => (
            <figure key={c.cle} className={`photogramme pg-${(i % 6) + 1}`}>
              <div className="pg-fenetre">
                {c.src ? <img className="pg-image" src={c.src} alt="" loading="lazy" /> : <div className="pg-image" aria-hidden="true" />}
                <span className="pg-grain" aria-hidden="true" />
                <span className="pg-hud mono" aria-hidden="true">
                  <i>● {String(c.n).padStart(2, "0")}A</i>{c.src ? <i>THRUFRAME</i> : <i>{t.pellicule}</i>}
                </span>
                {c.theme && <figcaption className="pg-theme">{c.theme}</figcaption>}
              </div>
              <p className="pg-legende mono">THRUFRAME · {String(c.n).padStart(2, "0")}</p>
            </figure>
          ))}
          <a className="photogramme pg-fin" href="https://www.instagram.com/thru_frame/" target="_blank" rel="noreferrer" data-curseur="@thru_frame">
            <span className="pg-fin-texte">{t.fin}</span>
            <span className="mono">instagram.com/thru_frame ↗</span>
          </a>
        </div>
      </div>
    </section>
  );
}
