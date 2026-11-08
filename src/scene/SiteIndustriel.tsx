// Le site industriel des quatre chapitres. Une seule description des équipements produit :
// le nuage de points (Observer), les arêtes et le dôme (Sécuriser), les volumes et la tuyauterie (Construire),
// les étiquettes avec provenance et confiance (Comprendre).
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { MeshSurfaceSampler } from "three/examples/jsm/math/MeshSurfaceSampler.js";
import { useEtat } from "../etat";
import { BASCULE, estNuit, etape, recit, REDUIT } from "./progression";

const FROID = "#5CC8D0";
const CHAUD = "#F2A65A";

type Partie = { id: string; geo: THREE.BufferGeometry; pos: [number, number, number]; rot?: [number, number, number]; couleur: string };

function parties(): Partie[] {
  const cyl = (r: number, h: number, s = 28) => new THREE.CylinderGeometry(r, r, h, s);
  return [
    { id: "t01", geo: cyl(1.6, 4), pos: [-3, 2, -1], couleur: "#9FB3BA" },
    { id: "t01d", geo: new THREE.SphereGeometry(1.6, 28, 12, 0, Math.PI * 2, 0, Math.PI / 2), pos: [-3, 4, -1], couleur: "#9FB3BA" },
    { id: "t02", geo: cyl(1.15, 3), pos: [2.6, 1.5, -2.6], couleur: "#B8C6CB" },
    { id: "t02d", geo: new THREE.SphereGeometry(1.15, 24, 10, 0, Math.PI * 2, 0, Math.PI / 2), pos: [2.6, 3, -2.6], couleur: "#B8C6CB" },
    { id: "p101", geo: new THREE.BoxGeometry(1.2, 0.8, 0.8), pos: [0.4, 0.4, 1.4], couleur: "#3E7C87" },
    { id: "p101m", geo: cyl(0.34, 0.9, 18), pos: [1.3, 0.45, 1.4], rot: [0, 0, Math.PI / 2], couleur: "#2B5560" },
    { id: "e07", geo: cyl(0.6, 2.6, 22), pos: [-1.6, 0.8, 4], rot: [0, 0, Math.PI / 2], couleur: "#8A9BA1" },
    { id: "v12", geo: new THREE.SphereGeometry(0.28, 16, 12), pos: [-0.6, 0.6, 2.8], couleur: CHAUD },
    { id: "local", geo: new THREE.BoxGeometry(3, 2.4, 2.2), pos: [4.6, 1.2, 2.6], couleur: "#2A3A40" },
    { id: "chem", geo: cyl(0.35, 7, 16), pos: [-5.6, 3.5, 2.6], couleur: "#7E8E94" },
  ];
}

const TUYAUX = [
  [[-1.4, 0.5, -0.6], [-0.6, 0.45, 0.4], [-0.2, 0.4, 1.4]],
  [[0.4, 0.4, 1.8], [-0.2, 0.6, 2.8], [-0.4, 0.8, 4]],
  [[-2.9, 0.8, 4], [-3.5, 2.6, 3], [0, 2.8, 0.2], [2.6, 2.8, -1.4], [2.6, 0.6, -1.5]],
  [[3.6, 0.5, -2], [4.2, 0.6, 0], [4.6, 0.6, 1.5]],
].map((pts) => new THREE.CatmullRomCurve3(pts.map(([x, y, z]) => new THREE.Vector3(x, y, z))));

const ETIQUETTES = [
  { pos: [-3, 5.3, -1], code: "T-01", en: "Storage tank", fr: "Cuve de stockage", obs: true, conf: 98 },
  { pos: [0.7, 1.4, 1.4], code: "P-101", en: "Pump", fr: "Pompe", obs: true, conf: 96 },
  { pos: [2.6, 3.9, -2.6], code: "T-02", en: "Buffer tank", fr: "Cuve tampon", obs: true, conf: 93 },
  { pos: [-0.6, 1.2, 2.8], code: "V-12", en: "Valve", fr: "Vanne", obs: false, conf: 71 },
  { pos: [-1.6, 1.7, 4], code: "E-07", en: "Heat exchanger", fr: "Échangeur", obs: false, conf: 61 },
  { pos: [4.6, 3, 2.6], code: "PLC-1", en: "Controller (inferred)", fr: "Automate (déduit)", obs: false, conf: 74 },
] as const;

/** Sol unique : grille anticrénelée qui s'estompe au loin, disque et anneau dessinés dans le même plan
 * (un seul plan, donc aucune surface qui se superpose et clignote). */
function Sol() {
  const mat = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {},
    vertexShader: "varying vec2 vXZ; void main(){ vec4 w = modelMatrix * vec4(position,1.0); vXZ = w.xz; gl_Position = projectionMatrix * viewMatrix * w; }",
    fragmentShader: `varying vec2 vXZ;
      void main(){
        // fwidth peut valoir 0 sur certains pixels : sans plancher, division par zéro, pixel NaN, et le Bloom
        // étale ce NaN sur tout l'écran (image noire une fois sur deux sur une vraie carte graphique).
        vec2 g = abs(fract(vXZ - 0.5) - 0.5) / max(fwidth(vXZ), vec2(1e-4));
        float ligne = 1.0 - min(min(g.x, g.y), 1.0);
        float r = length(vXZ);
        float fondu = 1.0 - smoothstep(12.0, 34.0, r);
        vec3 fond = mix(vec3(0.031, 0.043, 0.055), vec3(0.055, 0.09, 0.11), 1.0 - smoothstep(10.5, 11.2, r));
        vec3 c = fond + vec3(0.06, 0.12, 0.14) * ligne * fondu * 0.6;
        float anneau = 1.0 - smoothstep(0.0, max(fwidth(r), 1e-4) * 1.5, abs(r - 11.0) - 0.05);
        c += vec3(0.35, 1.4, 1.6) * anneau;
        gl_FragColor = vec4(c, 1.0);
      }`,
  }), []);
  return <mesh rotation={[-Math.PI / 2, 0, 0]} material={mat}><planeGeometry args={[140, 140]} /></mesh>;
}

function NuageDePoints({ liste }: { liste: Partie[] }) {
  const { geo, mat } = useMemo(() => {
    const pts: number[] = [];
    const p = new THREE.Vector3();
    for (const part of liste) {
      const m = new THREE.Mesh(part.geo);
      m.position.set(...part.pos);
      if (part.rot) m.rotation.set(...part.rot);
      m.updateMatrixWorld();
      const s = new MeshSurfaceSampler(m).build();
      part.geo.computeBoundingSphere();
      const n = Math.round(260 + part.geo.boundingSphere!.radius * 520);
      for (let i = 0; i < n; i++) {
        s.sample(p);
        p.applyMatrix4(m.matrixWorld);
        pts.push(p.x, p.y, p.z);
      }
    }
    for (const c of TUYAUX) c.getSpacedPoints(160).forEach((q) => pts.push(q.x, q.y, q.z));
    const g = new THREE.BufferGeometry().setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    const mt = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: { uScan: { value: -1 }, uOpacite: { value: 0 }, uFroid: { value: new THREE.Color(FROID) }, uChaud: { value: new THREE.Color(CHAUD) } },
      vertexShader: `uniform float uScan; varying float vY;
        void main(){ vY = position.y - uScan; vec4 mv = modelViewMatrix * vec4(position,1.0);
          gl_PointSize = max(2.0, 2.6 * (26.0 / max(-mv.z, 0.05))); gl_Position = projectionMatrix * mv; }`,
      fragmentShader: `uniform float uOpacite; uniform vec3 uFroid; uniform vec3 uChaud; varying float vY;
        void main(){ vec2 c = gl_PointCoord - 0.5; if (dot(c,c) > 0.25) discard;
          if (vY > 0.15) discard;
          float ligne = smoothstep(-0.6, 0.0, vY);
          vec3 col = mix(uFroid * 0.8, uChaud * 1.4, ligne);
          gl_FragColor = vec4(col, uOpacite * (0.45 + 0.5 * ligne)); }`,
    });
    return { geo: g, mat: mt };
  }, [liste]);
  useFrame(() => {
    const obs = REDUIT ? 1 : etape(0.27, 0.41);
    mat.uniforms.uScan.value = THREE.MathUtils.lerp(-0.5, 8.5, obs);
    mat.uniforms.uOpacite.value = etape(0.255, 0.29) * (1 - etape(0.64, 0.72));
  });
  return <points geometry={geo} material={mat} />;
}

function Dome() {
  const mat = useMemo(() => new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
    uniforms: { uOpacite: { value: 0 }, uTemps: { value: 0 }, uCouleur: { value: new THREE.Color(FROID) } },
    vertexShader: `varying vec3 vN; varying vec3 vV; varying vec3 vP;
      void main(){ vP = position; vec4 mv = modelViewMatrix * vec4(position,1.0);
        vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform float uOpacite; uniform float uTemps; uniform vec3 uCouleur; varying vec3 vN; varying vec3 vV; varying vec3 vP;
      void main(){ float f = pow(clamp(1.0 - abs(dot(vN, vV)), 0.0, 1.0), 2.5);
        float bande = 0.5 + 0.5 * sin(vP.y * 2.2 - uTemps * 0.6);
        gl_FragColor = vec4(uCouleur * 1.2, (f * 0.75 + bande * 0.08) * uOpacite); }`,
  }), []);
  const m = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    const s = etape(0.46, 0.55);
    mat.uniforms.uOpacite.value = s * (1 - etape(0.6, 0.66));
    mat.uniforms.uTemps.value = clock.elapsedTime;
    if (m.current) m.current.scale.setScalar(0.2 + 0.8 * s);
  });
  return (
    <mesh ref={m} material={mat}>
      <sphereGeometry args={[9.5, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2]} />
    </mesh>
  );
}

function Cadenas({ position, i }: { position: [number, number, number]; i: number }) {
  const g = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    const s = etape(0.48 + i * 0.015, 0.54 + i * 0.015) * (1 - etape(0.61, 0.65));
    if (!g.current) return;
    g.current.scale.setScalar(s * 0.9);
    g.current.rotation.y = clock.elapsedTime * 0.35 + i;
  });
  return (
    <group ref={g} position={position} scale={0}>
      <mesh><boxGeometry args={[0.42, 0.34, 0.16]} /><meshBasicMaterial color={[0.4, 1.3, 1.4]} toneMapped={false} /></mesh>
      <mesh position={[0, 0.2, 0]}><torusGeometry args={[0.13, 0.035, 8, 20, Math.PI]} /><meshBasicMaterial color={[0.4, 1.3, 1.4]} toneMapped={false} /></mesh>
    </group>
  );
}

function Volumes({ liste }: { liste: Partie[] }) {
  const refs = useRef<(THREE.Group | null)[]>([]);
  const mats = useMemo(() => liste.map((p) => new THREE.MeshStandardMaterial({
    color: p.couleur, roughness: 0.45, metalness: 0.55, transparent: true, opacity: 0,
    polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1,
  })), [liste]);
  const aretes = useMemo(() => liste.map((p) => new THREE.LineBasicMaterial({ color: FROID, transparent: true, opacity: 0, toneMapped: false })), [liste]);
  const geosAretes = useMemo(() => liste.map((p) => new THREE.EdgesGeometry(p.geo, 20)), [liste]);
  useFrame(() => {
    const sec = etape(0.45, 0.53);
    liste.forEach((_, i) => {
      const c = etape(0.62 + i * 0.008, 0.68 + i * 0.008);
      const g = refs.current[i];
      if (g) g.position.y = liste[i].pos[1] + (1 - c) * 5;
      mats[i].opacity = c;
      mats[i].transparent = c < 0.999;
      aretes[i].opacity = Math.max(sec * (1 - c * 0.75), 0) * (recit.p > 0.26 ? 1 : 0);
    });
  });
  return (
    <group>
      {liste.map((p, i) => (
        <group key={p.id} ref={(g) => { refs.current[i] = g; }} position={p.pos} rotation={p.rot ?? [0, 0, 0]}>
          <mesh geometry={p.geo} material={mats[i]} />
          <lineSegments geometry={geosAretes[i]} material={aretes[i]} />
        </group>
      ))}
    </group>
  );
}

function Tuyauterie() {
  const tubes = useMemo(() => TUYAUX.map((c) => new THREE.TubeGeometry(c, 80, 0.12, 10)), []);
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#C9D3D6", metalness: 0.7, roughness: 0.3 }), []);
  const paquets = useRef<THREE.InstancedMesh>(null);
  const tmp = useMemo(() => new THREE.Object3D(), []);
  const N = 6;
  useFrame(({ clock }) => {
    const g = etape(0.67, 0.76);
    tubes.forEach((t) => t.setDrawRange(0, Math.floor((t.index?.count ?? 0) * g)));
    if (!paquets.current) return;
    const on = etape(0.74, 0.78);
    TUYAUX.forEach((c, k) => {
      for (let j = 0; j < N; j++) {
        const t = REDUIT ? j / N : (clock.elapsedTime * 0.18 + j / N + k * 0.1) % 1;
        tmp.position.copy(c.getPointAt(t));
        tmp.scale.setScalar(0.09 * on);
        tmp.updateMatrix();
        paquets.current!.setMatrixAt(k * N + j, tmp.matrix);
      }
    });
    paquets.current.instanceMatrix.needsUpdate = true;
  });
  return (
    <group>
      {tubes.map((t, i) => <mesh key={i} geometry={t} material={mat} />)}
      <instancedMesh ref={paquets} args={[undefined, undefined, TUYAUX.length * N]}>
        <sphereGeometry args={[1, 10, 10]} />
        <meshBasicMaterial color={[2.6, 1.6, 0.7]} toneMapped={false} />
      </instancedMesh>
    </group>
  );
}

function Etiquettes() {
  const { langue } = useEtat();
  const refs = useRef<(HTMLDivElement | null)[]>([]);
  useFrame(() => {
    ETIQUETTES.forEach((_, i) => {
      const o = (1 - etape(0.02, 0.18, recit.q)) * etape(0.78 + i * 0.012, 0.82 + i * 0.012);
      const el = refs.current[i];
      if (el) { el.style.opacity = String(o); el.style.transform = `translateY(${(1 - o) * 10}px)`; }
    });
  });
  const mot = { en: { obs: "observed", hyp: "hypothesis" }, fr: { obs: "observé", hyp: "hypothèse" } }[langue];
  return (
    <group>
      {ETIQUETTES.map((e, i) => (
        <Html key={e.code} position={e.pos as unknown as [number, number, number]} center zIndexRange={[5, 0]} style={{ pointerEvents: "none" }}>
          <div ref={(d) => { refs.current[i] = d; }} className={e.obs ? "badge-twin obs" : "badge-twin hyp"} style={{ opacity: 0 }}>
            <b>{e.code}</b> {e[langue]}
            <span>{e.obs ? mot.obs : mot.hyp} · {e.conf} %</span>
          </div>
        </Html>
      ))}
    </group>
  );
}

export default function SiteIndustriel() {
  const liste = useMemo(parties, []);
  const groupe = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!groupe.current) return;
    groupe.current.visible = recit.p >= BASCULE && !estNuit();
    if (!REDUIT && recit.p > 0.9) groupe.current.rotation.y = Math.sin(clock.elapsedTime * 0.08) * 0.25 * etape(0.9, 0.96);
  });
  return (
    <group ref={groupe} visible={false}>
      <Sol />
      <NuageDePoints liste={liste} />
      <Volumes liste={liste} />
      <Tuyauterie />
      <Dome />
      {([[0.4, 1.4, 1.4], [-0.6, 1.2, 2.8], [4.6, 3.1, 2.6]] as [number, number, number][]).map((p, i) => <Cadenas key={i} position={p} i={i} />)}
      <Etiquettes />
      <ambientLight intensity={0.3} />
      <directionalLight position={[8, 14, 6]} intensity={1.6} color="#DDF3F5" />
      <pointLight position={[-6, 5, 6]} intensity={40} distance={30} color="#5CC8D0" />
      <pointLight position={[6, 4, -6]} intensity={30} distance={30} color="#F2A65A" />
    </group>
  );
}
