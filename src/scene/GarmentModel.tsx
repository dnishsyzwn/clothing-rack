import { useEffect, useMemo } from "react";
import { useGLTF, useTexture } from "@react-three/drei";
import {
  CatmullRomCurve3,
  Color,
  DoubleSide,
  Mesh,
  MeshPhysicalMaterial,
  RepeatWrapping,
  Vector2,
  Vector3,
} from "three";
import type { GarmentKind } from "../data/garments";

const FABRIC_MAPS = [
  "/textures/fabric/technicalFabricSmall_normal_256.png",
  "/textures/fabric/technicalFabricSmall_orm_256.png",
  "/textures/fabric/technicalFabricSmall_sheen_256.png",
];

// Perpendicular to the rail. The hook's inner top contacts the 0.026-radius rod;
// its stem ends at the imported shoulder support's swivel, y=-0.30.
const hookCurve = new CatmullRomCurve3([
  new Vector3(0, -0.3, 0),
  new Vector3(0, -0.19, 0),
  new Vector3(0, -0.125, -0.065),
  new Vector3(0, -0.045, -0.09),
  new Vector3(0, 0.025, -0.05),
  new Vector3(0, 0.038, 0.005),
  new Vector3(0, 0.005, 0.075),
  new Vector3(0, -0.065, 0.085),
  new Vector3(0, -0.105, 0.055),
]);

export function HangerHook() {
  return (
    <mesh castShadow>
      <tubeGeometry args={[hookCurve, 48, 0.011, 10, false]} />
      <meshStandardMaterial color="#9c9d95" metalness={0.94} roughness={0.26} />
    </mesh>
  );
}

/** Authored cloth-simulation meshes, including their fitted shoulder supports. */
export default function GarmentModel({
  kind,
  color,
}: {
  kind: GarmentKind;
  color: string;
}) {
  const { scene } = useGLTF(`/models/${kind}.glb`);
  const sourceMaps = useTexture(FABRIC_MAPS);
  const maps = useMemo(
    () =>
      sourceMaps.map((source) => {
        const map = source.clone();
        map.wrapS = map.wrapT = RepeatWrapping;
        map.repeat.set(64, 64);
        map.anisotropy = 8;
        map.needsUpdate = true;
        return map;
      }),
    [sourceMaps],
  );
  const fabric = useMemo(
    () =>
      new MeshPhysicalMaterial({
        name: "StudioFabric",
        color,
        roughness: 0.96,
        metalness: 0,
        normalMap: maps[0],
        normalScale: new Vector2(0.09, 0.09),
        roughnessMap: maps[1],
        sheen: 0.45,
        sheenColor: new Color("#ede8da"),
        sheenColorMap: maps[2],
        sheenRoughness: 0.8,
        sheenRoughnessMap: maps[2],
        side: DoubleSide,
      }),
    [color, maps],
  );
  const garment = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((object) => {
      if (!(object instanceof Mesh)) return;
      object.castShadow = true;
      object.receiveShadow = true;
      if (object.name === "GarmentFabric") object.material = fabric;
    });
    return clone;
  }, [scene, fabric]);
  useEffect(
    () => () => {
      fabric.dispose();
      maps.forEach((map) => map.dispose());
    },
    [fabric, maps],
  );
  // Cached source geometry is shared by both tee colorways.
  return <primitive object={garment} dispose={null} />;
}

useGLTF.preload("/models/tee.glb");
useGLTF.preload("/models/long-sleeve.glb");
useGLTF.preload("/models/trousers.glb");
