// Rail de navigation à droite : numéro de chaque section, section active et progression du défilement.
// Il n'apparaît qu'une fois la nuit tombée (quand le contenu commence).
import { useEffect, useRef, useState } from "react";

export type EntreeRail = { id: string; n: string; libelle: string };

export default function Rail({ entrees }: { entrees: EntreeRail[] }) {
  const [actif, setActif] = useState("");
  const [visible, setVisible] = useState(false);
  const barre = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const obs = new IntersectionObserver((liste) => {
      liste.forEach((e) => { if (e.isIntersecting) setActif(e.target.id); });
    }, { rootMargin: "-45% 0px -50% 0px" });
    entrees.forEach((e) => { const el = document.getElementById(e.id); if (el) obs.observe(el); });
    let raf = 0;
    const maj = () => {
      raf = 0;
      const premier = document.getElementById(entrees[0]?.id);
      const debut = premier ? premier.getBoundingClientRect().top + scrollY - innerHeight * 0.6 : 0;
      const fin = document.documentElement.scrollHeight - innerHeight;
      const p = Math.min(1, Math.max(0, (scrollY - debut) / Math.max(1, fin - debut)));
      setVisible(scrollY > debut);
      if (barre.current) barre.current.style.transform = `scaleY(${p})`;
    };
    const auDefilement = () => { if (!raf) raf = requestAnimationFrame(maj); };
    maj();
    addEventListener("scroll", auDefilement, { passive: true });
    return () => { obs.disconnect(); removeEventListener("scroll", auDefilement); cancelAnimationFrame(raf); };
  }, [entrees]);

  return (
    <nav className={visible ? "rail visible" : "rail"} aria-label="Index">
      <div className="rail-piste"><div ref={barre} className="rail-barre" /></div>
      <ol>
        {entrees.map((e) => (
          <li key={e.id} className={actif === e.id ? "actif" : ""}>
            <a href={`#${e.id}`} data-curseur={e.libelle}><span className="rail-n">{e.n}</span><span className="rail-l">{e.libelle}</span></a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
