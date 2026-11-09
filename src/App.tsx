import { lazy, Suspense, useEffect, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import profil from "./donnees/profil.json";
import { maj, mouvementReduit, useEtat, type Langue } from "./etat";
import { periode, T } from "./textes";
import { recit } from "./scene/progression";
import Intro, { DUREE_INTRO } from "./composants/Intro";
import Curseur from "./composants/Curseur";
import Rail from "./composants/Rail";
import Projets from "./composants/Projets";
import Pellicule from "./composants/Pellicule";
import Conseil from "./composants/Conseil";
import { useEchecsDirect } from "./echecsDirect";

// Écran tactile sans souris : pas de survol possible, on dit « touchez » au lieu de « survolez ».
const TACTILE = typeof matchMedia !== "undefined" && matchMedia("(hover: none)").matches;

gsap.registerPlugin(ScrollTrigger);

/** Titre de section : numéro géant en contour derrière, titre découpé en lettres pour l'animation au défilement. */
function Titre({ n, texte }: { n: string; texte: string }) {
  return (
    <h2 className="titre-section" aria-label={texte}>
      <span className="numero-geant" aria-hidden="true">{n}</span>
      <span className="titre-mots" aria-hidden="true">
        {texte.split(" ").map((mot, i) => (
          <span className="mot" key={i}>{[...mot].map((c, j) => <span className="lettre-t" key={j}>{c}</span>)}</span>
        ))}
      </span>
    </h2>
  );
}

/** Heure locale de Dakar, mise à jour chaque minute. */
function Horloge({ langue, libelle }: { langue: Langue; libelle: string }) {
  const [, rafraichir] = useState(0);
  useEffect(() => { const id = setInterval(() => rafraichir((x) => x + 1), 20000); return () => clearInterval(id); }, []);
  const heure = new Intl.DateTimeFormat(langue, { timeZone: "Africa/Dakar", hour: "2-digit", minute: "2-digit" }).format(new Date());
  return (
    <div className="hud apparait mono" aria-label={`${libelle} ${heure}`}>
      <span>14.69°N · 17.44°W</span>
      <span>{libelle} <b>{heure}</b> GMT</span>
    </div>
  );
}
const Scene = lazy(() => import("./scene/Scene"));

// Hauteur des étapes du récit (en vh). Leur somme moins 100 donne la course du défilement (1000 vh),
// calée sur les bornes de scene/progression.ts.
const HAUTEURS = { accueil: 100, plongee: 220, chapitres: [180, 170, 170, 170], fin: 90 };

function Barre() {
  const { langue, recruteur } = useEtat();
  const t = T[langue];
  return (
    <header className="barre">
      <a className="marque magnet" href="#accueil" aria-label="Rassoul NAME">RN<span>.</span></a>
      <nav className="menu" aria-label="Sections">
        <a className="magnet" href="#parcours"><span data-texte={t.nav.travail}>{t.nav.travail}</span></a>
        <a className="magnet" href="#passions"><span data-texte={t.nav.passions}>{t.nav.passions}</span></a>
        <a className="magnet" href="#contact"><span data-texte={t.nav.contact}>{t.nav.contact}</span></a>
      </nav>
      <div className="commandes">
        <button className="bouton-texte magnet" onClick={() => maj({ recruteur: !recruteur })} aria-pressed={recruteur}>
          {recruteur ? t.immersif : t.recruteur}
        </button>
        <div className="langues" role="group" aria-label="Language">
          {(["en", "fr"] as Langue[]).map((l) => (
            <button key={l} aria-pressed={langue === l} onClick={() => maj({ langue: l })}>{l.toUpperCase()}</button>
          ))}
        </div>
      </div>
    </header>
  );
}

function Nom({ texte }: { texte: string }) {
  return (
    <h1 className="nom" aria-label={texte}>
      {texte.split(" ").map((mot, i) => (
        <span className="mot" key={i} aria-hidden="true">
          {[...mot].map((c, j) => <span className="lettre" key={j}>{c}</span>)}
        </span>
      ))}
    </h1>
  );
}

function Section({ id, children, large }: { id: string; children: React.ReactNode; large?: boolean }) {
  return (
    <section id={id} className={large ? "section large" : "section"}>
      <div className="panneau revele">{children}</div>
    </section>
  );
}

export default function App() {
  const { langue, recruteur } = useEtat();
  const t = T[langue];
  const racine = useRef<HTMLDivElement>(null);
  const reduit = mouvementReduit();

  useEffect(() => { document.documentElement.lang = langue; }, [langue]);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      if (!recruteur) {
        ScrollTrigger.create({
          trigger: ".histoire", start: "top top", end: "bottom bottom",
          onUpdate: (s) => { recit.p = s.progress; },
        });
        ScrollTrigger.create({
          trigger: ".passage", start: "top bottom", end: "bottom bottom",
          onUpdate: (s) => { recit.q = s.progress; },
        });
        document.querySelectorAll<HTMLElement>(".chapitre-recit").forEach((el) => {
          gsap.fromTo(el.querySelector(".carte-recit"), { opacity: 0, y: 50 }, {
            opacity: 1, y: 0, ease: "power2.out",
            scrollTrigger: { trigger: el, start: "top 75%", end: "top 35%", scrub: true },
          });
          gsap.to(el.querySelector(".carte-recit"), {
            opacity: 0, y: -40, ease: "power2.in",
            scrollTrigger: { trigger: el, start: "bottom 70%", end: "bottom 35%", scrub: true },
          });
        });
        gsap.to(".accueil-texte", { opacity: 0, y: -60, ease: "none",
          scrollTrigger: { trigger: ".plongee", start: "top 85%", end: "top 30%", scrub: true } });
        // Voile nocturne derrière le contenu (remplace les panneaux opaques) : le ciel reste visible.
        gsap.fromTo(".voile-nuit", { opacity: 0 }, { opacity: 1, ease: "none",
          scrollTrigger: { trigger: "#formation", start: "top bottom", end: "top 40%", scrub: true } });
      }
      if (reduit) return;
      const d = DUREE_INTRO * 0.75; // le nom se lève pendant que le diaphragme s'ouvre
      gsap.from(".nom .lettre", { yPercent: 115, opacity: 0, duration: 1.1, ease: "expo.out", stagger: 0.025, delay: 0.3 + d, clearProps: "transform,opacity" });
      gsap.from(".accueil .apparait", { y: 24, opacity: 0, duration: 0.9, ease: "power3.out", stagger: 0.12, delay: 0.8 + d, clearProps: "transform,opacity" });
      // Titres de section : lettres qui montent, numéro géant et titre en parallaxe opposée.
      gsap.utils.toArray<HTMLElement>(".titre-section").forEach((h) => {
        gsap.from(h.querySelectorAll(".lettre-t"), { yPercent: 110, rotate: 8, opacity: 0, stagger: 0.025, duration: 0.9,
          ease: "expo.out", scrollTrigger: { trigger: h, start: "top 88%", toggleActions: "play none none reverse" } });
        if (recruteur) return; // vue recruteur : les lettres apparaissent, mais pas de parallaxe
        gsap.fromTo(h.querySelector(".numero-geant"), { yPercent: 35 }, { yPercent: -35, ease: "none",
          scrollTrigger: { trigger: h, start: "top bottom", end: "bottom top", scrub: true } });
        gsap.fromTo(h.querySelector(".titre-mots"), { x: 50 }, { x: -30, ease: "none",
          scrollTrigger: { trigger: h, start: "top bottom", end: "bottom top", scrub: true } });
      });
      // Ligne de temps de l'expérience qui se trace au défilement.
      gsap.fromTo(".trace-temps", { scaleY: 0 }, { scaleY: 1, ease: "none",
        scrollTrigger: { trigger: ".chrono", start: "top 70%", end: "bottom 65%", scrub: true } });
      // Chiffres des échecs qui défilent jusqu'à leur valeur réelle.
      // L'animation n'est créée qu'à l'entrée à l'écran : avant, ce sont les vrais chiffres qui s'affichent.
      // On réécrit d'abord la vraie valeur : un compteur interrompu (bascule vers la vue recruteur pendant
      // qu'il défile) resterait sinon figé à 0, React ne réécrivant pas un texte qui n'a pas changé pour lui.
      document.querySelectorAll<HTMLElement>("[data-compte]").forEach((el) => {
        el.textContent = Number(el.dataset.compte).toLocaleString(document.documentElement.lang);
      });
      if (!recruteur) document.querySelectorAll<HTMLElement>("[data-compte]").forEach((el) => {
        ScrollTrigger.create({ trigger: el, start: "top 88%", once: true, onEnter: () => {
          const n = { v: 0 }, cible = Number(el.dataset.compte);
          gsap.to(n, { v: cible, duration: 1.6, ease: "power3.out",
            onUpdate: () => { el.textContent = Math.round(n.v).toLocaleString(document.documentElement.lang); } });
        } });
      });
      gsap.utils.toArray<HTMLElement>(".revele").forEach((el) => {
        gsap.from(el, { y: 60, opacity: 0, duration: 1, ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 85%", toggleActions: "play none none reverse" } });
        gsap.from(el.querySelectorAll(".item"), { y: 24, opacity: 0, duration: 0.7, ease: "power2.out", stagger: 0.06,
          scrollTrigger: { trigger: el, start: "top 75%", toggleActions: "play none none reverse" } });
      });
    }, racine);
    let lenis: Lenis | null = null;
    if (!reduit && !recruteur) {
      lenis = new Lenis({ duration: 1.2, smoothWheel: true });
      lenis.on("scroll", ScrollTrigger.update);
      const tic = (temps: number) => lenis!.raf(temps * 1000);
      gsap.ticker.add(tic);
      gsap.ticker.lagSmoothing(0);
      return () => { gsap.ticker.remove(tic); lenis!.destroy(); ctx.revert(); };
    }
    return () => ctx.revert();
  }, [recruteur, reduit]);

  const id = profil.identite;
  const parCat = new Map<string, typeof profil.competences>();
  profil.competences.forEach((c) => parCat.set(c.cat[langue], [...(parCat.get(c.cat[langue]) ?? []), c]));

  const accueil = (
    <div className="accueil-texte">
      <p className="surtitre apparait">{t.surtitre}</p>
      <Nom texte={id.nom} />
      <p className="phrase apparait">{t.phrase}</p>
      <p className="titre apparait">{profil.titre[langue]} · ESP Dakar · 2027</p>
      <div className="actions apparait">
        <a className="bouton magnet" href="#contact"><span>{t.contact}</span></a>
        <a className="bouton secondaire magnet" href={profil.cv[0]?.fichier} download><span>{t.cv}</span></a>
      </div>
      {!recruteur && <p className="defiler apparait">{TACTILE ? t.toucherObjets : t.survolObjets}<br /><span className="defiler-fil" aria-hidden="true" />{t.defiler}</p>}
    </div>
  );

  const rail = [
    { id: "formation", n: "01", libelle: t.formation },
    { id: "parcours", n: "02", libelle: t.parcours },
    { id: "projets", n: "03", libelle: t.projets },
    { id: "competences", n: "04", libelle: t.competences },
    { id: "engagements", n: "05", libelle: t.engagements },
    { id: "passions", n: "06", libelle: t.passions.titre },
    { id: "contact", n: "07", libelle: t.contact },
  ];
  // Stats en direct depuis Chess.com (valeurs du build en attendant ou en secours).
  const ech = useEchecsDirect(profil.echecs);

  return (
    <div ref={racine} className={recruteur ? "app recruteur" : "app"}>
      {!recruteur && <Intro />}
      {!recruteur && <Conseil t={t.conseil} />}
      {!recruteur && <Suspense fallback={null}><Scene /></Suspense>}
      {!recruteur && <div className="voile-nuit" aria-hidden="true" />}
      {!recruteur && <div id="eclair" className="eclair" aria-hidden="true" />}
      {!recruteur && <div id="fondu" className="fondu" aria-hidden="true" />}
      {!recruteur && <Curseur libelleObjet={t.ouvrir} />}
      {!recruteur && <Rail entrees={rail} />}
      <Barre />
      <main>
        {recruteur ? (
          <section id="accueil" className="section accueil">{accueil}</section>
        ) : (
          <div className="histoire">
            <section id="accueil" className="accueil etape-recit" style={{ height: `${HAUTEURS.accueil}vh` }}>
              {accueil}
              <Horloge langue={langue} libelle={t.heure} />
            </section>
            <section className="plongee etape-recit" style={{ height: `${HAUTEURS.plongee}vh` }}>
              <div className="carte-recit apropos">
                <p className="mono compteur">{t.apropos.titre}</p>
                <p className="apropos-texte">{t.apropos.texte}</p>
                <p className="mission">{t.apropos.mission}</p>
                <ul className="traits">{t.apropos.traits.map((x) => <li key={x}>{x}</li>)}</ul>
              </div>
              <p className="invite mono">{t.plongee}</p>
            </section>
            {t.chapitres.map((c, i) => (
              <section key={c.cle} className="chapitre-recit etape-recit" style={{ height: `${HAUTEURS.chapitres[i]}vh` }}>
                <div className="carte-recit">
                  <p className="mono compteur">{t.ingenieur} · <span>{String(i + 1).padStart(2, "0")}</span> / 04</p>
                  <h2 className="titre-recit">{c.titre}</h2>
                  <p>{c.texte}</p>
                  <p className="preuve-recit mono">↳ {c.preuve}</p>
                </div>
              </section>
            ))}
            <section className="etape-recit" style={{ height: `${HAUTEURS.fin}vh` }} />
          </div>
        )}
        {!recruteur && (
          <section className="passage" aria-hidden="true" />
        )}

        <Section id="formation">
          <Titre n="01" texte={t.formation} />
          {profil.formation.map((f) => (
            <article key={f.id} className="item ligne">
              <h3>{f[langue].titre}</h3>
              <p className="meta">{f[langue].lieu} · {periode(f.debut, f.fin, false, langue, f.prevu)}</p>
            </article>
          ))}
        </Section>

        <Section id="parcours" large>
          <Titre n="02" texte={t.parcours} />
          <div className="chrono">
            <span className="trace-fond" aria-hidden="true" /><span className="trace-temps" aria-hidden="true" />
            {[...profil.experiences].reverse().map((e) => (
              <article key={e.id} className="item etape-chrono">
                <p className="meta mono">{periode(e.debut, e.fin, e.enCours, langue)}</p>
                <h3 className="grand">{e[langue].titre}</h3>
                <p className="organisation">{e[langue].lieu}</p>
                <ul className="puces">{e[langue].puces.map((p, i) => <li key={i}>{p}</li>)}</ul>
              </article>
            ))}
          </div>
        </Section>

        <section id="projets" className="section large projets-bloc">
          <div className="section-tete revele">
            <Titre n="03" texte={t.projets} />
            <p className="intro">{t.projetsIntro}</p>
          </div>
          <Projets projets={profil.projets} langue={langue} preuve={t.preuve} immersif={!recruteur} />
        </section>

        <Section id="competences" large>
          <Titre n="04" texte={t.competences} />
          <p className="intro">{t.competencesIntro}</p>
          <div className="categories">
            {[...parCat.entries()].map(([cat, liste]) => (
              <div key={cat} className="item categorie">
                <h3 className="mono">{cat}</h3>
                <ul className="puces-comp">{liste.map((c) => <li key={c.id} className="comp">{c.nom[langue]}</li>)}</ul>
              </div>
            ))}
          </div>
          <p className="meta"><strong>{t.langues} :</strong> {profil.langues[langue].join(" · ")}</p>
        </Section>

        <Section id="engagements">
          <Titre n="05" texte={t.engagements} />
          {profil.engagements.map((e) => (
            <article key={e.id} className="item ligne">
              <h3>{e[langue].role}</h3>
              <p className="meta">{e[langue].lieu}{e.enCours ? ` · ${t.enCours}` : e.debut ? ` · ${periode(e.debut, "", false, langue)}` : ""}</p>
            </article>
          ))}
        </Section>

        <section id="passions" className="section large passions">
          <div className="section-tete revele">
            <Titre n="06" texte={t.passions.titre} />
            <p className="intro">{t.passions.intro}</p>
          </div>
          <Pellicule immersif={!recruteur}
            t={{ ...t.passions.photo, ...t.pellicule }} />
          <div className="grille-passions">
            <article id="echecs" className="item passion passion-echecs">
              <p className="mono passion-n">♞ 01</p>
              <h3>{t.passions.echecs.titre}</h3>
              <div className="chiffres">
                <div className="brillants"><i aria-hidden="true">!!</i><b data-compte={ech.brillants}>{ech.brillants}</b><span>{t.passions.echecs.brillants}</span></div>
                <div><b key={`r${ech.rapide.actuel}`} data-compte={ech.rapide.actuel}>{ech.rapide.actuel}</b><span>{t.passions.echecs.rapide} · {t.passions.echecs.meilleur} {ech.rapide.meilleur}</span></div>
                <div><b key={`b${ech.blitz.actuel}`} data-compte={ech.blitz.actuel}>{ech.blitz.actuel}</b><span>{t.passions.echecs.blitz} · {t.passions.echecs.meilleur} {ech.blitz.meilleur}</span></div>
                <div><b key={`t${ech.tactique}`} data-compte={ech.tactique}>{ech.tactique}</b><span>{t.passions.echecs.tactique}</span></div>
                <div><b key={`p${ech.rapide.parties + ech.blitz.parties}`} data-compte={ech.rapide.parties + ech.blitz.parties}>{(ech.rapide.parties + ech.blitz.parties).toLocaleString(langue)}</b><span>{t.passions.echecs.parties}</span></div>
              </div>
              <p>{t.passions.echecs.texte}</p>
              <a href={ech.profil} target="_blank" rel="noreferrer" data-curseur="Chess.com">{t.passions.echecs.lien} ↗</a>
            </article>
            <article id="sport" className="item passion passion-sport">
              <p className="mono passion-n">↑ 02</p>
              <h3>{t.passions.sport.titre}</h3>
              <p>{t.passions.sport.texte}</p>
            </article>
            <article id="creatif" className="item passion passion-creatif">
              <p className="mono passion-n">{"</>"} 03</p>
              <h3>{t.passions.creatif.titre}</h3>
              <p>{t.passions.creatif.texte}</p>
            </article>
          </div>
        </section>

        <section id="contact" className="section large contact-bloc">
          {!recruteur && (
            <div className="bandeau" aria-hidden="true">
              <div className="bandeau-piste">
                {Array.from({ length: 8 }, (_, i) => <span key={i}>{t.bandeau} <i>✦</i></span>)}
              </div>
            </div>
          )}
          <div className="panneau revele">
            <Titre n="07" texte={t.contact} />
            <p className="intro">{t.contactIntro}</p>
            <p className="item contact-ligne contact-mail"><a className="magnet" href={`mailto:${id.email}`} data-curseur="Mail">{id.email}</a></p>
            <p className="item contact-ligne">
              <a className="magnet" href={id.linkedin} target="_blank" rel="noreferrer">LinkedIn ↗</a>
              <a className="magnet" href={id.github} target="_blank" rel="noreferrer">GitHub ↗</a>
            </p>
            <h3 className="mono sous-titre">{t.cv}</h3>
            <ul className="liste-cv">
              {profil.cv.map((c) => (
                <li key={c.profil} className="item">
                  <a href={c.fichier} download data-curseur="PDF">{t.profilsCv[c.profil as keyof typeof t.profilsCv]} ↓</a>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>
      <footer className="pied"><p>{t.pied}</p><p>© {new Date().getFullYear()} {id.nom}</p></footer>
    </div>
  );
}
