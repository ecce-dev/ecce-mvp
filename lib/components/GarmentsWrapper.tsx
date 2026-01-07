import { getGarments } from "../actions/getGarments";
import CanvasWrapper from "./r3f/CanvasWrapper";
import Garments from "./r3f/Garments";
import * as THREE from 'three';

export default async function GarmentsWrapper() {
  const result = await getGarments();
  return (
    <div className="fixed z-10 top-0 left-0 right-0 h-full w-full">
      <CanvasWrapper
        initialCameraPosition={new THREE.Vector3(0, 0, 15)}
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
        }}>
        <Garments garments={result?.garments?.nodes ?? []} />
      </CanvasWrapper>
    </div>
  )
}