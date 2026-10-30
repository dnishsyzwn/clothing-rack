import {
  BufferGeometry,
  CanvasTexture,
  Float32BufferAttribute,
  RepeatWrapping,
  Shape,
  ShapeUtils,
  Vector2,
} from "three";
import { mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";
import type { GarmentKind } from "../data/garments";

// Original garment silhouettes. Every surface, fold, and texture is authored here.
export function garmentShape(kind: GarmentKind): Shape {
  const s = new Shape();
  if (kind === "trousers") {
    s.moveTo(-0.64, -0.64);
    s.quadraticCurveTo(0, -0.71, 0.64, -0.64);
    s.bezierCurveTo(0.73, -1.15, 0.78, -1.3, 0.7, -1.9);
    s.lineTo(0.68, -3.63);
    s.quadraticCurveTo(0.47, -3.69, 0.25, -3.64);
    s.lineTo(0.11, -1.72);
    s.quadraticCurveTo(0, -1.51, -0.1, -1.72);
    s.lineTo(-0.23, -3.63);
    s.quadraticCurveTo(-0.48, -3.68, -0.73, -3.61);
    s.lineTo(-0.72, -1.75);
    s.quadraticCurveTo(-0.8, -1.25, -0.64, -0.64);
  } else {
    const puff = kind === "puffer";
    const shirt = kind === "overshirt";
    const hem = puff ? -2.55 : shirt ? -2.74 : -2.64;
    s.moveTo(-0.23, -0.59);
    s.quadraticCurveTo(-0.4, -0.58, -0.66, -0.72);
    s.bezierCurveTo(-0.83, -0.86, -0.96, -1.55, -1.12, -2.22);
    s.quadraticCurveTo(-1.01, -2.31, -0.85, -2.27);
    s.lineTo(-0.59, -1.49);
    s.quadraticCurveTo(-0.6, -2.02, -0.63, hem + 0.08);
    s.quadraticCurveTo(-0.46, hem - 0.05, 0.01, hem);
    s.quadraticCurveTo(0.47, hem - 0.05, 0.64, hem + 0.06);
    s.lineTo(0.6, -1.5);
    s.lineTo(0.87, -2.27);
    s.quadraticCurveTo(1.01, -2.29, 1.13, -2.19);
    s.bezierCurveTo(0.99, -1.54, 0.85, -0.86, 0.66, -0.72);
    s.quadraticCurveTo(0.42, -0.59, 0.23, -0.59);
    s.quadraticCurveTo(0, puff ? -0.67 : -0.81, -0.23, -0.59);
  }
  s.closePath();
  return s;
}

export function surfaceDepth(kind: GarmentKind, x: number, y: number): number {
  const body = Math.abs(x) < 0.64;
  let depth =
    kind === "puffer" ? (body ? 0.19 : 0.14) : kind === "knit" ? 0.095 : 0.085;
  if (kind === "puffer") {
    const wave = Math.sin(((y + 0.59) * Math.PI) / 0.33);
    depth += Math.pow(Math.abs(wave), 0.7) * 0.075;
  } else if (kind === "trousers") {
    depth += 0.023 * Math.cos(x * 25 + Math.sin(y * 4) * 0.8);
    depth += 0.012 * Math.sin(y * 19 + x * 6);
  } else {
    depth += 0.012 * Math.sin(x * 19 + y * 3);
    depth += 0.009 * Math.sin(y * 14 + x * 8);
    const armpit = Math.exp(-Math.pow((y + 1.45) * 3, 2));
    depth += armpit * 0.02 * Math.sin(x * 23 + y * 15);
    depth += 0.008 * Math.cos(x * 35 + y * 5);
  }
  return depth;
}

function distanceToOutline(p: Vector2, outline: Vector2[]): number {
  let min = Infinity;
  for (let i = 0; i < outline.length; i++) {
    const a = outline[i],
      b = outline[(i + 1) % outline.length];
    const dx = b.x - a.x,
      dy = b.y - a.y;
    const t = Math.max(
      0,
      Math.min(
        1,
        ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy || 1),
      ),
    );
    min = Math.min(min, Math.hypot(p.x - a.x - t * dx, p.y - a.y - t * dy));
  }
  return min;
}

const outlines = new Map<GarmentKind, Vector2[]>();
function getOutline(kind: GarmentKind) {
  if (!outlines.has(kind)) outlines.set(kind, garmentShape(kind).getPoints(16));
  return outlines.get(kind)!;
}

export function surfaceZ(kind: GarmentKind, x: number, y: number) {
  const edge = Math.min(
    1,
    distanceToOutline(new Vector2(x, y), getOutline(kind)) /
      (kind === "puffer" ? 0.105 : 0.055),
  );
  return (
    surfaceDepth(kind, x, y) * Math.sqrt(Math.max(0, 1 - Math.pow(1 - edge, 2)))
  );
}

// Clip a silhouette to small grid cells so the sculpt has uniform mesh density.
// Long, skinny triangles from a simple outline triangulation cause visible folds.
function clipToCell(
  outline: Vector2[],
  left: number,
  bottom: number,
  size: number,
) {
  let polygon = outline;
  for (const [axis, limit, keepGreater] of [
    [0, left, true],
    [0, left + size, false],
    [1, bottom, true],
    [1, bottom + size, false],
  ] as const) {
    const input = polygon;
    polygon = [];
    if (!input.length) break;
    for (let i = 0; i < input.length; i++) {
      const a = input[i],
        b = input[(i + 1) % input.length];
      const av = axis === 0 ? a.x : a.y,
        bv = axis === 0 ? b.x : b.y;
      const aIn = keepGreater ? av >= limit - 1e-9 : av <= limit + 1e-9;
      const bIn = keepGreater ? bv >= limit - 1e-9 : bv <= limit + 1e-9;
      if (aIn) polygon.push(a);
      if (aIn !== bIn) {
        const t = (limit - av) / (bv - av);
        polygon.push(new Vector2(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t));
      }
    }
  }
  return polygon.filter(
    (point, i) =>
      point.distanceToSquared(polygon[(i + 1) % polygon.length]) > 1e-12,
  );
}

/** Sculpt uniformly tessellated front/back panels and weld the closed perimeter. */
export function createGarmentGeometry(kind: GarmentKind): BufferGeometry {
  const outline = getOutline(kind);
  const points: Vector2[] = [];
  const cell = 0.048;
  for (let x = -1.2; x < 1.2; x += cell)
    for (let y = -3.7; y < -0.4; y += cell) {
      const polygon = clipToCell(outline, x, y, cell);
      if (polygon.length < 3) continue;
      const triangles = ShapeUtils.triangulateShape(polygon, []);
      for (const face of triangles) points.push(...face.map((i) => polygon[i]));
    }
  const coords: number[] = [],
    uvs: number[] = [];
  function vertex(p: Vector2, sign: number) {
    const z = surfaceZ(kind, p.x, p.y);
    coords.push(p.x, p.y, sign * z);
    uvs.push((p.x + 1.2) / 2.4, -p.y / 3.7);
  }
  for (let i = 0; i < points.length; i += 3) {
    vertex(points[i], 1);
    vertex(points[i + 1], 1);
    vertex(points[i + 2], 1);
    vertex(points[i + 2], -1);
    vertex(points[i + 1], -1);
    vertex(points[i], -1);
  }
  const raw = new BufferGeometry();
  raw.setAttribute("position", new Float32BufferAttribute(coords, 3));
  raw.setAttribute("uv", new Float32BufferAttribute(uvs, 2));
  const geometry = mergeVertices(raw, 0.0001);
  geometry.computeVertexNormals();
  raw.dispose();
  return geometry;
}

/** A deterministic, locally generated weave. No remote images or fonts. */
export function createFabricTexture(knit: boolean): CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext("2d")!;
  const pixels = ctx.createImageData(256, 256);
  let seed = 314159;
  for (let y = 0; y < 256; y++)
    for (let x = 0; x < 256; x++) {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      const grain = (seed / 4294967296 - 0.5) * 18;
      const weave = knit
        ? 18 * Math.cos((x * Math.PI) / 4 + Math.sin((y * Math.PI) / 6) * 0.8) +
          5 * Math.sin((y * Math.PI) / 3)
        : 9 * Math.sin(x * Math.PI) + 7 * Math.cos((y * Math.PI) / 2 + (x % 4));
      const v = 140 + grain + weave;
      const i = (y * 256 + x) * 4;
      pixels.data[i] = pixels.data[i + 1] = pixels.data[i + 2] = v;
      pixels.data[i + 3] = 255;
    }
  ctx.putImageData(pixels, 0, 0);
  const texture = new CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = RepeatWrapping;
  texture.repeat.set(knit ? 7 : 5, knit ? 9 : 6);
  texture.anisotropy = 4;
  return texture;
}
