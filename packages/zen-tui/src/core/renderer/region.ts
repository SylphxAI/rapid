/**
 * Region utilities for dirty tracking and incremental rendering.
 *
 * A Region represents a rectangular area in the terminal buffer.
 * Used to track which parts of the screen need to be re-rendered.
 */

/**
 * A rectangular region in the terminal buffer.
 */
export interface Region {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Create a region from coordinates.
 */
export function createRegion(x: number, y: number, width: number, height: number): Region {
  return { x, y, width, height };
}

/**
 * Calculate the area of a region.
 */
export function regionArea(region: Region): number {
  return region.width * region.height;
}

/**
 * Check if two regions overlap.
 */
export function regionsOverlap(a: Region, b: Region): boolean {
  return !(
    a.x + a.width <= b.x ||
    b.x + b.width <= a.x ||
    a.y + a.height <= b.y ||
    b.y + b.height <= a.y
  );
}

/**
 * Check if region `a` contains region `b`.
 */
export function regionContains(a: Region, b: Region): boolean {
  return (
    b.x >= a.x && b.y >= a.y && b.x + b.width <= a.x + a.width && b.y + b.height <= a.y + a.height
  );
}

/**
 * Check if a point is inside a region.
 */
export function regionContainsPoint(region: Region, x: number, y: number): boolean {
  return (
    x >= region.x && x < region.x + region.width && y >= region.y && y < region.y + region.height
  );
}

/**
 * Calculate the intersection of two regions.
 * Returns null if they don't overlap.
 */
export function intersectRegions(a: Region, b: Region): Region | null {
  const x = Math.max(a.x, b.x);
  const y = Math.max(a.y, b.y);
  const right = Math.min(a.x + a.width, b.x + b.width);
  const bottom = Math.min(a.y + a.height, b.y + b.height);

  if (right <= x || bottom <= y) {
    return null;
  }

  return {
    x,
    y,
    width: right - x,
    height: bottom - y,
  };
}

/**
 * Calculate the bounding box that contains both regions.
 */
export function unionRegions(a: Region, b: Region): Region {
  const x = Math.min(a.x, b.x);
  const y = Math.min(a.y, b.y);
  const right = Math.max(a.x + a.width, b.x + b.width);
  const bottom = Math.max(a.y + a.height, b.y + b.height);

  return {
    x,
    y,
    width: right - x,
    height: bottom - y,
  };
}

/**
 * Expand a region by a given amount in all directions.
 */
export function expandRegion(region: Region, padding: number): Region {
  return {
    x: Math.max(0, region.x - padding),
    y: Math.max(0, region.y - padding),
    width: region.width + padding * 2,
    height: region.height + padding * 2,
  };
}

/**
 * Clamp a region to fit within bounds.
 */
export function clampRegion(region: Region, maxWidth: number, maxHeight: number): Region {
  const x = Math.max(0, Math.min(region.x, maxWidth - 1));
  const y = Math.max(0, Math.min(region.y, maxHeight - 1));
  const width = Math.min(region.width, maxWidth - x);
  const height = Math.min(region.height, maxHeight - y);

  return { x, y, width, height };
}

/**
 * Merge overlapping regions to reduce the number of regions.
 *
 * This is a simple greedy algorithm that merges regions if their
 * union is smaller than the sum of their areas (i.e., they overlap significantly).
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Region merging requires nested loops for greedy merge algorithm
export function mergeRegions(regions: Region[]): Region[] {
  if (regions.length <= 1) {
    return [...regions];
  }

  const result: Region[] = [];
  const used = new Set<number>();

  for (let i = 0; i < regions.length; i++) {
    if (used.has(i)) continue;

    let current = regions[i];
    used.add(i);

    // Try to merge with other regions
    let merged = true;
    while (merged) {
      merged = false;

      for (let j = 0; j < regions.length; j++) {
        if (used.has(j)) continue;

        const other = regions[j];

        // Check if merging is beneficial
        // Merge if they overlap or are adjacent
        if (shouldMerge(current, other)) {
          current = unionRegions(current, other);
          used.add(j);
          merged = true;
        }
      }
    }

    result.push(current);
  }

  return result;
}

/**
 * Determine if two regions should be merged.
 *
 * Merge if:
 * - They overlap, OR
 * - They are adjacent (touching), OR
 * - The union area is less than 1.5x the sum of individual areas
 */
function shouldMerge(a: Region, b: Region): boolean {
  // Check if they overlap or are adjacent (within 1 cell)
  const expanded = expandRegion(a, 1);
  if (regionsOverlap(expanded, b)) {
    return true;
  }

  // Check if merging would be efficient
  const unionArea = regionArea(unionRegions(a, b));
  const sumArea = regionArea(a) + regionArea(b);

  // Merge if union is less than 1.5x the sum (they share significant area)
  return unionArea < sumArea * 1.5;
}

/**
 * Calculate the total area of multiple regions (accounting for overlap).
 * This is an approximation using the union bounding box.
 */
export function totalRegionArea(regions: Region[]): number {
  if (regions.length === 0) return 0;
  if (regions.length === 1) return regionArea(regions[0]);

  // Use merged regions for a better approximation
  const merged = mergeRegions(regions);
  return merged.reduce((sum, r) => sum + regionArea(r), 0);
}

/**
 * Check if a region is empty (zero area).
 */
export function isEmptyRegion(region: Region): boolean {
  return region.width <= 0 || region.height <= 0;
}

/**
 * Create a full-screen region.
 */
export function fullRegion(width: number, height: number): Region {
  return { x: 0, y: 0, width, height };
}
