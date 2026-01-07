"use client"

import { useRef, useContext } from "react"
import { useFrame } from "@react-three/fiber"
import NormalizedGlbModel, { TargetBoundingBox } from "./NormalizedGlbModel"
import { GetGarmentsQuery } from "@/lib/gql/__generated__/graphql"
import OrbitControlsContext from "./OrbitControlsContext"
import * as THREE from 'three';
import { Float } from "@react-three/drei"


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

  const glbUrl = garment.garmentFields?.threeDFileGlb?.node?.mediaItemUrl;
  if (!glbUrl) return null;
  const proxiedUrl = getProxiedUrl(glbUrl);

  return (
    <group position={initPosition} rotation={[0, initialRotationY, 0]}>
      <group ref={groupRef}>
        <NormalizedGlbModel
          src={proxiedUrl}
          targetBoundingBox={targetBoundingBox}
        />
      </group>
    </group>
  )
}
