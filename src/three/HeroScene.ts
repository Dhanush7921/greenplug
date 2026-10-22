import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { Reflector } from 'three/examples/jsm/objects/Reflector.js';
import { gsap } from 'gsap';
import { SCENE_THEMES, type SceneTheme } from './palette';
import { createGlowMaterial, createMorphTube, createPointsMaterial, type GlowMaterial } from './glow';
import { createArch, createBackdrop, createCar, createCharger, createMaterials, createPin, createPlants, createScooter, type Pin, type Vehicle } from './models';
import { drawMapTexture, radialTexture } from './textures';

export type Quality = 'high' | 'low';
export type ThemeName = 'light' | 'dark';
export type PinFilter = 'all' | 'car' | 'bike';
export type ScreenAnchor = { x: number; y: number; visible: boolean };
export type AnchorMap = Record<string, ScreenAnchor>;

type Options = { canvas: HTMLCanvasElement; quality: Quality; theme: ThemeName; reducedMotion: boolean };

const R = 4.2; // platform radius
const MAP_Y = -0.345;
const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const v3 = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const onPlatform = (x: number, z: number) => Math.hypot(x, z) < R + 0.2;
const routeY = (x: number, z: number) => (onPlatform(x, z) ? 0.08 : MAP_Y + 0.06);

// Ground routes the energy ribbons morph into during the "discovery" phase.
const ROUTE_MAIN: [number, number][] = [
  [0.35, -1.0], [1.8, -2.5], [4.0, -3.1], [6.2, -1.7], [6.8, 1.0], [5.6, 3.7], [3.0, 5.0], [0.2, 5.3], [-2.6, 4.6], [-4.8, 3.0], [-6.5, 1.0], [-6.9, -1.8], [-5.6, -4.2], [-3.0, -5.6],
];
const ROUTE_BRANCH: [number, number][] = [[0.6, -1.2], [-0.7, -2.6], [-1.5, -4.6], [-0.9, -6.4], [0.9, -7.2]];

const PINS: { at: [number, number]; kind: Pin['kind']; id: string }[] = [
  { at: [6.55, -0.3], kind: 'car', id: 'pin-dc' },
  { at: [5.5, 4.4], kind: 'bike', id: 'pin-bike' },
  { at: [0.7, 6.0], kind: 'both', id: 'pin-host' },
  { at: [-5.3, 2.3], kind: 'car', id: 'pin-car2' },
  { at: [-7.0, -2.8], kind: 'bike', id: 'pin-bike2' },
  { at: [1.4, -7.3], kind: 'both', id: 'pin-both2' },
];

export class HeroScene {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.PerspectiveCamera(32, 1, 0.1, 260);
  onAnchors?: (a: AnchorMap) => void;
  onContextLost?: () => void;

  private world = new THREE.Group();
  private mats = createMaterials();
  private theme: SceneTheme;
  private themeName: ThemeName;
  private quality: Quality;
  private reduced: boolean;
  private car: Vehicle;
  private scooter: Vehicle;
  private charger: ReturnType<typeof createCharger>;
  private carFinal = { pos: v3(-1.5, 0, 0.6), rot: -0.42 };
  private scooterFinal = { pos: v3(2.45, 0, 0.9), rot: -2.25 };
  private glowMats: GlowMaterial[] = [];
  private ribbonMats: GlowMaterial[] = [];
  private ringMats: GlowMaterial[] = [];
  private curves: { a: THREE.CatmullRomCurve3; b: THREE.CatmullRomCurve3 }[] = [];
  private sparks!: THREE.Points;
  private sparkT: Float32Array = new Float32Array(0);
  private sparkCurve: Uint8Array = new Uint8Array(0);
  private dust!: THREE.Points;
  private dustMat!: THREE.ShaderMaterial;
  private sparkMat!: THREE.ShaderMaterial;
  private map!: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
  private mapTex: THREE.CanvasTexture | null = null;
  private pins: Pin[] = [];
  private backdrop: ReturnType<typeof createBackdrop>;
  private shadowMats: THREE.MeshBasicMaterial[] = [];
  private groundHalo!: THREE.MeshBasicMaterial;
  private drumMat = new THREE.MeshStandardMaterial({ color: '#cfe4d6', roughness: 0.35, metalness: 0.2 });
  private topMat: THREE.MeshPhysicalMaterial | null = null;
  private overlayMat: THREE.ShaderMaterial | null = null;
  private reflector: Reflector | null = null;
  private hemi = new THREE.HemisphereLight('#ffffff', '#8EB69B', 1);
  private key = new THREE.DirectionalLight('#ffffff', 2);
  private rim = new THREE.DirectionalLight('#DAF1DE', 1.4);
  private chargerLight = new THREE.PointLight('#8EB69B', 0, 7, 1.6);
  private lightBase = new THREE.Color('#f2fff5');
  private lightSoftBase = new THREE.Color('#8EB69B');
  private camPos: THREE.CatmullRomCurve3;
  private camTgt: THREE.CatmullRomCurve3;
  private anchors: Record<string, () => THREE.Vector3> = {};
  private tmp = new THREE.Vector3();
  private tmp2 = new THREE.Vector3();
  private state = { power: 0, carIn: 0, scooterIn: 0, draw: 0 };
  private scroll = 0;
  private pointer = { x: 0, y: 0, cx: 0, cy: 0 };
  private size = { w: 1, h: 1 };
  private dpr = 1;
  private frameTimes: number[] = [];
  private running = false;
  private last = 0;
  private time = 0;
  private intro: gsap.core.Timeline | null = null;
  private filter: PinFilter = 'all';
  private disposed = false;

  constructor({ canvas, quality, theme, reducedMotion }: Options) {
    this.quality = quality;
    this.reduced = reducedMotion;
    this.themeName = theme;
    this.theme = SCENE_THEMES[theme];
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.dpr = Math.min(window.devicePixelRatio || 1, quality === 'high' ? 2 : 1.5);
    this.renderer.setPixelRatio(this.dpr);
    canvas.addEventListener('webglcontextlost', this.handleContextLost);

    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    this.scene.add(this.world);
    this.world.add(this.hemi, this.key, this.rim, this.chargerLight);
    this.key.position.set(5, 9, 7);
    this.rim.position.set(-7, 5, -6);

    this.buildPlatform();
    this.backdrop = createBackdrop();
    this.world.add(this.backdrop.group);

    // Charger
    this.charger = createCharger(this.mats);
    this.charger.group.position.set(0.35, 0, -1.55);
    this.charger.group.rotation.y = 0.32;
    this.world.add(this.charger.group);
    this.addShadow(this.charger.group, 1.9, 1.5);

    const arch = createArch(this.mats);
    arch.group.position.set(0.1, 0, -2.75);
    arch.group.rotation.y = 0.12;
    this.world.add(arch.group);
    this.world.add(createPlants(this.mats));

    // Vehicles
    this.car = createCar(this.mats);
    this.car.group.scale.setScalar(0.86);
    this.world.add(this.car.group);
    this.addShadow(this.car.group, 6.2, 2.9, 0.95);
    this.scooter = createScooter(this.mats);
    this.scooter.group.scale.setScalar(0.95);
    this.world.add(this.scooter.group);
    this.addShadow(this.scooter.group, 2.6, 1.0, 0.9);
    this.placeVehicles(1, 1);
    this.world.updateMatrixWorld(true);

    this.buildRibbons();
    this.buildMap();
    this.buildPins();
    this.buildDust();

    // Camera path: hero -> close on the energy flow -> rise -> map view
    this.camPos = new THREE.CatmullRomCurve3([v3(9.1, 3.0, 11.9), v3(4.4, 1.7, 6.6), v3(-2.6, 9.0, 13.0), v3(0, 22, 13.5)], false, 'centripetal');
    this.camTgt = new THREE.CatmullRomCurve3([v3(-0.2, 0.95, 0), v3(-0.6, 1.15, -0.2), v3(0, 0.2, 0), v3(0, 0, 0.6)], false, 'centripetal');

    const carLocal = v3(0.2, 1.75, 0);
    const scooterLocal = v3(0, 1.55, 0);
    this.anchors = {
      charger: () => this.charger.head.getWorldPosition(this.tmp).add(this.tmp2.set(0, 0.55, 0)),
      car: () => this.car.group.localToWorld(this.tmp.copy(carLocal)),
      scooter: () => this.scooter.group.localToWorld(this.tmp.copy(scooterLocal)),
    };
    this.pins.forEach((p, i) => {
      const id = PINS[i].id;
      this.anchors[id] = () => this.tmp.copy(p.group.position).add(this.tmp2.set(0, 1.6 * p.group.scale.y, 0));
    });

    this.applyTheme();
    if (reducedMotion) this.skipIntro();
    else this.applyPower();
  }

  // ---------- build ----------
  private buildPlatform() {
    const drum = new THREE.Mesh(new THREE.CylinderGeometry(R + 0.08, R + 0.32, 0.34, this.quality === 'high' ? 128 : 72), this.drumMat);
    drum.position.y = -0.172;
    this.world.add(drum);

    const segs = this.quality === 'high' ? 128 : 72;
    if (this.quality === 'high') {
      const reflector = new Reflector(new THREE.CircleGeometry(R, segs), {
        textureWidth: 1024,
        textureHeight: 1024,
        clipBias: 0.003,
        color: 0x8a8f8c,
      });
      reflector.rotation.x = -Math.PI / 2;
      reflector.position.y = 0.0;
      this.reflector = reflector;
      this.world.add(reflector);
      this.overlayMat = new THREE.ShaderMaterial({
        uniforms: { uColor: { value: new THREE.Color('#eef7f0') }, uLine: { value: new THREE.Color('#8EB69B') }, uAlpha: { value: 0.6 }, uR: { value: R } },
        vertexShader: 'varying vec2 vP; void main(){ vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
        fragmentShader: /* glsl */ `
          uniform vec3 uColor; uniform vec3 uLine; uniform float uAlpha; uniform float uR; varying vec2 vP;
          void main(){
            float r = length(vP) / uR;
            float a = uAlpha * mix(0.82, 1.0, smoothstep(0.35, 1.0, r));
            float ring = 1.0 - smoothstep(0.0, 0.006, abs(fract(r * 6.0) - 0.5) - 0.494);
            vec3 col = mix(uColor, uLine, ring * 0.45);
            gl_FragColor = vec4(col, min(1.0, a + ring * 0.2));
            #include <colorspace_fragment>
          }`,
        transparent: true,
        depthWrite: false,
      });
      const overlay = new THREE.Mesh(new THREE.CircleGeometry(R, segs), this.overlayMat);
      overlay.rotation.x = -Math.PI / 2;
      overlay.position.y = 0.004;
      overlay.renderOrder = 1;
      this.world.add(overlay);
      // Keep the translucent overlay out of the mirror pass.
      const original = reflector.onBeforeRender.bind(reflector);
      reflector.onBeforeRender = (...args: Parameters<typeof original>) => {
        overlay.visible = false;
        original(...args);
        overlay.visible = true;
      };
    } else {
      this.topMat = new THREE.MeshPhysicalMaterial({ color: '#e4f1e8', roughness: 0.16, metalness: 0.1, clearcoat: 1, clearcoatRoughness: 0.05 });
      const top = new THREE.Mesh(new THREE.CircleGeometry(R, segs), this.topMat);
      top.rotation.x = -Math.PI / 2;
      this.world.add(top);
    }

    // Glowing rim + inner bay ring
    const rim = new THREE.Mesh(new THREE.TorusGeometry(R + 0.04, 0.035, 10, 256), createGlowMaterial());
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 0.01;
    rim.renderOrder = 3;
    this.world.add(rim);
    const inner = new THREE.Mesh(new THREE.TorusGeometry(2.9, 0.016, 8, 200), createGlowMaterial());
    inner.rotation.x = Math.PI / 2;
    inner.position.y = 0.012;
    inner.renderOrder = 3;
    this.world.add(inner);
    for (const m of [rim.material, inner.material]) {
      this.ringMats.push(m);
      this.glowMats.push(m);
    }
    inner.material.uniforms.uFlow.value = -0.7;

    // Soft ground halo
    this.groundHalo = new THREE.MeshBasicMaterial({ map: radialTexture(), color: '#163832', transparent: true, opacity: 0.2, depthWrite: false });
    const halo = new THREE.Mesh(new THREE.CircleGeometry(10, 48), this.groundHalo);
    halo.rotation.x = -Math.PI / 2;
    halo.position.y = MAP_Y + 0.004;
    halo.renderOrder = 0;
    this.world.add(halo);
  }

  private addShadow(parent: THREE.Object3D, sx: number, sz: number, opacity = 1) {
    const mat = new THREE.MeshBasicMaterial({ map: radialTexture(), color: '#163832', transparent: true, opacity, depthWrite: false });
    mat.userData.base = opacity;
    const s = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
    s.rotation.x = -Math.PI / 2;
    s.scale.set(sx / parent.scale.x, sz / parent.scale.x, 1);
    s.position.y = 0.014;
    s.renderOrder = 2;
    parent.add(s);
    this.shadowMats.push(mat);
  }

  private placeVehicles(carT: number, scooterT: number) {
    const place = (v: Vehicle, final: { pos: THREE.Vector3; rot: number }, t: number, travel: number) => {
      const fwd = this.tmp.set(Math.cos(final.rot), 0, -Math.sin(final.rot));
      const d = travel * (1 - t);
      v.group.position.copy(final.pos).addScaledVector(fwd, -d);
      v.group.rotation.y = final.rot;
      const spin = (travel - d) / (v.wheelRadius * v.group.scale.x);
      v.wheels.forEach((w) => (w.rotation.z = -spin));
    };
    place(this.car, this.carFinal, carT, 9);
    place(this.scooter, this.scooterFinal, scooterT, 6);
  }

  private buildRibbons() {
    const head = this.charger.head.getWorldPosition(new THREE.Vector3());
    const carPort = this.car.port.getWorldPosition(new THREE.Vector3());
    const scooterPort = this.scooter.port.getWorldPosition(new THREE.Vector3());
    const main = new THREE.CatmullRomCurve3(
      [
        head,
        v3(-0.2, 2.95, -0.7),
        v3(-1.9, 2.75, -0.1),
        v3(-3.5, 2.0, 0.4),
        v3(-3.7, 1.35, -1.2),
        v3(-2.2, 1.15, -2.4),
        v3(0.6, 1.4, -2.6),
        v3(2.9, 1.65, -1.5),
        v3(3.8, 1.4, 0.6),
        v3(2.6, 1.05, 2.5),
        v3(0.3, 0.95, 2.85),
        v3(-0.9, 0.95, 2.1),
        carPort.clone().add(v3(0.1, 0.05, 0.6)),
        carPort,
      ],
      false,
      'centripetal',
    );
    const branch = new THREE.CatmullRomCurve3(
      [head.clone().add(v3(0.25, -0.15, 0)), v3(1.5, 2.3, -0.6), v3(2.9, 1.8, -0.2), v3(3.4, 1.1, 0.8), scooterPort.clone().add(v3(0.3, 0.2, 0.3)), scooterPort],
      false,
      'centripetal',
    );
    const toCurve = (pts: [number, number][]) => new THREE.CatmullRomCurve3(pts.map(([x, z]) => v3(x, routeY(x, z), z)), false, 'centripetal');
    const routeMain = toCurve(ROUTE_MAIN);
    const routeBranch = toCurve(ROUTE_BRANCH);
    this.curves = [
      { a: main, b: routeMain },
      { a: branch, b: routeBranch },
    ];
    const segs = this.quality === 'high' ? 420 : 260;
    const specs = [
      { c: this.curves[0], segs, r: 0.034, rb: 0.07, h: 0.12, hb: 0.26 },
      { c: this.curves[1], segs: Math.round(segs * 0.45), r: 0.022, rb: 0.05, h: 0.08, hb: 0.2 },
    ];
    for (const s of specs) {
      const core = new THREE.Mesh(createMorphTube(s.c.a, s.c.b, s.segs, s.r, s.rb, 10), createGlowMaterial({ morph: true }));
      const halo = new THREE.Mesh(createMorphTube(s.c.a, s.c.b, s.segs, s.h, s.hb, 12), createGlowMaterial({ morph: true, halo: true }));
      for (const m of [core, halo]) {
        m.frustumCulled = false;
        m.renderOrder = 5;
        this.world.add(m);
        this.ribbonMats.push(m.material);
        this.glowMats.push(m.material);
      }
    }

    // Sparks travelling along the ribbons
    const n = this.quality === 'high' ? 70 : 40;
    const pos = new Float32Array(n * 3);
    const size = new Float32Array(n);
    const alpha = new Float32Array(n);
    this.sparkT = new Float32Array(n);
    this.sparkCurve = new Uint8Array(n);
    for (let i = 0; i < n; i++) {
      this.sparkT[i] = Math.random();
      this.sparkCurve[i] = i % 4 === 0 ? 1 : 0;
      size[i] = 0.09 + Math.random() * 0.12;
      alpha[i] = 0.5 + Math.random() * 0.5;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
    geo.setAttribute('aAlpha', new THREE.BufferAttribute(alpha, 1));
    this.sparkMat = createPointsMaterial('#DAF1DE', true);
    this.sparks = new THREE.Points(geo, this.sparkMat);
    this.sparks.frustumCulled = false;
    this.sparks.renderOrder = 6;
    this.world.add(this.sparks);
  }

  private buildMap() {
    const size = this.quality === 'high' ? 2048 : 1024;
    const worldSize = 30;
    const route = this.curves[0].b.getPoints(120).concat(this.curves[1].b.getPoints(60));
    // draw main and branch as separate strokes
    this.mapTex = drawMapTexture(null, this.theme, size, worldSize, this.curves[0].b.getPoints(160));
    void route;
    const mat = new THREE.ShaderMaterial({
      uniforms: { map: { value: this.mapTex }, uOpacity: { value: 0 } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: /* glsl */ `
        uniform sampler2D map; uniform float uOpacity; varying vec2 vUv;
        void main(){
          vec4 c = texture2D(map, vUv);
          float edge = smoothstep(0.5, 0.33, length(vUv - 0.5));
          gl_FragColor = vec4(c.rgb, c.a * edge * uOpacity);
          #include <colorspace_fragment>
        }`,
      transparent: true,
      depthWrite: false,
    });
    this.map = new THREE.Mesh(new THREE.PlaneGeometry(worldSize, worldSize), mat);
    this.map.rotation.x = -Math.PI / 2;
    this.map.position.y = MAP_Y;
    this.map.renderOrder = 0;
    this.map.visible = false;
    this.world.add(this.map);
  }

  private redrawMap() {
    if (!this.mapTex) return;
    drawMapTexture(this.mapTex, this.theme, (this.mapTex.image as HTMLCanvasElement).width, 30, this.curves[0].b.getPoints(160));
  }

  private buildPins() {
    for (const p of PINS) {
      const [x, z] = p.at;
      const color = p.kind === 'bike' ? this.theme.pinBike : this.theme.pinCar;
      const pin = createPin(color, p.kind, v3(x, onPlatform(x, z) ? 0.02 : MAP_Y + 0.02, z));
      this.pins.push(pin);
      this.world.add(pin.group);
    }
  }

  private buildDust() {
    const n = this.quality === 'high' ? 160 : 70;
    const pos = new Float32Array(n * 3);
    const size = new Float32Array(n);
    const alpha = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 14;
      pos[i * 3 + 1] = Math.random() * 4.5;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 9;
      size[i] = 0.03 + Math.random() * 0.06;
      alpha[i] = 0.2 + Math.random() * 0.8;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
    geo.setAttribute('aAlpha', new THREE.BufferAttribute(alpha, 1));
    this.dustMat = createPointsMaterial('#8EB69B', true);
    this.dust = new THREE.Points(geo, this.dustMat);
    this.dust.frustumCulled = false;
    this.world.add(this.dust);
  }

  // ---------- theme ----------
  setTheme(name: ThemeName) {
    if (name === this.themeName) return;
    this.themeName = name;
    this.theme = SCENE_THEMES[name];
    this.applyTheme();
    this.redrawMap();
    if (!this.running) this.render();
  }

  private applyTheme() {
    const t = this.theme;
    this.renderer.toneMappingExposure = t.exposure;
    this.hemi.color.set(t.hemiSky);
    this.hemi.groundColor.set(t.hemiGround);
    this.key.color.set(t.key);
    this.rim.color.set(t.rim);
    this.drumMat.color.set(t.drum);
    this.topMat?.color.set(t.topLow);
    if (this.overlayMat) {
      this.overlayMat.uniforms.uColor.value.set(t.overlay);
      this.overlayMat.uniforms.uAlpha.value = t.overlayAlpha;
      this.overlayMat.uniforms.uLine.value.set(this.themeName === 'dark' ? '#235347' : '#8EB69B');
    }
    this.shadowMats.forEach((m) => {
      m.color.set(t.shadow);
      m.opacity = (m.userData.base as number) * t.shadowOpacity;
    });
    this.groundHalo.color.set(t.shadow);
    this.groundHalo.opacity = t.shadowOpacity * 0.55;
    for (const m of this.glowMats) {
      m.uniforms.uCore.value.set(t.glowCore);
      m.uniforms.uGlow.value.set(t.glowColor);
      m.uniforms.uStreak.value.set(t.glowStreak);
      m.blending = t.glowAdditive ? THREE.AdditiveBlending : THREE.NormalBlending;
      m.needsUpdate = true;
    }
    this.sparkMat.uniforms.uColor.value.set(this.themeName === 'dark' ? '#DAF1DE' : '#ffffff');
    this.sparkMat.blending = t.glowAdditive ? THREE.AdditiveBlending : THREE.NormalBlending;
    this.sparkMat.needsUpdate = true;
    this.dustMat.uniforms.uColor.value.set(t.dust);
    this.dustMat.uniforms.uOpacity.value = t.dustOpacity;
    this.dustMat.blending = t.glowAdditive ? THREE.AdditiveBlending : THREE.NormalBlending;
    this.dustMat.needsUpdate = true;
    this.backdrop.far.uniforms.uColor.value.set(t.far);
    this.backdrop.mid.uniforms.uColor.value.set(t.mid);
    this.backdrop.near.uniforms.uColor.value.set(t.near);
    this.backdrop.cityMat.color.set(t.city);
    this.mats.shell.color.set(t.shell);
    this.mats.paint.color.set(t.paint);
    this.pins.forEach((p) => {
      const c = p.kind === 'bike' ? t.pinBike : t.pinCar;
      const m = p.head.material as THREE.MeshStandardMaterial;
      m.color.set(c);
      m.emissive.set(c);
      (p.ring.material as THREE.MeshBasicMaterial).color.set(c);
    });
    this.applyPower();
  }

  /** "Lights on": scales every emissive element by the intro power value. */
  private applyPower() {
    const p = this.state.power;
    const t = this.theme;
    this.scene.environmentIntensity = t.envIntensity * (0.25 + 0.75 * p);
    this.hemi.intensity = t.hemiIntensity * (0.35 + 0.65 * p);
    this.key.intensity = t.keyIntensity * (0.2 + 0.8 * p);
    this.rim.intensity = t.rimIntensity * p;
    this.chargerLight.intensity = (this.themeName === 'dark' ? 14 : 6) * p;
    this.mats.light.color.copy(this.lightBase).multiplyScalar(0.12 + 0.88 * p);
    this.mats.lightSoft.color.copy(this.lightSoftBase).multiplyScalar(0.12 + 0.88 * p);
    for (const m of this.glowMats) m.uniforms.uPower.value = p;
  }

  /** Compile every shader up front so the intro does not stutter on first frames. */
  async warmup() {
    this.update(0);
    this.applyScrollState();
    this.updateCamera();
    const map = this.map.visible;
    this.map.visible = true;
    this.pins.forEach((p) => (p.group.visible = true));
    try {
      await this.renderer.compileAsync(this.scene, this.camera);
    } catch {
      /* compileAsync unsupported: shaders compile on first render instead */
    }
    this.map.visible = map;
  }

  // ---------- intro ----------
  playIntro() {
    if (this.reduced) return;
    this.intro?.kill();
    const s = this.state;
    s.power = 0;
    s.carIn = 0;
    s.scooterIn = 0;
    s.draw = 0;
    const tl = gsap.timeline({ onUpdate: () => this.applyPower() });
    tl.to(s, { keyframes: { power: [0, 0.45, 0.06, 0.7, 0.25, 1] }, duration: 1.1, ease: 'none' }, 0.05)
      .to(s, { carIn: 1, duration: 1.9, ease: 'power3.out' }, 0)
      .to(s, { scooterIn: 1, duration: 1.6, ease: 'power3.out' }, 0.3)
      .to(s, { draw: 1, duration: 1.6, ease: 'power2.inOut' }, 0.95);
    this.intro = tl;
  }

  skipIntro() {
    this.intro?.kill();
    Object.assign(this.state, { power: 1, carIn: 1, scooterIn: 1, draw: 1 });
    this.applyPower();
  }

  // ---------- inputs ----------
  setScroll(p: number) {
    this.scroll = Math.min(1, Math.max(0, p));
    if (!this.running) this.render();
  }

  setPointer(nx: number, ny: number) {
    this.pointer.x = nx;
    this.pointer.y = ny;
  }

  setPinFilter(f: PinFilter) {
    this.filter = f;
    if (!this.running) {
      this.pins.forEach((p) => (p.shown = this.pinTarget(p)));
      this.render();
    }
  }

  private pinTarget(p: Pin) {
    const phase = smooth(0.78, 0.92, this.scroll);
    const match = this.filter === 'all' || p.kind === 'both' || p.kind === this.filter;
    return match ? phase : 0;
  }

  resize(w: number, h: number) {
    this.size = { w: Math.max(1, w), h: Math.max(1, h) };
    this.renderer.setSize(this.size.w, this.size.h, false);
    this.camera.aspect = this.size.w / this.size.h;
    const rt = this.reflector?.getRenderTarget();
    if (rt) rt.setSize(Math.round(this.size.w * this.dpr * 0.5), Math.round(this.size.h * this.dpr * 0.5));
    const scale = this.size.h * this.dpr * 0.5;
    this.sparkMat.uniforms.uScale.value = scale;
    this.dustMat.uniforms.uScale.value = scale;
    if (!this.running) this.render();
  }

  // ---------- loop ----------
  start() {
    if (this.running || this.disposed || this.reduced) return;
    this.running = true;
    this.last = performance.now();
    this.renderer.setAnimationLoop(this.loop);
  }

  stop() {
    this.running = false;
    this.renderer.setAnimationLoop(null);
  }

  private loop = (now: number) => {
    const dt = Math.min(0.05, Math.max(0, (now - this.last) / 1000));
    this.last = now;
    this.time += dt;
    this.adapt(dt);
    this.update(dt);
    this.draw();
  };

  /** Lower the pixel ratio if frames are consistently slow (never raises it, to avoid oscillation). */
  private adapt(dt: number) {
    this.frameTimes.push(dt);
    if (this.frameTimes.length < 90) return;
    const avg = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
    this.frameTimes.length = 0;
    if (avg > 0.024 && this.dpr > 1) {
      this.dpr = Math.max(1, this.dpr - 0.25);
      this.renderer.setPixelRatio(this.dpr);
      this.resize(this.size.w, this.size.h);
    }
  }

  private update(dt: number) {
    const s = this.scroll;
    const st = this.state;
    const k = 1 - Math.pow(0.0015, dt);
    this.pointer.cx += (this.pointer.x - this.pointer.cx) * k;
    this.pointer.cy += (this.pointer.y - this.pointer.cy) * k;

    this.placeVehicles(st.carIn, st.scooterIn);

    const boost = 1 + 0.7 * smooth(0.12, 0.3, s) * (1 - smooth(0.45, 0.62, s));
    const morph = smooth(0.42, 0.82, s);
    for (const m of this.ribbonMats) {
      m.uniforms.uTime.value = this.time;
      m.uniforms.uDraw.value = st.draw;
      m.uniforms.uMorph.value = morph;
      m.uniforms.uIntensity.value = this.theme.glowIntensity * boost;
      m.uniforms.uFlow.value = 1 + 0.8 * smooth(0.12, 0.3, s);
    }
    for (const m of this.ringMats) m.uniforms.uTime.value = this.time;
    this.ringMats.forEach((m) => (m.uniforms.uIntensity.value = this.theme.glowIntensity));

    // sparks follow the (morphing) ribbon
    const sp = this.sparks.geometry.getAttribute('position') as THREE.BufferAttribute;
    const mm = morph * morph * (3 - 2 * morph);
    for (let i = 0; i < this.sparkT.length; i++) {
      this.sparkT[i] = (this.sparkT[i] + dt * (0.08 + (i % 5) * 0.012) * (1 + 0.8 * smooth(0.12, 0.3, s))) % 1;
      const t = Math.min(1, Math.max(0, Math.min(this.sparkT[i], st.draw)));
      const c = this.curves[this.sparkCurve[i]];
      c.a.getPointAt(t, this.tmp);
      if (mm > 0.001) {
        c.b.getPointAt(t, this.tmp2);
        this.tmp.lerp(this.tmp2, mm);
      }
      sp.setXYZ(i, this.tmp.x, this.tmp.y + (mm > 0.5 ? 0.05 : 0), this.tmp.z);
    }
    sp.needsUpdate = true;
    this.sparkMat.uniforms.uOpacity.value = st.draw * st.power;

    // ambient dust drift
    const dp = this.dust.geometry.getAttribute('position') as THREE.BufferAttribute;
    for (let i = 0; i < dp.count; i++) {
      let y = dp.getY(i) + dt * (0.05 + (i % 7) * 0.01);
      if (y > 4.6) y = 0;
      dp.setY(i, y);
    }
    dp.needsUpdate = true;

    // pins
    for (const p of this.pins) {
      p.target = this.pinTarget(p);
      p.shown += (p.target - p.shown) * (1 - Math.pow(0.002, dt));
    }
  }

  private applyScrollState() {
    const s = this.scroll;
    const mapA = smooth(0.42, 0.7, s);
    this.map.visible = mapA > 0.001;
    this.map.material.uniforms.uOpacity.value = mapA;
    const back = 1 - smooth(0.38, 0.6, s);
    this.backdrop.group.visible = back > 0.001;
    this.backdrop.mats.forEach((m) => (m.uniforms.uAlpha.value = back * this.theme.backdropAlpha));
    this.backdrop.cityMat.opacity = back * this.theme.backdropAlpha * 0.6;
    this.dustMat.uniforms.uOpacity.value = this.theme.dustOpacity * (1 - smooth(0.5, 0.75, s));
    this.groundHalo.opacity = this.theme.shadowOpacity * 0.55 * (1 - mapA * 0.7);
    for (const p of this.pins) {
      const e = p.shown;
      const pop = e <= 0.0001 ? 0.0001 : e < 1 ? e * (1 + Math.sin(e * Math.PI) * 0.35) : 1;
      p.group.scale.setScalar(pop * 1.45);
      p.group.position.y = p.base.y + (1 - e) * 0.6;
      p.group.visible = e > 0.002;
      (p.ring.material as THREE.MeshBasicMaterial).opacity = 0.5 * e * (0.6 + 0.4 * Math.sin(this.time * 3 + p.base.x));
      p.ring.scale.setScalar(1 + 0.25 * Math.sin(this.time * 2 + p.base.z));
    }
  }

  private updateCamera() {
    const s = this.scroll;
    const { w, h } = this.size;
    const aspect = w / h;
    const t = s < 0.62 ? (s / 0.62) * (2 / 3) : 2 / 3 + ((s - 0.62) / 0.38) * (1 / 3);
    const pos = this.camPos.getPoint(t, this.tmp);
    const tgt = this.camTgt.getPoint(t, this.tmp2);
    // Pull back for narrow/portrait viewports so the whole scene fits.
    const fit = aspect >= 1.35 ? 1 : Math.min(2.5, 1.35 / aspect) * (aspect < 1 ? 0.7 : 0.95);
    const k = Math.max(1, fit);
    pos.sub(tgt).multiplyScalar(k).add(tgt);
    // Pointer parallax (fades as the camera rises)
    const infl = 1 - smooth(0.4, 0.8, s) * 0.75;
    const right = this.camera.matrixWorld.elements;
    pos.x += (right[0] * this.pointer.cx * 0.7 + right[4] * -this.pointer.cy * 0.35) * infl;
    pos.y += (right[1] * this.pointer.cx * 0.7 + right[5] * -this.pointer.cy * 0.35) * infl;
    pos.z += (right[2] * this.pointer.cx * 0.7 + right[6] * -this.pointer.cy * 0.35) * infl;
    this.camera.position.copy(pos);
    this.camera.lookAt(tgt);
    this.world.rotation.y = this.pointer.cx * 0.035 * infl;

    // Frame composition: scene sits right of the copy on wide screens, lower on portrait.
    const heroWeight = 1 - smooth(0.05, 0.3, s);
    const offX = aspect > 1.1 ? -w * Math.min(0.2, 0.08 + (aspect - 1.1) * 0.25) * heroWeight : 0;
    const offY = aspect < 1 ? -h * 0.25 * (1 - smooth(0.05, 0.4, s)) : h * 0.03 * heroWeight;
    this.camera.setViewOffset(w, h, offX, offY, w, h);
    this.camera.updateProjectionMatrix();
    this.camera.updateMatrixWorld();
  }

  private draw() {
    this.applyScrollState();
    this.updateCamera();
    this.renderer.render(this.scene, this.camera);
    this.emitAnchors();
  }

  /** Render one frame without the loop (reduced motion, theme switch while paused). */
  render() {
    if (this.disposed) return;
    this.update(0);
    this.draw();
  }

  private emitAnchors() {
    if (!this.onAnchors) return;
    const out: AnchorMap = {};
    const { w, h } = this.size;
    for (const [id, get] of Object.entries(this.anchors)) {
      const v = get().project(this.camera);
      out[id] = { x: (v.x * 0.5 + 0.5) * w, y: (-v.y * 0.5 + 0.5) * h, visible: v.z < 1 && v.z > -1 };
    }
    this.onAnchors(out);
  }

  private handleContextLost = (e: Event) => {
    e.preventDefault();
    this.stop();
    this.onContextLost?.();
  };

  dispose() {
    this.disposed = true;
    this.stop();
    this.intro?.kill();
    this.renderer.domElement.removeEventListener('webglcontextlost', this.handleContextLost);
    this.scene.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (mesh.geometry) mesh.geometry.dispose();
      const mat = mesh.material as THREE.Material | THREE.Material[] | undefined;
      if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
      else mat?.dispose();
    });
    this.mapTex?.dispose();
    this.reflector?.dispose();
    this.scene.environment?.dispose();
    this.renderer.dispose();
  }
}

export function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}
