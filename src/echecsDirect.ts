// Stats d'échecs en direct : le navigateur du visiteur interroge l'API publique de Chess.com (elle autorise
// les appels depuis n'importe quel site). Les valeurs du build servent tant que la réponse n'est pas arrivée,
// et restent affichées si Chess.com ne répond pas. Les coups brillants ne sont pas dans l'API : ils ne changent pas.
import { useEffect, useState } from "react";

type Cadence = { actuel: number; meilleur: number; parties: number };
export type Echecs = { rapide: Cadence; blitz: Cadence; tactique: number; brillants: number; profil: string };
type Brut = { last?: { rating?: number }; best?: { rating?: number }; record?: { win?: number; loss?: number; draw?: number } };

// Une seule requête par chargement de page.
let requete: Promise<Record<string, unknown> | null> | null = null;
const charger = (pseudo: string) =>
  (requete ??= fetch(`https://api.chess.com/pub/player/${pseudo}/stats`)
    .then((r) => (r.ok ? r.json() : null))
    .catch(() => null));

const cadence = (v: Brut | undefined, defaut: Cadence): Cadence => ({
  actuel: v?.last?.rating ?? defaut.actuel,
  meilleur: v?.best?.rating ?? defaut.meilleur,
  parties: v?.record ? (v.record.win ?? 0) + (v.record.loss ?? 0) + (v.record.draw ?? 0) : defaut.parties,
});

export function useEchecsDirect(base: Echecs): Echecs {
  const [ech, setEch] = useState(base);
  useEffect(() => {
    const pseudo = base.profil.split("/").pop()?.toLowerCase();
    if (!pseudo) return;
    let actif = true;
    charger(pseudo).then((d) => {
      if (!actif || !d) return;
      const tactique = (d.tactics as { highest?: { rating?: number } } | undefined)?.highest?.rating;
      setEch({
        ...base,
        rapide: cadence(d.chess_rapid as Brut, base.rapide),
        blitz: cadence(d.chess_blitz as Brut, base.blitz),
        tactique: tactique ?? base.tactique,
      });
    });
    return () => { actif = false; };
  }, [base]);
  return ech;
}
