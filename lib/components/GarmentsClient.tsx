"use client"

import { useGarments } from "@/lib/context/GarmentsContext";
import { useProgress } from "@react-three/drei";
import CanvasWrapper from "./r3f/CanvasWrapper";
import Garments from "./r3f/Garments";
import LoadingScreen from "./LoadingScreen";
import * as THREE from 'three';

/**
 * Client component that renders the 3D garments canvas
 * 
 * Subscribes to GarmentsContext to receive:
 * - Current garments to display
 * - Loading state for visual feedback
 * 
 * The garments are automatically updated when:
 * - User clicks "Explore" button
 * - Device type changes (responsive count adjustment)
 * 
 * Shows a loading overlay when:
 * - Garment data is being fetched (isLoading from context)
 * - GLB 3D files are being loaded (active from useProgress)
 */
export default function GarmentsClient() {
  const { garments, isLoading: isDataLoading } = useGarments();
  const { active: isAssetsLoading } = useProgress();
  
  // Combined loading state: data fetching OR GLB files loading
  const isLoading = isDataLoading || isAssetsLoading;

  return (
    <>
      <LoadingScreen isLoading={isLoading} />
      
      <div className="fixed z-10 top-0 left-0 right-0 h-full w-full">
        <CanvasWrapper
          initialCameraPosition={new THREE.Vector3(0, 0, 19)}
          controls={{
            orbitControls: {
              target: new THREE.Vector3(0, 0, 0),
              dampingFactor: 0.05,
              panSpeed: 1,
              rotateSpeed: 1,
              enableZoom: true,
              enablePan: true,
              enableRotate: true,
            }
          }}
          enableLights={{
            ambient: true,
            directional: true
          }}
        >
          <Garments garments={garments} />
        </CanvasWrapper>
      </div>
    </>
  );
}

