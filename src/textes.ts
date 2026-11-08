// Textes de l'interface (le contenu vient de src/donnees/profil.json).
import type { Langue } from "./etat";

export const T = {
  en: {
    surtitre: "Engineer · Creator · Explorer",
    phrase: "Computer engineering student in Dakar. I build, secure and ship software, and I look at the world through a camera lens, a chessboard and a pull-up bar.",
    survolObjets: "Everything on this rooftop is me: hover an object to open that part of my story.",
    toucherObjets: "Everything on this rooftop is me: tap an object to open that part of my story.",
    nav: { travail: "Work", passions: "Beyond code", contact: "Contact" },
    ingenieur: "Engineer",
    conseil: { titre: "Best experienced on a computer", texte: "The 3D scene and animations are designed for a large screen.", fermer: "Close" },
    intro: { systeme: "Opening the rooftop", passer: "Click or press a key to skip" },
    ouvrir: "Open",
    heure: "Dakar, local time",
    projetsIntro: "Each project drawn as the system it is.",
    pellicule: {
      pellicule: "Photography project",
      fin: "The rest of the roll is on Instagram",
      themes: ["Coastlines", "Streets & markets", "Architecture", "TER journeys", "Animals & plants", "Moments in between"],
    },
    bandeau: "Let's talk",
    apropos: {
      titre: "About me",
      texte: "I'm Rassoul, a final-year engineering student at ESP Dakar. I like to understand what happens behind an interface: how a system is designed, deployed, secured and kept running. I learn by building, I care about details, and I try to explain technical things without jargon.",
      mission: "Building, understanding and securing digital systems, at the crossroads of technology and creativity.",
      traits: ["Curious", "Precise", "Creative", "Competitive", "Committed"],
    },
    passions: {
      titre: "Beyond code",
      intro: "What I do when I'm not deploying something.",
      photo: { titre: "Photography · THRUFRAME", texte: "My photography project. Coastlines, streets and markets, architecture, TER train journeys, animals and plants, and the spontaneous moments in between. I'm interested in visual storytelling, cinematic framing and editing short videos.", lien: "See THRUFRAME on Instagram" },
      echecs: { titre: "Chess", texte: "Thousands of rapid games on Chess.com. I crossed 1000 once in rapid; my goal is to break that barrier for good. Tactics are my strong suit.", rapide: "Rapid", blitz: "Blitz", tactique: "Tactics (peak)", brillants: "brilliant moves on Chess.com", meilleur: "best", parties: "games", lien: "My Chess.com profile" },
      sport: { titre: "Calisthenics", texte: "Bodyweight training for strength and discipline: regular sessions, a structured progression and attention to nutrition. The same mindset as engineering: small steps, repeated, measured." },
      creatif: { titre: "Creative web & Linux", texte: "I collect unusual websites, 3D scenes and motion design (this portfolio is one of my experiments). I also tinker with Linux distributions, servers and containers; this machine runs Rocky Linux." },
    },
    plongee: "Let's step inside the screen.",
    chapitres: [
      { cle: "observer", titre: "Observe", texte: "Everything starts with what is really there: network traffic, inventories, logs. In my R&D work-study, I rebuild an industrial site from observed data instead of assumptions.", preuve: "R&D work-study · industrial digital twin" },
      { cle: "securiser", titre: "Secure", texte: "Then decide who can reach what, and with which keys. At Engy Partners I configured roles and access policies in Keycloak, managed secrets with Vault and certificates with an internal authority.", preuve: "Engy Partners · identity and access management" },
      { cle: "construire", titre: "Build", texte: "Then ship it: APIs, interfaces, containers, continuous integration. I built IPJI's e-learning platform on my own and I run DevOps for Hints, ESP's academic library.", preuve: "IPJI · Hints" },
      { cle: "comprendre", titre: "Understand", texte: "AI only where it helps, and never as a black box: each inferred element keeps its source and confidence level, so people know what to trust. That is the question I want to pursue in a PhD.", preuve: "R&D work-study · literature review on AI agents" },
    ],
    defiler: "Scroll to begin",
    formation: "Education",
    parcours: "Experience",
    projets: "Projects",
    competences: "Skills",
    competencesIntro: "Each skill is backed by an experience or a project listed above.",
    engagements: "Leadership",
    contact: "Let's talk",
    contactIntro: "Currently on an internship, so open to freelance projects only, fully remote.",
    cv: "Download a CV",
    profilsCv: { general: "General", genie_info: "Computer engineering", ia_recherche: "AI & digital twins", secu_ot: "Security (IAM, OT)", fullstack: "Full-stack" },
    recruteur: "Recruiter view",
    immersif: "Immersive view",
    enCours: "ongoing",
    prevu: "expected",
    preuve: "Evidence",
    langues: "Languages",
    pied: "Built with React, Three.js and GSAP. Content generated from a single source profile.",
    legendeScene: "Buildings: experience (front row) and projects (back row). Pylons: skills. Light flows: evidence links.",
  },
  fr: {
    surtitre: "Ingénieur · Créateur · Explorateur",
    phrase: "Élève ingénieur en informatique à Dakar. Je construis, sécurise et déploie des logiciels, et je regarde le monde à travers un objectif, un échiquier et une barre de traction.",
    survolObjets: "Tout ce qui est sur ce toit, c'est moi : survolez un objet pour ouvrir cette partie de mon histoire.",
    toucherObjets: "Tout ce qui est sur ce toit, c'est moi : touchez un objet pour ouvrir cette partie de mon histoire.",
    nav: { travail: "Travail", passions: "Au-delà du code", contact: "Contact" },
    ingenieur: "Ingénieur",
    conseil: { titre: "Meilleure expérience sur ordinateur", texte: "La scène 3D et les animations sont pensées pour un grand écran.", fermer: "Fermer" },
    intro: { systeme: "Ouverture du toit", passer: "Cliquez ou appuyez sur une touche pour passer" },
    ouvrir: "Ouvrir",
    heure: "Dakar, heure locale",
    projetsIntro: "Chaque projet dessiné comme le système qu'il est.",
    pellicule: {
      pellicule: "Projet photo",
      fin: "La suite de la pellicule est sur Instagram",
      themes: ["Les côtes", "Rues et marchés", "Architecture", "Trajets en TER", "Animaux et végétation", "Les instants entre deux"],
    },
    bandeau: "Discutons",
    apropos: {
      titre: "À propos",
      texte: "Je suis Rassoul, élève ingénieur en dernière année à l'ESP de Dakar. J'aime comprendre ce qui se passe derrière une interface : comment un système est conçu, déployé, sécurisé et maintenu. J'apprends en construisant, je soigne les détails, et j'essaie d'expliquer la technique sans jargon.",
      mission: "Construire, comprendre et sécuriser des systèmes numériques, au croisement de la technique et de la création.",
      traits: ["Curieux", "Précis", "Créatif", "Compétitif", "Engagé"],
    },
    passions: {
      titre: "Au-delà du code",
      intro: "Ce que je fais quand je ne déploie rien.",
      photo: { titre: "Photographie · THRUFRAME", texte: "Mon projet photo. Les côtes, les rues et les marchés, l'architecture, les trajets en TER, les animaux et la végétation, et les instants spontanés entre les deux. Je m'intéresse à la narration visuelle, au cadrage cinématographique et au montage de vidéos courtes.", lien: "Voir THRUFRAME sur Instagram" },
      echecs: { titre: "Échecs", texte: "Des milliers de parties rapides sur Chess.com. J'ai passé les 1000 une fois en rapide ; mon objectif est de franchir ce palier pour de bon. La tactique est mon point fort.", rapide: "Rapide", blitz: "Blitz", tactique: "Tactique (record)", brillants: "coups brillants sur Chess.com", meilleur: "record", parties: "parties", lien: "Mon profil Chess.com" },
      sport: { titre: "Calisthenics", texte: "L'entraînement au poids du corps, pour la force et la discipline : des séances régulières, une progression structurée et une attention à la nutrition. Le même état d'esprit qu'en ingénierie : de petits pas, répétés, mesurés." },
      creatif: { titre: "Web créatif et Linux", texte: "Je collectionne les sites qui sortent de l'ordinaire, la 3D et le motion design (ce portfolio est l'une de mes expériences). J'aime aussi bricoler les distributions Linux, les serveurs et les conteneurs ; cette machine tourne sous Rocky Linux." },
    },
    plongee: "Entrons dans l'écran.",
    chapitres: [
      { cle: "observer", titre: "Observer", texte: "Tout part de ce qui existe vraiment : le trafic réseau, les inventaires, les journaux. En alternance R&D, je reconstruis un site industriel à partir des données observées, pas des suppositions.", preuve: "Alternance R&D · jumeau numérique industriel" },
      { cle: "securiser", titre: "Sécuriser", texte: "Ensuite, décider qui accède à quoi, et avec quelles clés. Chez Engy Partners, j'ai configuré les rôles et les politiques d'accès dans Keycloak, géré les secrets avec Vault et les certificats avec une autorité interne.", preuve: "Engy Partners · gestion des identités et des accès" },
      { cle: "construire", titre: "Construire", texte: "Puis livrer : API, interfaces, conteneurs, intégration continue. J'ai développé seul la plateforme e-learning de l'IPJI et je suis responsable DevOps de Hints, la bibliothèque académique de l'ESP.", preuve: "IPJI · Hints" },
      { cle: "comprendre", titre: "Comprendre", texte: "L'IA seulement là où elle sert, et jamais comme une boîte noire : chaque élément déduit garde sa source et son niveau de confiance, pour savoir à quoi se fier. C'est la question que je veux poursuivre en thèse.", preuve: "Alternance R&D · état de l'art sur les agents IA" },
    ],
    defiler: "Faites défiler pour commencer",
    formation: "Formation",
    parcours: "Expérience",
    projets: "Projets",
    competences: "Compétences",
    competencesIntro: "Chaque compétence s'appuie sur une expérience ou un projet présentés plus haut.",
    engagements: "Engagements",
    contact: "Discutons",
    contactIntro: "En stage en ce moment, donc ouvert uniquement aux missions freelance, en télétravail.",
    cv: "Télécharger un CV",
    profilsCv: { general: "Général", genie_info: "Génie informatique", ia_recherche: "IA et jumeau numérique", secu_ot: "Sécurité (IAM, OT)", fullstack: "Full stack" },
    recruteur: "Vue recruteur",
    immersif: "Vue immersive",
    enCours: "en cours",
    prevu: "prévu",
    preuve: "Preuve",
    langues: "Langues",
    pied: "Réalisé avec React, Three.js et GSAP. Contenu généré depuis un profil source unique.",
    legendeScene: "Bâtiments : expériences (premier rang) et projets (second rang). Pylônes : compétences. Flux lumineux : liens de preuve.",
  },
} as const;

const MOIS = {
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  fr: ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."],
};

export function date(v: string, l: Langue) {
  if (!v) return "";
  const [a, m] = v.split("-");
  return m ? `${MOIS[l][Number(m) - 1]} ${a}` : a;
}

export function periode(debut: string, fin: string, enCours: boolean, l: Langue, prevu = false) {
  const d = date(debut, l);
  if (prevu) return `${debut.slice(0, 4)} – ${fin.slice(0, 4)} (${T[l].prevu})`;
  if (enCours && !fin) return `${d} – ${T[l].enCours}`;
  return fin ? `${d} – ${date(fin, l)}` : d;
}
