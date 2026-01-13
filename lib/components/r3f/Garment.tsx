"use client"

import { useRef, useContext, useCallback } from "react"
import { useFrame, ThreeEvent } from "@react-three/fiber"
import NormalizedGlbModel, { TargetBoundingBox } from "./NormalizedGlbModel"
import { GetGarmentsQuery } from "@/lib/gql/__generated__/graphql"
import OrbitControlsContext from "./OrbitControlsContext"
import * as THREE from 'three';
import { useAppModeStore } from "@/lib/stores/appModeStore"


interface GarmentProps {
  garment: NonNullable<GetGarmentsQuery['garments']>['nodes'][0];
  initPosition: THREE.Vector3;
  /** Initial Y-axis rotation for facing direction (radians) */
  initialRotationY?: number;
  /** Speed of individual spin animation (radians per second), 0 to disable */
  spinSpeed?: number;
  /** Target bounding box for model normalization */
  targetBoundingBox: TargetBoundingBox;
}


export default function Garment({
  garment,
  initPosition,
  initialRotationY = 0,
  spinSpeed = 0,
  targetBoundingBox
}: GarmentProps) {
  const groupRef = useRef<THREE.Group>(null!);
  const { isDragging } = useContext(OrbitControlsContext);
  const selectGarment = useAppModeStore((state) => state.selectGarment);

  // Individual spin animation (pauses when orbit controls are dragging)
  useFrame((_, delta) => {
    if (groupRef.current && spinSpeed !== 0 && !isDragging) {
      groupRef.current.rotation.y += spinSpeed * delta;
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
   */
  const handleClick = useCallback((event: ThreeEvent<MouseEvent>) => {
    // Stop propagation to prevent multiple garments from being selected
    event.stopPropagation();
    selectGarment(garment);
  }, [garment, selectGarment]);

  /**
   * Handle pointer enter - show cursor pointer
   */
  const handlePointerEnter = useCallback(() => {
    document.body.style.cursor = "pointer";
  }, []);

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
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
    >
      <group ref={groupRef}>
        <NormalizedGlbModel
          src={proxiedUrl}
          targetBoundingBox={targetBoundingBox}
        />
      </group>
    </group>
  )
}
