import { useGLTF } from '@react-three/drei';
import { useEffect, useMemo } from 'react';
import { Box3, Vector3 } from 'three';

// Decoder is served from /public/draco (no gstatic CDN call → CSP-safe, GDPR-friendly).
useGLTF.setDecoderPath('/draco/');

/**
 * Loads a real 3D model (.glb / .gltf — e.g. a Shopify Model3d source or a file
 * in /public/3d-models), recentres it and scales it to a ~3.6-unit box.
 * There is deliberately NO built-in stand-in model: the viewer only appears
 * when you provide real product media.
 */
export default function ProductModel({ model }) {
  if (!model?.url) return null;
  return <GlbModel url={model.url} />;
}

function GlbModel({ url }) {
  const { scene } = useGLTF(url);
  const { object, scale, offset } = useMemo(() => {
    const clone = scene.clone(true);
    const box = new Box3().setFromObject(clone);
    const size = box.getSize(new Vector3());
    const center = box.getCenter(new Vector3());
    const max = Math.max(size.x, size.y, size.z) || 1;
    return { object: clone, scale: 3.6 / max, offset: center.multiplyScalar(-1) };
  }, [scene]);

  useEffect(() => {
    object.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }, [object]);

  return (
    <group scale={scale}>
      <primitive object={object} position={offset} />
    </group>
  );
}
