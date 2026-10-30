import { describe, expect, it } from "vitest";
import { HOOK_GAP, moveOnRail, RAIL_MAX, RAIL_MIN } from "./railSolver";

describe("rail constraints", () => {
  const initial = [-3.75, -1.25, 1.25, 3.75];
  it("pushes a chain at the right end without crossing or escaping the rail", () => {
    const positions = moveOnRail(initial, 0, 100);
    expect(positions[3]).toBeCloseTo(RAIL_MAX);
    for (let i = 1; i < positions.length; i++)
      expect(positions[i] - positions[i - 1]).toBeCloseTo(HOOK_GAP);
  });
  it("pushes a chain at the left end and preserves the input", () => {
    const positions = moveOnRail(initial, 3, -100);
    expect(positions[0]).toBeCloseTo(RAIL_MIN);
    expect(initial).toEqual([-3.75, -1.25, 1.25, 3.75]);
    for (let i = 1; i < positions.length; i++)
      expect(positions[i] - positions[i - 1]).toBeCloseTo(HOOK_GAP);
  });
  it("leaves distant neighbors in place", () => {
    expect(moveOnRail(initial, 1, -1)).toEqual([-3.75, -1, 1.25, 3.75]);
  });
  it("maintains all invariants across repeated drags", () => {
    let positions = initial;
    for (let step = 0; step < 500; step++) {
      positions = moveOnRail(positions, step % 4, Math.sin(step * 3.1) * 15);
      expect(positions[0]).toBeGreaterThanOrEqual(RAIL_MIN - 1e-8);
      expect(positions[3]).toBeLessThanOrEqual(RAIL_MAX + 1e-8);
      for (let i = 1; i < positions.length; i++)
        expect(positions[i] - positions[i - 1]).toBeGreaterThanOrEqual(
          HOOK_GAP - 1e-8,
        );
    }
  });
  it("ignores invalid coordinates and indices", () => {
    expect(moveOnRail(initial, 0, NaN)).toEqual(initial);
    expect(moveOnRail(initial, 5, 0)).toEqual(initial);
  });
});
