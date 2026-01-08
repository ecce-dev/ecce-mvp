"use client"

import { useRef, useMemo, useContext } from "react";
import { useFrame } from "@react-three/fiber";
import { GetGarmentsQuery } from "@/lib/gql/__generated__/graphql";
import Garment from "./Garment";
import { useResponsiveScale } from "@/lib/hooks/useResponsiveScale";
import { useDevice } from "@/lib/hooks/useDevice";
import { TargetBoundingBox } from "./NormalizedGlbModel";
import OrbitControlsContext from "./OrbitControlsContext";
import * as THREE from 'three';
import { Stage } from "@react-three/drei";

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

interface GarmentsProps {
  garments: NonNullable<GetGarmentsQuery['garments']>['nodes'];
}

interface OrbitingGroupProps {
  children: React.ReactNode;
  orbitSpeed: number;
}

/**
 * Rotating carousel group that orbits all garments around the Y-axis.
 * Pauses rotation when orbit controls are being dragged.
 */
function OrbitingGroup({ children, orbitSpeed }: OrbitingGroupProps) {
  const groupRef = useRef<THREE.Group>(null!);
  const { isDragging } = useContext(OrbitControlsContext);

  useFrame((_, delta) => {
    // Only rotate when not dragging with orbit controls
    if (groupRef.current && !isDragging) {
      groupRef.current.rotation.y += orbitSpeed * delta;
    }
  });

  return <group ref={groupRef}>{children}</group>;
}

export default function Garments({ garments }: GarmentsProps) {
  const garmentCount = garments.length;

  // Get responsive scale factor (1.0 at desktop, 0.5 at mobile, interpolated between)
  const responsiveScale = useResponsiveScale();

  // Get device type for stepped orbit radius
  const { deviceType } = useDevice();

  // Get orbit radius based on device type (uses specific values per breakpoint)
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

  // Calculate other responsive values using scale factor
  const { yOffset, targetBoundingBox } = useMemo(() => ({
    yOffset: DESKTOP_Y_OFFSET * responsiveScale,
    targetBoundingBox: {
      x: DESKTOP_BOUNDING_BOX.x * responsiveScale,
      y: DESKTOP_BOUNDING_BOX.y * responsiveScale,
      z: DESKTOP_BOUNDING_BOX.z * responsiveScale,
    }
  }), [responsiveScale]);

  return (
    <>
      <OrbitingGroup orbitSpeed={ORBIT_SPEED}>
        {garments.map((garment, index) => {
          // Calculate angle for equal spacing around the circle
          const angle = (2 * Math.PI / garmentCount) * index;

          // Position on the circle (XZ plane, rotating around Y)
          const x = orbitRadius * Math.sin(angle);
          const z = orbitRadius * Math.cos(angle);
          const initPosition = new THREE.Vector3(x, yOffset, z);

          // Calculate initial rotation based on facing preference
          const initialRotationY = GARMENT_FACING === 'outward'
            ? angle  // Face outward from center
            : angle + Math.PI / 2;  // Face direction of travel

          return (
            <Garment
              key={garment?.slug}
              garment={garment}
              initPosition={initPosition}
              initialRotationY={initialRotationY}
              spinSpeed={SPIN_SPEED}
              targetBoundingBox={targetBoundingBox}
            />
          );
        })}
      </OrbitingGroup>
    </>
  );
}