"use client"

import { useRef, useContext, useCallback } from "react"
import { useFrame, ThreeEvent, ThreeElements } from "@react-three/fiber"
import NormalizedGlbModel, { TargetBoundingBox } from "./NormalizedGlbModel"
import { GetGarmentsQuery } from "@/lib/gql/__generated__/graphql"
import OrbitControlsContext from "./OrbitControlsContext"
import * as THREE from 'three';
import { useAppModeStore } from "@/lib/stores/appModeStore"
import { Html } from "@react-three/drei"
import { getLicenseContent } from "../ui-elements/UIElementsShared"
import { animated, useSpring } from "@react-spring/web"


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
  const selectedGarment = useAppModeStore((state) => state.selectedGarment);
  const groupRef = useRef<THREE.Group>(null!);
  const meshGroupRef = useRef<THREE.Group>(null!);
  const { isDragging } = useContext(OrbitControlsContext);
  const selectGarment = useAppModeStore((state) => state.selectGarment);
  const publicDomainTextContent = useAppModeStore((state) => state.publicDomainTextContent);
  const showGarmentCopyright = useAppModeStore((state) => state.showGarmentCopyright);

  // Track current opacity using ref to avoid React re-renders
  // State updates in useFrame cause excessive re-renders and RSC payload requests
  // Using ref allows smooth animation without triggering React re-renders
  const currentOpacityRef = useRef(1);

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

    // Opacity animation - using ref to avoid React state updates
    const currentOpacity = currentOpacityRef.current;
    const diff = targetOpacity - currentOpacity;
    if (Math.abs(diff) > 0.01) {
      const newOpacity = THREE.MathUtils.lerp(
        currentOpacity,
        targetOpacity,
        delta * opacityTransitionSpeed
      );
      currentOpacityRef.current = newOpacity;

      // Apply opacity directly to materials without triggering React re-renders
      if (meshGroupRef.current) {
        meshGroupRef.current.traverse((child) => {
          if (child instanceof THREE.Mesh && child.material) {
            const material = child.material as THREE.Material;
            if ('opacity' in material) {
              material.transparent = true;
              material.opacity = newOpacity;
              material.needsUpdate = true;
              material.visible = newOpacity > 0;
            }
          }
        });
      }
    } else if (currentOpacity !== targetOpacity) {
      // Snap to target when close enough
      currentOpacityRef.current = targetOpacity;
      if (meshGroupRef.current) {
        meshGroupRef.current.traverse((child) => {
          if (child instanceof THREE.Mesh && child.material) {
            const material = child.material as THREE.Material;
            if ('opacity' in material) {
              material.transparent = true;
              material.opacity = targetOpacity;
              material.needsUpdate = true;
              material.visible = targetOpacity > 0;
            }
          }
        });
      }
    }
  });

  /**
   * Converts WordPress media URLs to proxied paths to avoid CORS issues.
   * e.g., https://archive.ecce.ing/wp-content/uploads/2026/01/file.glb
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

    // return if a garment is already selected
    if (selectedGarment !== null) return

    // Don't re-select already selected garment
    if (isSelected) return;

    selectGarment(garment);
  }, [garment, selectGarment, selectedGarment, isSelected]);

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


  const garmentCopyrightOpacitySpring = useSpring({
    opacity: showGarmentCopyright ? 1 : 0,
    config: { tension: 2100, friction: 210 },
  })

  return (
    <group
      position={initPosition}
      rotation={[0, initialRotationY, 0]}
      onClick={handleClick}
      // onPointerEnter={handlePointerEnter}
      // onPointerLeave={handlePointerLeave}
      {...props}
    >
      <Html>
        <animated.div
          style={garmentCopyrightOpacitySpring}
          className="bg-background/70 border border-foreground p-8 overflow-y-auto w-full min-w-[280px] md:min-w-[350px] lg:min-w-[420px] translate-x-[-50%] translate-y-[-50%] flex flex-col gap-2"
        >
          <span className="font-zangezi uppercase" dangerouslySetInnerHTML={{ __html: garment.garmentFields?.name ?? "" }} />
          <span className="text-sm">
            {getLicenseContent(garment.garmentFields?.publicDomain ?? false, garment.garmentFields?.rights ?? "", publicDomainTextContent)}
          </span>
        </animated.div>
      </Html>
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
