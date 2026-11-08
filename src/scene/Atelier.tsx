// Accueil : l'atelier de Rassoul sur un toit de Dakar, face à l'océan, au crépuscule.
// Chaque objet du bureau est cliquable et mène à une section du site.
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useEtat } from "../etat";
import { BASCULE, estNuit, recit, REDUIT } from "./progression";

// --- Écran de l'ordinateur : sa position sert à la plongée de la caméra. ---
const CHARNIERE = new THREE.Vector3(0, 0.79, -0.13);
const INCLINAISON = -0.26;
const lid = new THREE.Object3D();
lid.position.copy(CHARNIERE);
lid.rotation.x = INCLINAISON;
lid.updateMatrixWorld();
export const ECRAN = {
  centre: new THREE.Vector3(0, 0.145, 0.008).applyMatrix4(lid.matrixWorld),
  normale: new THREE.Vector3(0, 0, 1).applyQuaternion(lid.quaternion),
};

export const OBJETS: Record<string, { cible: string; en: string; fr: string }> = {
  ordinateur: { cible: "#projets", en: "Projects", fr: "Projets" },
  serveur: { cible: "#parcours", en: "Experience", fr: "Expérience" },
  cadenas: { cible: "#competences", en: "Skills", fr: "Compétences" },
  echiquier: { cible: "#echecs", en: "Chess", fr: "Échecs" },
  diplome: { cible: "#formation", en: "Education", fr: "Formation" },
  appareil: { cible: "#photo", en: "Photography · THRUFRAME", fr: "Photographie · THRUFRAME" },
  barre: { cible: "#sport", en: "Calisthenics", fr: "Calisthenics" },
  antenne: { cible: "#engagements", en: "Leadership · Internet Society", fr: "Engagements · Internet Society" },
};

function texteEcran() {
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 640;
  const g = c.getContext("2d")!;
  g.fillStyle = "#0A1418";
  g.fillRect(0, 0, 1024, 640);
  g.font = "22px monospace";
  const lignes = [
    ["#5CC8D0", "const twin = await rebuild(site, {"],
    ["#E8EEF0", "  observed: traffic.flows(),"],
    ["#E8EEF0", "  inventory: netbox.assets(),"],
    ["#F2A65A", "  keepProvenance: true,"],
    ["#E8EEF0", "});"],
    ["#6F8790", "// every inference keeps its source"],
    ["#5CC8D0", "for (const a of twin.assets)"],
    ["#E8EEF0", "  label(a, a.confidence);"],
    ["#A78BFA", "deploy(twin).with(docker, ci);"],
  ];
  lignes.forEach(([coul, t], i) => {
    g.fillStyle = coul;
    g.fillText(t, 40, 70 + i * 40);
  });
  // Schéma du site industriel, en annonce de la suite.
  g.strokeStyle = "#5CC8D0";
  g.lineWidth = 3;
  g.beginPath(); g.arc(800, 220, 55, 0, Math.PI * 2); g.stroke();
  g.beginPath(); g.arc(920, 330, 40, 0, Math.PI * 2); g.stroke();
  g.strokeRect(700, 380, 120, 80);
  g.beginPath(); g.moveTo(855, 220); g.lineTo(920, 220); g.lineTo(920, 290); g.stroke();
  g.beginPath(); g.moveTo(800, 275); g.lineTo(800, 380); g.stroke();
  g.fillStyle = "#F2A65A";
  g.fillText("P-101 · 96 %", 830, 430);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function Ciel() {
  const mat = useMemo(() => new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { uNuit: { value: 0 } },
    vertexShader: "varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
    fragmentShader: `uniform float uNuit; varying vec3 vP;
      float hash(vec3 p){ return fract(sin(dot(p, vec3(12.9898,78.233,37.719))) * 43758.5453); }
      float bruit(vec3 p){ vec3 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
        float a = mix(mix(hash(i), hash(i+vec3(1,0,0)), f.x), mix(hash(i+vec3(0,1,0)), hash(i+vec3(1,1,0)), f.x), f.y);
        float b = mix(mix(hash(i+vec3(0,0,1)), hash(i+vec3(1,0,1)), f.x), mix(hash(i+vec3(0,1,1)), hash(i+vec3(1,1,1)), f.x), f.y);
        return mix(a, b, f.z); }
      void main(){
        float h = vP.y;
        // Crépuscule
        vec3 c = mix(vec3(1.0, 0.62, 0.36), vec3(0.78, 0.36, 0.45), smoothstep(-0.02, 0.12, h));
        c = mix(c, vec3(0.10, 0.09, 0.22), smoothstep(0.1, 0.55, h));
        // Nuit : horizon bleu profond, zénith presque noir, Voie lactée en écharpe
        vec3 n = mix(vec3(0.07, 0.10, 0.22), vec3(0.012, 0.016, 0.045), smoothstep(-0.02, 0.6, h));
        float d = dot(vP, normalize(vec3(0.55, 0.62, -0.56)));
        float nuage = bruit(vP * 6.0) * 0.6 + bruit(vP * 14.0) * 0.4;
        float bande = exp(-d * d * 18.0) * smoothstep(0.0, 0.25, h);
        n += vec3(0.24, 0.20, 0.36) * bande * (0.35 + 0.65 * nuage) * 0.95;
        n += vec3(0.10, 0.26, 0.34) * bande * smoothstep(0.5, 0.9, nuage) * 0.6;
        n += vec3(0.25, 0.12, 0.10) * exp(-h * 9.0) * 0.35; // lueur de la ville à l'horizon
        c = mix(c, n, uNuit);
        c = mix(c, vec3(0.02,0.025,0.045), smoothstep(-0.02, -0.25, h));
        gl_FragColor = vec4(c, 1.0);
      }`,
  }), []);
  useFrame(() => { mat.uniforms.uNuit.value = estNuit() ? 1 : 0; });
  return <mesh material={mat}><sphereGeometry args={[90, 32, 16]} /></mesh>;
}

/** Étoiles fixes (aucun scintillement), visibles seulement la nuit. */
function Etoiles() {
  const pts = useRef<THREE.Points>(null);
  const { geo, mat } = useMemo(() => {
    let g = 11;
    const alea = () => ((g = (g * 9301 + 49297) % 233280) / 233280);
    const pos: number[] = [], taille: number[] = [];
    for (let i = 0; i < 3800; i++) {
      const y = 0.04 + Math.pow(alea(), 0.7) * 0.96;
      const a = alea() * Math.PI * 2, r = Math.sqrt(1 - y * y);
      pos.push(Math.cos(a) * r * 85, y * 85, Math.sin(a) * r * 85);
      taille.push(alea() < 0.05 ? 3.6 : 1.6 + alea() * 1.4);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute("taille", new THREE.Float32BufferAttribute(taille, 1));
    const mat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, fog: false,
      vertexShader: "attribute float taille; varying float vT; void main(){ vT = taille; gl_PointSize = taille; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
      fragmentShader: "varying float vT; void main(){ vec2 c = gl_PointCoord - 0.5; float d = length(c); if (d > 0.5) discard; float a = smoothstep(0.5, 0.0, d); gl_FragColor = vec4(vec3(0.85, 0.9, 1.0) * (vT > 3.0 ? 1.15 : 0.8), a); }",
    });
    return { geo, mat };
  }, []);
  useFrame(() => { if (pts.current) pts.current.visible = estNuit(); });
  return <points ref={pts} geometry={geo} material={mat} visible={false} />;
}

/** Chemin de lumière de la lune sur l'océan, la nuit. */
function RefletLune() {
  const m = useRef<THREE.Mesh>(null);
  const tex = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 64; c.height = 256;
    const g = c.getContext("2d")!;
    const gx = g.createLinearGradient(0, 0, 64, 0);
    gx.addColorStop(0, "rgba(0,0,0,0)"); gx.addColorStop(0.5, "rgba(255,255,255,1)"); gx.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = gx; g.fillRect(0, 0, 64, 256);
    g.globalCompositeOperation = "destination-in";
    const gy = g.createLinearGradient(0, 0, 0, 256);
    gy.addColorStop(0, "rgba(0,0,0,0.9)"); gy.addColorStop(1, "rgba(0,0,0,0.05)");
    g.fillStyle = gy; g.fillRect(0, 0, 64, 256);
    return new THREE.CanvasTexture(c);
  }, []);
  useFrame(() => { if (m.current) m.current.visible = estNuit(); });
  return (
    <mesh ref={m} visible={false} position={[9, -2.9, -42]} rotation={[-Math.PI / 2, 0, -0.38]}>
      <planeGeometry args={[7, 52]} />
      <meshBasicMaterial map={tex} color={[0.75, 0.85, 1.1]} transparent opacity={0.55} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
    </mesh>
  );
}

/** Fenêtres allumées de la ville, la nuit. */
function Fenetres() {
  const pts = useRef<THREE.Points>(null);
  const geo = useMemo(() => {
    let g = 7;
    const alea = () => ((g = (g * 9301 + 49297) % 233280) / 233280);
    const pos: number[] = [];
    for (let i = 0; i < 46; i++) {
      const cote = i % 2 ? 1 : -1;
      const x = cote * (16 + alea() * 50), z = -24 - alea() * 40, h = 1.5 + alea() * 6;
      const sx = 2 + alea() * 3; alea();
      for (let k = 0; k < 18; k++) {
        if (alea() < 0.45) continue;
        pos.push(x + (alea() - 0.5) * sx * 0.8, -3.4 + 0.4 + alea() * (h - 0.6), z + 1.6);
      }
    }
    return new THREE.BufferGeometry().setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  }, []);
  useFrame(() => { if (pts.current) pts.current.visible = estNuit(); });
  return (
    <points ref={pts} geometry={geo} visible={false}>
      <pointsMaterial size={2.4} sizeAttenuation={false} color={[1.6, 1.05, 0.55]} toneMapped={false} />
    </points>
  );
}

function Ocean() {
  const geo = useMemo(() => new THREE.PlaneGeometry(260, 140, 90, 50), []);
  const base = useMemo(() => Float32Array.from(geo.attributes.position.array), [geo]);
  useFrame(({ clock }) => {
    if (REDUIT) return;
    const a = geo.attributes.position as THREE.BufferAttribute;
    const t = clock.elapsedTime;
    for (let i = 0; i < a.count; i++) {
      const x = base[i * 3], y = base[i * 3 + 1];
      a.setZ(i, Math.sin(x * 0.12 + t * 0.35) * 0.08 + Math.cos(y * 0.18 + t * 0.25) * 0.06);
    }
    a.needsUpdate = true;
  });
  return (
    <mesh geometry={geo} rotation={[-Math.PI / 2, 0, 0]} position={[0, -3, -75]}>
      <meshStandardMaterial color="#1D2B4A" roughness={0.42} metalness={0.45} />
    </mesh>
  );
}

function Ville() {
  const blocs = useMemo(() => {
    const r: { p: [number, number, number]; s: [number, number, number] }[] = [];
    let graine = 7;
    const alea = () => ((graine = (graine * 9301 + 49297) % 233280) / 233280);
    for (let i = 0; i < 46; i++) {
      const cote = i % 2 ? 1 : -1;
      const x = cote * (16 + alea() * 50);
      const z = -24 - alea() * 40;
      const h = 1.5 + alea() * 6;
      r.push({ p: [x, -3.4 + h / 2, z], s: [2 + alea() * 3, h, 2 + alea() * 3] });
    }
    return r;
  }, []);
  return (
    <group>
      {blocs.map((b, i) => (
        <mesh key={i} position={b.p}>
          <boxGeometry args={b.s} />
          <meshStandardMaterial color="#1B1828" roughness={0.9} emissive="#FFB36B" emissiveIntensity={i % 5 === 0 ? 0.08 : 0} />
        </mesh>
      ))}
    </group>
  );
}

function Baobab({ position }: { position: [number, number, number] }) {
  const sombre = "#151321";
  return (
    <group position={position}>
      <mesh position={[0, 1.6, 0]}><cylinderGeometry args={[0.55, 0.9, 3.2, 10]} /><meshStandardMaterial color={sombre} /></mesh>
      {[[-0.9, 3.5, 0.2, 0.6], [0.8, 3.6, -0.2, -0.6], [0.1, 3.9, 0.6, 0.15], [-0.3, 3.8, -0.6, -0.2]].map(([x, y, z, r], i) => (
        <mesh key={i} position={[x, y, z]} rotation={[0, 0, r]}><cylinderGeometry args={[0.12, 0.25, 1.6, 6]} /><meshStandardMaterial color={sombre} /></mesh>
      ))}
      {[[-1.4, 4.4, 0], [1.3, 4.5, -0.3], [0, 4.8, 0.5], [0.3, 4.6, -0.8]].map((p, i) => (
        <mesh key={i} position={p as [number, number, number]} scale={[1.1, 0.45, 1]}><sphereGeometry args={[0.9, 10, 8]} /><meshStandardMaterial color={sombre} /></mesh>
      ))}
    </group>
  );
}

function Guirlande() {
  const ampoules = useMemo(() => {
    const c = new THREE.QuadraticBezierCurve3(new THREE.Vector3(-3.6, 2.0, -2.9), new THREE.Vector3(0, 1.45, -1.6), new THREE.Vector3(3.6, 2.0, -2.9));
    return c.getPoints(22);
  }, []);
  const fil = useMemo(() => new THREE.BufferGeometry().setFromPoints(ampoules), [ampoules]);
  return (
    <group>
      <primitive object={new THREE.Line(fil, new THREE.LineBasicMaterial({ color: "#3A2E28" }))} />
      {ampoules.map((p, i) => (
        <mesh key={i} position={p}><sphereGeometry args={[0.035, 8, 8]} /><meshBasicMaterial color={[3.2, 2.2, 1.1]} toneMapped={false} /></mesh>
      ))}
      {[-3.6, 3.6].map((x) => (
        <mesh key={x} position={[x, 1.0, -2.9]}><cylinderGeometry args={[0.03, 0.03, 2.0, 6]} /><meshStandardMaterial color="#2A2420" /></mesh>
      ))}
      <pointLight position={[0, 1.9, -1]} intensity={6} distance={7} color="#FFB870" />
    </group>
  );
}

/** Objet cliquable : grossit au survol, affiche son nom et mène à sa section. */
function Interactif({ id, children, position, haut = 0.32 }: { id: string; children: React.ReactNode; position: [number, number, number]; haut?: number }) {
  const g = useRef<THREE.Group>(null);
  const [survol, setSurvol] = useState(false);
  const { langue } = useEtat();
  useFrame((_, dt) => {
    if (g.current) g.current.scale.setScalar(THREE.MathUtils.damp(g.current.scale.x, survol ? 1.08 : 1, 8, dt));
  });
  return (
    <group
      ref={g}
      position={position}
      onPointerOver={(e) => { e.stopPropagation(); setSurvol(true); recit.survolObjet = id; document.body.style.cursor = "pointer"; }}
      onPointerOut={() => { setSurvol(false); recit.survolObjet = null; document.body.style.cursor = ""; }}
      onClick={(e) => { e.stopPropagation(); document.querySelector(OBJETS[id].cible)?.scrollIntoView({ behavior: "smooth" }); }}
    >
      {children}
      {survol && (
        <Html position={[0, haut, 0]} center zIndexRange={[20, 10]} style={{ pointerEvents: "none" }}>
          <div className="etiquette vive">{OBJETS[id][langue]} →</div>
        </Html>
      )}
    </group>
  );
}

function Bureau() {
  const ecran = useMemo(texteEcran, []);
  const leds = useRef<THREE.MeshBasicMaterial[]>([]);
  useFrame(({ clock }) => {
    leds.current.forEach((m, i) => {
      // Pulsation lente et douce, sans clignotement.
      const k = REDUIT ? 1 : 0.75 + 0.25 * Math.sin(clock.elapsedTime * 0.8 + i * 1.7);
      m.color.setRGB(0.3 * k, 1.5 * k, 1.1 * k);
    });
  });
  const bois = "#6B4A33";
  return (
    <group>
      {/* Bureau et chaise */}
      <mesh position={[0, 0.75, 0]}><boxGeometry args={[1.7, 0.05, 0.82]} /><meshStandardMaterial color={bois} roughness={0.6} /></mesh>
      {[[-0.78, -0.35], [0.78, -0.35], [-0.78, 0.35], [0.78, 0.35]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.37, z]}><boxGeometry args={[0.05, 0.74, 0.05]} /><meshStandardMaterial color="#3B2A20" /></mesh>
      ))}
      <group position={[0.1, 0, 0.75]}>
        <mesh position={[0, 0.45, 0]}><boxGeometry args={[0.46, 0.05, 0.44]} /><meshStandardMaterial color="#2E2A2A" /></mesh>
        <mesh position={[0, 0.72, 0.2]}><boxGeometry args={[0.46, 0.5, 0.05]} /><meshStandardMaterial color="#2E2A2A" /></mesh>
        <mesh position={[0, 0.22, 0]}><cylinderGeometry args={[0.03, 0.03, 0.44, 8]} /><meshStandardMaterial color="#555" /></mesh>
      </group>

      {/* Ordinateur portable */}
      <Interactif id="ordinateur" position={[0, 0, 0]}>
        <mesh position={[0, 0.785, 0.02]}><boxGeometry args={[0.44, 0.02, 0.31]} /><meshStandardMaterial color="#9AA3AA" metalness={0.8} roughness={0.3} /></mesh>
        <group position={CHARNIERE} rotation={[INCLINAISON, 0, 0]}>
          <mesh position={[0, 0.145, 0]}><boxGeometry args={[0.44, 0.3, 0.012]} /><meshStandardMaterial color="#9AA3AA" metalness={0.8} roughness={0.3} /></mesh>
          <mesh position={[0, 0.145, 0.007]}><planeGeometry args={[0.405, 0.26]} /><meshBasicMaterial map={ecran} toneMapped={false} /></mesh>
        </group>
        <pointLight position={[0, 0.95, 0.25]} intensity={0.6} distance={1.6} color="#5CC8D0" />
      </Interactif>

      {/* Tasse */}
      <mesh position={[0.32, 0.82, 0.18]}><cylinderGeometry args={[0.035, 0.03, 0.09, 14]} /><meshStandardMaterial color="#E8E1D6" /></mesh>

      {/* Échiquier */}
      <Interactif id="echiquier" position={[0.56, 0.78, 0.08]}>
        {Array.from({ length: 64 }, (_, k) => {
          const i = k % 8, j = Math.floor(k / 8);
          return (
            <mesh key={k} position={[-0.14 + i * 0.04, 0, -0.14 + j * 0.04]}>
              <boxGeometry args={[0.04, 0.012, 0.04]} />
              <meshStandardMaterial color={(i + j) % 2 ? "#3B2A20" : "#E9DCC4"} />
            </mesh>
          );
        })}
        {[[-0.1, -0.1, 1], [0.02, -0.06, 1], [0.06, 0.1, 0], [-0.06, 0.06, 0], [0.1, -0.02, 1]].map(([x, z, b], i) => (
          <group key={i} position={[x, 0.03, z]}>
            <mesh><cylinderGeometry args={[0.009, 0.014, 0.045, 10]} /><meshStandardMaterial color={b ? "#F3EEE6" : "#1E1A18"} /></mesh>
            <mesh position={[0, 0.03, 0]}><sphereGeometry args={[0.01, 8, 8]} /><meshStandardMaterial color={b ? "#F3EEE6" : "#1E1A18"} /></mesh>
          </group>
        ))}
        <group position={[0.02, 0.04, 0.02]}>
          <mesh><cylinderGeometry args={[0.012, 0.017, 0.07, 10]} /><meshStandardMaterial color="#F2A65A" /></mesh>
          <mesh position={[0, 0.045, 0]}><boxGeometry args={[0.006, 0.02, 0.006]} /><meshStandardMaterial color="#F2A65A" /></mesh>
        </group>
      </Interactif>

      {/* Cadenas */}
      <Interactif id="cadenas" position={[-0.5, 0.8, 0.16]}>
        <mesh><boxGeometry args={[0.09, 0.075, 0.04]} /><meshStandardMaterial color="#C9A24A" metalness={0.85} roughness={0.25} /></mesh>
        <mesh position={[0, 0.04, 0]}><torusGeometry args={[0.03, 0.007, 8, 20, Math.PI]} /><meshStandardMaterial color="#C8CDD2" metalness={0.9} roughness={0.2} /></mesh>
      </Interactif>

      {/* Diplôme */}
      <Interactif id="diplome" position={[-0.48, 0.86, -0.22]}>
        <group rotation={[-0.2, 0.35, 0]}>
          <mesh><boxGeometry args={[0.24, 0.17, 0.014]} /><meshStandardMaterial color="#2B2420" /></mesh>
          <mesh position={[0, 0, 0.008]}><planeGeometry args={[0.2, 0.13]} /><meshStandardMaterial color="#EDE4D3" /></mesh>
          <mesh position={[0, -0.02, 0.009]}><circleGeometry args={[0.018, 16]} /><meshStandardMaterial color="#C9A24A" metalness={0.6} /></mesh>
        </group>
      </Interactif>

      {/* Appareil photo sur trépied, tourné vers l'océan */}
      <Interactif id="appareil" position={[-1.35, 0, 0.35]} haut={1.75}>
        {[0, 2.1, 4.2].map((a, i) => (
          <mesh key={i} position={[Math.sin(a) * 0.16, 0.62, Math.cos(a) * 0.16]} rotation={[Math.cos(a) * 0.25, 0, -Math.sin(a) * 0.25]}>
            <cylinderGeometry args={[0.012, 0.016, 1.28, 6]} /><meshStandardMaterial color="#1C1C1E" metalness={0.6} />
          </mesh>
        ))}
        <group position={[0, 1.36, 0]} rotation={[0, 0.5, 0]}>
          <mesh><boxGeometry args={[0.2, 0.13, 0.09]} /><meshStandardMaterial color="#1E1F22" roughness={0.5} /></mesh>
          <mesh position={[0, 0.0, -0.1]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.045, 0.05, 0.12, 20]} /><meshStandardMaterial color="#111214" metalness={0.5} /></mesh>
          <mesh position={[0, 0.0, -0.161]} rotation={[Math.PI / 2, 0, 0]}><circleGeometry args={[0.038, 20]} /><meshStandardMaterial color="#2D4E6B" metalness={0.9} roughness={0.1} /></mesh>
          <mesh position={[0.06, 0.08, 0]}><boxGeometry args={[0.03, 0.03, 0.03]} /><meshStandardMaterial color="#C9C9C9" /></mesh>
        </group>
      </Interactif>

      {/* Barre de traction */}
      <Interactif id="barre" position={[2.7, 0, -1.7]} haut={2.45}>
        {[-0.62, 0.62].map((x) => (
          <mesh key={x} position={[x, 1.05, 0]}><cylinderGeometry args={[0.035, 0.035, 2.1, 10]} /><meshStandardMaterial color="#2B2F33" metalness={0.6} roughness={0.4} /></mesh>
        ))}
        <mesh position={[0, 2.08, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.022, 0.022, 1.3, 12]} /><meshStandardMaterial color="#C8CDD2" metalness={0.9} roughness={0.2} /></mesh>
        <mesh position={[0, 0.02, 0.35]}><boxGeometry args={[0.9, 0.03, 0.55]} /><meshStandardMaterial color="#2E3F35" roughness={0.9} /></mesh>
      </Interactif>

      {/* Antenne (Internet Society) */}
      <Interactif id="antenne" position={[-3.5, 0, -2.6]} haut={3.0}>
        <mesh position={[0, 1.3, 0]}><cylinderGeometry args={[0.03, 0.045, 2.6, 8]} /><meshStandardMaterial color="#5A5F63" metalness={0.7} /></mesh>
        {[1.7, 2.0, 2.3].map((y, i) => (
          <mesh key={y} position={[0, y, 0]} rotation={[0, i * 0.6, Math.PI / 2]}><cylinderGeometry args={[0.01, 0.01, 0.7 - i * 0.15, 6]} /><meshStandardMaterial color="#8A9094" metalness={0.8} /></mesh>
        ))}
        <mesh position={[0, 2.64, 0]}><sphereGeometry args={[0.04, 10, 10]} /><meshBasicMaterial color={[2.4, 0.6, 0.4]} toneMapped={false} /></mesh>
      </Interactif>

      {/* Petit serveur */}
      <Interactif id="serveur" position={[1.2, 0, -0.15]}>
        <mesh position={[0, 0.3, 0]}><boxGeometry args={[0.34, 0.6, 0.4]} /><meshStandardMaterial color="#1A1F24" metalness={0.5} roughness={0.4} /></mesh>
        {[0.12, 0.24, 0.36, 0.48].map((y, i) => (
          <group key={y}>
            <mesh position={[0, y, 0.201]}><planeGeometry args={[0.28, 0.07]} /><meshStandardMaterial color="#232A30" /></mesh>
            <mesh position={[0.11, y, 0.203]}>
              <planeGeometry args={[0.018, 0.018]} />
              <meshBasicMaterial ref={(m) => { if (m) leds.current[i] = m; }} toneMapped={false} />
            </mesh>
          </group>
        ))}
      </Interactif>
    </group>
  );
}

export default function Atelier() {
  const groupe = useRef<THREE.Group>(null);
  const astre = useRef<THREE.Mesh>(null);
  const hemi = useRef<THREE.HemisphereLight>(null);
  const soleil = useRef<THREE.DirectionalLight>(null);
  useFrame(() => {
    if (groupe.current) groupe.current.visible = recit.p < BASCULE || estNuit();
    const n = estNuit();
    if (astre.current) {
      const m = astre.current.material as THREE.MeshBasicMaterial;
      if (n) { astre.current.position.set(14, 18, -66); astre.current.scale.setScalar(0.55); m.color.setRGB(1.5, 1.55, 1.7); }
      else { astre.current.position.set(-16, 1.6, -72); astre.current.scale.setScalar(1); m.color.setRGB(1.9, 1.25, 0.8); }
    }
    if (hemi.current) { hemi.current.color.set(n ? "#6F86B8" : "#FFB98A"); hemi.current.groundColor.set(n ? "#0A0C16" : "#20182A"); hemi.current.intensity = n ? 0.5 : 0.7; }
    if (soleil.current) { soleil.current.color.set(n ? "#9DB5FF" : "#FFB27A"); soleil.current.intensity = n ? 0.6 : 1.4; soleil.current.position.set(n ? 14 : -14, n ? 18 : 4, n ? -40 : -40); }
  });
  return (
    <group ref={groupe}>
      <Ciel />
      <Etoiles />
      <RefletLune />
      <mesh ref={astre} position={[-16, 1.6, -72]}><circleGeometry args={[2.8, 40]} /><meshBasicMaterial color={[1.9, 1.25, 0.8]} toneMapped={false} fog={false} /></mesh>
      <Ocean />
      <Ville />
      <Fenetres />
      <Baobab position={[-11, -3, -16]} />
      {/* Toit */}
      <mesh position={[0, -1.55, 0]}><boxGeometry args={[9, 3, 7]} /><meshStandardMaterial color="#2C2622" roughness={0.95} /></mesh>
      {[[0, 0.2, -3.45, 9, 0.4, 0.1], [-4.45, 0.25, 0, 0.1, 0.5, 7], [4.45, 0.25, 0, 0.1, 0.5, 7]].map(([x, y, z, sx, sy, sz], i) => (
        <mesh key={i} position={[x, y, z]}><boxGeometry args={[sx, sy, sz]} /><meshStandardMaterial color="#3A322C" /></mesh>
      ))}
      <Guirlande />
      <Bureau />
      <hemisphereLight ref={hemi} args={["#FFB98A", "#20182A", 0.7]} />
      <directionalLight ref={soleil} position={[-14, 4, -40]} intensity={1.4} color="#FFB27A" />
    </group>
  );
}
