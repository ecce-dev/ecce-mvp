"use client"

import { useGarments } from "@/lib/context/GarmentsContext";
import { ContactShadows, Environment, useProgress } from "@react-three/drei";
import CanvasWrapper from "./r3f/CanvasWrapper";
import Garments from "./r3f/Garments";
import LoadingScreen from "./LoadingScreen";
import * as THREE from 'three';
import { useDevice } from "../hooks/useDevice";

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
 * 
 * Features:
 * - Selection animation: Clicking a garment rotates camera to face it
 * - Opacity fade: Non-selected garments fade out when one is selected
 */
export default function GarmentsClient() {
  const { garments, isLoading: isDataLoading } = useGarments();
  const { active: isAssetsLoading } = useProgress();
  const { deviceType } = useDevice();

  // Combined loading state: data fetching OR GLB files loading
  const isLoading = isDataLoading || isAssetsLoading;

  const shadowRadius = deviceType === 'desktop' ? 21 : deviceType === 'tablet' ? 15 : 8;

  return (
    <>
      <LoadingScreen isLoading={isLoading} />

      <div className="fixed z-10 top-0 left-0 right-0 h-full w-full">
        <CanvasWrapper
          initialCameraPosition={new THREE.Vector3(0, 2, 19)}
          maxCameraDistance={42}
          minCameraDistance={4.2}
          controls={{
            orbitControls: {
              target: new THREE.Vector3(0, 0, 0),
              dampingFactor: 0.05,
              panSpeed: 1,
              rotateSpeed: 1,
              enableZoom: true,
              enablePan: true,
              enableRotate: true,
              maxPolarAngle: Math.PI / 2,
              minPolarAngle: 0,
            }
          }}
          enableLights={{
            ambient: false,
            directional: false
          }}
        >
          <Environment
            preset="studio"
          />
          <ContactShadows scale={shadowRadius * 4} position={[0, -5, 0]} far={shadowRadius} blur={2} />
          <Garments garments={garments} />
        </CanvasWrapper>
      </div>
    </>
  );
}
