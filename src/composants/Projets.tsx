// Projets présentés comme des « dossiers » empilés : chaque planche reste collée en haut de l'écran,
// la suivante glisse par-dessus et la précédente recule. Chaque planche porte le schéma du système.
// Règle : un schéma ne montre QUE ce que dit le texte du projet dans le profil maître (rien d'inventé).
import { useEffect, useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import type { Langue } from "../etat";
import { mouvementReduit } from "../etat";

type L = { en: string; fr: string };
type Noeud = { id: string; x: number; y: number; l: L; s?: L; style?: "accent" | "attente" | "pile" | "source" };
type Schema = { h: number; noeuds: Noeud[]; liens: [string, string, "pointille"?][]; legende: L };
const m = (en: string, fr = en): L => ({ en, fr });

export const SCHEMAS: Record<string, Schema> = {
  hints: {
    h: 290, legende: m("Delivery pipeline", "Chaîne de livraison"),
    noeuds: [
      { id: "df", x: 78, y: 50, l: m("Dockerfile"), s: m("multi-stage", "multi-étapes") },
      { id: "ci", x: 245, y: 50, l: m("CI · GitHub Actions"), s: m("lint · types · tests") },
      { id: "img", x: 405, y: 50, l: m("Docker image", "Image Docker") },
      { id: "e2e", x: 405, y: 150, l: m("E2E tests", "Tests E2E"), s: m("Playwright") },
      { id: "stg", x: 230, y: 150, l: m("Staging", "Préproduction"), s: m("behind Traefik", "derrière Traefik"), style: "accent" },
      { id: "app", x: 230, y: 250, l: m("Next.js · PostgreSQL · MinIO"), style: "pile" },
    ],
    liens: [["df", "ci"], ["ci", "img"], ["img", "e2e"], ["e2e", "stg"], ["stg", "app", "pointille"]],
  },
  zenvo: {
    h: 290, legende: m("B2B2C model and stack", "Modèle B2B2C et pile"),
    noeuds: [
      { id: "ecole", x: 90, y: 60, l: m("Schools", "Écoles"), s: m("B2B2C"), style: "source" },
      { id: "eleve", x: 90, y: 170, l: m("Learners 9–16", "Élèves 9-16 ans"), s: m("French-speaking Africa", "Afrique francophone") },
      { id: "front", x: 345, y: 50, l: m("Frontend"), s: m("React · Three.js"), style: "accent" },
      { id: "back", x: 345, y: 140, l: m("Backend + database", "Backend + base"), s: m("Supabase") },
      { id: "dep", x: 345, y: 230, l: m("Deployment", "Déploiement") },
    ],
    liens: [["ecole", "eleve"], ["eleve", "front"], ["front", "back"], ["back", "dep"]],
  },
  ayaqli: {
    h: 290, legende: m("Mobile app and API", "Application mobile et API"),
    noeuds: [
      { id: "app", x: 72, y: 130, l: m("Flutter app", "App Flutter"), style: "accent" },
      { id: "api", x: 235, y: 130, l: m("FastAPI"), s: m("surahs · verses · translations", "sourates · versets · traductions") },
      { id: "kw", x: 235, y: 40, l: m("Keyword search", "Recherche par mot-clé") },
      { id: "db", x: 400, y: 130, l: m("PostgreSQL") },
      { id: "vec", x: 375, y: 240, l: m("pgvector schema", "Schéma pgvector"), s: m("ready for semantic search", "prêt pour la recherche sémantique"), style: "attente" },
    ],
    liens: [["app", "api"], ["api", "kw"], ["api", "db"], ["db", "vec", "pointille"]],
  },
  shadow: {
    h: 290, legende: m("Game loop with no game master", "Boucle de jeu sans maître du jeu"),
    noeuds: [
      { id: "app", x: 80, y: 140, l: m("The app", "L'application"), s: m("no game master", "sans maître du jeu"), style: "accent" },
      { id: "roles", x: 235, y: 45, l: m("Roles", "Rôles") },
      { id: "tours", x: 400, y: 80, l: m("Turns", "Tours") },
      { id: "enig", x: 400, y: 215, l: m("Riddles", "Énigmes") },
      { id: "votes", x: 240, y: 245, l: m("Votes") },
    ],
    liens: [["app", "roles"], ["roles", "tours"], ["tours", "enig"], ["enig", "votes"], ["votes", "tours"]],
  },
  etat_art_nhi: {
    h: 310, legende: m("PRISMA 2020 method", "Méthode PRISMA 2020"),
    noeuds: [
      { id: "s1", x: 62, y: 34, l: m("IEEE Xplore"), style: "source" },
      { id: "s2", x: 175, y: 34, l: m("ACM"), style: "source" },
      { id: "s3", x: 280, y: 34, l: m("arXiv"), style: "source" },
      { id: "s4", x: 400, y: 34, l: m("Springer"), style: "source" },
      { id: "id", x: 240, y: 112, l: m("Identification") },
      { id: "sel", x: 240, y: 172, l: m("Screening", "Sélection") },
      { id: "inc", x: 240, y: 222, l: m("Included studies", "Études incluses") },
      { id: "res", x: 240, y: 282, l: m("IAM for autonomous AI agents", "IAM des agents IA autonomes"), s: m("Zero Trust · least privilege · secret lifecycle", "Zero Trust · moindre privilège · cycle de vie des secrets"), style: "accent" },
    ],
    liens: [["s1", "id"], ["s2", "id"], ["s3", "id"], ["s4", "id"], ["id", "sel"], ["sel", "inc"], ["inc", "res"]],
  },
};

const largeur = (n: Noeud, l: Langue) => Math.max(n.l[l].length * 7.1, (n.s?.[l].length ?? 0) * 5.9) + 26;

function Diagramme({ schema, langue }: { schema: Schema; langue: Langue }) {
  const pos = new Map(schema.noeuds.map((n) => [n.id, n]));
  return (
    <svg className="schema" viewBox={`0 0 480 ${schema.h}`} role="img" aria-label={schema.legende[langue]}>
      <defs>
        <marker id="fleche" viewBox="0 0 8 8" refX="4" refY="4" markerWidth="5" markerHeight="5" orient="auto">
          <path d="M0,0 L8,4 L0,8 z" fill="currentColor" />
        </marker>
      </defs>
      {schema.liens.map(([a, b, style], i) => {
        const A = pos.get(a)!, B = pos.get(b)!;
        return (
          <g key={i} className="lien" style={{ "--i": i } as React.CSSProperties}>
            <line x1={A.x} y1={A.y} x2={B.x} y2={B.y} className={style === "pointille" ? "trace pointille" : "trace"} />
            <line x1={A.x} y1={A.y} x2={B.x} y2={B.y} className="flux" />
          </g>
        );
      })}
      {schema.noeuds.map((n, i) => {
        const w = largeur(n, langue), h = n.s ? 42 : 28;
        return (
          <g key={n.id} className={`noeud ${n.style ?? ""}`} style={{ "--i": i } as React.CSSProperties} transform={`translate(${n.x} ${n.y})`}>
            <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={8} />
            <text y={n.s ? -3 : 4} className="n-l">{n.l[langue]}</text>
            {n.s && <text y={12} className="n-s">{n.s[langue]}</text>}
          </g>
        );
      })}
    </svg>
  );
}

type Projet = {
  id: string; techno: string[]; lien: string | null;
  en: { titre: string; role: string; texte: string; preuve: string };
  fr: { titre: string; role: string; texte: string; preuve: string };
};

export default function Projets({ projets, langue, preuve, immersif }: { projets: Projet[]; langue: Langue; preuve: string; immersif: boolean }) {
  const racine = useRef<HTMLDivElement>(null);

  // Allume le schéma d'une planche quand elle est à l'écran.
  useEffect(() => {
    const obs = new IntersectionObserver((l) => l.forEach((e) => e.target.classList.toggle("actif", e.isIntersecting)),
      { threshold: 0.35 });
    racine.current?.querySelectorAll(".dossier").forEach((d) => obs.observe(d));
    return () => obs.disconnect();
  }, []);

  // Empilement : la planche recouverte recule et s'assombrit.
  useLayoutEffect(() => {
    if (!immersif || mouvementReduit()) return;
    const ctx = gsap.context(() => {
      const dossiers = gsap.utils.toArray<HTMLElement>(".dossier");
      dossiers.forEach((d, i) => {
        const suivant = dossiers[i + 1];
        if (!suivant) return;
        // On fait reculer l'article : la planche garde son propre transform pour l'inclinaison à la souris.
        const st = { trigger: suivant, start: "top bottom", end: "top 12%", scrub: true };
        gsap.to(d, { scale: 0.92, ease: "none", transformOrigin: "50% 0", scrollTrigger: st });
        // Le contenu recouvert s'efface : il ne reste que le bord de la planche, sans textes superposés.
        gsap.to(d.querySelectorAll(".dossier-texte, .dossier-schema"), { opacity: 0, ease: "none", scrollTrigger: { ...st, start: "top 70%", end: "top 35%" } });
      });
    }, racine);
    return () => ctx.revert();
  }, [immersif]);

  const incliner = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!immersif || mouvementReduit() || e.pointerType !== "mouse") return;
    const el = e.currentTarget, r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
    el.style.setProperty("--ry", `${(px - 0.5) * 6}deg`);
    el.style.setProperty("--rx", `${(0.5 - py) * 5}deg`);
    el.style.setProperty("--gx", `${px * 100}%`);
    el.style.setProperty("--gy", `${py * 100}%`);
  };
  const remettre = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.style.setProperty("--rx", "0deg");
    e.currentTarget.style.setProperty("--ry", "0deg");
  };

  return (
    <div ref={racine} className="dossiers">
      {projets.map((p, i) => {
        const c = p[langue];
        const [nom, ...reste] = c.titre.split(", ");
        const schema = SCHEMAS[p.id];
        return (
          <article key={p.id} className="dossier" style={{ "--i": i } as React.CSSProperties}>
            <div className="dossier-plaque" onPointerMove={incliner} onPointerLeave={remettre}>
              <div className="dossier-texte">
                <p className="dossier-index mono"><b>{String(i + 1).padStart(2, "0")}</b> / {String(projets.length).padStart(2, "0")} · {c.role}</p>
                <h3 className="dossier-titre">{nom}</h3>
                {reste.length > 0 && <p className="dossier-sous">{reste.join(", ")}</p>}
                <p className="dossier-desc">{c.texte}</p>
                <ul className="dossier-techno">{p.techno.map((x) => <li key={x}>{x}</li>)}</ul>
                <p className="preuve">
                  <span className={p.lien ? "pastille publique" : "pastille"}>{preuve}</span>
                  {p.lien ? <a href={p.lien} target="_blank" rel="noreferrer" data-curseur="GitHub">{c.preuve} ↗</a> : c.preuve}
                </p>
              </div>
              {schema && (
                <figure className="dossier-schema">
                  <Diagramme schema={schema} langue={langue} />
                  <figcaption className="mono">fig. {String(i + 1).padStart(2, "0")} · {schema.legende[langue]}</figcaption>
                </figure>
              )}
              <span className="dossier-reflet" aria-hidden="true" />
            </div>
          </article>
        );
      })}
    </div>
  );
}
