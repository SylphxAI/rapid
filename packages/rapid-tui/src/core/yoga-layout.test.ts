/**
 * Yoga Layout Integration Tests
 *
 * Tests for flexbox layout computation using Yoga WASM.
 */
import { describe, expect, it } from 'bun:test';
import { computeLayout, type LayoutMap, type LayoutResult } from './yoga-layout.js';
import type { TUINode, TUIStyle } from './types.js';

// Helper to create a box node
const createBox = (
  style: TUIStyle = {},
  children: (string | TUINode)[] = [],
  tagName?: string,
): TUINode => ({
  type: 'box',
  tagName: tagName ?? 'box',
  style,
  children,
});

// Helper to create a text node
const createText = (content: string, style: TUIStyle = {}): TUINode => ({
  type: 'text',
  tagName: 'text',
  style,
  children: [content],
});

// Helper to create a fragment node
const createFragment = (children: (string | TUINode)[], style: TUIStyle = {}): TUINode => ({
  type: 'fragment',
  children,
  style,
});

describe('computeLayout', () => {
  // ==========================================================================
  // Basic Layout
  // ==========================================================================

  describe('Basic Layout', () => {
    it('should compute layout for a simple box', async () => {
      const root = createBox({ width: 80, height: 24 });
      const layoutMap = await computeLayout(root, 80, 24);

      expect(layoutMap.size).toBeGreaterThan(0);

      const rootLayout = layoutMap.get(root);
      expect(rootLayout).toBeDefined();
      expect(rootLayout?.x).toBe(0);
      expect(rootLayout?.y).toBe(0);
      expect(rootLayout?.width).toBe(80);
      expect(rootLayout?.height).toBe(24);
    });

    it('should handle empty node', async () => {
      const root = createBox({});
      const layoutMap = await computeLayout(root, 80, 24);

      expect(layoutMap.get(root)).toBeDefined();
    });

    it('should handle nested boxes', async () => {
      const child = createBox({ width: 40, height: 10 });
      const root = createBox({ width: 80, height: 24 }, [child]);
      const layoutMap = await computeLayout(root, 80, 24);

      const childLayout = layoutMap.get(child);
      expect(childLayout).toBeDefined();
      expect(childLayout?.width).toBe(40);
      expect(childLayout?.height).toBe(10);
    });

    it('should respect available dimensions', async () => {
      const root = createBox({});
      const layoutMap = await computeLayout(root, 100, 50);

      const rootLayout = layoutMap.get(root);
      expect(rootLayout).toBeDefined();
    });
  });

  // ==========================================================================
  // Flex Direction
  // ==========================================================================

  describe('Flex Direction', () => {
    it('should layout children in column by default', async () => {
      const child1 = createBox({ height: 5 });
      const child2 = createBox({ height: 5 });
      const root = createBox({ width: 80, height: 24, flexDirection: 'column' }, [child1, child2]);

      const layoutMap = await computeLayout(root, 80, 24);

      const layout1 = layoutMap.get(child1);
      const layout2 = layoutMap.get(child2);

      expect(layout1?.y).toBe(0);
      expect(layout2?.y).toBe(5);
    });

    it('should layout children in row', async () => {
      const child1 = createBox({ width: 20 });
      const child2 = createBox({ width: 20 });
      const root = createBox({ width: 80, height: 24, flexDirection: 'row' }, [child1, child2]);

      const layoutMap = await computeLayout(root, 80, 24);

      const layout1 = layoutMap.get(child1);
      const layout2 = layoutMap.get(child2);

      expect(layout1?.x).toBe(0);
      expect(layout2?.x).toBe(20);
    });
  });

  // ==========================================================================
  // Justify Content
  // ==========================================================================

  describe('Justify Content', () => {
    it('should justify content center', async () => {
      const child = createBox({ width: 20, height: 10 });
      const root = createBox(
        { width: 80, height: 24, flexDirection: 'row', justifyContent: 'center' },
        [child],
      );

      const layoutMap = await computeLayout(root, 80, 24);
      const childLayout = layoutMap.get(child);

      // Child should be centered: (80 - 20) / 2 = 30
      expect(childLayout?.x).toBe(30);
    });

    it('should justify content flex-start', async () => {
      const child = createBox({ width: 20, height: 10 });
      const root = createBox(
        { width: 80, height: 24, flexDirection: 'row', justifyContent: 'flex-start' },
        [child],
      );

      const layoutMap = await computeLayout(root, 80, 24);
      const childLayout = layoutMap.get(child);

      expect(childLayout?.x).toBe(0);
    });

    it('should justify content flex-end', async () => {
      const child = createBox({ width: 20, height: 10 });
      const root = createBox(
        { width: 80, height: 24, flexDirection: 'row', justifyContent: 'flex-end' },
        [child],
      );

      const layoutMap = await computeLayout(root, 80, 24);
      const childLayout = layoutMap.get(child);

      expect(childLayout?.x).toBe(60); // 80 - 20
    });

    it('should justify content space-between', async () => {
      const child1 = createBox({ width: 10, height: 10 });
      const child2 = createBox({ width: 10, height: 10 });
      const root = createBox(
        { width: 80, height: 24, flexDirection: 'row', justifyContent: 'space-between' },
        [child1, child2],
      );

      const layoutMap = await computeLayout(root, 80, 24);
      const layout1 = layoutMap.get(child1);
      const layout2 = layoutMap.get(child2);

      expect(layout1?.x).toBe(0);
      expect(layout2?.x).toBe(70); // 80 - 10
    });

    it('should justify content space-around', async () => {
      const child1 = createBox({ width: 10, height: 10 });
      const child2 = createBox({ width: 10, height: 10 });
      const root = createBox(
        { width: 80, height: 24, flexDirection: 'row', justifyContent: 'space-around' },
        [child1, child2],
      );

      const layoutMap = await computeLayout(root, 80, 24);
      const layout1 = layoutMap.get(child1);
      const layout2 = layoutMap.get(child2);

      // Space around: remaining = 60, spaces = 4, each = 15
      expect(layout1?.x).toBe(15);
      expect(layout2?.x).toBe(55);
    });
  });

  // ==========================================================================
  // Align Items
  // ==========================================================================

  describe('Align Items', () => {
    it('should align items center', async () => {
      const child = createBox({ width: 20, height: 10 });
      const root = createBox(
        { width: 80, height: 24, flexDirection: 'row', alignItems: 'center' },
        [child],
      );

      const layoutMap = await computeLayout(root, 80, 24);
      const childLayout = layoutMap.get(child);

      // Child should be centered vertically: (24 - 10) / 2 = 7
      expect(childLayout?.y).toBe(7);
    });

    it('should align items flex-start', async () => {
      const child = createBox({ width: 20, height: 10 });
      const root = createBox(
        { width: 80, height: 24, flexDirection: 'row', alignItems: 'flex-start' },
        [child],
      );

      const layoutMap = await computeLayout(root, 80, 24);
      const childLayout = layoutMap.get(child);

      expect(childLayout?.y).toBe(0);
    });

    it('should align items flex-end', async () => {
      const child = createBox({ width: 20, height: 10 });
      const root = createBox(
        { width: 80, height: 24, flexDirection: 'row', alignItems: 'flex-end' },
        [child],
      );

      const layoutMap = await computeLayout(root, 80, 24);
      const childLayout = layoutMap.get(child);

      expect(childLayout?.y).toBe(14); // 24 - 10
    });
  });

  // ==========================================================================
  // Width and Height
  // ==========================================================================

  describe('Width and Height', () => {
    it('should handle fixed width and height', async () => {
      const root = createBox({ width: 50, height: 30 });
      const layoutMap = await computeLayout(root, 80, 24);

      const rootLayout = layoutMap.get(root);
      expect(rootLayout?.width).toBe(50);
      expect(rootLayout?.height).toBe(30);
    });

    it('should handle percentage width', async () => {
      const child = createBox({ width: '50%', height: 10 });
      const root = createBox({ width: 80, height: 24 }, [child]);

      const layoutMap = await computeLayout(root, 80, 24);
      const childLayout = layoutMap.get(child);

      expect(childLayout?.width).toBe(40);
    });

    it('should handle percentage height', async () => {
      const child = createBox({ width: 40, height: '50%' });
      const root = createBox({ width: 80, height: 24 }, [child]);

      const layoutMap = await computeLayout(root, 80, 24);
      const childLayout = layoutMap.get(child);

      expect(childLayout?.height).toBe(12);
    });

    it('should handle auto width', async () => {
      const root = createBox({ width: 'auto', height: 24 });
      const layoutMap = await computeLayout(root, 80, 24);

      const rootLayout = layoutMap.get(root);
      expect(rootLayout).toBeDefined();
    });

    it('should handle minWidth and maxWidth', async () => {
      const child = createBox({ width: 100, minWidth: 20, maxWidth: 60, height: 10 });
      const root = createBox({ width: 80, height: 24 }, [child]);

      const layoutMap = await computeLayout(root, 80, 24);
      const childLayout = layoutMap.get(child);

      expect(childLayout?.width).toBe(60); // Clamped to maxWidth
    });

    it('should handle minHeight and maxHeight', async () => {
      const child = createBox({ width: 40, height: 100, minHeight: 5, maxHeight: 15 });
      const root = createBox({ width: 80, height: 24 }, [child]);

      const layoutMap = await computeLayout(root, 80, 24);
      const childLayout = layoutMap.get(child);

      expect(childLayout?.height).toBe(15); // Clamped to maxHeight
    });

    it('should handle function values for width', async () => {
      const root = createBox({ width: () => 60, height: 24 });
      const layoutMap = await computeLayout(root, 80, 24);

      const rootLayout = layoutMap.get(root);
      expect(rootLayout?.width).toBe(60);
    });

    it('should handle function values for height', async () => {
      const root = createBox({ width: 80, height: () => 20 });
      const layoutMap = await computeLayout(root, 80, 24);

      const rootLayout = layoutMap.get(root);
      expect(rootLayout?.height).toBe(20);
    });
  });

  // ==========================================================================
  // Padding
  // ==========================================================================

  describe('Padding', () => {
    it('should apply padding', async () => {
      const child = createBox({ flex: 1 });
      const root = createBox({ width: 80, height: 24, padding: 2 }, [child]);

      const layoutMap = await computeLayout(root, 80, 24);
      const childLayout = layoutMap.get(child);

      // Child should be inset by padding
      expect(childLayout?.x).toBe(2);
      expect(childLayout?.y).toBe(2);
      expect(childLayout?.width).toBe(76); // 80 - 2*2
      expect(childLayout?.height).toBe(20); // 24 - 2*2
    });

    it('should apply paddingX and paddingY', async () => {
      const child = createBox({ flex: 1 });
      const root = createBox({ width: 80, height: 24, paddingX: 4, paddingY: 2 }, [child]);

      const layoutMap = await computeLayout(root, 80, 24);
      const childLayout = layoutMap.get(child);

      expect(childLayout?.x).toBe(4);
      expect(childLayout?.y).toBe(2);
      expect(childLayout?.width).toBe(72); // 80 - 2*4
      expect(childLayout?.height).toBe(20); // 24 - 2*2
    });
  });

  // ==========================================================================
  // Margin
  // ==========================================================================

  describe('Margin', () => {
    it('should apply margin', async () => {
      const child = createBox({ width: 40, height: 10, margin: 2 });
      const root = createBox({ width: 80, height: 24 }, [child]);

      const layoutMap = await computeLayout(root, 80, 24);
      const childLayout = layoutMap.get(child);

      expect(childLayout?.x).toBe(2);
      expect(childLayout?.y).toBe(2);
    });

    it('should apply marginX and marginY', async () => {
      const child = createBox({ width: 40, height: 10, marginX: 4, marginY: 2 });
      const root = createBox({ width: 80, height: 24 }, [child]);

      const layoutMap = await computeLayout(root, 80, 24);
      const childLayout = layoutMap.get(child);

      expect(childLayout?.x).toBe(4);
      expect(childLayout?.y).toBe(2);
    });

    it('should apply individual margins', async () => {
      const child = createBox({
        width: 40,
        height: 10,
        marginTop: 1,
        marginRight: 2,
        marginBottom: 3,
        marginLeft: 4,
      });
      const root = createBox({ width: 80, height: 24 }, [child]);

      const layoutMap = await computeLayout(root, 80, 24);
      const childLayout = layoutMap.get(child);

      expect(childLayout?.x).toBe(4);
      expect(childLayout?.y).toBe(1);
    });
  });

  // ==========================================================================
  // Border
  // ==========================================================================

  describe('Border', () => {
    it('should account for border in layout', async () => {
      const child = createBox({ flex: 1 });
      const root = createBox({ width: 80, height: 24, borderStyle: 'single' }, [child]);

      const layoutMap = await computeLayout(root, 80, 24);
      const childLayout = layoutMap.get(child);

      // Border adds 1px on each side
      expect(childLayout?.x).toBe(1);
      expect(childLayout?.y).toBe(1);
      expect(childLayout?.width).toBe(78); // 80 - 2*1
      expect(childLayout?.height).toBe(22); // 24 - 2*1
    });

    it('should handle borderStyle as function', async () => {
      const child = createBox({ flex: 1 });
      const root = createBox({ width: 80, height: 24, borderStyle: () => 'single' }, [child]);

      const layoutMap = await computeLayout(root, 80, 24);
      const childLayout = layoutMap.get(child);

      expect(childLayout?.x).toBe(1);
      expect(childLayout?.y).toBe(1);
    });

    it('should not add border space for borderStyle none', async () => {
      const child = createBox({ flex: 1 });
      const root = createBox({ width: 80, height: 24, borderStyle: 'none' }, [child]);

      const layoutMap = await computeLayout(root, 80, 24);
      const childLayout = layoutMap.get(child);

      expect(childLayout?.x).toBe(0);
      expect(childLayout?.y).toBe(0);
    });
  });

  // ==========================================================================
  // Flex Properties
  // ==========================================================================

  describe('Flex Properties', () => {
    it('should handle flex: 1', async () => {
      const child1 = createBox({ flex: 1 });
      const child2 = createBox({ flex: 1 });
      const root = createBox({ width: 80, height: 24, flexDirection: 'row' }, [child1, child2]);

      const layoutMap = await computeLayout(root, 80, 24);
      const layout1 = layoutMap.get(child1);
      const layout2 = layoutMap.get(child2);

      expect(layout1?.width).toBe(40);
      expect(layout2?.width).toBe(40);
    });

    it('should handle different flex values', async () => {
      const child1 = createBox({ flex: 1 });
      const child2 = createBox({ flex: 2 });
      const root = createBox({ width: 90, height: 24, flexDirection: 'row' }, [child1, child2]);

      const layoutMap = await computeLayout(root, 90, 24);
      const layout1 = layoutMap.get(child1);
      const layout2 = layoutMap.get(child2);

      expect(layout1?.width).toBe(30); // 90 * 1/3
      expect(layout2?.width).toBe(60); // 90 * 2/3
    });

    it('should handle flexGrow', async () => {
      const child1 = createBox({ flexGrow: 1, width: 20 });
      const child2 = createBox({ width: 20 });
      const root = createBox({ width: 80, height: 24, flexDirection: 'row' }, [child1, child2]);

      const layoutMap = await computeLayout(root, 80, 24);
      const layout1 = layoutMap.get(child1);
      const layout2 = layoutMap.get(child2);

      expect(layout1?.width).toBe(60); // Takes remaining space
      expect(layout2?.width).toBe(20); // Fixed width
    });

    it('should handle flexShrink', async () => {
      const child1 = createBox({ flexShrink: 0, width: 50 });
      const child2 = createBox({ flexShrink: 1, width: 50 });
      const root = createBox({ width: 80, height: 24, flexDirection: 'row' }, [child1, child2]);

      const layoutMap = await computeLayout(root, 80, 24);
      const layout1 = layoutMap.get(child1);
      const layout2 = layoutMap.get(child2);

      expect(layout1?.width).toBe(50); // Won't shrink
      expect(layout2?.width).toBe(30); // Shrinks to fit
    });

    it('should handle flex as function', async () => {
      const child = createBox({ flex: () => 1 });
      const root = createBox({ width: 80, height: 24 }, [child]);

      const layoutMap = await computeLayout(root, 80, 24);
      const childLayout = layoutMap.get(child);

      expect(childLayout?.width).toBe(80);
    });
  });

  // ==========================================================================
  // Gap
  // ==========================================================================

  describe('Gap', () => {
    it('should apply gap between children', async () => {
      const child1 = createBox({ width: 20, height: 10 });
      const child2 = createBox({ width: 20, height: 10 });
      const root = createBox({ width: 80, height: 24, flexDirection: 'row', gap: 10 }, [
        child1,
        child2,
      ]);

      const layoutMap = await computeLayout(root, 80, 24);
      const layout1 = layoutMap.get(child1);
      const layout2 = layoutMap.get(child2);

      expect(layout1?.x).toBe(0);
      expect(layout2?.x).toBe(30); // 20 + 10 gap
    });
  });

  // ==========================================================================
  // Position
  // ==========================================================================

  describe('Position', () => {
    it('should handle absolute positioning', async () => {
      const child = createBox({ position: 'absolute', left: 10, top: 5, width: 30, height: 15 });
      const root = createBox({ width: 80, height: 24 }, [child]);

      const layoutMap = await computeLayout(root, 80, 24);
      const childLayout = layoutMap.get(child);

      expect(childLayout?.x).toBe(10);
      expect(childLayout?.y).toBe(5);
    });

    it('should handle right and bottom positioning', async () => {
      const child = createBox({
        position: 'absolute',
        right: 10,
        bottom: 5,
        width: 20,
        height: 10,
      });
      const root = createBox({ width: 80, height: 24 }, [child]);

      const layoutMap = await computeLayout(root, 80, 24);
      const childLayout = layoutMap.get(child);

      expect(childLayout?.x).toBe(50); // 80 - 10 - 20
      expect(childLayout?.y).toBe(9); // 24 - 5 - 10
    });

    it('should handle position as function', async () => {
      const child = createBox({ position: () => 'absolute', left: 15, top: 10, width: 20, height: 10 });
      const root = createBox({ width: 80, height: 24 }, [child]);

      const layoutMap = await computeLayout(root, 80, 24);
      const childLayout = layoutMap.get(child);

      expect(childLayout?.x).toBe(15);
      expect(childLayout?.y).toBe(10);
    });

    it('should handle position offsets as functions', async () => {
      const child = createBox({
        position: 'absolute',
        left: () => 10,
        top: () => 5,
        width: 20,
        height: 10,
      });
      const root = createBox({ width: 80, height: 24 }, [child]);

      const layoutMap = await computeLayout(root, 80, 24);
      const childLayout = layoutMap.get(child);

      expect(childLayout?.x).toBe(10);
      expect(childLayout?.y).toBe(5);
    });
  });

  // ==========================================================================
  // Text Nodes
  // ==========================================================================

  describe('Text Nodes', () => {
    it('should size text node based on content', async () => {
      const text = createText('Hello');
      const root = createBox({ width: 80, height: 24 }, [text]);

      const layoutMap = await computeLayout(root, 80, 24);
      const textLayout = layoutMap.get(text);

      expect(textLayout).toBeDefined();
      expect(textLayout?.width).toBe(5); // "Hello" is 5 characters
      expect(textLayout?.height).toBe(1);
    });

    it('should handle CJK text width', async () => {
      const text = createText('中文');
      const root = createBox({ width: 80, height: 24 }, [text]);

      const layoutMap = await computeLayout(root, 80, 24);
      const textLayout = layoutMap.get(text);

      expect(textLayout?.width).toBe(4); // Each CJK char is width 2
    });

    it('should respect explicit width on text node', async () => {
      const text = createText('Hello', { width: 20 });
      const root = createBox({ width: 80, height: 24 }, [text]);

      const layoutMap = await computeLayout(root, 80, 24);
      const textLayout = layoutMap.get(text);

      expect(textLayout?.width).toBe(20);
    });
  });

  // ==========================================================================
  // Fragment Nodes
  // ==========================================================================

  describe('Fragment Nodes', () => {
    it('should handle fragment nodes', async () => {
      const child1 = createBox({ width: 20, height: 10 });
      const child2 = createBox({ width: 20, height: 10 });
      const fragment = createFragment([child1, child2]);
      const root = createBox({ width: 80, height: 24, flexDirection: 'column' }, [fragment]);

      const layoutMap = await computeLayout(root, 80, 24);

      expect(layoutMap.get(fragment)).toBeDefined();
      expect(layoutMap.get(child1)).toBeDefined();
      expect(layoutMap.get(child2)).toBeDefined();
    });

    it('should layout fragment children', async () => {
      const child1 = createBox({ height: 5 });
      const child2 = createBox({ height: 5 });
      const fragment = createFragment([child1, child2]);
      const root = createBox({ width: 80, height: 24, flexDirection: 'column' }, [fragment]);

      const layoutMap = await computeLayout(root, 80, 24);
      const layout1 = layoutMap.get(child1);
      const layout2 = layoutMap.get(child2);

      // Fragment children should stack vertically
      expect(layout2!.y).toBeGreaterThan(layout1!.y);
    });

    it('should inherit parent flexDirection in fragment', async () => {
      const child1 = createBox({ width: 20, height: 10 });
      const child2 = createBox({ width: 20, height: 10 });
      const fragment = createFragment([child1, child2], { flexDirection: 'row' });
      const root = createBox({ width: 80, height: 24, flexDirection: 'row' }, [fragment]);

      const layoutMap = await computeLayout(root, 80, 24);
      const layout1 = layoutMap.get(child1);
      const layout2 = layoutMap.get(child2);

      // Fragment children should be side by side
      expect(layout2!.x).toBeGreaterThan(layout1!.x);
    });
  });

  // ==========================================================================
  // Layout Result Structure
  // ==========================================================================

  describe('Layout Result', () => {
    it('should return LayoutMap with correct structure', async () => {
      const root = createBox({ width: 80, height: 24 });
      const layoutMap = await computeLayout(root, 80, 24);

      expect(layoutMap instanceof Map).toBe(true);
    });

    it('should contain all nodes in layout map', async () => {
      const child1 = createBox({ width: 20, height: 10 });
      const child2 = createBox({ width: 20, height: 10 });
      const root = createBox({ width: 80, height: 24 }, [child1, child2]);

      const layoutMap = await computeLayout(root, 80, 24);

      expect(layoutMap.has(root)).toBe(true);
      expect(layoutMap.has(child1)).toBe(true);
      expect(layoutMap.has(child2)).toBe(true);
    });

    it('should have x, y, width, height in each layout result', async () => {
      const root = createBox({ width: 80, height: 24 });
      const layoutMap = await computeLayout(root, 80, 24);
      const layout = layoutMap.get(root);

      expect(layout).toHaveProperty('x');
      expect(layout).toHaveProperty('y');
      expect(layout).toHaveProperty('width');
      expect(layout).toHaveProperty('height');
    });
  });

  // ==========================================================================
  // Edge Cases
  // ==========================================================================

  describe('Edge Cases', () => {
    it('should handle deeply nested structures', async () => {
      const innermost = createBox({ width: 10, height: 5 });
      const level2 = createBox({ padding: 1 }, [innermost]);
      const level1 = createBox({ padding: 1 }, [level2]);
      const root = createBox({ width: 80, height: 24, padding: 1 }, [level1]);

      const layoutMap = await computeLayout(root, 80, 24);

      expect(layoutMap.size).toBe(4);
      expect(layoutMap.get(innermost)).toBeDefined();
    });

    it('should handle zero dimensions', async () => {
      const root = createBox({ width: 0, height: 0 });
      const layoutMap = await computeLayout(root, 80, 24);

      const layout = layoutMap.get(root);
      expect(layout?.width).toBe(0);
      expect(layout?.height).toBe(0);
    });

    it('should handle very large dimensions', async () => {
      const root = createBox({ width: 10000, height: 10000 });
      const layoutMap = await computeLayout(root, 10000, 10000);

      const layout = layoutMap.get(root);
      expect(layout?.width).toBe(10000);
      expect(layout?.height).toBe(10000);
    });

    it('should handle no children', async () => {
      const root = createBox({ width: 80, height: 24 }, []);
      const layoutMap = await computeLayout(root, 80, 24);

      expect(layoutMap.size).toBe(1);
    });

    it('should handle many children', async () => {
      const children = Array.from({ length: 100 }, () => createBox({ height: 1 }));
      const root = createBox({ width: 80, height: 200 }, children);

      const layoutMap = await computeLayout(root, 80, 200);

      expect(layoutMap.size).toBe(101); // root + 100 children
    });

    it('should handle mixed children types', async () => {
      const box = createBox({ width: 20, height: 5 });
      const text = createText('Hello');
      const root = createBox({ width: 80, height: 24 }, [box, text]);

      const layoutMap = await computeLayout(root, 80, 24);

      expect(layoutMap.get(box)).toBeDefined();
      expect(layoutMap.get(text)).toBeDefined();
    });
  });
});
