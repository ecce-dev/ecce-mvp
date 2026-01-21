"use client"

import React, { useRef, useMemo, useContext, useEffect, useCallback } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { GetGarmentsQuery } from "@/lib/gql/__generated__/graphql";
import Garment from "./Garment";
import { useResponsiveScale } from "@/lib/hooks/useResponsiveScale";
import { useDevice } from "@/lib/hooks/useDevice";
import { TargetBoundingBox } from "./NormalizedGlbModel";
import OrbitControlsContext from "./OrbitControlsContext";
import { useAppModeStore } from "@/lib/stores/appModeStore";
import { useEcceDialog } from "@/lib/components/ecce-elements";
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { useSpring, animated } from "@react-spring/three";

/** Minimum rotation difference (in radians) to trigger an animation */
const MIN_ROTATION_THRESHOLD = 0.01;

// ============================================
// CONFIGURATION CONSTANTS (Desktop baseline values)
// ============================================

/** 
 * Desktop baseline bounding box for garment normalization.
 * Models will be scaled uniformly to fit within these dimensions.
 * Smaller devices will scale down from these values.
 */
const DESKTOP_BOUNDING_BOX: TargetBoundingBox = { x: 5, y: 9, z: 5 };

/** Desktop baseline radius of the circular orbit (units) */
const DESKTOP_ORBIT_RADIUS = 11;

const TABLET_ORBIT_RADIUS = 4;

const MOBILE_ORBIT_RADIUS = 0;

/** Desktop baseline Y position offset for all garments */
const DESKTOP_Y_OFFSET = 0;

/** Speed of the carousel rotation around the center (radians per second) */
const ORBIT_SPEED = 0.09;

/** Speed of individual garment spin on their own axis (radians per second) */
const SPIN_SPEED = 0.09;

/** Speed of selected garment's slow rotation (radians per second) */
const SELECTED_SPIN_SPEED = 0.15;

/** 
 * How garments should face:
 * - 'outward': Garments face away from the center
 * - 'direction': Garments face their direction of travel (tangent to circle)
 */
const GARMENT_FACING: 'outward' | 'direction' = 'outward';

// ============================================
// SELECTION CONFIGURATION
// ============================================

/** Opacity for non-selected garments when one is selected */
const NON_SELECTED_OPACITY = 0.0;

/** Opacity transition speed (higher = faster) */
const OPACITY_TRANSITION_SPEED = 3;

// ============================================
// CAMERA DISTANCE CONFIGURATION (per device type)
// ============================================

/** Camera distance when viewing a selected garment (closer view) */
const SELECTED_CAMERA_DISTANCE = {
  mobile: 15,
  tablet: 11,
  desktop: 10,
} as const;

/** Camera distance during garment switching animation */
export const SWITCH_CAMERA_DISTANCE = {
  mobile: 17,
  tablet: 12,
  desktop: 17,
} as const;

/** Default camera distance when no garment is selected */
// const DEFAULT_CAMERA_DISTANCE = {
//   mobile: 15,
//   tablet: 16,
//   desktop: 15,
// } as const;

// ============================================

interface GarmentsProps {
  garments: NonNullable<GetGarmentsQuery['garments']>['nodes'];
}

interface OrbitingGroupProps {
  children: React.ReactNode;
  orbitSpeed: number;
  isPaused: boolean;
  isDragging: boolean;
  rotationRef: React.MutableRefObject<number>;
  /** Whether carousel animation mode is active */
  useCarouselAnimation: boolean;
  /** 
   * Base angle of the selected garment in the carousel.
   * When this changes to a new value, the carousel animates to bring that garment in front of the camera.
   * null = no selection, carousel auto-rotates
   */
  selectedGarmentBaseAngle: number | null;
  /** Reference to OrbitControls for reading camera angle */
  orbitControlsRef: React.RefObject<OrbitControlsImpl> | null;
  /** Callback when carousel animation starts */
  onAnimationStart?: () => void;
  /** Callback when carousel animation completes */
  onAnimationComplete?: () => void;
}

/**
 * Rotating carousel group that orbits all garments around the Y-axis.
 * 
 * SIMPLIFIED CAROUSEL ANIMATION:
 * - When selectedGarmentBaseAngle changes to a new value:
 *   1. Read camera's current azimuthal angle
 *   2. Calculate target carousel rotation to bring garment in front of camera
 *   3. Animate carousel rotation (shortest path) using lerp in useFrame
 * - When selectedGarmentBaseAngle becomes null: resume auto-rotation
 */
function OrbitingGroup({
  children,
  orbitSpeed,
  isPaused,
  isDragging,
  rotationRef,
  useCarouselAnimation,
  selectedGarmentBaseAngle,
  orbitControlsRef,
  onAnimationStart,
  onAnimationComplete,
}: OrbitingGroupProps) {
  const groupRef = useRef<THREE.Group>(null!);

  // Animation state
  const isAnimatingRef = useRef(false);
  const targetRotationRef = useRef<number | null>(null);
  const animationStartedRef = useRef(false);

  // Track previous base angle to detect when selection changes
  const prevBaseAngleRef = useRef<number | null>(null);

  // Animation speed (lerp factor per frame, higher = faster)
  const ANIMATION_SPEED = 0.08;
  const ANIMATION_THRESHOLD = 0.001; // Close enough to target

  // Handle carousel animation when a garment is selected
  useEffect(() => {
    // Skip if not in carousel mode
    if (!useCarouselAnimation) {
      prevBaseAngleRef.current = selectedGarmentBaseAngle;
      return;
    }

    // Check if base angle actually changed (new garment selected)
    const baseAngleChanged = selectedGarmentBaseAngle !== prevBaseAngleRef.current;
    prevBaseAngleRef.current = selectedGarmentBaseAngle;

    // If no selection or base angle didn't change, skip
    if (selectedGarmentBaseAngle === null || !baseAngleChanged) {
      return;
    }

    // === CALCULATE TARGET ROTATION ===

    // 1. Read camera's current azimuthal angle
    const cameraAngle = orbitControlsRef?.current?.getAzimuthalAngle() ?? 0;

    // 2. Get current carousel rotation
    const currentRotation = groupRef.current?.rotation.y ?? rotationRef.current;

    // 3. Calculate garment's current world angle
    const currentWorldAngle = selectedGarmentBaseAngle + currentRotation;

    // 4. Calculate rotation delta to bring garment to camera angle
    let rotationDelta = cameraAngle - currentWorldAngle;

    // 5. Normalize to shortest path [-π, π]
    while (rotationDelta > Math.PI) rotationDelta -= 2 * Math.PI;
    while (rotationDelta < -Math.PI) rotationDelta += 2 * Math.PI;

    // 6. Calculate final target rotation
    const targetRotation = currentRotation + rotationDelta;

    // Skip if already at target (avoid micro-animations)
    if (Math.abs(rotationDelta) < MIN_ROTATION_THRESHOLD) {
      return;
    }

    // Set target and start animation
    targetRotationRef.current = targetRotation;
    isAnimatingRef.current = true;
    animationStartedRef.current = false; // Will trigger onAnimationStart on first frame

  }, [selectedGarmentBaseAngle, useCarouselAnimation, orbitControlsRef, rotationRef]);

  // All rotation logic in useFrame for predictable behavior
  useFrame(() => {
    if (!groupRef.current) return;

    // Handle carousel animation
    if (isAnimatingRef.current && targetRotationRef.current !== null) {
      // Trigger onAnimationStart on first frame
      if (!animationStartedRef.current) {
        animationStartedRef.current = true;
        onAnimationStart?.();
      }

      const current = groupRef.current.rotation.y;
      const target = targetRotationRef.current;
      const diff = target - current;

      // Check if close enough to target
      if (Math.abs(diff) < ANIMATION_THRESHOLD) {
        // Snap to target and complete animation
        groupRef.current.rotation.y = target;
        rotationRef.current = target;
        isAnimatingRef.current = false;
        targetRotationRef.current = null;
        onAnimationComplete?.();
      } else {
        // Lerp towards target
        groupRef.current.rotation.y += diff * ANIMATION_SPEED;
        rotationRef.current = groupRef.current.rotation.y;
      }
      return;
    }

    // Auto-rotate when not paused, not dragging, and not animating
    if (!isPaused && !isDragging) {
      groupRef.current.rotation.y += orbitSpeed * (1 / 60); // Approximate delta
      rotationRef.current = groupRef.current.rotation.y;
    }
  });

  return <group ref={groupRef}>{children}</group>;
}

/**
 * Calculate the index of the selected garment
 */
function getSelectedIndex(
  garments: NonNullable<GetGarmentsQuery['garments']>['nodes'],
  selectedGarment: NonNullable<GetGarmentsQuery['garments']>['nodes'][0] | null
): number {
  if (!selectedGarment) return -1;
  return garments.findIndex(g => g?.slug === selectedGarment.slug);
}

export default function Garments({ garments }: GarmentsProps) {
  const garmentCount = garments.length;

  // Get responsive scale factor (1.0 at desktop, scaled at smaller devices)
  const responsiveScale = useResponsiveScale();

  // Get device type for stepped values
  const { deviceType } = useDevice();

  // Get selected garment and animation mode from store
  const selectedGarment = useAppModeStore((state) => state.selectedGarment);
  const selectionAnimationMode = useAppModeStore((state) => state.selectionAnimationMode);
  const selectedIndex = getSelectedIndex(garments, selectedGarment);
  const hasSelection = selectedIndex !== -1;

  // Get submit request dialog state from context
  const { isDialogOpen } = useEcceDialog();
  const isSubmitRequestOpen = isDialogOpen("submit-request");

  // Track carousel's current rotation for camera positioning
  const carouselRotationRef = useRef(0);

  // Track previous selection state to detect entering/exiting selection vs switching garments
  const prevHasSelectionRef = useRef(hasSelection);

  // Get context for triggering camera rotation, orbit target, distance, and isDragging state
  const {
    setTargetAzimuthalAngle,
    setTargetOrbitTarget,
    setTargetDistance,
    setQueuedDistanceCorrection,
    isDragging,
    orbitControlsRef,
    isCarouselAnimating,
    setIsCarouselAnimating,
  } = useContext(OrbitControlsContext);

  // Get orbit radius based on device type
  const orbitRadius = useMemo(() => {
    switch (deviceType) {
      case 'mobile':
        return MOBILE_ORBIT_RADIUS;
      case 'tablet':
        return TABLET_ORBIT_RADIUS;
      default:
        return DESKTOP_ORBIT_RADIUS;
    }
  }, [deviceType]);

  // Calculate responsive values
  const { yOffset, targetBoundingBox } = useMemo(() => ({
    yOffset: DESKTOP_Y_OFFSET * responsiveScale,
    targetBoundingBox: {
      x: DESKTOP_BOUNDING_BOX.x * responsiveScale,
      y: DESKTOP_BOUNDING_BOX.y * responsiveScale,
      z: DESKTOP_BOUNDING_BOX.z * responsiveScale,
    }
  }), [responsiveScale]);

  // Get camera distances based on device type
  const { selectedCameraDistance, defaultCameraDistance } = useMemo(() => ({
    selectedCameraDistance: SELECTED_CAMERA_DISTANCE[deviceType],
    defaultCameraDistance: SWITCH_CAMERA_DISTANCE[deviceType],
  }), [deviceType]);

  // Calculate base positions for all garments (their carousel positions)
  const garmentData = useMemo(() => {
    return garments.map((_, index) => {
      const baseAngle = (2 * Math.PI / garmentCount) * index;
      const x = orbitRadius * Math.sin(baseAngle);
      const z = orbitRadius * Math.cos(baseAngle);
      const rotationY = GARMENT_FACING === 'outward' ? baseAngle : baseAngle + Math.PI / 2;

      return {
        baseAngle,
        position: new THREE.Vector3(x, yOffset, z),
        initialRotationY: rotationY,
      };
    });
  }, [garments, garmentCount, orbitRadius, yOffset]);

  // Trigger camera animation when a garment is selected (only for 'camera' animation mode)
  // For 'carousel' mode, the OrbitingGroup handles animation internally
  useEffect(() => {
    // Only handle camera mode animations here
    if (selectionAnimationMode !== 'camera') {
      prevHasSelectionRef.current = hasSelection;
      return;
    }

    // Detect if selection STATE changed (entering/exiting) vs switching between garments
    const isEnteringSelection = hasSelection && !prevHasSelectionRef.current;
    const isExitingSelection = !hasSelection && prevHasSelectionRef.current;
    const isSwitchingGarments = hasSelection && prevHasSelectionRef.current;
    prevHasSelectionRef.current = hasSelection;

    if (selectedIndex !== -1) {
      const selectedGarmentData = garmentData[selectedIndex];
      if (selectedGarmentData) {
        // CAMERA ANIMATION MODE: Camera animates to view the garment

        // Calculate world angle: base angle + carousel rotation
        const worldAngle = selectedGarmentData.baseAngle + carouselRotationRef.current;

        // Set target azimuthal angle for camera to face this garment
        setTargetAzimuthalAngle(worldAngle);

        // Calculate world position by rotating the local position by carousel rotation
        const carouselRotation = carouselRotationRef.current;
        const localPos = selectedGarmentData.position;

        // Apply Y-axis rotation to get world position
        const worldX = localPos.x * Math.cos(carouselRotation) + localPos.z * Math.sin(carouselRotation);
        const worldZ = -localPos.x * Math.sin(carouselRotation) + localPos.z * Math.cos(carouselRotation);

        // Set orbit target to the selected garment's world position
        setTargetOrbitTarget(new THREE.Vector3(worldX, localPos.y, worldZ));

        // Handle distance animation based on transition type:
        if (isEnteringSelection) {
          // Entering selection: immediate distance animation
          setTargetDistance(selectedCameraDistance);
        } else if (isSwitchingGarments) {
          // Switching garments: queue distance correction AFTER target/azimuth animations complete
          // This prevents distance drift caused by the orbit target animation
          setQueuedDistanceCorrection(selectedCameraDistance);
        }
      }
    } else if (isExitingSelection) {
      // Exiting selection in camera mode - return orbit target to origin and camera to current distance
      setTargetOrbitTarget(new THREE.Vector3(0, 0, 0));
      // Use original orbit target position to reset camera position
      const targetDistance = orbitControlsRef?.current?.position0.length();
      setTargetDistance(targetDistance ?? null);
    }
  }, [
    selectedIndex,
    garmentData,
    hasSelection,
    selectionAnimationMode,
    setTargetAzimuthalAngle,
    setTargetOrbitTarget,
    setTargetDistance,
    setQueuedDistanceCorrection,
    selectedCameraDistance,
  ]);

  // Memoized callbacks to prevent unnecessary effect re-runs in OrbitingGroup
  const handleAnimationStart = useCallback(() => {
    setIsCarouselAnimating(true);
  }, [setIsCarouselAnimating]);

  const handleAnimationComplete = useCallback(() => {
    setIsCarouselAnimating(false);
  }, [setIsCarouselAnimating]);

  // Calculate the selected garment's base angle (null if no selection)
  const selectedBaseAngle = selectedIndex !== -1 ? garmentData[selectedIndex]?.baseAngle ?? null : null;

  const scaleSpring = useSpring({
    scale: deviceType === 'mobile' ? (selectedGarment ? 1.42 : 1.3) : 1,
  })

  return (
    <>
      <OrbitingGroup
        orbitSpeed={ORBIT_SPEED}
        isPaused={hasSelection || isSubmitRequestOpen}
        isDragging={isDragging}
        rotationRef={carouselRotationRef}
        useCarouselAnimation={selectionAnimationMode === 'carousel'}
        selectedGarmentBaseAngle={selectedBaseAngle}
        orbitControlsRef={orbitControlsRef}
        onAnimationStart={handleAnimationStart}
        onAnimationComplete={handleAnimationComplete}
      >
        {garments.map((garment, index) => (
          <React.Fragment key={garment?.slug}>
            <animated.group
              scale={scaleSpring.scale}
            >
              <Garment
                garment={garment}
                initPosition={garmentData[index].position}
                initialRotationY={garmentData[index].initialRotationY}
                spinSpeed={hasSelection ? (index === selectedIndex ? SELECTED_SPIN_SPEED : 0) : SPIN_SPEED}
                targetBoundingBox={targetBoundingBox}
                isSelected={index === selectedIndex}
                hasSelection={hasSelection}
                nonSelectedOpacity={NON_SELECTED_OPACITY}
                opacityTransitionSpeed={OPACITY_TRANSITION_SPEED}
              />

            </animated.group>

          </React.Fragment>
        ))}
      </OrbitingGroup>
    </>
  );
}
