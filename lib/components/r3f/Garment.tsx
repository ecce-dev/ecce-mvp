"use client"

import GlbModelLoader from "./GlbModelLoader"
import { GetGarmentsQuery } from "@/lib/gql/__generated__/graphql"
import * as THREE from 'three';


interface GarmentProps {
  garment: NonNullable<GetGarmentsQuery['garments']>['nodes'][0];
  initPosition: THREE.Vector3;
  scale?: number
}


export default function Garment({
  garment,
  initPosition,
  scale
}: GarmentProps) {
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
    <group position={initPosition} scale={scale}>
      <GlbModelLoader src={proxiedUrl} />
    </group>
  )
}
