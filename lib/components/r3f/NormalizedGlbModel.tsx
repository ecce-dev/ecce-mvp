"use client"

import { useEffect, useMemo, useRef } from "react"
import { useGLTF } from "@react-three/drei"
import * as THREE from 'three'

export interface TargetBoundingBox {
  x: number;
  y: number;
  z: number;
}

export interface NormalizedGlbModelProps {
  /** Path to the .glb file */
  src: string;
  /** Target bounding box dimensions to fit the model within */
  targetBoundingBox: TargetBoundingBox;
}

/**
 * Loads a GLB model and normalizes it to fit within the target bounding box.
 * The model is scaled uniformly (preserving aspect ratio) based on its largest dimension
 * and centered at the origin.
 */
export default function NormalizedGlbModel({ src, targetBoundingBox }: NormalizedGlbModelProps) {
  const { scene } = useGLTF(src);
  const groupRef = useRef<THREE.Group>(null!);
  
  // Clone the scene to avoid mutating the cached original
  const clonedScene = useMemo(() => scene.clone(), [scene]);

  // Calculate normalization transforms
  const { scale, centerOffset } = useMemo(() => {
    // Compute bounding box of the model
    const bbox = new THREE.Box3().setFromObject(clonedScene);
    
    // Get the size of the model in each dimension
    const modelSize = new THREE.Vector3();
    bbox.getSize(modelSize);
    
    // Get the center of the model
    const modelCenter = new THREE.Vector3();
    bbox.getCenter(modelCenter);

    // Calculate scale factors for each axis to fit within target bounding box
    const scaleX = modelSize.x > 0 ? targetBoundingBox.x / modelSize.x : 1;
    const scaleY = modelSize.y > 0 ? targetBoundingBox.y / modelSize.y : 1;
    const scaleZ = modelSize.z > 0 ? targetBoundingBox.z / modelSize.z : 1;

    // Use the smallest scale factor to ensure the model fits within ALL dimensions
    // (uniform scaling to preserve aspect ratio)
    const uniformScale = Math.min(scaleX, scaleY, scaleZ);

    // Calculate center offset to move model center to origin
    // We need to negate the center and scale it
    const centerOffset = modelCenter.clone().multiplyScalar(-1);

    return {
      scale: uniformScale,
      centerOffset
    };
  }, [clonedScene, targetBoundingBox]);

  // Apply the center offset to the scene's position
  useEffect(() => {
    if (groupRef.current) {
      // The inner group handles centering, outer handles scaling
      clonedScene.position.copy(centerOffset);
    }
  }, [clonedScene, centerOffset]);

  return (
    <group ref={groupRef} scale={scale}>
      <primitive object={clonedScene} />
    </group>
  );
}

/**
 * Preload a GLB file for better performance
 */
NormalizedGlbModel.preload = useGLTF.preload;

