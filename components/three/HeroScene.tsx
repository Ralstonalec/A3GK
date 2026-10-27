'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { AdaptiveDpr } from '@react-three/drei';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';

/**
 * Material study: a knit-fabric swatch over a matte foam layer, lit with a soft key and a rim light.
 *
 * This is deliberately NOT a garment. The garment type and padding layout are unconfirmed, so no
 * body-shaped model or padding positions are drawn. Replace with a model built from the real
 * product (GLB + photographed textures) once supplied.
 */

const vert = /* glsl */ `
  varying vec2 vUv; varying vec3 vN; varying vec3 vV;
  void main() {
    vUv = uv;
    vec3 p = position;
    p.z += sin(p.x * 1.4) * 0.12 + cos(p.y * 1.1) * 0.06; // gentle drape
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    vN = normalize(normalMatrix * normal);
    vV = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }`;

const frag = /* glsl */ `
  varying vec2 vUv; varying vec3 vN; varying vec3 vV;
  uniform vec3 uBase; uniform vec3 uRim;
  void main() {
    vec2 g = vUv * vec2(70.0, 100.0);
    vec2 f = fract(g) - 0.5;
    float col = floor(g.x);
    // interlocking "V" stitches, alternating by column
    float v = abs(f.x) * 1.6 + (f.y * mix(1.0, -1.0, mod(col, 2.0))) * 0.5;
    float stitch = smoothstep(0.55, 0.15, abs(v - 0.15));
    vec3 n = normalize(vN);
    float key = max(dot(n, normalize(vec3(-0.4, 0.7, 0.8))), 0.0);
    float fres = pow(1.0 - max(dot(n, normalize(vV)), 0.0), 3.0);
    vec3 c = uBase * (0.45 + 0.75 * stitch) * (0.5 + key) + uRim * fres * 0.6;
    gl_FragColor = vec4(c, 1.0);
  }`;

function Swatch() {
  const group = useRef<THREE.Group>(null);
  const uniforms = useMemo(() => ({ uBase: { value: new THREE.Color('#9aa4b3') }, uRim: { value: new THREE.Color('#d6ff4a') } }), []);
  useFrame(({ clock, camera }) => {
    const t = clock.elapsedTime;
    if (group.current) {
      group.current.rotation.y = Math.sin(t * 0.15) * 0.35;
      group.current.rotation.x = -0.15 + Math.sin(t * 0.11) * 0.05;
    }
    camera.position.x = Math.sin(t * 0.08) * 0.4;
    camera.lookAt(0, 0, 0);
  });
  return (
    <group ref={group} position={[1.4, 0, 0]}>
      {/* foam layer: matte, slightly offset */}
      <mesh position={[0.05, -0.05, -0.12]}>
        <boxGeometry args={[3.0, 2.0, 0.18]} />
        <meshStandardMaterial color="#14161a" roughness={1} metalness={0} />
      </mesh>
      <mesh>
        <planeGeometry args={[3.2, 2.2, 48, 32]} />
        <shaderMaterial vertexShader={vert} fragmentShader={frag} uniforms={uniforms} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

/** Instanced drifting dust: one draw call for all particles. */
function Dust({ count = 90 }: { count?: number }) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const seeds = useMemo(() => Array.from({ length: count }, () => ({
    x: (Math.random() - 0.5) * 8, y: (Math.random() - 0.5) * 5, z: (Math.random() - 0.5) * 4,
    s: 0.008 + Math.random() * 0.016, sp: 0.05 + Math.random() * 0.1, ph: Math.random() * 6.28,
  })), [count]);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    seeds.forEach((s, i) => {
      dummy.position.set(s.x + Math.sin(t * s.sp + s.ph) * 0.3, s.y + ((t * s.sp * 0.6 + s.ph) % 1) * 0.4, s.z);
      dummy.scale.setScalar(s.s);
      dummy.updateMatrix();
      mesh.current!.setMatrixAt(i, dummy.matrix);
    });
    mesh.current!.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshBasicMaterial color="#ffffff" transparent opacity={0.35} />
    </instancedMesh>
  );
}

export default function HeroScene() {
  return (
    <Canvas
      dpr={[1, 1.75]}
      camera={{ position: [0, 0, 5], fov: 35 }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      style={{ background: 'transparent' }}
    >
      <ambientLight intensity={0.35} />
      <spotLight position={[-3, 3, 4]} angle={0.5} penumbra={1} intensity={30} />
      <directionalLight position={[4, 1, -2]} intensity={1.2} color="#d6ff4a" />
      <Swatch />
      <Dust />
      <AdaptiveDpr pixelated />
    </Canvas>
  );
}
