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

export function buildTube(s: Surface, vSeg: number, uSeg: number, stitchesPerM = 110, mirrorX = false) {
  const pos: number[] = [];
  const uv: number[] = [];
  const p = new THREE.Vector3();
  for (let j = 0; j <= vSeg; j++) {
    const v = j / vSeg;
    const circ = s.circumference(v);
    for (let i = 0; i <= uSeg; i++) {
      const u = i / uSeg;
      s.point(u, v, p);
      pos.push(mirrorX ? -p.x : p.x, p.y, p.z);
      uv.push(u * circ * stitchesPerM, v * s.length * stitchesPerM);
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

// ---------- padding ----------

export type PadSpec = {
  id: string;
  zone: string; // matches a BASE_LAYER.paddedAreas id
  label: string;
  surf: string;
  u0: number;
  v0?: number;
  y0?: number; // for ellipse surfaces: world y of the pad centre
  a: number; // half width (m)
  b: number; // half height (m)
  shape: 'ellipse' | 'shield';
  rot?: number;
  mirror?: boolean;
};

export const PITCH = 0.0175; // hex cell circumradius incl. groove

export type PadCell = { pos: THREE.Vector3; quat: THREE.Quaternion; nrm: THREE.Vector3 };
export type PadData = { spec: PadSpec; side: 1 | -1; cells: PadCell[]; centre: THREE.Vector3; normal: THREE.Vector3 };

function inside(spec: PadSpec, x: number, y: number) {
  const rot = spec.rot ?? 0;
  const c = Math.cos(-rot);
  const s = Math.sin(-rot);
  const rx = x * c - y * s;
  const ry = x * s + y * c;
  const { a, b } = spec;
  const n = 2.6;
  const sq = (px: number, py: number, ca: number, cb: number) => Math.pow(Math.abs(px / ca), n) + Math.pow(Math.abs(py / cb), n) <= 1;
  if (spec.shape === 'ellipse') return sq(rx, ry, a, b);
  return sq(rx, ry - 0.36 * b, a, 0.6 * b) || sq(rx, ry + 0.42 * b, 0.52 * a, 0.62 * b);
}

export function buildPad(spec: PadSpec, surf: Surface, side: 1 | -1): PadData {
  const cells: PadCell[] = [];
  const r = PITCH;
  const dx = Math.sqrt(3) * r;
  const dy = 1.5 * r;
  const v0 = spec.v0 ?? surf.vAtY!(spec.y0!);
  const rows = Math.ceil((spec.b * 1.15) / dy);
  const cols = Math.ceil((spec.a * 1.15) / dx) + 1;
  const basis = new THREE.Matrix4();
  const mir = (v: THREE.Vector3) => (side === -1 ? new THREE.Vector3(-v.x, v.y, v.z) : v);
  for (let j = -rows; j <= rows; j++) {
    for (let i = -cols; i <= cols; i++) {
      const x = (i + (j & 1 ? 0.5 : 0)) * dx;
      const y = j * dy;
      if (!inside(spec, x, y)) continue;
      const v = Math.min(1, Math.max(0, v0 + y / surf.length));
      const u = spec.u0 + x / surf.circumference(v);
      const f = surfaceFrame(surf, ((u % 1) + 1) % 1, v);
      const P = mir(f.P);
      const Y = mir(f.Y);
      const Z = mir(f.Z);
      const X = new THREE.Vector3().crossVectors(Y, Z);
      basis.makeBasis(X, Y, Z);
      cells.push({ pos: P, quat: new THREE.Quaternion().setFromRotationMatrix(basis), nrm: Z });
    }
  }
  const fc = surfaceFrame(surf, spec.u0, v0);
  return { spec, side, cells, centre: mir(fc.P), normal: mir(fc.Z) };
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
