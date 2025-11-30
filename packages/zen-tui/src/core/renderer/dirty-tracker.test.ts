import { describe, expect, it, beforeEach } from 'bun:test';
import { DirtyTracker, DirtyType } from './dirty-tracker.js';
import type { TUINode } from '../types.js';
import { createRegion } from './region.js';

// Mock TUINode for testing
function createMockNode(id: string): TUINode {
  return {
    type: 'Box',
    props: { id },
    children: [],
  } as unknown as TUINode;
}

// Mock LayoutMap
function createMockLayoutMap(
  entries: Array<{ node: TUINode; x: number; y: number; width: number; height: number }>
): Map<TUINode, { left: number; top: number; width: number; height: number }> {
  const map = new Map();
  for (const entry of entries) {
    map.set(entry.node, {
      left: entry.x,
      top: entry.y,
      width: entry.width,
      height: entry.height,
    });
  }
  return map;
}

describe('DirtyTracker', () => {
  let tracker: DirtyTracker;

  beforeEach(() => {
    tracker = new DirtyTracker();
    tracker.setDimensions(80, 24);
  });

  describe('markContentDirty', () => {
    it('marks node as content dirty', () => {
      const node = createMockNode('test');
      tracker.markContentDirty(node);

      expect(tracker.isNodeDirty(node)).toBe(true);
      expect(tracker.getNodeDirtyType(node)).toBe(DirtyType.Content);
      expect(tracker.hasDirtyNodes).toBe(true);
    });

    it('adds node region to dirty regions', () => {
      const node = createMockNode('test');
      const layoutMap = createMockLayoutMap([
        { node, x: 10, y: 5, width: 20, height: 10 },
      ]);

      tracker.updateNodeRegions(layoutMap);
      tracker.markContentDirty(node);

      const regions = tracker.getDirtyRegions();
      expect(regions.length).toBe(1);
      expect(regions[0]).toEqual(createRegion(10, 5, 20, 10));
    });

    it('does not set layoutDirty', () => {
      const node = createMockNode('test');
      tracker.markContentDirty(node);

      expect(tracker.layoutDirty).toBe(false);
    });
  });

  describe('markLayoutDirty', () => {
    it('marks node as layout dirty', () => {
      const node = createMockNode('test');
      tracker.markLayoutDirty(node);

      expect(tracker.isNodeDirty(node)).toBe(true);
      expect(tracker.getNodeDirtyType(node) & DirtyType.Layout).toBeTruthy();
    });

    it('sets layoutDirty flag', () => {
      const node = createMockNode('test');
      tracker.markLayoutDirty(node);

      expect(tracker.layoutDirty).toBe(true);
    });
  });

  describe('markStructureDirty', () => {
    it('marks node as structure dirty', () => {
      const node = createMockNode('test');
      tracker.markStructureDirty(node);

      expect(tracker.isNodeDirty(node)).toBe(true);
      expect(tracker.getNodeDirtyType(node)).toBe(DirtyType.Structure);
    });

    it('sets layoutDirty flag', () => {
      const node = createMockNode('test');
      tracker.markStructureDirty(node);

      expect(tracker.layoutDirty).toBe(true);
    });
  });

  describe('markFullDirty', () => {
    it('sets layoutDirty and adds full region', () => {
      tracker.markFullDirty();

      expect(tracker.layoutDirty).toBe(true);
      const regions = tracker.getDirtyRegions();
      expect(regions.length).toBe(1);
      expect(regions[0]).toEqual(createRegion(0, 0, 80, 24));
    });
  });

  describe('getDirtyRatio', () => {
    it('returns 0 for no dirty regions', () => {
      expect(tracker.getDirtyRatio()).toBe(0);
    });

    it('calculates ratio correctly', () => {
      const node = createMockNode('test');
      const layoutMap = createMockLayoutMap([
        { node, x: 0, y: 0, width: 40, height: 12 }, // Half the screen
      ]);

      tracker.updateNodeRegions(layoutMap);
      tracker.markContentDirty(node);

      const ratio = tracker.getDirtyRatio();
      expect(ratio).toBeCloseTo(0.25, 1); // 40*12 / 80*24 = 480/1920 = 0.25
    });

    it('returns 1 for full dirty', () => {
      tracker.markFullDirty();
      expect(tracker.getDirtyRatio()).toBe(1);
    });
  });

  describe('updateNodeRegions', () => {
    it('updates node to region mapping', () => {
      const node1 = createMockNode('node1');
      const node2 = createMockNode('node2');

      const layoutMap = createMockLayoutMap([
        { node: node1, x: 0, y: 0, width: 10, height: 5 },
        { node: node2, x: 20, y: 10, width: 15, height: 8 },
      ]);

      tracker.updateNodeRegions(layoutMap);

      expect(tracker.getNodeRegion(node1)).toEqual(createRegion(0, 0, 10, 5));
      expect(tracker.getNodeRegion(node2)).toEqual(createRegion(20, 10, 15, 8));
    });

    it('clears old mappings', () => {
      const node1 = createMockNode('node1');
      const node2 = createMockNode('node2');

      const layoutMap1 = createMockLayoutMap([
        { node: node1, x: 0, y: 0, width: 10, height: 5 },
      ]);
      tracker.updateNodeRegions(layoutMap1);

      const layoutMap2 = createMockLayoutMap([
        { node: node2, x: 20, y: 10, width: 15, height: 8 },
      ]);
      tracker.updateNodeRegions(layoutMap2);

      expect(tracker.getNodeRegion(node1)).toBeUndefined();
      expect(tracker.getNodeRegion(node2)).toBeDefined();
    });
  });

  describe('clear', () => {
    it('clears all dirty state', () => {
      const node = createMockNode('test');
      tracker.markContentDirty(node);
      tracker.markLayoutDirty(node);
      tracker.markFullDirty();

      tracker.clear();

      expect(tracker.hasDirtyNodes).toBe(false);
      expect(tracker.layoutDirty).toBe(false);
      expect(tracker.getDirtyRegions().length).toBe(0);
    });
  });

  describe('multiple dirty types', () => {
    it('combines dirty types with OR', () => {
      const node = createMockNode('test');

      tracker.markContentDirty(node);
      tracker.markLayoutDirty(node);

      const type = tracker.getNodeDirtyType(node);
      expect(type & DirtyType.Content).toBeTruthy();
      expect(type & DirtyType.Layout).toBeTruthy();
    });
  });

  describe('getDirtyRegions', () => {
    it('merges overlapping regions', () => {
      const node1 = createMockNode('node1');
      const node2 = createMockNode('node2');

      const layoutMap = createMockLayoutMap([
        { node: node1, x: 0, y: 0, width: 20, height: 10 },
        { node: node2, x: 10, y: 5, width: 20, height: 10 },
      ]);

      tracker.updateNodeRegions(layoutMap);
      tracker.markContentDirty(node1);
      tracker.markContentDirty(node2);

      const regions = tracker.getDirtyRegions();
      // Should be merged into one region
      expect(regions.length).toBe(1);
    });
  });
});
