"use client"

import { Suspense, useRef, useState } from "react";
import { Environment, OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { RefObject } from "react";
import * as THREE from 'three'
import OrbitControlsContext from "@/lib/components/r3f/OrbitControlsContext";


function CustomEnvironment(props: { environmentFilePath: string | string[] }) {
  return <>
    <Environment
      files={props.environmentFilePath}
      background
    />
  </>
}


export type CanvasWrapperProps = {
  environmentFilePath?: string | string[]
  controls?: {
    orbitControls?: {
      dampingFactor?: number
      panSpeed?: number
      rotateSpeed?: number
      target?: THREE.Vector3
      maxPolarAngle?: number
      minPolarAngle?: number
      enablePan?: boolean
      enableZoom?: boolean
      enableRotate?: boolean
      maxZoom?: number
      minZoom?: number
    }
  } | null
  initialCameraPosition?: THREE.Vector3
  maxCameraDistance?: number
  minCameraDistance?: number
  cameraFov?: number
  enableLights?: {
    ambient?: boolean
    directional?: boolean
  }
}

function CanvasWrapper({
  initialCameraPosition = new THREE.Vector3(0, 2, -15),
  controls = null,
  maxCameraDistance = 500,
  minCameraDistance = 1,
  enableLights = {
    ambient: true,
    directional: true
  },
  ...props
}: React.PropsWithChildren<CanvasWrapperProps>) {
  /**
   * Ref
   */
  const orbitRef = useRef<OrbitControlsImpl>(null!)
  const [orbitControlsRef, setOrbitControlsRef] = useState<RefObject<OrbitControlsImpl>>(orbitRef)
  const [isDragging, setIsDragging] = useState(false)


  return <>
    <OrbitControlsContext.Provider value={{ orbitControlsRef, setOrbitControlsRef, isDragging, setIsDragging }}>
      <Canvas
        shadows
        onContextMenu={(e) => e.nativeEvent.preventDefault()}
        id="canvas-wrapper"
        flat
        dpr={[1, 2]}
        camera={{
          fov: props.cameraFov ?? 60,
          near: 0.01,
          far: maxCameraDistance * 2,
          position: initialCameraPosition
        }}
        gl={{
          preserveDrawingBuffer: false,
          localClippingEnabled: true // required for uikit scrolling
        }}
      >
        {props.environmentFilePath ? <CustomEnvironment environmentFilePath={props.environmentFilePath} /> : null}
        {controls && controls.orbitControls && <OrbitControls
          ref={orbitControlsRef}
          makeDefault
          target={controls.orbitControls.target ?? new THREE.Vector3(0, 0, 0)}
          dampingFactor={controls.orbitControls.dampingFactor ?? 0.05}
          panSpeed={controls.orbitControls.panSpeed ?? 1}
          rotateSpeed={controls.orbitControls.rotateSpeed ?? 1}
          maxDistance={maxCameraDistance}
          minDistance={minCameraDistance}
          maxPolarAngle={controls.orbitControls.maxPolarAngle ?? Math.PI}
          minPolarAngle={controls.orbitControls.minPolarAngle ?? 0}
          enableZoom={controls.orbitControls.enableZoom ?? false}
          enablePan={controls.orbitControls.enablePan ?? false}
          enableRotate={controls.orbitControls.enableRotate ?? true}
          enableDamping={true}
          onStart={() => { setIsDragging(true) }}
          onEnd={() => { setIsDragging(false) }}
        />}
        {enableLights && <>
          {enableLights.ambient && <ambientLight intensity={0.42} />}
          {enableLights.directional && <directionalLight
            position={[0, 20, 0]}
            intensity={1.5}
            castShadow
            // shadow-mapSize={[2048, 2048]}
            shadow-camera-far={30}
            shadow-camera-left={-10}
            shadow-camera-right={10}
            shadow-camera-top={10}
            shadow-camera-bottom={-10}
          />}
        </>}
        <Suspense fallback={null}>
          {props.children}
        </Suspense>
      </Canvas>
    </OrbitControlsContext.Provider>
  </>
}

export default CanvasWrapper 