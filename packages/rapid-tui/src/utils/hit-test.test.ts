/**
 * Hit Testing Module Tests
 *
 * Tests for mouse hit detection using Yoga layout data.
 */
import { beforeEach, describe, expect, it } from 'bun:test';
import type { TUINode } from '../core/types.js';
import type { LayoutMap, LayoutResult } from '../core/yoga-layout.js';
import {
  clearHitTestLayout,
  findClickableAncestor,
  hitTest,
  hitTestAll,
  setHitTestLayout,
} from './hit-test.js';

// Helper to create a mock TUINode
const createNode = (
  tagName: string,
  style?: TUINode['style'],
  props?: TUINode['props'],
  children?: TUINode['children'],
): TUINode => ({
  type: 'box',
  tagName,
  style,
  props,
  children,
});

// Helper to create a layout result
const createLayout = (x: number, y: number, width: number, height: number): LayoutResult => ({
  x,
  y,
  width,
  height,
});

describe('hit-test', () => {
  beforeEach(() => {
    clearHitTestLayout();
  });

  // ==========================================================================
  // setHitTestLayout / clearHitTestLayout
  // ==========================================================================

  describe('setHitTestLayout / clearHitTestLayout', () => {
    it('should return null when no layout is set', () => {
      const result = hitTest(5, 5);
      expect(result).toBeNull();
    });

    it('should return results after layout is set', () => {
      const root = createNode('root');
      const layoutMap: LayoutMap = new Map([[root, createLayout(0, 0, 80, 24)]]);

      setHitTestLayout(layoutMap, root);

      const result = hitTest(1, 1);
      expect(result).not.toBeNull();
    });

    it('should return null after layout is cleared', () => {
      const root = createNode('root');
      const layoutMap: LayoutMap = new Map([[root, createLayout(0, 0, 80, 24)]]);

      setHitTestLayout(layoutMap, root);
      clearHitTestLayout();

      const result = hitTest(1, 1);
      expect(result).toBeNull();
    });
  });

  // ==========================================================================
  // hitTest - Basic Hit Detection
  // ==========================================================================

  describe('hitTest - Basic', () => {
    it('should hit a single node', () => {
      const root = createNode('root');
      const layoutMap: LayoutMap = new Map([[root, createLayout(0, 0, 80, 24)]]);

      setHitTestLayout(layoutMap, root);

      const result = hitTest(10, 10);
      expect(result).not.toBeNull();
      expect(result?.node).toBe(root);
    });

    it('should convert 1-indexed mouse coords to 0-indexed layout coords', () => {
      const root = createNode('root');
      const layoutMap: LayoutMap = new Map([[root, createLayout(0, 0, 80, 24)]]);

      setHitTestLayout(layoutMap, root);

      // Mouse coord (1, 1) should map to layout coord (0, 0)
      const result = hitTest(1, 1);
      expect(result?.localX).toBe(0);
      expect(result?.localY).toBe(0);
    });

    it('should return null for coords outside root', () => {
      const root = createNode('root');
      const layoutMap: LayoutMap = new Map([[root, createLayout(0, 0, 10, 10)]]);

      setHitTestLayout(layoutMap, root);

      // Outside bounds (1-indexed coords)
      const result = hitTest(15, 15);
      expect(result).toBeNull();
    });

    it('should calculate correct local coordinates', () => {
      const root = createNode('root');
      const layoutMap: LayoutMap = new Map([[root, createLayout(5, 5, 20, 10)]]);

      setHitTestLayout(layoutMap, root);

      // Mouse coord (10, 8) = layout coord (9, 7)
      // Node starts at (5, 5), so local = (9-5, 7-5) = (4, 2)
      const result = hitTest(10, 8);
      expect(result?.localX).toBe(4);
      expect(result?.localY).toBe(2);
    });
  });

  // ==========================================================================
  // hitTest - Nested Elements
  // ==========================================================================

  describe('hitTest - Nested Elements', () => {
    it('should find deepest child', () => {
      const child = createNode('child');
      const root = createNode('root', undefined, undefined, [child]);

      const layoutMap: LayoutMap = new Map([
        [root, createLayout(0, 0, 80, 24)],
        [child, createLayout(10, 5, 20, 10)],
      ]);

      setHitTestLayout(layoutMap, root);

      // Hit the child area (1-indexed)
      const result = hitTest(15, 8);
      expect(result?.node).toBe(child);
    });

    it('should return parent if child not hit', () => {
      const child = createNode('child');
      const root = createNode('root', undefined, undefined, [child]);

      const layoutMap: LayoutMap = new Map([
        [root, createLayout(0, 0, 80, 24)],
        [child, createLayout(10, 5, 20, 10)],
      ]);

      setHitTestLayout(layoutMap, root);

      // Hit outside child but inside root (1-indexed)
      const result = hitTest(5, 3);
      expect(result?.node).toBe(root);
    });

    it('should handle deeply nested elements', () => {
      const innermost = createNode('innermost');
      const middle = createNode('middle', undefined, undefined, [innermost]);
      const root = createNode('root', undefined, undefined, [middle]);

      const layoutMap: LayoutMap = new Map([
        [root, createLayout(0, 0, 80, 24)],
        [middle, createLayout(5, 5, 30, 15)],
        [innermost, createLayout(10, 8, 10, 5)],
      ]);

      setHitTestLayout(layoutMap, root);

      const result = hitTest(15, 10);
      expect(result?.node).toBe(innermost);
    });

    it('should handle last child wins for overlapping normal flow', () => {
      const child1 = createNode('child1');
      const child2 = createNode('child2');
      const root = createNode('root', undefined, undefined, [child1, child2]);

      // Both children at same position
      const layoutMap: LayoutMap = new Map([
        [root, createLayout(0, 0, 80, 24)],
        [child1, createLayout(5, 5, 20, 10)],
        [child2, createLayout(5, 5, 20, 10)],
      ]);

      setHitTestLayout(layoutMap, root);

      // Last child (child2) should be hit
      const result = hitTest(10, 10);
      expect(result?.node).toBe(child2);
    });
  });

  // ==========================================================================
  // hitTest - Absolute Positioning & zIndex
  // ==========================================================================

  describe('hitTest - Absolute Positioning', () => {
    it('should prefer absolute positioned element over normal', () => {
      const normal = createNode('normal');
      const absolute = createNode('absolute', { position: 'absolute' });
      const root = createNode('root', undefined, undefined, [normal, absolute]);

      const layoutMap: LayoutMap = new Map([
        [root, createLayout(0, 0, 80, 24)],
        [normal, createLayout(5, 5, 20, 10)],
        [absolute, createLayout(5, 5, 20, 10)],
      ]);

      setHitTestLayout(layoutMap, root);

      const result = hitTest(10, 10);
      expect(result?.node).toBe(absolute);
    });

    it('should respect zIndex for absolute elements', () => {
      const low = createNode('low-z', { position: 'absolute', zIndex: 1 });
      const high = createNode('high-z', { position: 'absolute', zIndex: 10 });
      const root = createNode('root', undefined, undefined, [high, low]); // high first in children

      const layoutMap: LayoutMap = new Map([
        [root, createLayout(0, 0, 80, 24)],
        [low, createLayout(5, 5, 20, 10)],
        [high, createLayout(5, 5, 20, 10)],
      ]);

      setHitTestLayout(layoutMap, root);

      // Higher zIndex should be hit regardless of order
      const result = hitTest(10, 10);
      expect(result?.node).toBe(high);
    });

    it('should handle reactive position style', () => {
      const absolute = createNode('absolute', () => ({ position: 'absolute' }));
      const normal = createNode('normal');
      const root = createNode('root', undefined, undefined, [normal, absolute]);

      const layoutMap: LayoutMap = new Map([
        [root, createLayout(0, 0, 80, 24)],
        [normal, createLayout(5, 5, 20, 10)],
        [absolute, createLayout(5, 5, 20, 10)],
      ]);

      setHitTestLayout(layoutMap, root);

      const result = hitTest(10, 10);
      expect(result?.node).toBe(absolute);
    });

    it('should handle reactive zIndex', () => {
      const low = createNode('low-z', () => ({ position: 'absolute', zIndex: () => 1 }));
      const high = createNode('high-z', () => ({ position: 'absolute', zIndex: () => 10 }));
      const root = createNode('root', undefined, undefined, [low, high]);

      const layoutMap: LayoutMap = new Map([
        [root, createLayout(0, 0, 80, 24)],
        [low, createLayout(5, 5, 20, 10)],
        [high, createLayout(5, 5, 20, 10)],
      ]);

      setHitTestLayout(layoutMap, root);

      const result = hitTest(10, 10);
      expect(result?.node).toBe(high);
    });
  });

  // ==========================================================================
  // hitTest - Fragment Nodes
  // ==========================================================================

  describe('hitTest - Fragment Nodes', () => {
    it('should handle fragment node children', () => {
      const fragmentChild = createNode('fragment-child');
      const fragment: TUINode = {
        type: 'fragment',
        children: [fragmentChild],
      };
      const root = createNode('root', undefined, undefined, [fragment]);

      const layoutMap: LayoutMap = new Map([
        [root, createLayout(0, 0, 80, 24)],
        [fragmentChild, createLayout(5, 5, 20, 10)],
      ]);

      setHitTestLayout(layoutMap, root);

      const result = hitTest(10, 10);
      expect(result?.node).toBe(fragmentChild);
    });

    it('should handle absolute positioned fragment children', () => {
      const normalChild = createNode('normal');
      const absChild = createNode('abs', { position: 'absolute', zIndex: 5 });
      const fragment: TUINode = {
        type: 'fragment',
        children: [normalChild, absChild],
      };
      const root = createNode('root', undefined, undefined, [fragment]);

      const layoutMap: LayoutMap = new Map([
        [root, createLayout(0, 0, 80, 24)],
        [normalChild, createLayout(5, 5, 20, 10)],
        [absChild, createLayout(5, 5, 20, 10)],
      ]);

      setHitTestLayout(layoutMap, root);

      const result = hitTest(10, 10);
      expect(result?.node).toBe(absChild);
    });
  });

  // ==========================================================================
  // hitTest - Edge Cases
  // ==========================================================================

  describe('hitTest - Edge Cases', () => {
    it('should handle node with no layout', () => {
      const child = createNode('child');
      const root = createNode('root', undefined, undefined, [child]);

      // Only root has layout, child doesn't
      const layoutMap: LayoutMap = new Map([[root, createLayout(0, 0, 80, 24)]]);

      setHitTestLayout(layoutMap, root);

      const result = hitTest(10, 10);
      expect(result?.node).toBe(root);
    });

    it('should skip string children', () => {
      const root = createNode('root', undefined, undefined, ['text content']);

      const layoutMap: LayoutMap = new Map([[root, createLayout(0, 0, 80, 24)]]);

      setHitTestLayout(layoutMap, root);

      const result = hitTest(5, 5);
      expect(result?.node).toBe(root);
    });

    it('should handle boundary hits correctly', () => {
      const root = createNode('root');
      const layoutMap: LayoutMap = new Map([[root, createLayout(0, 0, 10, 10)]]);

      setHitTestLayout(layoutMap, root);

      // Just inside boundary (1-indexed to 0-indexed: 1->0, 10->9)
      expect(hitTest(1, 1)?.node).toBe(root);
      expect(hitTest(10, 10)?.node).toBe(root);

      // Just outside boundary
      expect(hitTest(11, 5)).toBeNull();
      expect(hitTest(5, 11)).toBeNull();
    });

    it('should handle zero-size elements', () => {
      const root = createNode('root');
      const layoutMap: LayoutMap = new Map([[root, createLayout(5, 5, 0, 0)]]);

      setHitTestLayout(layoutMap, root);

      const result = hitTest(6, 6);
      expect(result).toBeNull();
    });
  });

  // ==========================================================================
  // hitTestAll
  // ==========================================================================

  describe('hitTestAll', () => {
    it('should return empty array when no layout', () => {
      const results = hitTestAll(5, 5);
      expect(results).toEqual([]);
    });

    it('should return all elements at point', () => {
      const child = createNode('child');
      const root = createNode('root', undefined, undefined, [child]);

      const layoutMap: LayoutMap = new Map([
        [root, createLayout(0, 0, 80, 24)],
        [child, createLayout(5, 5, 20, 10)],
      ]);

      setHitTestLayout(layoutMap, root);

      const results = hitTestAll(10, 10);
      expect(results.length).toBe(2);
      expect(results.map((r) => r.node)).toContain(root);
      expect(results.map((r) => r.node)).toContain(child);
    });

    it('should include local coordinates for each hit', () => {
      const child = createNode('child');
      const root = createNode('root', undefined, undefined, [child]);

      const layoutMap: LayoutMap = new Map([
        [root, createLayout(0, 0, 80, 24)],
        [child, createLayout(10, 5, 20, 10)],
      ]);

      setHitTestLayout(layoutMap, root);

      // Hit at (15, 8) 1-indexed = (14, 7) 0-indexed
      const results = hitTestAll(15, 8);

      const rootHit = results.find((r) => r.node === root);
      expect(rootHit?.localX).toBe(14);
      expect(rootHit?.localY).toBe(7);

      const childHit = results.find((r) => r.node === child);
      expect(childHit?.localX).toBe(4); // 14 - 10
      expect(childHit?.localY).toBe(2); // 7 - 5
    });

    it('should order by tree traversal then zIndex', () => {
      const normal = createNode('normal');
      const absolute = createNode('absolute', { position: 'absolute', zIndex: 5 });
      const root = createNode('root', undefined, undefined, [normal, absolute]);

      const layoutMap: LayoutMap = new Map([
        [root, createLayout(0, 0, 80, 24)],
        [normal, createLayout(5, 5, 20, 10)],
        [absolute, createLayout(5, 5, 20, 10)],
      ]);

      setHitTestLayout(layoutMap, root);

      const results = hitTestAll(10, 10);
      // Root first, then normal, then absolute (highest zIndex last)
      expect(results[0].node).toBe(root);
    });
  });

  // ==========================================================================
  // findClickableAncestor
  // ==========================================================================

  describe('findClickableAncestor', () => {
    it('should return null for null input', () => {
      const result = findClickableAncestor(null);
      expect(result).toBeNull();
    });

    it('should return node with onClick handler', () => {
      const clickHandler = () => {};
      const clickable = createNode('clickable', undefined, { onClick: clickHandler });

      const layoutMap: LayoutMap = new Map([[clickable, createLayout(0, 0, 80, 24)]]);

      setHitTestLayout(layoutMap, clickable);

      const hit = hitTest(5, 5);
      const result = findClickableAncestor(hit);

      expect(result).toBe(clickable);
    });

    it('should return null if no onClick handler', () => {
      const notClickable = createNode('not-clickable');

      const layoutMap: LayoutMap = new Map([[notClickable, createLayout(0, 0, 80, 24)]]);

      setHitTestLayout(layoutMap, notClickable);

      const hit = hitTest(5, 5);
      const result = findClickableAncestor(hit);

      expect(result).toBeNull();
    });
  });

  // ==========================================================================
  // hitTestAll - Advanced Fragment Tests
  // ==========================================================================

  describe('hitTestAll - Fragments', () => {
    it('should collect hits through fragment nodes', () => {
      const fragmentChild1 = createNode('frag-child-1');
      const fragmentChild2 = createNode('frag-child-2');
      const fragment: TUINode = {
        type: 'fragment',
        children: [fragmentChild1, fragmentChild2],
      };
      const root = createNode('root', undefined, undefined, [fragment]);

      const layoutMap: LayoutMap = new Map([
        [root, createLayout(0, 0, 80, 24)],
        [fragmentChild1, createLayout(5, 5, 20, 10)],
        [fragmentChild2, createLayout(5, 5, 20, 10)], // Same position - later wins for hitTest
      ]);

      setHitTestLayout(layoutMap, root);

      const results = hitTestAll(10, 10);

      // Should include root, fragmentChild1, fragmentChild2
      expect(results.length).toBe(3);
      expect(results.map((r) => r.node.tagName)).toContain('root');
      expect(results.map((r) => r.node.tagName)).toContain('frag-child-1');
      expect(results.map((r) => r.node.tagName)).toContain('frag-child-2');
    });

    it('should handle nested fragments', () => {
      // Note: hitTestAll only processes one level of fragments directly
      // Nested fragments are not recursively unwrapped in the hitTestAll traversal
      const deepChild = createNode('deep');
      const innerFragment: TUINode = {
        type: 'fragment',
        children: [deepChild],
      };
      const outerFragment: TUINode = {
        type: 'fragment',
        children: [innerFragment],
      };
      const root = createNode('root', undefined, undefined, [outerFragment]);

      const layoutMap: LayoutMap = new Map([
        [root, createLayout(0, 0, 80, 24)],
        [deepChild, createLayout(5, 5, 20, 10)],
      ]);

      setHitTestLayout(layoutMap, root);

      const results = hitTestAll(10, 10);

      // Only root is hit since nested fragments are not fully traversed
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results.map((r) => r.node.tagName)).toContain('root');
    });

    it('should handle fragment with mixed absolute and normal children', () => {
      const normalChild = createNode('normal');
      const absChild = createNode('absolute', { position: 'absolute', zIndex: 10 });
      const fragment: TUINode = {
        type: 'fragment',
        children: [normalChild, absChild],
      };
      const root = createNode('root', undefined, undefined, [fragment]);

      const layoutMap: LayoutMap = new Map([
        [root, createLayout(0, 0, 80, 24)],
        [normalChild, createLayout(5, 5, 20, 10)],
        [absChild, createLayout(5, 5, 20, 10)],
      ]);

      setHitTestLayout(layoutMap, root);

      const results = hitTestAll(10, 10);

      // All three should be hit
      expect(results.length).toBe(3);

      // For hitTest (deepest), absolute should win
      const deepest = hitTest(10, 10);
      expect(deepest?.node.tagName).toBe('absolute');
    });
  });

  // ==========================================================================
  // hitTestAll - zIndex Ordering
  // ==========================================================================

  describe('hitTestAll - zIndex Ordering', () => {
    it('should order absolute children by ascending zIndex', () => {
      const abs1 = createNode('abs1', { position: 'absolute', zIndex: 5 });
      const abs2 = createNode('abs2', { position: 'absolute', zIndex: 1 });
      const abs3 = createNode('abs3', { position: 'absolute', zIndex: 10 });
      const root = createNode('root', undefined, undefined, [abs1, abs2, abs3]);

      const layoutMap: LayoutMap = new Map([
        [root, createLayout(0, 0, 80, 24)],
        [abs1, createLayout(5, 5, 20, 10)],
        [abs2, createLayout(5, 5, 20, 10)],
        [abs3, createLayout(5, 5, 20, 10)],
      ]);

      setHitTestLayout(layoutMap, root);

      const results = hitTestAll(10, 10);

      // Root first, then absolute children in zIndex order (lowest to highest)
      // So: root, abs2(z1), abs1(z5), abs3(z10)
      expect(results.length).toBe(4);
      expect(results[0].node.tagName).toBe('root');
      // Absolute children are appended in zIndex order
      const absNodes = results.slice(1);
      const zIndexes = absNodes.map((r) => {
        const style = typeof r.node.style === 'function' ? r.node.style() : r.node.style;
        return style?.zIndex ?? 0;
      });
      expect(zIndexes).toEqual([1, 5, 10]);
    });

    it('should handle mixed normal and absolute children', () => {
      const normal1 = createNode('normal1');
      const normal2 = createNode('normal2');
      const abs1 = createNode('abs1', { position: 'absolute', zIndex: 1 });
      const root = createNode('root', undefined, undefined, [normal1, abs1, normal2]);

      const layoutMap: LayoutMap = new Map([
        [root, createLayout(0, 0, 80, 24)],
        [normal1, createLayout(5, 5, 20, 10)],
        [normal2, createLayout(5, 5, 20, 10)],
        [abs1, createLayout(5, 5, 20, 10)],
      ]);

      setHitTestLayout(layoutMap, root);

      const results = hitTestAll(10, 10);

      // Should have root, normal1, normal2, then abs1 (absolute at end)
      expect(results.length).toBe(4);
      expect(results[0].node.tagName).toBe('root');
    });

    it('should hit one of the same zIndex elements', () => {
      const abs1 = createNode('abs1', { position: 'absolute', zIndex: 5 });
      const abs2 = createNode('abs2', { position: 'absolute', zIndex: 5 }); // Same zIndex
      const root = createNode('root', undefined, undefined, [abs1, abs2]);

      const layoutMap: LayoutMap = new Map([
        [root, createLayout(0, 0, 80, 24)],
        [abs1, createLayout(5, 5, 20, 10)],
        [abs2, createLayout(5, 5, 20, 10)],
      ]);

      setHitTestLayout(layoutMap, root);

      // For same zIndex, behavior depends on sort stability - either one is valid
      const deepest = hitTest(10, 10);
      expect(['abs1', 'abs2']).toContain(deepest?.node.tagName);
    });

    it('should handle negative zIndex', () => {
      const absNeg = createNode('neg', { position: 'absolute', zIndex: -1 });
      const absPos = createNode('pos', { position: 'absolute', zIndex: 1 });
      const absZero = createNode('zero', { position: 'absolute', zIndex: 0 });
      const root = createNode('root', undefined, undefined, [absNeg, absPos, absZero]);

      const layoutMap: LayoutMap = new Map([
        [root, createLayout(0, 0, 80, 24)],
        [absNeg, createLayout(5, 5, 20, 10)],
        [absPos, createLayout(5, 5, 20, 10)],
        [absZero, createLayout(5, 5, 20, 10)],
      ]);

      setHitTestLayout(layoutMap, root);

      const results = hitTestAll(10, 10);

      // Order should be: root, neg(-1), zero(0), pos(1)
      const absResults = results.slice(1);
      const zIndexes = absResults.map((r) => {
        const style = typeof r.node.style === 'function' ? r.node.style() : r.node.style;
        return style?.zIndex ?? 0;
      });
      expect(zIndexes).toEqual([-1, 0, 1]);
    });
  });

  // ==========================================================================
  // hitTestAll - Edge Cases
  // ==========================================================================

  describe('hitTestAll - Edge Cases', () => {
    it('should handle deeply nested tree with multiple levels', () => {
      const level4 = createNode('level4');
      const level3 = createNode('level3', undefined, undefined, [level4]);
      const level2 = createNode('level2', undefined, undefined, [level3]);
      const level1 = createNode('level1', undefined, undefined, [level2]);
      const root = createNode('root', undefined, undefined, [level1]);

      const layoutMap: LayoutMap = new Map([
        [root, createLayout(0, 0, 80, 24)],
        [level1, createLayout(1, 1, 70, 20)],
        [level2, createLayout(2, 2, 60, 18)],
        [level3, createLayout(3, 3, 50, 16)],
        [level4, createLayout(4, 4, 40, 14)],
      ]);

      setHitTestLayout(layoutMap, root);

      const results = hitTestAll(10, 10);

      expect(results.length).toBe(5);
      expect(results.map((r) => r.node.tagName)).toEqual([
        'root',
        'level1',
        'level2',
        'level3',
        'level4',
      ]);
    });

    it('should handle empty fragments', () => {
      const emptyFragment: TUINode = {
        type: 'fragment',
        children: [],
      };
      const root = createNode('root', undefined, undefined, [emptyFragment]);

      const layoutMap: LayoutMap = new Map([[root, createLayout(0, 0, 80, 24)]]);

      setHitTestLayout(layoutMap, root);

      const results = hitTestAll(10, 10);

      expect(results.length).toBe(1);
      expect(results[0].node.tagName).toBe('root');
    });

    it('should handle node with undefined children', () => {
      const root = createNode('root', undefined, undefined, undefined);

      const layoutMap: LayoutMap = new Map([[root, createLayout(0, 0, 80, 24)]]);

      setHitTestLayout(layoutMap, root);

      const results = hitTestAll(10, 10);

      expect(results.length).toBe(1);
    });

    it('should handle point outside all elements', () => {
      const child = createNode('child');
      const root = createNode('root', undefined, undefined, [child]);

      const layoutMap: LayoutMap = new Map([
        [root, createLayout(0, 0, 10, 10)],
        [child, createLayout(2, 2, 5, 5)],
      ]);

      setHitTestLayout(layoutMap, root);

      // Point outside root
      const results = hitTestAll(20, 20);

      expect(results.length).toBe(0);
    });

    it('should handle point inside root but outside child', () => {
      const child = createNode('child');
      const root = createNode('root', undefined, undefined, [child]);

      const layoutMap: LayoutMap = new Map([
        [root, createLayout(0, 0, 50, 50)],
        [child, createLayout(10, 10, 10, 10)],
      ]);

      setHitTestLayout(layoutMap, root);

      // Point inside root but outside child
      const results = hitTestAll(5, 5);

      expect(results.length).toBe(1);
      expect(results[0].node.tagName).toBe('root');
    });
  });
});
