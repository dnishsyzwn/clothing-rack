import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { garments } from "../data/garments";

type Asset = {
  nodes: { name: string; mesh: number }[];
  meshes: { primitives: { attributes: { POSITION: number } }[] }[];
  accessors: { min: number[]; max: number[] }[];
  images?: unknown[];
};

describe("prepared clothing assets", () => {
  for (const kind of ["tee", "long-sleeve", "trousers"] as const) {
    it(`${kind} includes one fitted support and full-volume fabric, within its interaction bounds`, () => {
      const file = readFileSync(
        new URL(`../../public/models/${kind}.glb`, import.meta.url),
      );
      expect(file.toString("ascii", 0, 4)).toBe("glTF");
      const length = file.readUInt32LE(12);
      const asset = JSON.parse(file.toString("utf8", 20, 20 + length)) as Asset;
      expect(asset.nodes.map((node) => node.name).sort()).toEqual([
        "GarmentFabric",
        "HangerShoulders",
      ]);
      // No embedded source print/logo textures or extra preview hangers.
      expect(asset.images ?? []).toHaveLength(0);
      const bounds = (name: string) => {
        const node = asset.nodes.find((node) => node.name === name)!;
        return asset.accessors[
          asset.meshes[node.mesh].primitives[0].attributes.POSITION
        ];
      };
      const support = bounds("HangerShoulders"),
        fabric = bounds("GarmentFabric");
      // The imported hanger neck meets the static hook's swivel, not above it.
      expect(support.max[1]).toBeCloseTo(-0.3, 5);
      expect(fabric.min[2]).toBeLessThan(support.min[2]);
      expect(fabric.max[2]).toBeGreaterThan(support.max[2]);
      const config = garments.find((garment) => garment.kind === kind)!;
      expect(fabric.max[0] - fabric.min[0]).toBeLessThanOrEqual(
        config.width + 0.01,
      );
      expect(-fabric.min[1]).toBeLessThanOrEqual(config.length + 0.01);
    });
  }
});
