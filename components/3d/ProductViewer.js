import { Canvas } from '@react-three/fiber';
import { ContactShadows, Environment, Lightformer } from '@react-three/drei';
import { Suspense } from 'react';
import CameraController from './CameraController';
import ProductModel from './ProductModel';
import { usePrefersReducedMotion } from '@/lib/hooks';

/** Studio lighting without any network fetch: key + rim lightformers inside a procedural environment. */
function Lighting({ rim = '#ffffff' }) {
  return (
    <>
      <ambientLight intensity={0.35} />
      <directionalLight position={[3, 5, 4]} intensity={2.1} castShadow />
      <pointLight position={[-4, 1.5, -2]} intensity={14} color={rim} distance={12} />
      <Environment resolution={256} environmentIntensity={0.9}>
        <Lightformer form="rect" intensity={3.2} position={[0, 4, 3]} scale={[8, 2.4, 1]} color="#ffffff" />
        <Lightformer form="rect" intensity={2} position={[-5, 1, -2]} rotation-y={Math.PI / 2} scale={[6, 3, 1]} color={rim} />
        <Lightformer form="ring" intensity={2.4} position={[5, 1, 1]} rotation-y={-Math.PI / 2} scale={3} color="#9fd8ff" />
      </Environment>
    </>
  );
}

/**
 * R3F canvas showing one real 3D model (GLB) on a turntable.
 * `active` pauses rendering when off-screen (battery + main-thread friendly).
 * `controlsRef` receives { rotateBy, zoomBy, reset }.
 */
function ProductViewer({ model, controlsRef, active = true, autoRotate = true, initialAngle = 0.5, camera = { position: [0, 0.2, 6.4], fov: 32 } }) {
  const reduced = usePrefersReducedMotion();
  return (
    <Canvas dpr={[1, 1.75]} camera={camera} frameloop={active ? 'always' : 'never'} gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }} shadows>
      <Suspense fallback={null}>
        <Lighting />
        <CameraController ref={controlsRef} autoRotate={autoRotate} reducedMotion={reduced} initialAngle={initialAngle}>
          <ProductModel model={model} />
        </CameraController>
        <ContactShadows position={[0, -2.15, 0]} opacity={0.5} scale={9} blur={2.6} far={4} />
      </Suspense>
    </Canvas>
  );
}

// NB: next/dynamic does not forward `ref`, hence the explicit `controlsRef` prop.
export default ProductViewer;
