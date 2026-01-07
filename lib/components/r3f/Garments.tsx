import { GetGarmentsQuery } from "@/lib/gql/__generated__/graphql";
import Garment from "./Garment";
import * as THREE from 'three';

interface GarmentsProps {
  garments: NonNullable<GetGarmentsQuery['garments']>['nodes'];
}

export default function Garments({ garments }: GarmentsProps) {
  return (
    <group>
      {garments.map((garment, index) => {
        const initPosition = new THREE.Vector3(index * 3 - 3, -3, 0);
        return <Garment
          key={garment?.slug}
          garment={garment}
          initPosition={initPosition}
          scale={3}
        />;
      })}
    </group>
  )
}