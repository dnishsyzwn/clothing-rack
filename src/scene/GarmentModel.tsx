import { useEffect, useMemo } from "react";
import {
  CatmullRomCurve3,
  Color,
  DoubleSide,
  MeshPhysicalMaterial,
  Vector3,
} from "three";
import type { GarmentKind } from "../data/garments";
import {
  createFabricTexture,
  createGarmentGeometry,
  surfaceZ,
} from "./garmentGeometry";

type Point = [number, number, number];

export function Tube({
  points,
  radius = 0.01,
  color = "#454840",
  metalness = 0,
  roughness = 0.8,
}: {
  points: Point[];
  radius?: number;
  color?: string;
  metalness?: number;
  roughness?: number;
}) {
  const curve = useMemo(
    () => new CatmullRomCurve3(points.map((p) => new Vector3(...p))),
    [points],
  );
  return (
    <mesh castShadow>
      <tubeGeometry
        args={[curve, Math.max(12, points.length * 5), radius, 7, false]}
      />
      <meshStandardMaterial
        color={color}
        roughness={roughness}
        metalness={metalness}
      />
    </mesh>
  );
}

function Seam({
  kind,
  coords,
  back = false,
  color = "#64665a",
  radius = 0.004,
}: {
  kind: GarmentKind;
  coords: [number, number][];
  back?: boolean;
  color?: string;
  radius?: number;
}) {
  const points: Point[] = coords.map(([x, y]) => [
    x,
    y,
    (back ? -1 : 1) * (surfaceZ(kind, x, y) + 0.003),
  ]);
  return <Tube points={points} color={color} radius={radius} />;
}

function Button({
  x,
  y,
  kind,
  back = false,
  color = "#393d34",
}: {
  x: number;
  y: number;
  kind: GarmentKind;
  back?: boolean;
  color?: string;
}) {
  return (
    <mesh
      position={[x, y, (back ? -1 : 1) * (surfaceZ(kind, x, y) + 0.012)]}
      rotation={[Math.PI / 2, 0, 0]}
      castShadow
    >
      <cylinderGeometry args={[0.025, 0.025, 0.013, 16]} />
      <meshStandardMaterial color={color} roughness={0.5} />
    </mesh>
  );
}

function Pocket({
  kind,
  x,
  y,
  color,
  back = false,
  width = 0.33,
  height = 0.38,
}: {
  kind: GarmentKind;
  x: number;
  y: number;
  color: string;
  back?: boolean;
  width?: number;
  height?: number;
}) {
  const sign = back ? -1 : 1;
  const depth = surfaceZ(kind, x, y);
  return (
    <group>
      <mesh position={[x, y, sign * (depth + 0.004)]} castShadow>
        <boxGeometry args={[width, height, 0.011, 4, 4]} />
        <meshStandardMaterial color={color} roughness={1} />
      </mesh>
      <Seam
        kind={kind}
        back={back}
        color={color}
        coords={[
          [x - width / 2, y + height / 2],
          [x - width / 2, y - height / 2],
          [x + width / 2, y - height / 2],
          [x + width / 2, y + height / 2],
        ]}
      />
    </group>
  );
}

function Collar({ kind, color }: { kind: GarmentKind; color: string }) {
  if (kind === "trousers") return null;
  if (kind === "puffer")
    return (
      <group>
        <mesh
          position={[0, -0.63, -0.015]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={[1, 0.74, 1]}
          castShadow
        >
          <torusGeometry args={[0.25, 0.085, 12, 40]} />
          <meshStandardMaterial color={color} roughness={0.65} />
        </mesh>
        <Tube
          points={[
            [-0.3, -0.6, 0.03],
            [-0.26, -0.48, -0.05],
            [0, -0.45, -0.16],
            [0.26, -0.48, -0.05],
            [0.3, -0.6, 0.03],
          ]}
          radius={0.075}
          color={color}
        />
      </group>
    );
  if (kind === "knit")
    return (
      <>
        <Tube
          points={[
            [-0.235, -0.6, 0.005],
            [-0.18, -0.7, 0.035],
            [0, -0.735, 0.045],
            [0.18, -0.7, 0.035],
            [0.235, -0.6, 0.005],
          ]}
          radius={0.041}
          color={color}
        />
        <Tube
          points={[
            [-0.235, -0.6, -0.008],
            [0, -0.56, -0.035],
            [0.235, -0.6, -0.008],
          ]}
          radius={0.033}
          color={color}
        />
      </>
    );
  return (
    <group>
      {[-1, 1].map((sign) => (
        <mesh
          key={sign}
          position={[sign * 0.21, -0.72, 0.085]}
          rotation={[0.2, sign * -0.2, sign * -0.36]}
          castShadow
        >
          <boxGeometry args={[0.18, 0.25, 0.025]} />
          <meshStandardMaterial color={color} roughness={1} />
        </mesh>
      ))}
      <Tube
        points={[
          [-0.23, -0.59, -0.01],
          [0, -0.53, -0.09],
          [0.23, -0.59, -0.01],
        ]}
        radius={0.037}
        color={color}
      />
    </group>
  );
}

function PufferDetails({ color }: { color: string }) {
  const kind = "puffer";
  const seamColor = new Color(color).multiplyScalar(0.87).getStyle();
  return (
    <>
      {[false, true].map((back) => (
        <group key={String(back)}>
          {Array.from({ length: 5 }, (_, i) => -0.92 - i * 0.33).map((y) => (
            <Seam
              key={y}
              kind={kind}
              back={back}
              color={seamColor}
              radius={0.003}
              coords={[
                [-0.57, y],
                [-0.29, y - 0.005],
                [0, y - 0.006],
                [0.29, y - 0.005],
                [0.57, y],
              ]}
            />
          ))}
          {[-1, 1].map((side) =>
            Array.from({ length: 4 }, (_, i) => {
              const y = -1.12 - i * 0.29;
              const x = side * (0.75 + i * 0.058);
              return (
                <Seam
                  key={`${side}-${i}`}
                  kind={kind}
                  back={back}
                  color={seamColor}
                  coords={[
                    [x - 0.11, y + 0.04],
                    [x, y],
                    [x + 0.11, y - 0.04],
                  ]}
                />
              );
            }),
          )}
        </group>
      ))}
      <Seam
        kind={kind}
        color="#222720"
        radius={0.022}
        coords={[
          [0, -0.76],
          [0, -1.2],
          [0, -1.8],
          [0, -2.48],
        ]}
      />
      <Seam
        kind={kind}
        color="#8a8c7f"
        radius={0.006}
        coords={[
          [0, -0.79],
          [0, -1.2],
          [0, -1.8],
          [0, -2.47],
        ]}
      />
      <mesh position={[0.025, -0.93, 0.245]} castShadow>
        <boxGeometry args={[0.04, 0.085, 0.022]} />
        <meshStandardMaterial color="#a5a594" metalness={0.8} roughness={0.4} />
      </mesh>
      {[-1, 1].map((side) => (
        <Seam
          key={side}
          kind={kind}
          color="#252922"
          radius={0.011}
          coords={[
            [side * 0.36, -1.81],
            [side * 0.47, -2.12],
          ]}
        />
      ))}
    </>
  );
}

function ShirtDetails({ color }: { color: string }) {
  const dark = new Color(color).multiplyScalar(0.87).getStyle();
  return (
    <>
      {[-1, 1].map((side) => (
        <group key={side}>
          <Pocket
            kind="overshirt"
            x={side * 0.33}
            y={-1.19}
            color={dark}
            width={0.34}
            height={0.36}
          />
          <Seam
            kind="overshirt"
            color={dark}
            radius={0.013}
            coords={[
              [side * 0.33 - 0.17, -1.02],
              [side * 0.33, -1.03],
              [side * 0.33 + 0.17, -1.02],
            ]}
          />
          <Button kind="overshirt" x={side * 0.33} y={-1.07} />
        </group>
      ))}
      <Seam
        kind="overshirt"
        radius={0.017}
        color={color}
        coords={[
          [0, -0.83],
          [0, -1.3],
          [0, -1.9],
          [0, -2.67],
        ]}
      />
      {[-0.91, -1.26, -1.61, -1.96, -2.31, -2.61].map((y) => (
        <Button key={y} kind="overshirt" x={0} y={y} />
      ))}
      <Seam
        kind="overshirt"
        back
        color={dark}
        coords={[
          [-0.55, -0.92],
          [0, -0.99],
          [0.55, -0.92],
        ]}
      />
      <Seam
        kind="overshirt"
        back
        color={dark}
        coords={[
          [0, -1.0],
          [0, -1.25],
          [0, -1.6],
        ]}
      />
    </>
  );
}

function KnitDetails({ color }: { color: string }) {
  const dark = new Color(color).multiplyScalar(0.86).getStyle();
  return (
    <>
      {[false, true].map((back) => (
        <group key={String(back)}>
          <Seam
            kind="knit"
            back
            color={dark}
            radius={0.012}
            coords={[
              [-0.59, -2.48],
              [0, -2.53],
              [0.59, -2.48],
            ]}
          />
          {Array.from({ length: 38 }, (_, i) => -0.57 + i * 0.03).map((x) => (
            <Seam
              key={x}
              kind="knit"
              back
              color={color}
              radius={0.0045}
              coords={[
                [x, -2.53],
                [x * 0.99, -2.63],
              ]}
            />
          ))}
          {[-1, 1].map((side) => (
            <Seam
              key={side}
              kind="knit"
              back
              color={dark}
              radius={0.014}
              coords={[
                [side * 0.88, -2.12],
                [side * 0.99, -2.17],
                [side * 1.08, -2.16],
              ]}
            />
          ))}
        </group>
      ))}
    </>
  );
}

function TrouserDetails({ color }: { color: string }) {
  const dark = new Color(color).multiplyScalar(0.8).getStyle();
  return (
    <>
      {[false, true].map((back) => (
        <group key={String(back)}>
          <Seam
            kind="trousers"
            back
            color={dark}
            radius={0.023}
            coords={[
              [-0.61, -0.78],
              [0, -0.82],
              [0.62, -0.78],
            ]}
          />
          {[-0.5, -0.19, 0.21, 0.51].map((x) => (
            <Seam
              key={x}
              kind="trousers"
              back
              color={color}
              radius={0.017}
              coords={[
                [x, -0.66],
                [x, -0.85],
              ]}
            />
          ))}
          {[-1, 1].map((side) => (
            <Seam
              key={side}
              kind="trousers"
              back
              color={dark}
              coords={[
                [side * 0.68, -1.5],
                [side * 0.64, -2.4],
                [side * 0.65, -3.56],
              ]}
            />
          ))}
          {[-1, 1].map((side) => (
            <Seam
              key={`hem-${side}`}
              kind="trousers"
              back
              color={dark}
              radius={0.006}
              coords={[
                [side * 0.27, -3.55],
                [side * 0.46, -3.58],
                [side * 0.66, -3.55],
              ]}
            />
          ))}
        </group>
      ))}
      <Seam
        kind="trousers"
        color={dark}
        coords={[
          [0.02, -0.83],
          [0.07, -1.06],
          [0.03, -1.35],
          [-0.02, -1.46],
        ]}
      />
      <Button kind="trousers" x={0.035} y={-0.74} color="#afa895" />
      {[-1, 1].map((side) => (
        <group key={side}>
          <Seam
            kind="trousers"
            color={dark}
            coords={[
              [side * 0.43, -0.84],
              [side * 0.49, -1.05],
              [side * 0.65, -1.18],
            ]}
          />
          <Pocket
            kind="trousers"
            back
            x={side * 0.35}
            y={-1.17}
            color={dark}
            width={0.32}
            height={0.34}
          />
        </group>
      ))}
      <mesh position={[0.39, -0.73, -0.115]}>
        <boxGeometry args={[0.15, 0.1, 0.009]} />
        <meshStandardMaterial color="#a48e6a" roughness={1} />
      </mesh>
    </>
  );
}

export function HangerHook() {
  return (
    <Tube
      points={[
        [0, -0.25, 0],
        [0, -0.16, 0],
        [-0.07, -0.09, 0],
        [-0.09, 0.03, 0],
        [0, 0.095, 0],
        [0.095, 0.035, 0],
        [0.085, -0.025, 0],
      ]}
      radius={0.014}
      color="#777b70"
      metalness={0.85}
      roughness={0.3}
    />
  );
}

export function Hanger({ trousers = false }: { trousers?: boolean }) {
  const color = "#33352f";
  return (
    <>
      <Tube
        points={[
          [0, -0.25, 0],
          [-0.2, -0.35, 0],
          [-0.55, -0.49, 0],
          [-0.66, -0.57, 0],
          [-0.58, -0.6, 0],
          [0, -0.59, 0],
          [0.58, -0.6, 0],
          [0.66, -0.57, 0],
          [0.55, -0.49, 0],
          [0.2, -0.35, 0],
          [0, -0.25, 0],
        ]}
        radius={0.025}
        color={color}
      />
      {trousers &&
        [-0.49, 0.49].map((x) => (
          <mesh key={x} position={[x, -0.6, 0.035]} castShadow>
            <boxGeometry args={[0.085, 0.17, 0.075]} />
            <meshStandardMaterial
              color="#4e5249"
              metalness={0.7}
              roughness={0.4}
            />
          </mesh>
        ))}
    </>
  );
}

export default function GarmentModel({
  kind,
  color,
}: {
  kind: GarmentKind;
  color: string;
}) {
  const geometry = useMemo(() => createGarmentGeometry(kind), [kind]);
  const fabric = useMemo(() => createFabricTexture(kind === "knit"), [kind]);
  const material = useMemo(
    () =>
      new MeshPhysicalMaterial({
        color,
        roughness: kind === "puffer" ? 0.67 : 0.96,
        metalness: 0,
        bumpMap: fabric,
        bumpScale: kind === "knit" ? 0.018 : 0.008,
        side: DoubleSide,
        sheen: kind === "puffer" ? 0.3 : 0.65,
        sheenRoughness: 0.8,
        sheenColor: new Color(color).lerp(new Color("white"), 0.2),
      }),
    [color, fabric, kind],
  );
  useEffect(
    () => () => {
      geometry.dispose();
      fabric.dispose();
      material.dispose();
    },
    [geometry, fabric, material],
  );
  return (
    <group>
      <Hanger trousers={kind === "trousers"} />
      <mesh geometry={geometry} material={material} castShadow receiveShadow />
      <Collar kind={kind} color={color} />
      {kind === "puffer" && <PufferDetails color={color} />}
      {kind === "overshirt" && <ShirtDetails color={color} />}
      {kind === "knit" && <KnitDetails color={color} />}
      {kind === "trousers" && <TrouserDetails color={color} />}
    </group>
  );
}
