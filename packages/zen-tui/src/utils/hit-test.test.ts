/**
 * Hit Testing Module Tests
 *
 * Tests for mapping screen coordinates to TUI elements using layout data.
 */
import { describe, expect, it, beforeEach, afterEach } from 'bun:test';
import {
  hitTest,
  hitTestAll,
  setHitTestLayout,
  clearHitTestLayout,
  findClickableAncestor,
  type HitTestResult,
} from './hit-test.js';
import type { TUINode } from '../core/types.js';
import type { LayoutMap, LayoutResult } from '../core/yoga-layout.js';

// Helper to create a mock TUINode
const createNode = (
  tagName: string,
  style: TUINode['style'] = {},
  children: TUINode['children'] = [],
  props: Record<string, unknown> = {},
): TUINode => ({
  type: 'box',
  tagName,
  style,
  children,
  props,
});

// Helper to create a layout map
const createLayoutMap = (entries: Array<[TUINode, LayoutResult]>): LayoutMap => {
  return new Map(entries);
};

describe('hit-test', () => {
  afterEach(() => {
    clearHitTestLayout();
  });

  // ==========================================================================
  // hitTest - Basic Functionality
  // ==========================================================================

  describe('hitTest - Basic', () => {
    it('should return null when no layout is set', () => {
      const result = hitTest(5, 5);
      expect(result).toBeNull();
    });

    it('should return null when coordinates are outside all elements', () => {
      const root = createNode('root');
      const layoutMap = createLayoutMap([
        [root, { x: 0, y: 0, width: 10, height: 10 }],
      ]);

      setHitTestLayout(layoutMap, root);

      // Outside bounds
      expect(hitTest(20, 20)).toBeNull();
      expect(hitTest(0, 0)).toBeNull(); // 0,0 in 1-indexed is -1,-1 in layout
    });

    it('should return the root node when hit', () => {
      const root = createNode('root');
      const layoutMap = createLayoutMap([
        [root, { x: 0, y: 0, width: 10, height: 10 }],
      ]);

      setHitTestLayout(layoutMap, root);

      // Hit inside root (1-indexed mouse coords)
      const result = hitTest(5, 5);
      expect(result).not.toBeNull();
      expect(result?.node).toBe(root);
      expect(result?.layout).toEqual({ x: 0, y: 0, width: 10, height: 10 });
    });

    it('should calculate local coordinates correctly', () => {
      const root = createNode('root');
      const layoutMap = createLayoutMap([
        [root, { x: 5, y: 5, width: 10, height: 10 }],
      ]);

      setHitTestLayout(layoutMap, root);

      // Hit at screen position (8, 8) = layout (7, 7)
      // Local should be (7-5, 7-5) = (2, 2)
      const result = hitTest(8, 8);
      expect(result?.localX).toBe(2);
      expect(result?.localY).toBe(2);
    });

    it('should convert 1-indexed mouse coords to 0-indexed layout', () => {
      const root = createNode('root');
      const layoutMap = createLayoutMap([
        [root, { x: 0, y: 0, width: 10, height: 10 }],
      ]);

      setHitTestLayout(layoutMap, root);

      // Mouse (1,1) should hit layout (0,0)
      const result = hitTest(1, 1);
      expect(result).not.toBeNull();
      expect(result?.localX).toBe(0);
      expect(result?.localY).toBe(0);
    });
  });

  // ==========================================================================
  // hitTest - Nested Elements
  // ==========================================================================

  describe('hitTest - Nested Elements', () => {
    it('should return deepest child when hit', () => {
      const child = createNode('child');
      const root = createNode('root', {}, [child]);

      const layoutMap = createLayoutMap([
        [root, { x: 0, y: 0, width: 20, height: 20 }],
        [child, { x: 5, y: 5, width: 10, height: 10 }],
      ]);

      setHitTestLayout(layoutMap, root);

      // Hit inside child
      const result = hitTest(8, 8); // layout (7, 7)
      expect(result?.node).toBe(child);
    });

    it('should return parent when child is not hit', () => {
      const child = createNode('child');
      const root = createNode('root', {}, [child]);

      const layoutMap = createLayoutMap([
        [root, { x: 0, y: 0, width: 20, height: 20 }],
        [child, { x: 5, y: 5, width: 5, height: 5 }],
      ]);

      setHitTestLayout(layoutMap, root);

      // Hit inside root but outside child
      const result = hitTest(2, 2); // layout (1, 1)
      expect(result?.node).toBe(root);
    });

    it('should handle deeply nested structures', () => {
      const grandchild = createNode('grandchild');
      const child = createNode('child', {}, [grandchild]);
      const root = createNode('root', {}, [child]);

      const layoutMap = createLayoutMap([
        [root, { x: 0, y: 0, width: 30, height: 30 }],
        [child, { x: 5, y: 5, width: 20, height: 20 }],
        [grandchild, { x: 10, y: 10, width: 10, height: 10 }],
      ]);

      setHitTestLayout(layoutMap, root);

      // Hit inside grandchild
      const result = hitTest(13, 13); // layout (12, 12)
      expect(result?.node).toBe(grandchild);
    });

    it('should prefer last sibling in normal flow (later = on top)', () => {
      const child1 = createNode('child1');
      const child2 = createNode('child2');
      const root = createNode('root', {}, [child1, child2]);

      // Both children overlap
      const layoutMap = createLayoutMap([
        [root, { x: 0, y: 0, width: 20, height: 20 }],
        [child1, { x: 0, y: 0, width: 10, height: 10 }],
        [child2, { x: 5, y: 5, width: 10, height: 10 }],
      ]);

      setHitTestLayout(layoutMap, root);

      // Hit in overlapping region
      const result = hitTest(7, 7); // layout (6, 6)
      expect(result?.node).toBe(child2); // Last sibling wins
    });
  });

  // ==========================================================================
  // hitTest - Absolute Positioning & zIndex
  // ==========================================================================

  describe('hitTest - Absolute Positioning', () => {
    it('should prefer higher zIndex for absolute elements', () => {
      const lowZ = createNode('lowZ', { position: 'absolute', zIndex: 1 });
      const highZ = createNode('highZ', { position: 'absolute', zIndex: 10 });
      const root = createNode('root', {}, [lowZ, highZ]);

      // Both absolute children overlap
      const layoutMap = createLayoutMap([
        [root, { x: 0, y: 0, width: 20, height: 20 }],
        [lowZ, { x: 0, y: 0, width: 10, height: 10 }],
        [highZ, { x: 5, y: 5, width: 10, height: 10 }],
      ]);

      setHitTestLayout(layoutMap, root);

      // Hit in overlapping region
      const result = hitTest(7, 7); // layout (6, 6)
      expect(result?.node).toBe(highZ); // Higher zIndex wins
    });

    it('should treat absolute elements over normal flow', () => {
      const normal = createNode('normal');
      const absolute = createNode('absolute', { position: 'absolute', zIndex: 1 });
      const root = createNode('root', {}, [normal, absolute]);

      // Both children overlap
      const layoutMap = createLayoutMap([
        [root, { x: 0, y: 0, width: 20, height: 20 }],
        [normal, { x: 0, y: 0, width: 15, height: 15 }],
        [absolute, { x: 5, y: 5, width: 10, height: 10 }],
      ]);

      setHitTestLayout(layoutMap, root);

      // Hit in overlapping region
      const result = hitTest(8, 8); // layout (7, 7)
      expect(result?.node).toBe(absolute); // Absolute over normal flow
    });

    it('should handle zIndex as function', () => {
      const node = createNode('node', { position: 'absolute', zIndex: () => 5 });
      const root = createNode('root', {}, [node]);

      const layoutMap = createLayoutMap([
        [root, { x: 0, y: 0, width: 20, height: 20 }],
        [node, { x: 0, y: 0, width: 10, height: 10 }],
      ]);

      setHitTestLayout(layoutMap, root);

      const result = hitTest(5, 5);
      expect(result?.node).toBe(node);
    });

    it('should handle position as function', () => {
      const node = createNode('node', { position: () => 'absolute' });
      const root = createNode('root', {}, [node]);

      const layoutMap = createLayoutMap([
        [root, { x: 0, y: 0, width: 20, height: 20 }],
        [node, { x: 0, y: 0, width: 10, height: 10 }],
      ]);

      setHitTestLayout(layoutMap, root);

      const result = hitTest(5, 5);
      expect(result?.node).toBe(node);
    });
  });

  // ==========================================================================
  // hitTest - Fragment Nodes
  // ==========================================================================

  describe('hitTest - Fragment Nodes', () => {
    it('should handle fragment children', () => {
      const fragmentChild = createNode('fragment-child');
      const fragment: TUINode = {
        type: 'fragment',
        children: [fragmentChild],
      };
      const root = createNode('root', {}, [fragment]);

      const layoutMap = createLayoutMap([
        [root, { x: 0, y: 0, width: 20, height: 20 }],
        [fragmentChild, { x: 5, y: 5, width: 10, height: 10 }],
      ]);

      setHitTestLayout(layoutMap, root);

      const result = hitTest(8, 8); // layout (7, 7)
      expect(result?.node).toBe(fragmentChild);
    });

    it('should handle absolute positioned fragment children', () => {
      const absFragmentChild = createNode('abs-fragment-child', { position: 'absolute', zIndex: 5 });
      const fragment: TUINode = {
        type: 'fragment',
        children: [absFragmentChild],
      };
      const normal = createNode('normal');
      const root = createNode('root', {}, [normal, fragment]);

      const layoutMap = createLayoutMap([
        [root, { x: 0, y: 0, width: 20, height: 20 }],
        [normal, { x: 0, y: 0, width: 15, height: 15 }],
        [absFragmentChild, { x: 5, y: 5, width: 10, height: 10 }],
      ]);

      setHitTestLayout(layoutMap, root);

      const result = hitTest(8, 8);
      expect(result?.node).toBe(absFragmentChild);
    });
  });

  // ==========================================================================
  // hitTest - Edge Cases
  // ==========================================================================

  describe('hitTest - Edge Cases', () => {
    it('should handle string children gracefully', () => {
      const root = createNode('root', {}, ['text child' as unknown as TUINode]);

      const layoutMap = createLayoutMap([
        [root, { x: 0, y: 0, width: 20, height: 20 }],
      ]);

      setHitTestLayout(layoutMap, root);

      const result = hitTest(5, 5);
      expect(result?.node).toBe(root); // String children are skipped
    });

    it('should handle null/undefined children', () => {
      const root = createNode('root', {}, [null as unknown as TUINode, undefined as unknown as TUINode]);

      const layoutMap = createLayoutMap([
        [root, { x: 0, y: 0, width: 20, height: 20 }],
      ]);

      setHitTestLayout(layoutMap, root);

      const result = hitTest(5, 5);
      expect(result?.node).toBe(root);
    });

    it('should handle style as function', () => {
      const node = createNode('node', () => ({ position: 'absolute', zIndex: 5 }));
      const root = createNode('root', {}, [node]);

      const layoutMap = createLayoutMap([
        [root, { x: 0, y: 0, width: 20, height: 20 }],
        [node, { x: 0, y: 0, width: 10, height: 10 }],
      ]);

      setHitTestLayout(layoutMap, root);

      const result = hitTest(5, 5);
      expect(result?.node).toBe(node);
    });

    it('should handle missing style', () => {
      const node: TUINode = { type: 'box', tagName: 'node', children: [] };
      const root = createNode('root', {}, [node]);

      const layoutMap = createLayoutMap([
        [root, { x: 0, y: 0, width: 20, height: 20 }],
        [node, { x: 0, y: 0, width: 10, height: 10 }],
      ]);

      setHitTestLayout(layoutMap, root);

      const result = hitTest(5, 5);
      expect(result).not.toBeNull();
    });

    it('should handle zero-size elements', () => {
      const child = createNode('child');
      const root = createNode('root', {}, [child]);

      const layoutMap = createLayoutMap([
        [root, { x: 0, y: 0, width: 20, height: 20 }],
        [child, { x: 5, y: 5, width: 0, height: 0 }],
      ]);

      setHitTestLayout(layoutMap, root);

      // Zero-size element cannot be hit
      const result = hitTest(6, 6);
      expect(result?.node).toBe(root);
    });

    it('should handle exact boundary hits', () => {
      const child = createNode('child');
      const root = createNode('root', {}, [child]);

      const layoutMap = createLayoutMap([
        [root, { x: 0, y: 0, width: 20, height: 20 }],
        [child, { x: 5, y: 5, width: 5, height: 5 }], // 5-9 inclusive
      ]);

      setHitTestLayout(layoutMap, root);

      // Left edge (x=5 in layout)
      expect(hitTest(6, 7)?.node).toBe(child);

      // Right edge (x=9 in layout, x=10 is outside)
      expect(hitTest(10, 7)?.node).toBe(child);
      expect(hitTest(11, 7)?.node).toBe(root); // Outside

      // Top edge (y=5 in layout)
      expect(hitTest(7, 6)?.node).toBe(child);

      // Bottom edge (y=9 in layout, y=10 is outside)
      expect(hitTest(7, 10)?.node).toBe(child);
      expect(hitTest(7, 11)?.node).toBe(root); // Outside
    });
  });

  // ==========================================================================
  // hitTestAll
  // ==========================================================================

  describe('hitTestAll', () => {
    it('should return empty array when no layout is set', () => {
      const results = hitTestAll(5, 5);
      expect(results).toEqual([]);
    });

    it('should return all elements in path from root to leaf', () => {
      const grandchild = createNode('grandchild');
      const child = createNode('child', {}, [grandchild]);
      const root = createNode('root', {}, [child]);

      const layoutMap = createLayoutMap([
        [root, { x: 0, y: 0, width: 30, height: 30 }],
        [child, { x: 5, y: 5, width: 20, height: 20 }],
        [grandchild, { x: 10, y: 10, width: 10, height: 10 }],
      ]);

      setHitTestLayout(layoutMap, root);

      const results = hitTestAll(13, 13);
      expect(results.length).toBe(3);
      expect(results[0].node).toBe(root);
      expect(results[1].node).toBe(child);
      expect(results[2].node).toBe(grandchild);
    });

    it('should include absolute positioned elements at end', () => {
      const normal = createNode('normal');
      const absolute = createNode('absolute', { position: 'absolute', zIndex: 1 });
      const root = createNode('root', {}, [normal, absolute]);

      const layoutMap = createLayoutMap([
        [root, { x: 0, y: 0, width: 20, height: 20 }],
        [normal, { x: 0, y: 0, width: 15, height: 15 }],
        [absolute, { x: 5, y: 5, width: 10, height: 10 }],
      ]);

      setHitTestLayout(layoutMap, root);

      const results = hitTestAll(8, 8);
      // Should have root, normal, absolute (absolute last due to higher paint order)
      expect(results.length).toBeGreaterThanOrEqual(2);
      expect(results[results.length - 1].node).toBe(absolute);
    });
  });

  // ==========================================================================
  // findClickableAncestor
  // ==========================================================================

  describe('findClickableAncestor', () => {
    it('should return null for null result', () => {
      expect(findClickableAncestor(null)).toBeNull();
    });

    it('should return node if it has onClick handler', () => {
      const node = createNode('button', {}, [], { onClick: () => {} });
      const root = createNode('root', {}, [node]);

      const layoutMap = createLayoutMap([
        [root, { x: 0, y: 0, width: 20, height: 20 }],
        [node, { x: 5, y: 5, width: 10, height: 10 }],
      ]);

      setHitTestLayout(layoutMap, root);

      const hitResult = hitTest(8, 8);
      const clickable = findClickableAncestor(hitResult);
      expect(clickable).toBe(node);
    });

    it('should return null if node has no onClick', () => {
      const node = createNode('div');
      const root = createNode('root', {}, [node]);

      const layoutMap = createLayoutMap([
        [root, { x: 0, y: 0, width: 20, height: 20 }],
        [node, { x: 5, y: 5, width: 10, height: 10 }],
      ]);

      setHitTestLayout(layoutMap, root);

      const hitResult = hitTest(8, 8);
      const clickable = findClickableAncestor(hitResult);
      expect(clickable).toBeNull();
    });
  });

  // ==========================================================================
  // setHitTestLayout / clearHitTestLayout
  // ==========================================================================

  describe('Layout Management', () => {
    it('should set and clear layout correctly', () => {
      const root = createNode('root');
      const layoutMap = createLayoutMap([
        [root, { x: 0, y: 0, width: 10, height: 10 }],
      ]);

      setHitTestLayout(layoutMap, root);
      expect(hitTest(5, 5)).not.toBeNull();

      clearHitTestLayout();
      expect(hitTest(5, 5)).toBeNull();
    });

    it('should allow setting new layout after clear', () => {
      const root1 = createNode('root1');
      const root2 = createNode('root2');

      const layoutMap1 = createLayoutMap([
        [root1, { x: 0, y: 0, width: 10, height: 10 }],
      ]);
      const layoutMap2 = createLayoutMap([
        [root2, { x: 0, y: 0, width: 20, height: 20 }],
      ]);

      setHitTestLayout(layoutMap1, root1);
      expect(hitTest(5, 5)?.node).toBe(root1);

      setHitTestLayout(layoutMap2, root2);
      expect(hitTest(5, 5)?.node).toBe(root2);
    });
  });
});
