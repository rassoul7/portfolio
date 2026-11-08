// Petit bandeau « meilleure expérience sur ordinateur », affiché seulement sur téléphone et tablette
// (écran tactile ou étroit), juste après l'ouverture. Une fois par session, fermable, et il part tout seul.
import { useEffect, useState } from "react";
import { DUREE_INTRO } from "./Intro";

const CLE = "conseil-ordi";
const vu = () => { try { return sessionStorage.getItem(CLE) === "1"; } catch { return false; } };
const memoriser = () => { try { sessionStorage.setItem(CLE, "1"); } catch { /* navigation privée : tant pis */ } };

export default function Conseil({ t }: { t: { titre: string; texte: string; fermer: string } }) {
  const [etat, setEtat] = useState<"cache" | "visible" | "sortie">("cache");

  useEffect(() => {
    if (vu() || !matchMedia("(pointer: coarse), (max-width: 900px)").matches) return;
    const entree = setTimeout(() => { setEtat("visible"); memoriser(); }, DUREE_INTRO * 1000 + 700);
    const sortie = setTimeout(() => setEtat("sortie"), DUREE_INTRO * 1000 + 8700);
    return () => { clearTimeout(entree); clearTimeout(sortie); };
  }, []);

  if (etat === "cache") return null;
  return (
    <div className={`conseil ${etat}`} role="status" onAnimationEnd={() => etat === "sortie" && setEtat("cache")}>
      <span className="conseil-icone" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
          <rect x="3" y="4" width="18" height="12" rx="1.5" /><path d="M1.5 19.5h21" />
        </svg>
      </span>
      <p><b>{t.titre}</b><span>{t.texte}</span></p>
      <button type="button" onClick={() => setEtat("sortie")} aria-label={t.fermer}>✕</button>
    </div>
  );
}
