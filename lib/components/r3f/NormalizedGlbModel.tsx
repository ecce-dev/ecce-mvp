"use client"

import { useMemo } from "react"
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
 * 
 * Note: Centering is applied directly during clone to ensure correct positioning
 * on the first render (avoids useEffect timing issues).
 */
export default function NormalizedGlbModel({ src, targetBoundingBox }: NormalizedGlbModelProps) {
  const { scene } = useGLTF(src);

  // Clone scene, calculate transforms, and apply centering in one pass
  // This ensures the model is correctly positioned on the very first render
  const { clonedScene, scale } = useMemo(() => {
    // Clone the scene to avoid mutating the cached original
    const clone = scene.clone();
    
    // Compute bounding box of the model
    const bbox = new THREE.Box3().setFromObject(clone);
    
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

    // Apply center offset directly to the clone's position
    // This moves the model's center to the origin immediately (no useEffect delay)
    clone.position.set(-modelCenter.x, -modelCenter.y, -modelCenter.z);

    return {
      clonedScene: clone,
      scale: uniformScale
    };
  }, [scene, targetBoundingBox]);

  return (
    <group scale={scale}>
      <primitive object={clonedScene} />
    </group>
  );
}

/**
 * Preload a GLB file for better performance
 */
NormalizedGlbModel.preload = useGLTF.preload;

