"use client"

import { useRef, useContext, useCallback, useState } from "react"
import { useFrame, ThreeEvent, ThreeElements } from "@react-three/fiber"
import NormalizedGlbModel, { TargetBoundingBox } from "./NormalizedGlbModel"
import { GetGarmentsQuery } from "@/lib/gql/__generated__/graphql"
import OrbitControlsContext from "./OrbitControlsContext"
import * as THREE from 'three';
import { useAppModeStore } from "@/lib/stores/appModeStore"


type GarmentProps = {
  garment: NonNullable<GetGarmentsQuery['garments']>['nodes'][0];
  initPosition: THREE.Vector3;
  /** Initial Y-axis rotation for facing direction (radians) */
  initialRotationY?: number;
  /** Speed of individual spin animation (radians per second), 0 to disable */
  spinSpeed?: number;
  /** Target bounding box for model normalization */
  targetBoundingBox: TargetBoundingBox;
  /** Whether this garment is currently selected */
  isSelected: boolean;
  /** Whether any garment is currently selected */
  hasSelection: boolean;
  /** Opacity for non-selected garments (0-1) */
  nonSelectedOpacity: number;
  /** Speed of opacity transition (higher = faster) */
  opacityTransitionSpeed: number;
} & ThreeElements['group']


export default function Garment({
  garment,
  initPosition,
  initialRotationY = 0,
  spinSpeed = 0,
  targetBoundingBox,
  isSelected,
  hasSelection,
  nonSelectedOpacity,
  opacityTransitionSpeed,
  ...props
}: GarmentProps) {
  const groupRef = useRef<THREE.Group>(null!);
  const meshGroupRef = useRef<THREE.Group>(null!);
  const { isDragging } = useContext(OrbitControlsContext);
  const selectGarment = useAppModeStore((state) => state.selectGarment);

  // Track current opacity for smooth transitions
  const [currentOpacity, setCurrentOpacity] = useState(1);

  // Calculate target opacity based on selection state
  const targetOpacity = hasSelection 
    ? (isSelected ? 1 : nonSelectedOpacity) 
    : 1;

  // Individual spin animation (pauses when orbit controls are dragging)
  useFrame((_, delta) => {
    // Spin animation (spinSpeed controls whether to spin - 0 disables, selected garment gets its own speed)
    if (groupRef.current && spinSpeed !== 0 && !isDragging) {
      groupRef.current.rotation.y += spinSpeed * delta;
    }

    // Opacity animation
    const diff = targetOpacity - currentOpacity;
    if (Math.abs(diff) > 0.01) {
      const newOpacity = THREE.MathUtils.lerp(
        currentOpacity,
        targetOpacity,
        delta * opacityTransitionSpeed
      );
      setCurrentOpacity(newOpacity);
      
      // Apply opacity to all meshes in the group
      if (meshGroupRef.current) {
        meshGroupRef.current.traverse((child) => {
          if (child instanceof THREE.Mesh && child.material) {
            const material = child.material as THREE.Material;
            if ('opacity' in material) {
              material.transparent = true;
              material.opacity = newOpacity;
              material.needsUpdate = true;
            }
          }
        });
      }
    }
  });

  /**
   * Converts WordPress media URLs to proxied paths to avoid CORS issues.
   * e.g., https://admin.ecce.ing/wp-content/uploads/2026/01/file.glb
   *   ->  /wp-content/uploads/2026/01/file.glb
   */
  function getProxiedUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      // Return just the pathname to use our Next.js rewrite proxy
      return urlObj.pathname;
    } catch {
      // If URL parsing fails, return original
      return url;
    }
  }

  /**
   * Handle garment click - select this garment
   * Allows clicking on any garment, even when another is selected (switches selection)
   */
  const handleClick = useCallback((event: ThreeEvent<MouseEvent>) => {
    // Stop propagation to prevent multiple garments from being selected
    event.stopPropagation();
    
    // Don't re-select already selected garment
    if (isSelected) return;
    
    selectGarment(garment);
  }, [garment, selectGarment, isSelected]);

  /**
   * Handle pointer enter - show cursor pointer
   * Shows pointer on all garments except the currently selected one
   */
  const handlePointerEnter = useCallback(() => {
    if (!isSelected) {
      document.body.style.cursor = "pointer";
    }
  }, [isSelected]);

  /**
   * Handle pointer leave - reset cursor
   */
  const handlePointerLeave = useCallback(() => {
    document.body.style.cursor = "auto";
  }, []);

  const glbUrl = garment.garmentFields?.threeDFileGlb?.node?.mediaItemUrl;
  if (!glbUrl) return null;
  const proxiedUrl = getProxiedUrl(glbUrl);

  return (
    <group 
      position={initPosition}
      rotation={[0, initialRotationY, 0]}
      onClick={handleClick}
      // onPointerEnter={handlePointerEnter}
      // onPointerLeave={handlePointerLeave}
      {...props}
    >
      <group ref={groupRef}>
        <group ref={meshGroupRef}>
          <NormalizedGlbModel
            src={proxiedUrl}
            targetBoundingBox={targetBoundingBox}
          />
        </group>
      </group>
    </group>
  )
}
