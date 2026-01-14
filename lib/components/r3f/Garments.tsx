"use client"

import { useRef, useMemo, useContext, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { GetGarmentsQuery } from "@/lib/gql/__generated__/graphql";
import Garment from "./Garment";
import { useResponsiveScale } from "@/lib/hooks/useResponsiveScale";
import { useDevice } from "@/lib/hooks/useDevice";
import { TargetBoundingBox } from "./NormalizedGlbModel";
import OrbitControlsContext from "./OrbitControlsContext";
import { useAppModeStore } from "@/lib/stores/appModeStore";
import * as THREE from 'three';

// ============================================
// CONFIGURATION CONSTANTS (Desktop baseline values)
// ============================================

/** 
 * Desktop baseline bounding box for garment normalization.
 * Models will be scaled uniformly to fit within these dimensions.
 * Smaller devices will scale down from these values.
 */
const DESKTOP_BOUNDING_BOX: TargetBoundingBox = { x: 5, y: 12, z: 5 };

/** Desktop baseline radius of the circular orbit (units) */
const DESKTOP_ORBIT_RADIUS = 9;

const TABLET_ORBIT_RADIUS = 4;

const MOBILE_ORBIT_RADIUS = 0;

/** Desktop baseline Y position offset for all garments */
const DESKTOP_Y_OFFSET = 0;

/** Speed of the carousel rotation around the center (radians per second) */
const ORBIT_SPEED = 0.09;

/** Speed of individual garment spin on their own axis (radians per second) */
const SPIN_SPEED = 0.09;

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
const NON_SELECTED_OPACITY = 0.3;

/** Opacity transition speed (higher = faster) */
const OPACITY_TRANSITION_SPEED = 3;

/** Camera distance when viewing a selected garment (closer view) */
const SELECTED_CAMERA_DISTANCE = 12;

/** Default camera distance when no garment is selected (from GarmentsClient initial position) */
const DEFAULT_CAMERA_DISTANCE = 19;

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
}

/**
 * Rotating carousel group that orbits all garments around the Y-axis.
 * Pauses rotation when orbit controls are being dragged or when a garment is selected.
 * Tracks current rotation in a ref for camera positioning calculations.
 */
function OrbitingGroup({ children, orbitSpeed, isPaused, isDragging, rotationRef }: OrbitingGroupProps) {
  const groupRef = useRef<THREE.Group>(null!);

  useFrame((_, delta) => {
    // Only rotate when not dragging and not paused
    if (groupRef.current && !isDragging && !isPaused) {
      groupRef.current.rotation.y += orbitSpeed * delta;
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

  // Get selected garment from store
  const selectedGarment = useAppModeStore((state) => state.selectedGarment);
  const selectedIndex = getSelectedIndex(garments, selectedGarment);
  const hasSelection = selectedIndex !== -1;

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
    isDragging 
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

  // Trigger camera rotation, orbit target, and distance when a garment is selected
  useEffect(() => {
    // Detect if selection STATE changed (entering/exiting) vs switching between garments
    const isEnteringSelection = hasSelection && !prevHasSelectionRef.current;
    const isExitingSelection = !hasSelection && prevHasSelectionRef.current;
    const isSwitchingGarments = hasSelection && prevHasSelectionRef.current;
    prevHasSelectionRef.current = hasSelection;

    if (selectedIndex !== -1) {
      const selectedGarmentData = garmentData[selectedIndex];
      if (selectedGarmentData) {
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
          setTargetDistance(SELECTED_CAMERA_DISTANCE);
        } else if (isSwitchingGarments) {
          // Switching garments: queue distance correction AFTER target/azimuth animations complete
          // This prevents distance drift caused by the orbit target animation
          setQueuedDistanceCorrection(SELECTED_CAMERA_DISTANCE);
        }
      }
    } else if (isExitingSelection) {
      // Exiting selection - return orbit target to origin and camera to default distance
      setTargetOrbitTarget(new THREE.Vector3(0, 0, 0));
      setTargetDistance(DEFAULT_CAMERA_DISTANCE);
    }
  }, [selectedIndex, garmentData, hasSelection, setTargetAzimuthalAngle, setTargetOrbitTarget, setTargetDistance, setQueuedDistanceCorrection]);

  return (
    <>
      <OrbitingGroup 
        orbitSpeed={ORBIT_SPEED} 
        isPaused={hasSelection}
        isDragging={isDragging}
        rotationRef={carouselRotationRef}
      >
        {garments.map((garment, index) => (
          <Garment
            key={garment?.slug}
            garment={garment}
            initPosition={garmentData[index].position}
            initialRotationY={garmentData[index].initialRotationY}
            spinSpeed={hasSelection ? 0 : SPIN_SPEED}
            targetBoundingBox={targetBoundingBox}
            isSelected={index === selectedIndex}
            hasSelection={hasSelection}
            nonSelectedOpacity={NON_SELECTED_OPACITY}
            opacityTransitionSpeed={OPACITY_TRANSITION_SPEED}
          />
        ))}
      </OrbitingGroup>
    </>
  );
}
