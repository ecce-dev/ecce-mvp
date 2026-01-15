"use client"

import { Suspense, useRef, useState, useContext, useEffect, useCallback } from "react";
import { Environment, OrbitControls } from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { RefObject } from "react";
import * as THREE from 'three'
import { useSpring } from "@react-spring/three";
import OrbitControlsContext from "@/lib/components/r3f/OrbitControlsContext";
import { SWITCH_CAMERA_DISTANCE } from "./Garments";

// ============================================
// CAMERA ANIMATION CONFIGURATION
// ============================================

/**
 * Animation curve options:
 * 1 = Snappy: Quick and responsive with minimal overshoot
 * 2 = Smooth: Elegant, flowing motion (default spring feel)
 * 3 = Bouncy: Playful spring with slight overshoot
 * 4 = Swift: Very fast, almost instant
 * 5 = Gentle: Smooth transition with no bounce (clamped)
 */
type AnimationCurveOption = 1 | 2 | 3 | 4 | 5;

/**
 * STEP 1: Orbit Target Animation
 * Animates the point the camera looks at (runs FIRST).
 * Recommended: 5 (Gentle) for smooth transition without bounce
 */
const ORBIT_TARGET_ANIMATION_CURVE: AnimationCurveOption = 4;

/**
 * STEP 2: Azimuth (Rotation) Animation
 * Animates camera rotation around the scene (runs AFTER orbit target completes).
 * Recommended: 1 (Snappy) for responsive feel
 */
const AZIMUTH_ANIMATION_CURVE: AnimationCurveOption = 1;

/**
 * STEP 3: Distance Correction Animation
 * Animates camera distance (runs AFTER azimuth completes).
 * Recommended: 1 (Snappy) for quick adjustment
 */
const DISTANCE_CORRECTION_CURVE: AnimationCurveOption = 3;

/**
 * Immediate Distance Animation (enter/exit selection)
 * Used when entering or exiting selection mode (runs independently).
 * Recommended: 5 (Gentle) for smooth transition without bounce
 */
const IMMEDIATE_DISTANCE_CURVE: AnimationCurveOption = 4;

/**
 * Carousel Rotation Animation
 * Used when in 'carousel' animation mode - rotates carousel to bring garment to camera.
 * Recommended: 2 (Smooth) for elegant carousel rotation
 */
const CAROUSEL_ROTATION_CURVE: AnimationCurveOption = 2;

/** Animation curve configurations for react-spring */
const ANIMATION_CURVES = {
  1: { tension: 420, friction: 60 },                  // Snappy - quick and responsive
  2: { tension: 170, friction: 26 },                  // Smooth - default spring feel
  3: { tension: 200, friction: 15 },                  // Bouncy - playful with overshoot
  4: { tension: 600, friction: 40 },                  // Swift - very fast
  5: { tension: 280, friction: 60, clamp: true },    // Gentle - smooth, no bounce
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
 * Animation sequence for garment-to-garment switches (sequential queue):
 * 1. STEP 1: Orbit target animation (very fast)
 * 2. STEP 2: Azimuth rotation animation (runs AFTER orbit target completes)
 * 3. STEP 3: Distance correction animation (runs AFTER azimuth completes)
 * 
 * For enter/exit selection: Distance animation runs immediately (independent).
 */
function CameraRotationAnimator() {
  const { 
    orbitControlsRef, 
    targetAzimuthalAngle, 
    targetOrbitTarget,
    targetDistance,
    queuedDistanceCorrection,
    setQueuedDistanceCorrection,
  } = useContext(OrbitControlsContext);
  
  const { camera } = useThree();

  // Get animation configs for each animation step
  const orbitTargetConfig = ANIMATION_CURVES[ORBIT_TARGET_ANIMATION_CURVE];
  const azimuthConfig = ANIMATION_CURVES[AZIMUTH_ANIMATION_CURVE];
  const distanceCorrectionConfig = ANIMATION_CURVES[DISTANCE_CORRECTION_CURVE];
  const immediateDistanceConfig = ANIMATION_CURVES[IMMEDIATE_DISTANCE_CURVE];

  // Track if animations are active
  const isAnimatingTarget = useRef(false);
  const isAnimatingAzimuthal = useRef(false);
  const isAnimatingDistance = useRef(false);

  // Queue for pending animations (sequential execution)
  const pendingAzimuth = useRef<number | null>(null);
  const pendingDistanceCorrection = useRef<number | null>(null);

  // React-spring for orbit target position (STEP 1)
  const [, targetApi] = useSpring(() => ({
    x: 0,
    y: 0,
    z: 0,
    config: orbitTargetConfig,
    onChange: ({ value }) => {
      if (isAnimatingTarget.current && orbitControlsRef?.current) {
        orbitControlsRef.current.target.set(value.x, value.y, value.z);
        orbitControlsRef.current.update();
      }
    },
  }));

  // React-spring for azimuthal angle (STEP 2)
  const [, azimuthalApi] = useSpring(() => ({
    angle: 0,
    config: azimuthConfig,
    onChange: ({ value }) => {
      if (isAnimatingAzimuthal.current && orbitControlsRef?.current) {
        orbitControlsRef.current.setAzimuthalAngle(value.angle);
        orbitControlsRef.current.update();
      }
    },
  }));

  // React-spring for camera distance (for both immediate and correction)
  const distanceConfigRef = useRef(immediateDistanceConfig);
  const [, distanceApi] = useSpring(() => ({
    distance: SWITCH_CAMERA_DISTANCE.desktop as number,
    config: distanceConfigRef.current,
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

  // Refs to store latest versions of trigger functions (avoids stale closures in onRest callbacks)
  const triggerQueuedAzimuthRef = useRef<() => void>(() => {});
  const triggerQueuedDistanceCorrectionRef = useRef<() => void>(() => {});

  /**
   * STEP 2 → STEP 3: Trigger the queued distance correction animation.
   * Called when azimuth animation completes.
   */
  triggerQueuedDistanceCorrectionRef.current = useCallback(() => {
    if (pendingDistanceCorrection.current !== null && orbitControlsRef?.current) {
      const currentDist = orbitControlsRef.current.getDistance();
      const targetDist = pendingDistanceCorrection.current;
      
      distanceConfigRef.current = distanceCorrectionConfig;
      
      isAnimatingDistance.current = true;
      distanceApi.start({
        from: { distance: currentDist },
        to: { distance: targetDist },
        config: distanceCorrectionConfig,
        onRest: () => { 
          isAnimatingDistance.current = false; 
          pendingDistanceCorrection.current = null;
        },
      });
      
      setQueuedDistanceCorrection(null);
    }
  }, [distanceApi, distanceCorrectionConfig, orbitControlsRef, setQueuedDistanceCorrection]);

  /**
   * STEP 1 → STEP 2: Trigger the queued azimuth animation.
   * Called when orbit target animation completes.
   */
  triggerQueuedAzimuthRef.current = useCallback(() => {
    if (pendingAzimuth.current !== null && orbitControlsRef?.current) {
      const currentAngle = orbitControlsRef.current.getAzimuthalAngle();
      const normalizedTarget = normalizeAngleDiff(pendingAzimuth.current, currentAngle);
      
      isAnimatingAzimuthal.current = true;
      azimuthalApi.start({
        from: { angle: currentAngle },
        to: { angle: normalizedTarget },
        config: azimuthConfig,
        onRest: () => { 
          isAnimatingAzimuthal.current = false;
          pendingAzimuth.current = null;
          // When azimuth completes, trigger distance correction (STEP 2 → STEP 3)
          triggerQueuedDistanceCorrectionRef.current();
        },
      });
    }
  }, [azimuthalApi, azimuthConfig, orbitControlsRef]);

  // STEP 1: Handle orbit target animation (starts the sequence)
  useEffect(() => {
    if (targetOrbitTarget !== null && orbitControlsRef?.current) {
      const current = orbitControlsRef.current.target;
      
      isAnimatingTarget.current = true;
      targetApi.start({
        from: { x: current.x, y: current.y, z: current.z },
        to: { x: targetOrbitTarget.x, y: targetOrbitTarget.y, z: targetOrbitTarget.z },
        config: orbitTargetConfig,
        onRest: () => { 
          isAnimatingTarget.current = false;
          // When orbit target completes, trigger queued azimuth (STEP 1 → STEP 2)
          triggerQueuedAzimuthRef.current();
        },
      });
    }
  }, [targetOrbitTarget, targetApi, orbitControlsRef, orbitTargetConfig]);

  // STEP 2: Handle azimuthal angle animation (queued or immediate)
  useEffect(() => {
    if (targetAzimuthalAngle !== null && orbitControlsRef?.current) {
      // If orbit target is animating, queue the azimuth animation
      if (isAnimatingTarget.current) {
        pendingAzimuth.current = targetAzimuthalAngle;
      } else {
        // No orbit target animation running, start azimuth immediately
        const currentAngle = orbitControlsRef.current.getAzimuthalAngle();
        const normalizedTarget = normalizeAngleDiff(targetAzimuthalAngle, currentAngle);
        
        isAnimatingAzimuthal.current = true;
        azimuthalApi.start({
          from: { angle: currentAngle },
          to: { angle: normalizedTarget },
          config: azimuthConfig,
          onRest: () => { 
            isAnimatingAzimuthal.current = false;
            // When azimuth completes, trigger distance correction (STEP 2 → STEP 3)
            triggerQueuedDistanceCorrectionRef.current();
          },
        });
      }
    }
  }, [targetAzimuthalAngle, azimuthalApi, orbitControlsRef, azimuthConfig]);

  // STEP 3: Handle queued distance correction (queued for the sequence)
  useEffect(() => {
    if (queuedDistanceCorrection !== null) {
      pendingDistanceCorrection.current = queuedDistanceCorrection;
      
      // If no other animations are running, trigger immediately
      if (!isAnimatingTarget.current && !isAnimatingAzimuthal.current) {
        triggerQueuedDistanceCorrectionRef.current();
      }
    }
  }, [queuedDistanceCorrection]);

  // Handle immediate distance animation (for enter/exit selection - runs independently)
  useEffect(() => {
    if (targetDistance !== null && orbitControlsRef?.current) {
      const currentDist = orbitControlsRef.current.getDistance();
      
      distanceConfigRef.current = immediateDistanceConfig;
      
      isAnimatingDistance.current = true;
      distanceApi.start({
        from: { distance: currentDist },
        to: { distance: targetDistance },
        config: immediateDistanceConfig,
        onRest: () => { isAnimatingDistance.current = false; },
      });
    }
  }, [targetDistance, distanceApi, orbitControlsRef, immediateDistanceConfig]);

  return null;
}

// CarouselRotationAnimator has been removed - animation is now handled directly in OrbitingGroup
// This simplifies the architecture by eliminating state synchronization between components


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
const [queuedDistanceCorrection, setQueuedDistanceCorrection] = useState<number | null>(null)

// Carousel animation state (only need this flag to disable orbit controls during animation)
const [isCarouselAnimating, setIsCarouselAnimating] = useState(false)


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
      setTargetDistance,
      queuedDistanceCorrection,
      setQueuedDistanceCorrection,
      isCarouselAnimating,
      setIsCarouselAnimating,
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
          // Disable rotation during carousel animation to prevent user interference
          enableRotate={isCarouselAnimating ? false : (controls.orbitControls.enableRotate ?? true)}
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
