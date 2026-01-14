"use client"

import { Suspense, useRef, useState, useContext, useEffect } from "react";
import { Environment, OrbitControls } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { RefObject } from "react";
import * as THREE from 'three'
import { useSpring } from "@react-spring/three";
import OrbitControlsContext from "@/lib/components/r3f/OrbitControlsContext";

// ============================================
// CAMERA ANIMATION CONFIGURATION
// ============================================

/**
 * Animation curve presets for camera transitions.
 * Change this value (1-4) to switch between different animation feels.
 * 
 * 1 = Snappy: Quick, responsive feel with minimal overshoot
 * 2 = Smooth: Elegant, flowing motion with gentle easing
 * 3 = Bouncy: Playful spring with slight overshoot
 * 4 = Swift: Very fast, almost instant transitions
 */
const ANIMATION_CURVE: 1 | 2 | 3 | 4 = 1;

/** Animation curve configurations for react-spring */
const ANIMATION_CURVES = {
  1: { tension: 280, friction: 60 },      // Snappy - quick and responsive
  2: { tension: 170, friction: 26 },      // Smooth - default spring feel
  3: { tension: 200, friction: 15 },      // Bouncy - playful with overshoot
  4: { tension: 400, friction: 40 },      // Swift - very fast
} as const;

// ============================================

function CustomEnvironment(props: { environmentFilePath: string | string[] }) {
  return <>
    <Environment
      files={props.environmentFilePath}
      background
    />
  </>
}

/**
 * Normalize angle difference to [-PI, PI] for shortest rotation path
 */
function normalizeAngleDiff(target: number, current: number): number {
  let diff = target - current;
  while (diff > Math.PI) diff -= 2 * Math.PI;
  while (diff < -Math.PI) diff += 2 * Math.PI;
  return current + diff;
}

/**
 * Component that handles smooth camera animation via OrbitControls.
 * Uses react-spring for physics-based easing with configurable curves.
 * 
 * Animates:
 * - Azimuthal angle (rotation around Y axis)
 * - Orbit target position (what the camera orbits around)
 * - Camera distance (zoom level)
 */
function CameraRotationAnimator() {
  const { 
    orbitControlsRef, 
    targetAzimuthalAngle, 
    targetOrbitTarget,
    targetDistance,
  } = useContext(OrbitControlsContext);
  
  const { camera } = useThree();

  // Get selected animation config
  const springConfig = ANIMATION_CURVES[ANIMATION_CURVE];

  // Track if animation is active to prevent onChange from running on mount
  const isAnimatingAzimuthal = useRef(false);
  const isAnimatingTarget = useRef(false);
  const isAnimatingDistance = useRef(false);

  // React-spring for azimuthal angle
  const [, azimuthalApi] = useSpring(() => ({
    angle: 0,
    config: springConfig,
    onChange: ({ value }) => {
      if (isAnimatingAzimuthal.current && orbitControlsRef?.current) {
        orbitControlsRef.current.setAzimuthalAngle(value.angle);
        orbitControlsRef.current.update();
      }
    },
  }));

  // React-spring for orbit target position
  const [, targetApi] = useSpring(() => ({
    x: 0,
    y: 0,
    z: 0,
    config: springConfig,
    onChange: ({ value }) => {
      if (isAnimatingTarget.current && orbitControlsRef?.current) {
        orbitControlsRef.current.target.set(value.x, value.y, value.z);
        orbitControlsRef.current.update();
      }
    },
  }));

  // React-spring for camera distance
  const [, distanceApi] = useSpring(() => ({
    distance: 19,
    config: springConfig,
    onChange: ({ value }) => {
      if (isAnimatingDistance.current && orbitControlsRef?.current) {
        const controls = orbitControlsRef.current;
        const direction = new THREE.Vector3()
          .subVectors(camera.position, controls.target)
          .normalize();
        camera.position.copy(controls.target).addScaledVector(direction, value.distance);
        controls.update();
      }
    },
  }));

  // Handle azimuthal angle animation trigger
  useEffect(() => {
    if (targetAzimuthalAngle !== null && orbitControlsRef?.current) {
      const currentAngle = orbitControlsRef.current.getAzimuthalAngle();
      // Normalize the target angle for shortest path rotation
      const normalizedTarget = normalizeAngleDiff(targetAzimuthalAngle, currentAngle);
      
      isAnimatingAzimuthal.current = true;
      azimuthalApi.start({
        from: { angle: currentAngle },
        to: { angle: normalizedTarget },
        onRest: () => { isAnimatingAzimuthal.current = false; },
      });
    }
  }, [targetAzimuthalAngle, azimuthalApi, orbitControlsRef]);

  // Handle orbit target animation trigger
  useEffect(() => {
    if (targetOrbitTarget !== null && orbitControlsRef?.current) {
      const current = orbitControlsRef.current.target;
      
      isAnimatingTarget.current = true;
      targetApi.start({
        from: { x: current.x, y: current.y, z: current.z },
        to: { x: targetOrbitTarget.x, y: targetOrbitTarget.y, z: targetOrbitTarget.z },
        onRest: () => { isAnimatingTarget.current = false; },
      });
    }
  }, [targetOrbitTarget, targetApi, orbitControlsRef]);

  // Handle distance animation trigger
  useEffect(() => {
    if (targetDistance !== null && orbitControlsRef?.current) {
      const currentDist = orbitControlsRef.current.getDistance();
      
      isAnimatingDistance.current = true;
      distanceApi.start({
        from: { distance: currentDist },
        to: { distance: targetDistance },
        onRest: () => { isAnimatingDistance.current = false; },
      });
    }
  }, [targetDistance, distanceApi, orbitControlsRef]);

  return null;
}


export type CanvasWrapperProps = {
  environmentFilePath?: string | string[]
  controls?: {
    orbitControls?: {
      dampingFactor?: number
      panSpeed?: number
      rotateSpeed?: number
      target?: THREE.Vector3
      maxPolarAngle?: number
      minPolarAngle?: number
      enablePan?: boolean
      enableZoom?: boolean
      enableRotate?: boolean
      maxZoom?: number
      minZoom?: number
    }
  } | null
  initialCameraPosition?: THREE.Vector3
  maxCameraDistance?: number
  minCameraDistance?: number
  cameraFov?: number
  enableLights?: {
    ambient?: boolean
    directional?: boolean
  }
}

function CanvasWrapper({
  initialCameraPosition = new THREE.Vector3(0, 2, -15),
  controls = null,
  maxCameraDistance = 500,
  minCameraDistance = 1,
  enableLights = {
    ambient: true,
    directional: true
  },
  ...props
}: React.PropsWithChildren<CanvasWrapperProps>) {
  /**
   * Refs and State
   */
  const orbitRef = useRef<OrbitControlsImpl>(null!)
  const [orbitControlsRef, setOrbitControlsRef] = useState<RefObject<OrbitControlsImpl>>(orbitRef)
  const [isDragging, setIsDragging] = useState(false)
  const [targetAzimuthalAngle, setTargetAzimuthalAngle] = useState<number | null>(null)
  const [targetOrbitTarget, setTargetOrbitTarget] = useState<THREE.Vector3 | null>(null)
  const [targetDistance, setTargetDistance] = useState<number | null>(null)


  return <>
    <OrbitControlsContext.Provider value={{ 
      orbitControlsRef, 
      setOrbitControlsRef, 
      isDragging, 
      setIsDragging,
      targetAzimuthalAngle,
      setTargetAzimuthalAngle,
      targetOrbitTarget,
      setTargetOrbitTarget,
      targetDistance,
      setTargetDistance
    }}>
      <Canvas
        shadows
        onContextMenu={(e) => e.nativeEvent.preventDefault()}
        id="canvas-wrapper"
        flat
        dpr={[1, 2]}
        camera={{
          fov: props.cameraFov ?? 60,
          near: 0.01,
          far: maxCameraDistance * 2,
          position: initialCameraPosition
        }}
        gl={{
          preserveDrawingBuffer: false,
          localClippingEnabled: true // required for uikit scrolling
        }}
      >
        {props.environmentFilePath ? <CustomEnvironment environmentFilePath={props.environmentFilePath} /> : null}
        {controls && controls.orbitControls && <OrbitControls
          ref={orbitControlsRef}
          makeDefault
          target={controls.orbitControls.target ?? new THREE.Vector3(0, 0, 0)}
          dampingFactor={controls.orbitControls.dampingFactor ?? 0.05}
          panSpeed={controls.orbitControls.panSpeed ?? 1}
          rotateSpeed={controls.orbitControls.rotateSpeed ?? 1}
          maxDistance={maxCameraDistance}
          minDistance={minCameraDistance}
          maxPolarAngle={controls.orbitControls.maxPolarAngle ?? Math.PI}
          minPolarAngle={controls.orbitControls.minPolarAngle ?? 0}
          enableZoom={controls.orbitControls.enableZoom ?? false}
          enablePan={controls.orbitControls.enablePan ?? false}
          enableRotate={controls.orbitControls.enableRotate ?? true}
          enableDamping={true}
          onStart={() => { setIsDragging(true) }}
          onEnd={() => { setIsDragging(false) }}
        />}
        <CameraRotationAnimator />
        {enableLights && <>
          {enableLights.ambient && <ambientLight intensity={0.42} />}
          {enableLights.directional && <directionalLight
            position={[0, 20, 0]}
            intensity={1.5}
            castShadow
            // shadow-mapSize={[2048, 2048]}
            shadow-camera-far={30}
            shadow-camera-left={-10}
            shadow-camera-right={10}
            shadow-camera-top={10}
            shadow-camera-bottom={-10}
          />}
        </>}
        <Suspense fallback={null}>
          {props.children}
        </Suspense>
      </Canvas>
    </OrbitControlsContext.Provider>
  </>
}

export default CanvasWrapper 
