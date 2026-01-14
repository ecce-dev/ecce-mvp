import { RefObject, createContext } from "react";
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import * as THREE from 'three'

type OrbitControlsContextType = {
  /** Reference to the OrbitControls instance */
  orbitControlsRef: RefObject<OrbitControlsImpl> | null
  setOrbitControlsRef: (ref: RefObject<OrbitControlsImpl>) => void
  /** Whether user is currently dragging the orbit controls */
  isDragging: boolean
  setIsDragging: (dragging: boolean) => void
  /** Target azimuthal angle for camera rotation animation (null = no animation) */
  targetAzimuthalAngle: number | null
  setTargetAzimuthalAngle: (angle: number | null) => void
  /** Target position for OrbitControls to orbit around (null = no animation) */
  targetOrbitTarget: THREE.Vector3 | null
  setTargetOrbitTarget: (target: THREE.Vector3 | null) => void
  /** Target distance from camera to orbit target (null = no animation) */
  targetDistance: number | null
  setTargetDistance: (distance: number | null) => void
}

const OrbitControlsContext = createContext<OrbitControlsContextType>({
  orbitControlsRef: null,
  setOrbitControlsRef: () => {},
  isDragging: false,
  setIsDragging: () => {},
  targetAzimuthalAngle: null,
  setTargetAzimuthalAngle: () => {},
  targetOrbitTarget: null,
  setTargetOrbitTarget: () => {},
  targetDistance: null,
  setTargetDistance: () => {},
});

export default OrbitControlsContext
