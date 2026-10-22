import * as THREE from 'three';
import type { SceneTheme } from './palette';

function canvas(w: number, h = w) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

/** Radial falloff used for contact shadows and glow sprites. */
export function radialTexture(inner = 0, outer = 1) {
  const c = canvas(128);
  const g = c.getContext('2d')!;
  const grd = g.createRadialGradient(64, 64, inner * 64, 64, 64, outer * 64);
  grd.addColorStop(0, 'rgba(255,255,255,1)');
  grd.addColorStop(0.45, 'rgba(255,255,255,0.45)');
  grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Charger display: brand mark + status bars. Purely illustrative. */
export function chargerScreenTexture() {
  const c = canvas(256, 352);
  const g = c.getContext('2d')!;
  const bg = g.createLinearGradient(0, 0, 0, 352);
  bg.addColorStop(0, '#163832');
  bg.addColorStop(1, '#051F20');
  g.fillStyle = bg;
  g.fillRect(0, 0, 256, 352);
  // bolt
  g.save();
  g.translate(128, 132);
  g.scale(4.6, 4.6);
  g.translate(-16, -16);
  g.fillStyle = '#DAF1DE';
  g.shadowColor = '#8EB69B';
  g.shadowBlur = 6;
  const p = new Path2D('M18.2 6.5 9.8 17.6h5.6l-2.1 7.9 8.9-11.7h-5.7l1.7-7.3Z');
  g.fill(p);
  g.restore();
  // ring
  g.strokeStyle = 'rgba(142,182,155,0.55)';
  g.lineWidth = 5;
  g.beginPath();
  g.arc(128, 132, 92, -Math.PI * 0.5, Math.PI * 1.15);
  g.stroke();
  g.strokeStyle = 'rgba(218,241,222,0.15)';
  g.beginPath();
  g.arc(128, 132, 92, Math.PI * 1.15, Math.PI * 1.5);
  g.stroke();
  // bars
  for (let i = 0; i < 10; i++) {
    g.fillStyle = i < 7 ? '#8EB69B' : 'rgba(142,182,155,0.2)';
    g.fillRect(40 + i * 18, 270, 12, 26);
  }
  g.fillStyle = 'rgba(218,241,222,0.5)';
  g.fillRect(40, 312, 176, 4);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

/** Stylised, invented city map for the discovery phase (not real geography). */
export function drawMapTexture(tex: THREE.CanvasTexture | null, theme: SceneTheme, size: number, worldSize: number, route: THREE.Vector3[]) {
  const c = (tex?.image as HTMLCanvasElement) || canvas(size);
  const g = c.getContext('2d')!;
  const m = theme.map;
  const S = c.width;
  const toPx = (v: number) => (v / worldSize + 0.5) * S;
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

  g.fillStyle = m.bg;
  g.fillRect(0, 0, S, S);

  // Blocks on a slightly rotated grid
  g.save();
  g.translate(S / 2, S / 2);
  g.rotate(-0.22);
  const cell = S / 22;
  for (let i = -16; i < 16; i++) {
    for (let j = -16; j < 16; j++) {
      if (rnd() < 0.18) continue;
      g.fillStyle = rnd() < 0.12 ? m.park : m.block;
      const pad = cell * 0.14;
      g.beginPath();
      g.roundRect(i * cell + pad, j * cell + pad, cell - pad * 2, cell - pad * 2, cell * 0.12);
      g.fill();
    }
  }
  g.strokeStyle = m.minor;
  g.lineWidth = S * 0.004;
  for (let i = -16; i <= 16; i++) {
    g.beginPath();
    g.moveTo(i * cell, -S);
    g.lineTo(i * cell, S);
    g.stroke();
    g.beginPath();
    g.moveTo(-S, i * cell);
    g.lineTo(S, i * cell);
    g.stroke();
  }
  g.restore();

  // Coastline on the east edge
  g.fillStyle = m.water;
  g.beginPath();
  g.moveTo(S, 0);
  g.lineTo(S * 0.86, 0);
  for (let y = 0; y <= S; y += S / 24) g.lineTo(S * (0.84 + Math.sin(y / S * 5.2) * 0.035 + rnd() * 0.01), y);
  g.lineTo(S, S);
  g.closePath();
  g.fill();

  // Major roads (one follows the route so the morphed ribbon sits on a road)
  const road = (pts: [number, number][], w: number) => {
    for (const [stroke, width] of [[m.casing, w * 1.7], [m.major, w]] as const) {
      g.strokeStyle = stroke;
      g.lineWidth = width;
      g.lineCap = 'round';
      g.lineJoin = 'round';
      g.beginPath();
      pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
      g.stroke();
    }
  };
  road(route.map((p) => [toPx(p.x), toPx(p.z)]), S * 0.012);
  road([[0, S * 0.3], [S * 0.3, S * 0.36], [S * 0.6, S * 0.28], [S * 0.86, S * 0.32]], S * 0.009);
  road([[S * 0.22, S], [S * 0.3, S * 0.6], [S * 0.42, S * 0.3], [S * 0.46, 0]], S * 0.009);
  road([[0, S * 0.78], [S * 0.5, S * 0.72], [S * 0.84, S * 0.8]], S * 0.007);

  const t = tex || new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  t.needsUpdate = true;
  return t;
}
