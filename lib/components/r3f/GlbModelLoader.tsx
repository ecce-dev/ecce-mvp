"use client"

import { useGLTF } from "@react-three/drei"
import { ThreeElements } from "@react-three/fiber"

export type GlbModelLoaderProps = ThreeElements['group'] & {
  /** Path to the .glb file */
  src: string
}

/**
 * Loads and renders a GLB model
 * @param src - Path to the .glb file
 * @param props - Additional Three.js group props (position, rotation, scale, etc.)
 */
export default function GlbModelLoader({ src, ...props }: GlbModelLoaderProps) {
  const { scene } = useGLTF(src)

  return (
    <primitive object={scene.clone()} {...props} />
  )
}

/**
 * Preload a GLB file for better performance
 * Usage: Garment.preload('/path/to/model.glb')
 */
GlbModelLoader.preload = useGLTF.preload
