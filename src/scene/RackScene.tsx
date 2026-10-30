import {
  Component,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import type { ThreeEvent } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer } from "@react-three/drei";
import { Group, MathUtils, Plane, Vector3 } from "three";
import { garments } from "../data/garments";
import type { GarmentKind } from "../data/garments";
import GarmentModel, { HangerHook } from "./GarmentModel";

export type RackSceneProps = {
  positions: number[];
  selected: number;
  hovered: number | null;
  back: boolean[];
  reducedMotion: boolean;
  onHover: (index: number | null) => void;
  onSelect: (index: number) => void;
  onMove: (index: number, x: number) => void;
  onToggle: (index: number) => void;
  onDrag: (index: number | null) => void;
  onReady: () => void;
};

class SceneBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? <SceneFallback /> : this.props.children;
  }
}

function FlatPiece({ kind, color }: { kind: GarmentKind; color: string }) {
  return (
    <svg viewBox="0 0 100 160" aria-hidden="true">
      <path
        d="M50 10c0-6 8-6 8 0s-8 4-8 12L24 35h52L50 22"
        fill="none"
        stroke="#50534a"
        strokeWidth="1.5"
      />
      {kind === "trousers" ? (
        <path d="M28 36h44l2 38-5 78H54l-4-70-4 70H29l-3-78z" fill={color} />
      ) : (
        <path
          d="m39 34-16 5-18 53 15 6 11-31-2 66q21 5 42 0l-2-66 11 31 15-6-18-53-16-5q-11 12-22 0"
          fill={color}
        />
      )}
    </svg>
  );
}

function SceneFallback() {
  return (
    <div className="scene-fallback">
      <div className="fallback-rail">
        {garments.map((g) => (
          <FlatPiece key={g.id} kind={g.kind} color={g.color} />
        ))}
      </div>
      <p>The studio is shown in still mode. Interactive 3D needs WebGL.</p>
    </div>
  );
}

function Ready({ onReady }: { onReady: () => void }) {
  const sent = useRef(false);
  useFrame(() => {
    if (!sent.current) {
      sent.current = true;
      onReady();
    }
  });
  return null;
}

function CameraRig({
  selected,
  positions,
  dragging,
  reducedMotion,
}: {
  selected: number;
  positions: number[];
  dragging: number | null;
  reducedMotion: boolean;
}) {
  const { camera, size, invalidate } = useThree();
  const initialized = useRef(false);
  const aspect = size.width / size.height;
  const mobile = size.width < 700;
  const viewWidth = mobile ? 5.0 : 12.6;
  const viewHeight = Math.max(5.0, viewWidth / aspect);
  const targetX = mobile ? MathUtils.clamp(positions[selected], -3.4, 3.4) : 0;
  const targetY = -1.18;
  useFrame((_, delta) => {
    const targetZ = viewHeight / (2 * Math.tan((27 * Math.PI) / 360));
    const d = reducedMotion ? 1 : 1 - Math.exp(-6 * Math.min(delta, 0.1));
    if (!initialized.current) {
      camera.position.x = targetX;
      initialized.current = true;
    }
    if (dragging === null)
      camera.position.x = MathUtils.lerp(camera.position.x, targetX, d);
    camera.position.y = targetY + 0.65;
    camera.position.z = targetZ;
    camera.lookAt(camera.position.x, targetY, 0);
    camera.updateProjectionMatrix();
    if (Math.abs(camera.position.x - targetX) > 0.001 && dragging === null)
      invalidate();
  });
  useEffect(() => {
    invalidate();
  }, [targetX, viewHeight, invalidate]);
  return null;
}

type PointerCaptureTarget = {
  setPointerCapture: (id: number) => void;
  releasePointerCapture: (id: number) => void;
};
type DragInfo = {
  index: number;
  pointerId: number;
  startX: number;
  startY: number;
  offset: number;
  moved: boolean;
  type: string;
  target: PointerCaptureTarget;
  heldBack: boolean;
  worldX: number;
  worldY: number;
};

function SceneContents(props: RackSceneProps) {
  const { gl, invalidate } = useThree();
  const drag = useRef<DragInfo | null>(null);
  const [dragging, setDragging] = useState<number | null>(null);
  const plane = useMemo(() => new Plane(new Vector3(0, 0, 1), -0.7), []);
  const hit = useMemo(() => new Vector3(), []);
  const latest = useRef(props);
  latest.current = props;

  const finish = useCallback(
    (cancelled = false) => {
      const current = drag.current;
      if (!current) return;
      drag.current = null;
      try {
        current.target.releasePointerCapture(current.pointerId);
      } catch {
        /* capture already released by browser */
      }
      setDragging(null);
      latest.current.onDrag(null);
      if (!cancelled && !current.moved && current.type !== "mouse")
        latest.current.onToggle(current.index);
      let nextHover: number | null = null;
      if (current.type === "mouse" && !cancelled) {
        const index = garments.findIndex(
          (g, i) =>
            Math.abs(current.worldX - latest.current.positions[i]) <
              (g.kind === "trousers" ? 0.725 : 1.115) &&
            Math.abs(current.worldY - (0.85 - (g.length + 0.4) / 2)) <
              (g.length - 0.35) / 2,
        );
        if (index !== -1) nextHover = index;
      }
      latest.current.onHover(nextHover);
      gl.domElement.style.cursor = "grab";
      invalidate();
    },
    [gl, invalidate],
  );

  useEffect(() => {
    const release = (e: PointerEvent) => {
      if (drag.current?.pointerId === e.pointerId)
        finish(e.type === "pointercancel");
    };
    const cancel = () => finish(true);
    window.addEventListener("pointerup", release);
    window.addEventListener("pointercancel", release);
    window.addEventListener("blur", cancel);
    window.addEventListener("resize", cancel);
    return () => {
      window.removeEventListener("pointerup", release);
      window.removeEventListener("pointercancel", release);
      window.removeEventListener("blur", cancel);
      window.removeEventListener("resize", cancel);
    };
  }, [finish]);

  const pointerDown = (index: number, event: ThreeEvent<PointerEvent>) => {
    if (drag.current || event.button !== 0) return;
    event.stopPropagation();
    event.ray.intersectPlane(plane, hit);
    const target = event.target as unknown as PointerCaptureTarget;
    drag.current = {
      index,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      offset: props.positions[index] - hit.x,
      moved: false,
      type: event.pointerType,
      target,
      heldBack: props.back[index] || props.hovered === index,
      worldX: hit.x,
      worldY: hit.y,
    };
    target.setPointerCapture(event.pointerId);
    props.onSelect(index);
    // Freeze the camera and inspection immediately, even before the drag threshold.
    setDragging(index);
    props.onDrag(index);
    gl.domElement.style.cursor = "grabbing";
  };

  const pointerMove = (event: ThreeEvent<PointerEvent>) => {
    const current = drag.current;
    if (!current || current.pointerId !== event.pointerId) return;
    event.stopPropagation();
    if (
      !current.moved &&
      Math.hypot(
        event.clientX - current.startX,
        event.clientY - current.startY,
      ) < 6
    )
      return;
    current.moved = true;
    if (event.ray.intersectPlane(plane, hit)) {
      current.worldX = hit.x;
      current.worldY = hit.y;
      props.onMove(current.index, hit.x + current.offset);
    }
    invalidate();
  };

  return (
    <>
      <CameraRig
        selected={props.selected}
        positions={props.positions}
        dragging={dragging}
        reducedMotion={props.reducedMotion}
      />
      <ambientLight intensity={0.65} />
      <hemisphereLight args={["#fffdf4", "#b3b4a7", 1.2]} />
      <directionalLight
        position={[-4, 7, 6]}
        intensity={2.5}
        color="#fffdf4"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-8}
        shadow-camera-right={8}
        shadow-camera-top={5}
        shadow-camera-bottom={-6}
        shadow-normalBias={0.035}
      />
      <directionalLight position={[5, 2, -3]} intensity={1.8} color="#e9ede5" />
      <Environment resolution={128}>
        <Lightformer
          form="rect"
          intensity={2}
          color="#fffdf4"
          scale={[8, 5, 1]}
          position={[-4, 4, 5]}
          rotation={[0, 0.5, 0]}
        />
        <Lightformer
          form="rect"
          intensity={1}
          color="#d7e1d6"
          scale={[5, 5, 1]}
          position={[5, 1, -2]}
          rotation={[0, -Math.PI / 2, 0]}
        />
      </Environment>
      <group position={[0, 0.85, 0]}>
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.026, 0.026, 30, 24]} />
          <meshStandardMaterial
            color="#62665d"
            metalness={0.94}
            roughness={0.26}
          />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]} position={[0, 0.014, 0.012]}>
          <cylinderGeometry args={[0.0035, 0.0035, 30, 8]} />
          <meshBasicMaterial color="#e5e7df" />
        </mesh>
        {garments.map((garment, index) => (
          <MovingGarment
            key={garment.id}
            index={index}
            x={props.positions[index]}
            kind={garment.kind}
            color={garment.color}
            back={
              drag.current?.index === index
                ? drag.current.heldBack
                : props.back[index] || props.hovered === index
            }
            reducedMotion={props.reducedMotion}
          >
            <mesh
              position={[0, -(garment.length + 0.4) / 2, 0.7]}
              onPointerOver={(event) => {
                event.stopPropagation();
                if (!drag.current && event.pointerType === "mouse") {
                  props.onHover(index);
                  gl.domElement.style.cursor = "grab";
                }
              }}
              onPointerOut={() => {
                if (!drag.current) {
                  props.onHover(null);
                  gl.domElement.style.cursor = "auto";
                }
              }}
              onPointerDown={(event) => pointerDown(index, event)}
              onPointerMove={pointerMove}
              onPointerUp={(event) => {
                if (drag.current?.pointerId === event.pointerId) {
                  event.stopPropagation();
                  finish();
                }
              }}
              onPointerCancel={() => finish(true)}
              onLostPointerCapture={() => {
                if (drag.current) finish(true);
              }}
            >
              <planeGeometry
                args={[
                  garment.kind === "trousers" ? 1.45 : 2.23,
                  garment.length - 0.35,
                ]}
              />
              <meshBasicMaterial
                transparent
                opacity={0}
                depthWrite={false}
                colorWrite={false}
              />
            </mesh>
          </MovingGarment>
        ))}
      </group>
      <ContactShadows
        position={[0, -3.2, 0]}
        opacity={0.26}
        scale={22}
        blur={2.8}
        far={5}
        resolution={256}
        color="#41463b"
        frames={Infinity}
      />
      <Ready onReady={props.onReady} />
    </>
  );
}

function MovingGarment({
  index,
  x,
  kind,
  color,
  back,
  reducedMotion,
  children,
}: {
  index: number;
  x: number;
  kind: GarmentKind;
  color: string;
  back: boolean;
  reducedMotion: boolean;
  children: ReactNode;
}) {
  const outer = useRef<Group>(null!);
  const pivot = useRef<Group>(null!);
  const previousX = useRef(x);
  const sway = useRef(0);
  const velocity = useRef(0);
  const { invalidate } = useThree();
  const initialX = useRef(x);
  useEffect(() => {
    invalidate();
  }, [x, back, reducedMotion, invalidate]);
  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const lerp = reducedMotion ? 1 : 1 - Math.exp(-12 * dt);
    outer.current.position.x = MathUtils.lerp(
      outer.current.position.x,
      x,
      lerp,
    );
    const movement = outer.current.position.x - previousX.current;
    previousX.current = outer.current.position.x;
    velocity.current += -sway.current * 65 * dt - movement * 0.55;
    velocity.current *= Math.exp(-7 * dt);
    sway.current = reducedMotion
      ? 0
      : MathUtils.clamp(sway.current + velocity.current * dt, -0.075, 0.075);
    pivot.current.rotation.z = sway.current;
    const target = back ? Math.PI : 0;
    pivot.current.rotation.y = reducedMotion
      ? target
      : MathUtils.damp(pivot.current.rotation.y, target, 7, dt);
    const active =
      Math.abs(outer.current.position.x - x) > 0.0001 ||
      Math.abs(pivot.current.rotation.y - target) > 0.0002 ||
      Math.abs(sway.current) > 0.0001 ||
      Math.abs(velocity.current) > 0.001;
    if (active) invalidate();
  });
  return (
    <group ref={outer} position={[initialX.current, 0, index * -0.012]}>
      <HangerHook />
      <group ref={pivot} position={[0, -0.25, 0]}>
        <group position={[0, 0.25, 0]}>
          <GarmentModel kind={kind} color={color} />
        </group>
      </group>
      {children}
    </group>
  );
}

export default function RackScene(props: RackSceneProps) {
  return (
    <SceneBoundary>
      <Canvas
        frameloop="demand"
        shadows="percentage"
        dpr={[1, 1.75]}
        camera={{ position: [0, -0.53, 14], fov: 27, near: 0.1, far: 80 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
        fallback={<SceneFallback />}
        onPointerMissed={() => props.onHover(null)}
        onCreated={({ gl }) => {
          gl.setClearColor("#e9e8e3", 0);
          gl.domElement.setAttribute("aria-hidden", "true");
        }}
      >
        <Suspense fallback={null}>
          <SceneContents {...props} />
        </Suspense>
      </Canvas>
    </SceneBoundary>
  );
}

export function HangerIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M10.5 6.5a2 2 0 1 1 2 2V11L3 17h18l-8.5-6"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}
