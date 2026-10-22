// Procedural, original models: no external assets are loaded.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { chargerScreenTexture } from './textures';

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export type Mats = ReturnType<typeof createMaterials>;

export function createMaterials() {
  return {
    paint: new THREE.MeshPhysicalMaterial({ color: '#e6f2ea', metalness: 0.55, roughness: 0.26, clearcoat: 1, clearcoatRoughness: 0.06 }),
    paintAccent: new THREE.MeshPhysicalMaterial({ color: '#235347', metalness: 0.6, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.1 }),
    glass: new THREE.MeshPhysicalMaterial({ color: '#0b2b26', metalness: 0.3, roughness: 0.04, clearcoat: 1, clearcoatRoughness: 0.02 }),
    trim: new THREE.MeshStandardMaterial({ color: '#0b1a18', metalness: 0.3, roughness: 0.55 }),
    tire: new THREE.MeshStandardMaterial({ color: '#0e1615', metalness: 0, roughness: 0.88 }),
    rim: new THREE.MeshStandardMaterial({ color: '#d7e3dc', metalness: 1, roughness: 0.22 }),
    rimDark: new THREE.MeshStandardMaterial({ color: '#163832', metalness: 0.8, roughness: 0.35 }),
    shell: new THREE.MeshPhysicalMaterial({ color: '#f4faf6', metalness: 0.15, roughness: 0.2, clearcoat: 1, clearcoatRoughness: 0.05 }),
    darkGlass: new THREE.MeshPhysicalMaterial({ color: '#051F20', metalness: 0.4, roughness: 0.08, clearcoat: 1 }),
    seat: new THREE.MeshStandardMaterial({ color: '#163832', metalness: 0.1, roughness: 0.7 }),
    light: new THREE.MeshBasicMaterial({ color: '#f2fff5', toneMapped: false }),
    lightSoft: new THREE.MeshBasicMaterial({ color: '#8EB69B', toneMapped: false }),
    leaf: new THREE.MeshStandardMaterial({ color: '#163832', roughness: 0.85, flatShading: true }),
    leafLight: new THREE.MeshStandardMaterial({ color: '#235347', roughness: 0.8, flatShading: true }),
    planter: new THREE.MeshStandardMaterial({ color: '#163832', roughness: 0.5, metalness: 0.2 }),
  };
}

/** Extrude a side profile, then taper it so it reads as a body rather than a slab. */
function sculpt(shape: THREE.Shape, width: number, bevel: number, deform: (x: number, y: number, z: number) => number, curveSegments = 28) {
  const depth = width - bevel * 2;
  let geo: THREE.BufferGeometry = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel * 0.7,
    bevelSegments: 6,
    curveSegments,
  });
  geo.translate(0, 0, -depth / 2);
  geo.deleteAttribute('normal');
  geo.deleteAttribute('uv');
  geo = mergeVertices(geo, 1e-4);
  const pos = geo.getAttribute('position') as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    pos.setZ(i, z * deform(x, y, z));
  }
  geo.computeVertexNormals();
  return geo;
}

function wheel(m: Mats, r: number, w: number, spokes = 5) {
  const g = new THREE.Group();
  const tire = new THREE.Mesh(new THREE.TorusGeometry(r - w * 0.32, w * 0.36, 16, 48), m.tire);
  tire.scale.z = 1.5;
  g.add(tire);
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.66, r * 0.66, w * 0.8, 36), m.rimDark);
  barrel.rotation.x = Math.PI / 2;
  g.add(barrel);
  const face = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.64, r * 0.6, 0.02, 40), m.rim);
  face.rotation.x = Math.PI / 2;
  face.position.z = w * 0.41;
  g.add(face);
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.14, r * 0.14, 0.03, 20), m.rimDark);
  hub.rotation.x = Math.PI / 2;
  hub.position.z = w * 0.43;
  g.add(hub);
  for (let i = 0; i < spokes; i++) {
    const slot = new THREE.Mesh(new THREE.BoxGeometry(r * 0.38, r * 0.1, 0.02), m.rimDark);
    const a = (i / spokes) * Math.PI * 2;
    slot.position.set(Math.cos(a) * r * 0.38, Math.sin(a) * r * 0.38, w * 0.425);
    slot.rotation.z = a;
    g.add(slot);
  }
  return g;
}

export type Vehicle = { group: THREE.Group; wheels: THREE.Object3D[]; wheelRadius: number; port: THREE.Object3D };

export function createCar(m: Mats): Vehicle {
  const group = new THREE.Group();
  const W = 1.86;
  const wr = 0.36;
  const s = new THREE.Shape();
  s.moveTo(2.12, 0.3);
  s.quadraticCurveTo(2.33, 0.32, 2.33, 0.52);
  s.bezierCurveTo(2.33, 0.66, 2.22, 0.76, 1.98, 0.8);
  s.bezierCurveTo(1.6, 0.87, 1.22, 0.92, 0.94, 0.96);
  s.bezierCurveTo(0.6, 1.1, 0.34, 1.29, 0.05, 1.35);
  s.bezierCurveTo(-0.5, 1.41, -1.05, 1.38, -1.46, 1.22);
  s.bezierCurveTo(-1.82, 1.12, -2.1, 1.02, -2.27, 0.98);
  s.quadraticCurveTo(-2.35, 0.96, -2.35, 0.84);
  s.lineTo(-2.33, 0.45);
  s.quadraticCurveTo(-2.3, 0.3, -2.1, 0.3);
  const ar = 0.47;
  const cy = wr;
  const off = Math.asin((0.3 - cy) / ar);
  s.absarc(-1.42, cy, ar, Math.PI - off, off, true);
  s.absarc(1.42, cy, ar, Math.PI - off, off, true);
  s.lineTo(2.12, 0.3);

  const deform = (x: number, y: number) => {
    let k = 1 - 0.3 * smooth(0.92, 1.42, y);
    const e = smooth(1.45, 2.45, Math.abs(x));
    k *= 1 - 0.22 * e * e;
    k *= 1 - 0.05 * (1 - smooth(0.22, 0.46, y));
    return k;
  };
  const body = new THREE.Mesh(sculpt(s, W, 0.13, deform), m.paint);
  group.add(body);

  // Glass house: same deformation, slightly proud of the body so it reads as tinted glass.
  const gs = new THREE.Shape();
  gs.moveTo(0.88, 0.975);
  gs.bezierCurveTo(0.58, 1.11, 0.34, 1.3, 0.05, 1.365);
  gs.bezierCurveTo(-0.5, 1.425, -1.05, 1.395, -1.46, 1.235);
  gs.bezierCurveTo(-1.74, 1.16, -1.95, 1.07, -2.08, 1.03);
  gs.lineTo(-1.9, 0.99);
  gs.lineTo(0.88, 0.975);
  const glassGeo = sculpt(gs, W + 0.03, 0.13, (x, y) => deform(x, y) * 1.012, 20);
  const glass = new THREE.Mesh(glassGeo, m.glass);
  group.add(glass);

  // Light bars and details
  const front = new THREE.Mesh(new RoundedBoxGeometry(0.05, 0.045, 1.42, 2, 0.02), m.light);
  front.position.set(2.31, 0.7, 0);
  group.add(front);
  const rear = new THREE.Mesh(new RoundedBoxGeometry(0.05, 0.05, 1.36, 2, 0.02), m.lightSoft);
  rear.position.set(-2.32, 0.86, 0);
  group.add(rear);
  const sill = new THREE.Mesh(new RoundedBoxGeometry(2.0, 0.08, W * 0.98, 2, 0.03), m.trim);
  sill.position.set(0, 0.29, 0);
  group.add(sill);
  for (const z of [-1, 1]) {
    const mirror = new THREE.Mesh(new RoundedBoxGeometry(0.2, 0.1, 0.16, 2, 0.04), m.glass);
    mirror.position.set(0.72, 1.0, z * 0.9);
    group.add(mirror);
    const stripe = new THREE.Mesh(new RoundedBoxGeometry(3.0, 0.018, 0.02, 1, 0.008), m.lightSoft);
    stripe.position.set(-0.4, 0.95, z * (W / 2 - 0.015));
    group.add(stripe);
  }

  const port = new THREE.Object3D();
  port.position.set(-1.62, 0.86, W / 2 - 0.02);
  group.add(port);
  const portGlow = new THREE.Mesh(new THREE.CircleGeometry(0.06, 24), m.light);
  portGlow.position.copy(port.position).add(new THREE.Vector3(0, 0, 0.012));
  group.add(portGlow);

  const wheels: THREE.Object3D[] = [];
  for (const x of [-1.42, 1.42]) {
    for (const z of [-1, 1]) {
      const w = wheel(m, wr, 0.26);
      w.position.set(x, wr, z * (W / 2 - 0.16));
      if (z < 0) w.rotation.y = Math.PI;
      group.add(w);
      wheels.push(w);
    }
  }
  return { group, wheels, wheelRadius: wr, port };
}

export function createScooter(m: Mats): Vehicle {
  const group = new THREE.Group();
  const wr = 0.24;
  // Rear body
  const rb = new THREE.Shape();
  rb.moveTo(-0.2, 0.36);
  rb.lineTo(-0.2, 0.6);
  rb.bezierCurveTo(-0.32, 0.74, -0.62, 0.8, -0.86, 0.74);
  rb.bezierCurveTo(-0.98, 0.7, -1.0, 0.58, -0.92, 0.48);
  rb.bezierCurveTo(-0.82, 0.4, -0.66, 0.36, -0.5, 0.42);
  rb.lineTo(-0.3, 0.36);
  rb.lineTo(-0.2, 0.36);
  const rear = new THREE.Mesh(sculpt(rb, 0.4, 0.07, (_x, y) => 1 - 0.25 * smooth(0.55, 0.8, y), 20), m.paint);
  group.add(rear);
  // Floorboard
  const floor = new THREE.Mesh(new RoundedBoxGeometry(0.66, 0.08, 0.34, 3, 0.03), m.trim);
  floor.position.set(0.08, 0.34, 0);
  group.add(floor);
  // Front shield
  const fs = new THREE.Shape();
  fs.moveTo(0.34, 0.32);
  fs.lineTo(0.5, 0.32);
  fs.bezierCurveTo(0.62, 0.52, 0.66, 0.78, 0.62, 1.0);
  fs.lineTo(0.5, 1.04);
  fs.bezierCurveTo(0.46, 0.8, 0.42, 0.56, 0.34, 0.42);
  fs.lineTo(0.34, 0.32);
  const shield = new THREE.Mesh(sculpt(fs, 0.44, 0.07, (_x, y) => 1 - 0.18 * smooth(0.7, 1.05, y), 20), m.paint);
  group.add(shield);
  // Seat
  const seat = new THREE.Mesh(new RoundedBoxGeometry(0.62, 0.08, 0.3, 3, 0.04), m.seat);
  seat.position.set(-0.5, 0.79, 0);
  seat.rotation.z = 0.06;
  group.add(seat);
  // Steering column and handlebar
  const col = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.035, 0.6, 12), m.trim);
  col.position.set(0.6, 1.0, 0);
  col.rotation.z = 0.32;
  group.add(col);
  const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.62, 12), m.trim);
  bar.position.set(0.52, 1.27, 0);
  bar.rotation.x = Math.PI / 2;
  group.add(bar);
  const head = new THREE.Mesh(new RoundedBoxGeometry(0.16, 0.12, 0.3, 3, 0.05), m.paint);
  head.position.set(0.56, 1.25, 0);
  group.add(head);
  const lamp = new THREE.Mesh(new THREE.CircleGeometry(0.05, 20), m.light);
  lamp.position.set(0.645, 1.24, 0);
  lamp.rotation.y = Math.PI / 2;
  group.add(lamp);
  const strip = new THREE.Mesh(new RoundedBoxGeometry(0.03, 0.42, 0.05, 1, 0.012), m.light);
  strip.position.set(0.66, 0.74, 0);
  strip.rotation.z = -0.2;
  group.add(strip);
  const tail = new THREE.Mesh(new RoundedBoxGeometry(0.04, 0.05, 0.22, 1, 0.015), m.lightSoft);
  tail.position.set(-0.98, 0.62, 0);
  group.add(tail);
  // Fork and fender
  const fork = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.5, 8), m.trim);
  fork.position.set(0.64, 0.44, 0);
  fork.rotation.z = 0.3;
  group.add(fork);
  const fender = new THREE.Mesh(new THREE.TorusGeometry(wr + 0.04, 0.03, 8, 24, Math.PI * 0.75), m.paint);
  fender.position.set(0.64, wr, 0);
  fender.rotation.z = Math.PI * 0.2;
  fender.scale.z = 2.6;
  group.add(fender);

  const port = new THREE.Object3D();
  port.position.set(-0.7, 0.6, 0.18);
  group.add(port);

  const wheels: THREE.Object3D[] = [];
  for (const x of [-0.66, 0.64]) {
    const w = wheel(m, wr, 0.15, 6);
    w.position.set(x, wr, 0);
    group.add(w);
    wheels.push(w);
  }
  return { group, wheels, wheelRadius: wr, port };
}

export function createCharger(m: Mats) {
  const group = new THREE.Group();
  const plinth = new THREE.Mesh(new RoundedBoxGeometry(1.12, 0.12, 0.8, 3, 0.05), m.trim);
  plinth.position.y = 0.06;
  group.add(plinth);
  const body = new THREE.Mesh(new RoundedBoxGeometry(0.8, 2.15, 0.52, 6, 0.2), m.shell);
  body.position.y = 1.19;
  group.add(body);
  const panel = new THREE.Mesh(new RoundedBoxGeometry(0.62, 1.62, 0.06, 4, 0.03), m.darkGlass);
  panel.position.set(0, 1.28, 0.25);
  group.add(panel);
  const screenTex = chargerScreenTexture();
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.44, 0.6), new THREE.MeshBasicMaterial({ map: screenTex, toneMapped: false }));
  screen.position.set(0, 1.66, 0.285);
  group.add(screen);
  const strips: THREE.Mesh[] = [];
  for (const x of [-0.37, 0.37]) {
    const st = new THREE.Mesh(new RoundedBoxGeometry(0.035, 1.8, 0.035, 1, 0.015), m.light);
    st.position.set(x, 1.2, 0.24);
    group.add(st);
    strips.push(st);
  }
  // Sculptural loop on top
  const loop = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.07, 18, 48, Math.PI), m.shell);
  loop.position.set(0, 2.26, 0);
  group.add(loop);
  const loopGlow = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.018, 8, 48, Math.PI), m.light);
  loopGlow.position.set(0, 2.26, 0.07);
  group.add(loopGlow);
  // Holster + coiled cable
  const holster = new THREE.Mesh(new RoundedBoxGeometry(0.14, 0.26, 0.16, 2, 0.04), m.trim);
  holster.position.set(0.45, 1.15, 0.06);
  group.add(holster);
  const cablePath = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.45, 1.02, 0.08),
    new THREE.Vector3(0.55, 0.55, 0.22),
    new THREE.Vector3(0.62, 0.2, 0.42),
    new THREE.Vector3(0.48, 0.12, 0.62),
    new THREE.Vector3(0.2, 0.16, 0.5),
    new THREE.Vector3(0.16, 0.5, 0.3),
    new THREE.Vector3(0.38, 1.0, 0.18),
  ]);
  const cable = new THREE.Mesh(new THREE.TubeGeometry(cablePath, 64, 0.03, 8, false), m.trim);
  group.add(cable);
  const head = new THREE.Object3D();
  head.position.set(0, 2.05, 0.3);
  group.add(head);
  return { group, head, strips, screen };
}

/** Free-standing arch that frames the platform. */
export function createArch(m: Mats) {
  const group = new THREE.Group();
  const R = 3.55;
  const arch = new THREE.Mesh(new THREE.TorusGeometry(R, 0.12, 20, 160, Math.PI), m.shell);
  group.add(arch);
  const inner = new THREE.Mesh(new THREE.TorusGeometry(R - 0.13, 0.03, 8, 160, Math.PI), m.paintAccent);
  group.add(inner);
  for (const x of [-R, R]) {
    const foot = new THREE.Mesh(new RoundedBoxGeometry(0.5, 0.16, 0.5, 2, 0.05), m.trim);
    foot.position.set(x, 0.02, 0);
    group.add(foot);
  }
  return { group, R };
}

export function createPlants(m: Mats) {
  const group = new THREE.Group();
  const spots: [number, number, number][] = [
    [-3.2, -2.6, 1.0],
    [3.4, -2.2, 0.85],
    [-1.4, -3.6, 0.7],
    [1.6, -3.5, 0.75],
  ];
  let seed = 3;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (const [x, z, s] of spots) {
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.42 * s, 0.34 * s, 0.4 * s, 24), m.planter);
    pot.position.set(x, 0.2 * s, z);
    group.add(pot);
    for (let i = 0; i < 5; i++) {
      const leaf = new THREE.Mesh(new THREE.IcosahedronGeometry((0.2 + rnd() * 0.18) * s, 1), i % 2 ? m.leaf : m.leafLight);
      leaf.position.set(x + (rnd() - 0.5) * 0.5 * s, (0.5 + rnd() * 0.5) * s, z + (rnd() - 0.5) * 0.5 * s);
      leaf.scale.y = 1.2 + rnd() * 0.6;
      group.add(leaf);
    }
  }
  return group;
}

/** Distant layered hills and a hazy skyline for depth (fades to transparent at the base). */
export function createBackdrop() {
  const group = new THREE.Group();
  const mats: THREE.ShaderMaterial[] = [];
  const mk = (color: string, z: number, height: number, seed: number, width = 280) => {
    const s = new THREE.Shape();
    s.moveTo(-width / 2, -6);
    let r = seed;
    for (let i = 0; i <= 64; i++) {
      r = (r * 16807) % 2147483647;
      const x = -width / 2 + (i / 64) * width;
      const y = height * (0.45 + 0.35 * Math.sin(i * 0.55 + seed) + 0.2 * (r / 2147483647));
      s.lineTo(x, y);
    }
    s.lineTo(width / 2, -6);
    const mat = new THREE.ShaderMaterial({
      uniforms: { uColor: { value: new THREE.Color(color) }, uAlpha: { value: 1 }, uTop: { value: height } },
      vertexShader: 'varying float vY; void main(){ vY = position.y; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: 'uniform vec3 uColor; uniform float uAlpha; uniform float uTop; varying float vY; void main(){ float a = smoothstep(-2.0, uTop * 0.6, vY); gl_FragColor = vec4(uColor, a * uAlpha); \n#include <colorspace_fragment>\n }',
      transparent: true,
      depthWrite: false,
    });
    mats.push(mat);
    const mesh = new THREE.Mesh(new THREE.ShapeGeometry(s), mat);
    mesh.position.z = z;
    group.add(mesh);
    return mat;
  };
  const far = mk('#8EB69B', -70, 13, 11);
  const mid = mk('#8EB69B', -52, 8, 5);
  const cityMat = new THREE.MeshBasicMaterial({ color: '#8EB69B', transparent: true, opacity: 0.5, depthWrite: false });
  const near = mk('#235347', -38, 4, 23, 220);
  return { group, far, mid, near, cityMat, mats };
}

export type Pin = { group: THREE.Group; head: THREE.Mesh; ring: THREE.Mesh; kind: 'car' | 'bike' | 'both'; base: THREE.Vector3; shown: number; target: number };

export function createPin(color: string, kind: Pin['kind'], pos: THREE.Vector3): Pin {
  const group = new THREE.Group();
  const prof: THREE.Vector2[] = [];
  for (let i = 0; i <= 24; i++) {
    const t = i / 24;
    const a = t * Math.PI;
    // teardrop: point at bottom, round top
    const y = 1.1 - Math.cos(a) * 0.32 - (1 - t) * (1 - t) * 0.65;
    const x = Math.sin(a) * 0.32 * Math.min(1, 0.25 + t * 1.6);
    prof.push(new THREE.Vector2(Math.max(0.0001, x), y));
  }
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.3, metalness: 0.2, emissive: color, emissiveIntensity: 0.25 });
  const head = new THREE.Mesh(new THREE.LatheGeometry(prof, 32), mat);
  group.add(head);
  const dot = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 12), new THREE.MeshBasicMaterial({ color: '#ffffff', toneMapped: false }));
  dot.position.y = 1.1;
  dot.position.z = 0.0;
  dot.scale.z = 1.4;
  group.add(dot);
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.3, 0.42, 40),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.6, depthWrite: false, side: THREE.DoubleSide }),
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.02;
  group.add(ring);
  group.position.copy(pos);
  group.scale.setScalar(0.0001);
  return { group, head, ring, kind, base: pos.clone(), shown: 0, target: 0 };
}
