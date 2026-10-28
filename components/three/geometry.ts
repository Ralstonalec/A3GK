import * as THREE from 'three';

/** A parametric tube-like surface: u wraps around (0..1), v runs along the length (0..1). */
export interface Surface {
  point(u: number, v: number, out?: THREE.Vector3): THREE.Vector3;
  axis(v: number, out?: THREE.Vector3): THREE.Vector3;
  circumference(v: number): number;
  length: number;
  vAtY?: (y: number) => number;
}

function measure(s: Surface) {
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  s.point(0, 0, a);
  let len = 0;
  for (let i = 1; i <= 24; i++) {
    s.point(0, i / 24, b);
    len += a.distanceTo(b);
    a.copy(b);
  }
  return len;
}

/** Elliptical cross-section swept up the Y axis. Profile points are (rx, y, rz). u=0 faces +z, u=.25 faces +x. */
export function ellipseSurface(profile: THREE.Vector3[]): Surface {
  const curve = new THREE.CatmullRomCurve3(profile, false, 'centripetal');
  const tmp = new THREE.Vector3();
  const s: Surface = {
    point(u, v, out = new THREE.Vector3()) {
      curve.getPoint(Math.min(1, Math.max(0, v)), tmp);
      const t = u * Math.PI * 2;
      return out.set(tmp.x * Math.sin(t), tmp.y, tmp.z * Math.cos(t));
    },
    axis(v, out = new THREE.Vector3()) {
      curve.getPoint(Math.min(1, Math.max(0, v)), tmp);
      return out.set(0, tmp.y, 0);
    },
    circumference(v) {
      curve.getPoint(Math.min(1, Math.max(0, v)), tmp);
      const a = tmp.x;
      const b = tmp.z;
      return Math.PI * (3 * (a + b) - Math.sqrt((3 * a + b) * (a + 3 * b)));
    },
    length: 0,
    vAtY(y) {
      let lo = 0;
      let hi = 1;
      const up = curve.getPoint(1).y > curve.getPoint(0).y;
      for (let i = 0; i < 24; i++) {
        const mid = (lo + hi) / 2;
        const my = curve.getPoint(mid).y;
        if (up ? my < y : my > y) lo = mid; else hi = mid;
      }
      return (lo + hi) / 2;
    },
  };
  s.length = measure(s);
  return s;
}

/** Circular cross-section swept along a centreline. u=0 points toward `ref`, projected off the tangent. */
export function curveSurface(points: THREE.Vector3[], radii: [number, number][], ref: THREE.Vector3): Surface {
  const curve = new THREE.CatmullRomCurve3(points, false, 'centripetal');
  const radius = (v: number) => {
    for (let i = 1; i < radii.length; i++) {
      if (v <= radii[i][0]) {
        const [v0, r0] = radii[i - 1];
        const [v1, r1] = radii[i];
        const t = (v - v0) / (v1 - v0);
        return r0 + (r1 - r0) * t * t * (3 - 2 * t);
      }
    }
    return radii[radii.length - 1][1];
  };
  const T = new THREE.Vector3();
  const A = new THREE.Vector3();
  const B = new THREE.Vector3();
  const frame = (v: number) => {
    curve.getTangentAt(v, T);
    A.copy(ref).addScaledVector(T, -ref.dot(T)).normalize();
    B.crossVectors(T, A);
  };
  const s: Surface = {
    point(u, v, out = new THREE.Vector3()) {
      v = Math.min(1, Math.max(0, v));
      frame(v);
      curve.getPointAt(v, out);
      const t = u * Math.PI * 2;
      const r = radius(v);
      return out.addScaledVector(A, Math.cos(t) * r).addScaledVector(B, Math.sin(t) * r);
    },
    axis(v, out = new THREE.Vector3()) {
      return curve.getPointAt(Math.min(1, Math.max(0, v)), out);
    },
    circumference: (v) => 2 * Math.PI * radius(v),
    length: curve.getLength(),
  };
  return s;
}

export function surfaceFrame(s: Surface, u: number, v: number) {
  const P = s.point(u, v);
  const e = 0.002;
  const V = s.point(u, Math.min(1, v + e)).sub(s.point(u, Math.max(0, v - e))).normalize();
  const out = P.clone().sub(s.axis(v));
  const N = out.addScaledVector(V, -out.dot(V)).normalize();
  const X = new THREE.Vector3().crossVectors(V, N);
  return { P, X, Y: V, Z: N };
}

export function buildTube(s: Surface, vSeg: number, uSeg: number, stitchesPerM = 110, mirrorX = false, opts: { unitUV?: boolean; wrinkle?: number } = {}) {
  const pos: number[] = [];
  const uv: number[] = [];
  const p = new THREE.Vector3();
  for (let j = 0; j <= vSeg; j++) {
    const v = j / vSeg;
    const circ = s.circumference(v);
    for (let i = 0; i <= uSeg; i++) {
      const u = i / uSeg;
      s.point(u, v, p);
      if (opts.wrinkle) {
        const w = opts.wrinkle * (Math.sin(u * 37 + v * 11) * 0.5 + Math.sin(u * 91 - v * 23 + 1.3) * 0.3 + Math.sin(v * 47 + u * 5) * 0.2);
        const ax = s.axis(v);
        p.addScaledVector(p.clone().sub(ax).normalize(), w);
      }
      pos.push(mirrorX ? -p.x : p.x, p.y, p.z);
      if (opts.unitUV) uv.push(u, v); else uv.push(u * circ * stitchesPerM, v * s.length * stitchesPerM);
    }
  }
  const idx: number[] = [];
  for (let j = 0; j < vSeg; j++) {
    for (let i = 0; i < uSeg; i++) {
      const a = j * (uSeg + 1) + i;
      const b = a + uSeg + 1;
      idx.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();

  // make sure normals face away from the axis (cheap check on a mid vertex)
  const mid = Math.floor(vSeg / 2) * (uSeg + 1);
  const n = new THREE.Vector3().fromBufferAttribute(g.attributes.normal as THREE.BufferAttribute, mid);
  const q = new THREE.Vector3().fromBufferAttribute(g.attributes.position as THREE.BufferAttribute, mid);
  const ax = s.axis(0.5);
  if (mirrorX) ax.x = -ax.x;
  if (n.dot(q.sub(ax)) < 0) {
    const flipped = idx.slice();
    for (let k = 0; k < flipped.length; k += 3) { const t = flipped[k + 1]; flipped[k + 1] = flipped[k + 2]; flipped[k + 2] = t; }
    g.setIndex(flipped);
    g.computeVertexNormals();
  }
  // stitch the seam so there is no lighting crease
  const na = g.attributes.normal as THREE.BufferAttribute;
  for (let j = 0; j <= vSeg; j++) {
    const a = j * (uSeg + 1);
    const b = a + uSeg;
    const x = (na.getX(a) + na.getX(b)) / 2;
    const y = (na.getY(a) + na.getY(b)) / 2;
    const z = (na.getZ(a) + na.getZ(b)) / 2;
    na.setXYZ(a, x, y, z);
    na.setXYZ(b, x, y, z);
  }
  return g;
}

// ---------- padding: one continuous quilted surface per pad ----------

export type Shape =
  | { kind: 'ellipse'; a: number; b: number; n?: number }
  | { kind: 'capsule'; a: number; r: number }
  | { kind: 'poly'; pts: [number, number][] };

export type PadSpec = {
  id: string;
  zone: string;
  label: string;
  surf: string;
  u0: number;
  v0?: number;
  y0?: number;
  shape: Shape;
  rot?: number;
  mirror?: boolean;
};

export type PadMesh = { spec: PadSpec; side: 1 | -1; geo: THREE.BufferGeometry; centre: THREE.Vector3; normal: THREE.Vector3 };

type SD = (x: number, y: number) => number;

function shapeSD(shape: Shape): { sd: SD; hx: number; hy: number } {
  if (shape.kind === 'ellipse') {
    const { a, b } = shape;
    const n = shape.n ?? 2.6;
    return { hx: a, hy: b, sd: (x, y) => (Math.pow(Math.pow(Math.abs(x / a), n) + Math.pow(Math.abs(y / b), n), 1 / n) - 1) * Math.min(a, b) };
  }
  if (shape.kind === 'capsule') {
    const { a, r } = shape;
    return { hx: a + r, hy: r, sd: (x, y) => Math.hypot(x - Math.max(-a, Math.min(a, x)), y) - r };
  }
  const curve = new THREE.CatmullRomCurve3(shape.pts.map(([x, y]) => new THREE.Vector3(x, y, 0)), true, 'catmullrom', 0.5);
  const poly = curve.getPoints(160);
  let hx = 0;
  let hy = 0;
  for (const p of poly) { hx = Math.max(hx, Math.abs(p.x)); hy = Math.max(hy, Math.abs(p.y)); }
  return {
    hx, hy,
    sd: (x, y) => {
      let d = Infinity;
      let inside = false;
      for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        const a = poly[j];
        const b = poly[i];
        if ((b.y > y) !== (a.y > y) && x < ((a.x - b.x) * (y - b.y)) / (a.y - b.y) + b.x) inside = !inside;
        const ex = b.x - a.x;
        const ey = b.y - a.y;
        const t = Math.max(0, Math.min(1, ((x - a.x) * ex + (y - a.y) * ey) / (ex * ex + ey * ey || 1)));
        d = Math.min(d, Math.hypot(x - a.x - t * ex, y - a.y - t * ey));
      }
      return inside ? -d : d;
    },
  };
}

const R_HEX = 0.0145; // hex circumradius
const smooth01 = (a: number, b: number, v: number) => { const t = Math.min(1, Math.max(0, (v - a) / (b - a))); return t * t * (3 - 2 * t); };

/** Distance (m) from the point to the nearest hex edge, positive inside. Pointy-top lattice. */
function hexInset(x: number, y: number) {
  const R = R_HEX;
  const q = ((Math.sqrt(3) / 3) * x - y / 3) / R;
  const r = ((2 / 3) * y) / R;
  const cx = q;
  const cz = r;
  const cy = -cx - cz;
  let rx = Math.round(cx);
  let ry = Math.round(cy);
  let rz = Math.round(cz);
  const dx = Math.abs(rx - cx);
  const dy = Math.abs(ry - cy);
  const dz = Math.abs(rz - cz);
  if (dx > dy && dx > dz) rx = -ry - rz; else if (dy > dz) ry = -rx - rz; else rz = -rx - ry;
  const px = x - R * Math.sqrt(3) * (rx + rz / 2);
  const py = y - R * 1.5 * rz;
  const d = Math.max(Math.abs(px), Math.abs(px * 0.5 + py * 0.8660254), Math.abs(-px * 0.5 + py * 0.8660254));
  return (R * Math.sqrt(3)) / 2 - d;
}

const LIP = 0.0028; // stitched border band height
const CELL = 0.0052; // cell height above the band
const BAND = 0.0075; // border band width
const GROOVE = 0.0026;

function padHeight(s: number, x: number, y: number) {
  const lip = LIP * smooth01(0, 0.002, s);
  const inset = smooth01(BAND, BAND + 0.0025, s);
  if (inset <= 0) return lip;
  const t = hexInset(x, y) - GROOVE / 2;
  const cell = smooth01(0, 0.0032, t);
  const dome = 0.82 + 0.18 * smooth01(0, 0.012, t);
  return lip + CELL * cell * dome * inset;
}

export function buildPadMesh(spec: PadSpec, surf: Surface, side: 1 | -1): PadMesh {
  const { sd: sd0, hx, hy } = shapeSD(spec.shape);
  const rot = spec.rot ?? 0;
  const c = Math.cos(-rot);
  const sn = Math.sin(-rot);
  const sd: SD = (x, y) => sd0(x * c - y * sn, x * sn + y * c);
  const half = Math.hypot(hx, hy) + 0.004;
  const step = 0.0022;
  const n = Math.ceil((half * 2) / step) + 1;
  const v0 = spec.v0 ?? surf.vAtY!(spec.y0!);
  const mir = (v: THREE.Vector3) => (side === -1 ? new THREE.Vector3(-v.x, v.y, v.z) : v);

  const idx = new Int32Array(n * n).fill(-1);
  const pos: number[] = [];
  const uv: number[] = [];
  const S: number[] = [];
  let count = 0;
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n; i++) {
      const x = -half + i * step;
      const y = -half + j * step;
      const s = -sd(x, y);
      if (s < -0.0025) continue;
      const v = Math.min(1, Math.max(0, v0 + y / surf.length));
      const u = (((spec.u0 + x / surf.circumference(v)) % 1) + 1) % 1;
      const f = surfaceFrame(surf, u, v);
      const h = (s > 0 ? padHeight(s, x, y) : 0) + 0.0004;
      const P = mir(f.P.addScaledVector(f.Z, h));
      pos.push(P.x, P.y, P.z);
      uv.push(x * 90, y * 90);
      S.push(s);
      idx[j * n + i] = count++;
    }
  }
  const tri: number[] = [];
  for (let j = 0; j < n - 1; j++) {
    for (let i = 0; i < n - 1; i++) {
      const a = idx[j * n + i];
      const b = idx[j * n + i + 1];
      const cc = idx[(j + 1) * n + i];
      const d = idx[(j + 1) * n + i + 1];
      if (a < 0 || b < 0 || cc < 0 || d < 0) continue;
      if (S[a] < 0 && S[b] < 0 && S[cc] < 0 && S[d] < 0) continue;
      if (side === 1) tri.push(a, b, d, a, d, cc); else tri.push(a, d, b, a, cc, d);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(tri);
  geo.computeVertexNormals();
  const fc = surfaceFrame(surf, spec.u0, v0);
  return { spec, side, geo, centre: mir(fc.P), normal: mir(fc.Z) };
}

export function hexPillow(radius: number, depth: number, bevel: number) {
  const sh = new THREE.Shape();
  for (let k = 0; k < 6; k++) {
    const a = Math.PI / 6 + (k * Math.PI) / 3;
    const px = Math.cos(a) * radius;
    const py = Math.sin(a) * radius;
    if (k === 0) sh.moveTo(px, py); else sh.lineTo(px, py);
  }
  sh.closePath();
  const g = new THREE.ExtrudeGeometry(sh, { depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 2, curveSegments: 1 });
  g.translate(0, 0, bevel);
  return g;
}

export function makeKnitTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d')!;
  g.fillStyle = '#808080';
  g.fillRect(0, 0, 128, 128);
  g.lineCap = 'round';
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const x = col * 16;
      const y = row * 16;
      const grad = g.createLinearGradient(x, y, x + 16, y + 16);
      grad.addColorStop(0, '#f2f2f2');
      grad.addColorStop(1, '#3a3a3a');
      g.strokeStyle = grad;
      g.lineWidth = 4.2;
      g.beginPath();
      g.moveTo(x + 2, y + 2);
      g.lineTo(x + 8, y + 14);
      g.lineTo(x + 14, y + 2);
      g.stroke();
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 4;
  return t;
}

/** A thin raised seam following the surface: pass (u,v) samples. */
export function seamGeometry(s: Surface, samples: [number, number][], closed: boolean, mirrorX = false, r = 0.0011) {
  const pts = samples.map(([u, v]) => { const p = s.point(u, v); if (mirrorX) p.x = -p.x; return p; });
  const curve = new THREE.CatmullRomCurve3(pts, closed);
  return new THREE.TubeGeometry(curve, Math.max(8, pts.length * 2), r, 5, closed);
}
export const ringSamples = (v: number, steps = 96): [number, number][] => Array.from({ length: steps }, (_, i) => [i / steps, v] as [number, number]);
export const lineSamples = (u: number, v0: number, v1: number, steps = 40): [number, number][] => Array.from({ length: steps + 1 }, (_, i) => [u, v0 + ((v1 - v0) * i) / steps] as [number, number]);
