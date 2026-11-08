// Scène principale : l'atelier à Dakar (accueil), la plongée dans l'écran, puis le site industriel en quatre chapitres.
// La caméra suit des positions-clés selon la progression du récit (recit.p, de 0 à 1).
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";
import { useRef } from "react";
import * as THREE from "three";
import Atelier, { ECRAN } from "./Atelier";
import SiteIndustriel from "./SiteIndustriel";
import { BASCULE, estNuit, etape, recit, REDUIT } from "./progression";

type Cle = { p: number; pos: THREE.Vector3; look: THREE.Vector3 };
const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

const CLES_ATELIER: Cle[] = [
  { p: 0, pos: v(4.6, 2.6, 6.0), look: v(0.2, 1.0, -0.6) },
  { p: 0.12, pos: v(1.2, 1.3, 1.5), look: v(0, 0.92, -0.08) },
  { p: 0.235, pos: ECRAN.centre.clone().addScaledVector(ECRAN.normale, 0.09), look: ECRAN.centre.clone() },
];
const CLES_SITE: Cle[] = [
  { p: 0.25, pos: v(24, 19, 25), look: v(0, 1.5, 0) },
  { p: 0.36, pos: v(13, 8.5, 15), look: v(2.3, 1.6, -2) },
  { p: 0.53, pos: v(-15, 11, 14), look: v(-2, 2, -2.2) },
  { p: 0.7, pos: v(3, 14, 19), look: v(3, 1, 0) },
  { p: 0.86, pos: v(12.5, 7.5, 13.5), look: v(-2.1, 1.7, 3.1) },
  { p: 1, pos: v(19, 20, 22), look: v(0, 1, 0) },
];

function interpoler(cles: Cle[], p: number): [THREE.Vector3, THREE.Vector3] {
  if (p <= cles[0].p) return [cles[0].pos.clone(), cles[0].look.clone()];
  for (let i = 0; i < cles.length - 1; i++) {
    const a = cles[i], b = cles[i + 1];
    if (p <= b.p) {
      const t = etape(a.p, b.p, p);
      return [a.pos.clone().lerp(b.pos, t), a.look.clone().lerp(b.look, t)];
    }
  }
  const z = cles[cles.length - 1];
  return [z.pos.clone(), z.look.clone()];
}

const FOND_ATELIER = new THREE.Color("#2A1B2A");
const FOND_SITE = new THREE.Color("#080B0E");
const FOND_NUIT = new THREE.Color("#04060C");

/** La nuit sur le toit : un lent tour de caméra pendant la lecture du contenu. */
function orbiteNuit(t: number): [THREE.Vector3, THREE.Vector3] {
  // Balancier lent depuis l'arrière du toit, regard levé vers la lune, la Voie lactée et l'océan.
  const a = REDUIT ? 0 : Math.sin(t * 0.04) * 0.22;
  return [v(2.6 + Math.sin(a) * 3, 2.4, 6.2), v(-2 + a * 20, 8.5, -45)];
}

// Passage vers la nuit : plan drone qui s'élève au-dessus du site (regard vers le bas, l'anneau rapetisse
// dans le bleu nuit), puis on redescend du ciel étoilé sur le toit. Regarder l'horizon du site montrerait le bord du sol.
const MONTEE = { pos: v(6, 48, 18), look: v(0, 0, -2) };
const DESCENTE = { pos: v(2.6, 22, 8), look: v(-2, 40, -45) };

function Realisateur() {
  const { camera, pointer, scene } = useThree();
  const regard = useRef(v(0, 1, 0));
  const monde = useRef<"atelier" | "site" | "nuit" | null>(null);
  const debutNuit = useRef(0);
  useFrame(({ clock }, dt) => {
    const p = recit.p;
    const q = recit.q;
    const ici = estNuit() ? "nuit" : p < BASCULE ? "atelier" : "site";
    if (ici === "nuit" && monde.current !== "nuit") debutNuit.current = clock.elapsedTime;
    let pos: THREE.Vector3, look: THREE.Vector3;
    if (ici === "nuit") {
      [pos, look] = orbiteNuit(clock.elapsedTime - debutNuit.current);
      const d = 1 - etape(0.5, 0.95, q); // redescente depuis le ciel
      pos.lerp(DESCENTE.pos, d);
      look.lerp(DESCENTE.look, d);
    } else {
      [pos, look] = interpoler(ici === "atelier" ? CLES_ATELIER : CLES_SITE, p);
      if (ici === "site") {
        const m = etape(0.0, 0.5, q); // montée au-dessus du site
        pos.lerp(MONTEE.pos, m);
        look.lerp(MONTEE.look, m);
      }
    }
    // Légère respiration et parallaxe de la souris, réduites près de l'écran.
    if (!REDUIT) {
      const pres = ici === "atelier" ? 1 - etape(0.12, 0.22, p) : 1;
      pos.x += pointer.x * (ici === "atelier" ? 0.2 : 0.8) * pres;
      pos.y += pointer.y * (ici === "atelier" ? 0.1 : 0.4) * pres;
    }
    if (monde.current !== ici) {
      camera.position.copy(pos);
      regard.current.copy(look);
      monde.current = ici;
    } else {
      const k = REDUIT ? 1 : 1 - Math.exp(-dt * 4);
      camera.position.lerp(pos, k);
      regard.current.lerp(look, k);
    }
    camera.lookAt(regard.current);
    // Plan proche minuscule seulement pendant la plongée dans l'écran : ailleurs, il ruinerait la précision
    // de profondeur et ferait clignoter les surfaces proches les unes des autres (z-fighting).
    const proche = p > 0.15 && p < BASCULE ? 0.02 : 0.25;
    if ((camera as THREE.PerspectiveCamera).near !== proche) {
      (camera as THREE.PerspectiveCamera).near = proche;
      camera.updateProjectionMatrix();
    }
    const fog = scene.fog as THREE.Fog;
    if (ici === "atelier") { fog.color.set("#B8705E"); fog.near = 30; fog.far = 160; scene.background = FOND_ATELIER; }
    else if (ici === "nuit") { fog.color.set("#0B1226"); fog.near = 35; fog.far = 170; scene.background = FOND_NUIT; }
    else { fog.color.copy(FOND_SITE); fog.near = 26; fog.far = 75; scene.background = FOND_SITE; }
    const fondu = document.getElementById("fondu");
    if (fondu) fondu.style.opacity = String(0.92 * etape(0.22, 0.48, q) * (1 - etape(0.52, 0.8, q)));
    // Éclair blanc qui masque la bascule entre les deux mondes.
    const eclair = document.getElementById("eclair");
    if (eclair) eclair.style.opacity = String(0.85 * etape(0.19, 0.243, p) * (1 - etape(0.248, 0.32, p)));
  });
  return null;
}

export default function Scene() {
  return (
    <Canvas
      className="scene"
      dpr={[1, 1.75]}
      camera={{ position: [4.6, 2.6, 6.0], fov: 40, near: 0.25, far: 260 }}
      gl={{ antialias: false, powerPreference: "high-performance" }}
      aria-hidden="true"
    >
      <fog attach="fog" args={["#B8705E", 30, 160]} />
      <Atelier />
      <SiteIndustriel />
      <Realisateur />
      <EffectComposer multisampling={4}>
        <Bloom intensity={0.75} luminanceThreshold={0.9} luminanceSmoothing={0.45} mipmapBlur radius={0.65} />
        <Vignette offset={0.25} darkness={0.7} />
      </EffectComposer>
    </Canvas>
  );
}
