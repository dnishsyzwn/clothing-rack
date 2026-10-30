export const RAIL_MIN = -5.15;
export const RAIL_MAX = 5.15;
export const HOOK_GAP = 1.72;

/** A dragged hanger pushes a chain of neighbors, without changing their order. */
export function moveOnRail(
  positions: readonly number[],
  index: number,
  target: number,
): number[] {
  if (index < 0 || index >= positions.length || !Number.isFinite(target))
    return [...positions];
  const next = [...positions];
  next[index] = Math.max(
    RAIL_MIN + index * HOOK_GAP,
    Math.min(RAIL_MAX - (next.length - 1 - index) * HOOK_GAP, target),
  );
  for (let i = index + 1; i < next.length; i++)
    next[i] = Math.max(next[i], next[i - 1] + HOOK_GAP);
  for (let i = index - 1; i >= 0; i--)
    next[i] = Math.min(next[i], next[i + 1] - HOOK_GAP);
  return next;
}
