import { useFrame, useThree } from '@react-three/fiber';
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { MathUtils } from 'three';

const DEG = Math.PI / 180;

/**
 * Turntable camera controller.
 *
 * Drag (pointer events → mouse, touch and pen) spins the model with inertia;
 * it auto-rotates while idle (never when the user prefers reduced motion);
 * the imperative handle drives the on-screen rotate / zoom buttons and the
 * arrow-key shortcuts, so the viewer is fully operable without a pointer.
 *
 * Page scroll is deliberately NOT hijacked: the canvas uses `touch-action: pan-y`,
 * so vertical swipes still scroll the page and only horizontal drags rotate.
 */
const CameraController = forwardRef(function CameraController(
  { children, autoRotate = true, autoSpeed = 0.5, resumeDelay = 2.2, initialAngle = 0.5, minZoom = 0.7, maxZoom = 1.8, reducedMotion = false, tilt = true },
  ref,
) {
  const group = useRef(null);
  const { gl, camera } = useThree();
  const s = useRef({ target: initialAngle, current: initialAngle, tilt: 0, tiltTarget: 0, dragging: false, lastX: 0, lastY: 0, idle: 0, zoom: 1, zoomTarget: 1, baseZ: camera.position.z });

  useImperativeHandle(ref, () => ({
    rotateBy(degrees) {
      s.current.target += degrees * DEG;
      s.current.idle = 0;
    },
    zoomBy(factor) {
      s.current.zoomTarget = MathUtils.clamp(s.current.zoomTarget * factor, minZoom, maxZoom);
    },
    reset() {
      Object.assign(s.current, { target: initialAngle, tiltTarget: 0, zoomTarget: 1, idle: 0 });
    },
  }));

  useEffect(() => {
    const el = gl.domElement;
    const st = s.current;
    el.style.touchAction = 'pan-y';
    el.style.cursor = 'grab';

    const down = (e) => {
      st.dragging = true;
      st.lastX = e.clientX;
      st.lastY = e.clientY;
      st.idle = 0;
      el.setPointerCapture?.(e.pointerId);
      el.style.cursor = 'grabbing';
    };
    const move = (e) => {
      if (!st.dragging) return;
      st.target += (e.clientX - st.lastX) * 0.012;
      if (tilt) st.tiltTarget = MathUtils.clamp(st.tiltTarget + (e.clientY - st.lastY) * 0.004, -0.5, 0.5);
      st.lastX = e.clientX;
      st.lastY = e.clientY;
    };
    const up = (e) => {
      st.dragging = false;
      st.idle = 0;
      el.releasePointerCapture?.(e.pointerId);
      el.style.cursor = 'grab';
    };

    el.addEventListener('pointerdown', down);
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    return () => {
      el.removeEventListener('pointerdown', down);
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('pointercancel', up);
    };
  }, [gl, tilt]);

  useFrame((_, delta) => {
    const st = s.current;
    const dt = Math.min(delta, 0.05);
    if (!st.dragging) {
      st.idle += dt;
      if (autoRotate && !reducedMotion && st.idle > resumeDelay) st.target += dt * autoSpeed;
      if (st.idle > resumeDelay) st.tiltTarget *= 1 - Math.min(1, dt * 1.5);
    }
    const k = 1 - Math.exp(-9 * dt);
    st.current += (st.target - st.current) * k;
    st.tilt += (st.tiltTarget - st.tilt) * k;
    st.zoom += (st.zoomTarget - st.zoom) * k;
    if (group.current) {
      group.current.rotation.y = st.current;
      group.current.rotation.x = st.tilt;
    }
    camera.position.z = st.baseZ / st.zoom;
  });

  return <group ref={group}>{children}</group>;
});

export default CameraController;
