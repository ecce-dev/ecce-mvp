import { RefObject, createContext } from "react";
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'

type OrbitControlsContextType = {
  orbitControlsRef: RefObject<OrbitControlsImpl> | null
  setOrbitControlsRef: Function
  isDragging: boolean
  setIsDragging: Function
}
const OrbitControlsContext = createContext<OrbitControlsContextType>({
  orbitControlsRef: null,
  setOrbitControlsRef: (_: RefObject<OrbitControlsImpl>) => {},
  isDragging: false,
  setIsDragging: (_: boolean) => {}
});

export default OrbitControlsContext