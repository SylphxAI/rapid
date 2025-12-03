import { describe, expect, it } from 'bun:test';
import {
  clampRegion,
  createRegion,
  expandRegion,
  fullRegion,
  intersectRegions,
  isEmptyRegion,
  mergeRegions,
  regionArea,
  regionContains,
  regionContainsPoint,
  regionsOverlap,
  totalRegionArea,
  unionRegions,
} from './region.js';

describe('Region utilities', () => {
  describe('createRegion', () => {
    it('creates a region with given coordinates', () => {
      const region = createRegion(10, 20, 30, 40);
      expect(region).toEqual({ x: 10, y: 20, width: 30, height: 40 });
    });
  });

  describe('regionArea', () => {
    it('calculates area correctly', () => {
      expect(regionArea(createRegion(0, 0, 10, 20))).toBe(200);
      expect(regionArea(createRegion(5, 5, 1, 1))).toBe(1);
      expect(regionArea(createRegion(0, 0, 0, 10))).toBe(0);
    });
  });

  describe('regionsOverlap', () => {
    it('returns true for overlapping regions', () => {
      const a = createRegion(0, 0, 10, 10);
      const b = createRegion(5, 5, 10, 10);
      expect(regionsOverlap(a, b)).toBe(true);
    });

    it('returns false for non-overlapping regions', () => {
      const a = createRegion(0, 0, 10, 10);
      const b = createRegion(20, 20, 10, 10);
      expect(regionsOverlap(a, b)).toBe(false);
    });

    it('returns false for adjacent regions', () => {
      const a = createRegion(0, 0, 10, 10);
      const b = createRegion(10, 0, 10, 10);
      expect(regionsOverlap(a, b)).toBe(false);
    });
  });

  describe('regionContains', () => {
    it('returns true when a contains b', () => {
      const a = createRegion(0, 0, 20, 20);
      const b = createRegion(5, 5, 10, 10);
      expect(regionContains(a, b)).toBe(true);
    });

    it('returns false when b is not fully inside a', () => {
      const a = createRegion(0, 0, 10, 10);
      const b = createRegion(5, 5, 10, 10);
      expect(regionContains(a, b)).toBe(false);
    });

    it('returns true when regions are identical', () => {
      const a = createRegion(5, 5, 10, 10);
      const b = createRegion(5, 5, 10, 10);
      expect(regionContains(a, b)).toBe(true);
    });
  });

  describe('regionContainsPoint', () => {
    it('returns true for point inside region', () => {
      const region = createRegion(10, 10, 20, 20);
      expect(regionContainsPoint(region, 15, 15)).toBe(true);
      expect(regionContainsPoint(region, 10, 10)).toBe(true);
    });

    it('returns false for point outside region', () => {
      const region = createRegion(10, 10, 20, 20);
      expect(regionContainsPoint(region, 5, 15)).toBe(false);
      expect(regionContainsPoint(region, 30, 30)).toBe(false);
    });

    it('returns false for point on boundary (exclusive end)', () => {
      const region = createRegion(10, 10, 20, 20);
      expect(regionContainsPoint(region, 30, 15)).toBe(false);
      expect(regionContainsPoint(region, 15, 30)).toBe(false);
    });
  });

  describe('intersectRegions', () => {
    it('returns intersection of overlapping regions', () => {
      const a = createRegion(0, 0, 10, 10);
      const b = createRegion(5, 5, 10, 10);
      const result = intersectRegions(a, b);
      expect(result).toEqual({ x: 5, y: 5, width: 5, height: 5 });
    });

    it('returns null for non-overlapping regions', () => {
      const a = createRegion(0, 0, 10, 10);
      const b = createRegion(20, 20, 10, 10);
      expect(intersectRegions(a, b)).toBeNull();
    });
  });

  describe('unionRegions', () => {
    it('returns bounding box of two regions', () => {
      const a = createRegion(0, 0, 10, 10);
      const b = createRegion(5, 5, 10, 10);
      const result = unionRegions(a, b);
      expect(result).toEqual({ x: 0, y: 0, width: 15, height: 15 });
    });

    it('handles non-overlapping regions', () => {
      const a = createRegion(0, 0, 5, 5);
      const b = createRegion(10, 10, 5, 5);
      const result = unionRegions(a, b);
      expect(result).toEqual({ x: 0, y: 0, width: 15, height: 15 });
    });
  });

  describe('expandRegion', () => {
    it('expands region by padding', () => {
      const region = createRegion(10, 10, 20, 20);
      const result = expandRegion(region, 5);
      expect(result).toEqual({ x: 5, y: 5, width: 30, height: 30 });
    });

    it('clamps to 0 for x and y', () => {
      const region = createRegion(2, 2, 10, 10);
      const result = expandRegion(region, 5);
      expect(result.x).toBe(0);
      expect(result.y).toBe(0);
    });
  });

  describe('clampRegion', () => {
    it('clamps region to bounds', () => {
      const region = createRegion(-5, -5, 30, 30);
      const result = clampRegion(region, 20, 20);
      expect(result.x).toBe(0);
      expect(result.y).toBe(0);
      expect(result.width).toBeLessThanOrEqual(20);
      expect(result.height).toBeLessThanOrEqual(20);
    });

    it('returns same region if within bounds', () => {
      const region = createRegion(5, 5, 10, 10);
      const result = clampRegion(region, 100, 100);
      expect(result).toEqual(region);
    });
  });

  describe('mergeRegions', () => {
    it('returns empty array for empty input', () => {
      expect(mergeRegions([])).toEqual([]);
    });

    it('returns single region unchanged', () => {
      const regions = [createRegion(0, 0, 10, 10)];
      expect(mergeRegions(regions)).toEqual(regions);
    });

    it('merges overlapping regions', () => {
      const regions = [
        createRegion(0, 0, 10, 10),
        createRegion(5, 5, 10, 10),
      ];
      const result = mergeRegions(regions);
      expect(result.length).toBe(1);
      expect(result[0]).toEqual({ x: 0, y: 0, width: 15, height: 15 });
    });

    it('merges adjacent regions', () => {
      const regions = [
        createRegion(0, 0, 10, 10),
        createRegion(10, 0, 10, 10),
      ];
      const result = mergeRegions(regions);
      // Adjacent regions should be merged
      expect(result.length).toBe(1);
    });

    it('keeps distant regions separate', () => {
      const regions = [
        createRegion(0, 0, 5, 5),
        createRegion(50, 50, 5, 5),
      ];
      const result = mergeRegions(regions);
      expect(result.length).toBe(2);
    });
  });

  describe('totalRegionArea', () => {
    it('returns 0 for empty array', () => {
      expect(totalRegionArea([])).toBe(0);
    });

    it('returns area for single region', () => {
      const regions = [createRegion(0, 0, 10, 10)];
      expect(totalRegionArea(regions)).toBe(100);
    });

    it('approximates area for multiple regions', () => {
      const regions = [
        createRegion(0, 0, 10, 10),
        createRegion(20, 20, 10, 10),
      ];
      // After merging, these should stay separate
      const result = totalRegionArea(regions);
      expect(result).toBe(200);
    });
  });

  describe('isEmptyRegion', () => {
    it('returns true for zero-width region', () => {
      expect(isEmptyRegion(createRegion(0, 0, 0, 10))).toBe(true);
    });

    it('returns true for zero-height region', () => {
      expect(isEmptyRegion(createRegion(0, 0, 10, 0))).toBe(true);
    });

    it('returns false for non-empty region', () => {
      expect(isEmptyRegion(createRegion(0, 0, 1, 1))).toBe(false);
    });
  });

  describe('fullRegion', () => {
    it('creates a full-screen region', () => {
      const result = fullRegion(80, 24);
      expect(result).toEqual({ x: 0, y: 0, width: 80, height: 24 });
    });
  });
});
