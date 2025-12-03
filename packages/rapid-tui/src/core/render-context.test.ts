/**
 * Render Context Tests
 *
 * Tests for the fine-grained reactivity context including:
 * - markNodeDirty() and dirty flag propagation
 * - markLayoutDirty() and layout invalidation
 * - Parent propagation for text/fragment nodes
 */

import { describe, expect, it, beforeEach, afterEach } from 'bun:test';
import {
  setRenderContext,
  markNodeDirty,
  markLayoutDirty,
  clearDirtyFlags,
  getRenderContext,
  invalidateLayout,
  hasDirtyNodes,
  scheduleNodeUpdate,
} from './render-context.js';
import type { TUINode } from './types.js';

// Mock render context
const createMockContext = () => {
  const dirtyNodes = new Set<TUINode>();
  let layoutDirty = false;
  let updateScheduled = false;

  return {
    context: {
      layoutMap: new Map(),
      dirtyNodes,
      layoutDirty,
      scheduleUpdate: () => {
        updateScheduled = true;
      },
      invalidateLayout: () => {
        layoutDirty = true;
      },
    },
    getDirtyNodes: () => dirtyNodes,
    isLayoutDirty: () => layoutDirty,
    isUpdateScheduled: () => updateScheduled,
  };
};

// Helper to create nodes
const createNode = (type: string, children: TUINode['children'] = []): TUINode => ({
  type: type as TUINode['type'],
  props: {},
  children,
});

describe('Render Context', () => {
  let mock: ReturnType<typeof createMockContext>;

  beforeEach(() => {
    mock = createMockContext();
    setRenderContext(mock.context);
  });

  afterEach(() => {
    setRenderContext(null as any);
  });

  // ==========================================================================
  // markNodeDirty
  // ==========================================================================

  describe('markNodeDirty', () => {
    it('should set _dirty flag on node', () => {
      const node = createNode('box');

      markNodeDirty(node);

      expect(node._dirty).toBe(true);
    });

    it('should add node to dirtyNodes set', () => {
      const node = createNode('box');

      markNodeDirty(node);

      expect(mock.getDirtyNodes().has(node)).toBe(true);
    });

    it('should schedule an update', () => {
      const node = createNode('box');

      markNodeDirty(node);

      expect(mock.isUpdateScheduled()).toBe(true);
    });

    it('should handle multiple nodes', () => {
      const node1 = createNode('box');
      const node2 = createNode('box');
      const node3 = createNode('box');

      markNodeDirty(node1);
      markNodeDirty(node2);
      markNodeDirty(node3);

      expect(mock.getDirtyNodes().size).toBe(3);
    });

    it('should not duplicate nodes in dirtyNodes set', () => {
      const node = createNode('box');

      markNodeDirty(node);
      markNodeDirty(node);
      markNodeDirty(node);

      expect(mock.getDirtyNodes().size).toBe(1);
    });

    it('should do nothing without context', () => {
      setRenderContext(null as any);
      const node = createNode('box');

      // Should not throw
      expect(() => markNodeDirty(node)).not.toThrow();
      expect(node._dirty).toBeUndefined();
    });
  });

  // ==========================================================================
  // Parent Propagation
  // ==========================================================================

  describe('Parent Propagation', () => {
    it('should propagate dirty flag from text node to parent', () => {
      const parent = createNode('box');
      const textNode = createNode('text');
      textNode.parentNode = parent;
      parent.children.push(textNode);

      markNodeDirty(textNode);

      expect(textNode._dirty).toBe(true);
      expect(parent._dirty).toBe(true);
    });

    it('should propagate dirty flag from fragment node to parent', () => {
      const parent = createNode('box');
      const fragment = createNode('fragment');
      fragment.parentNode = parent;
      parent.children.push(fragment);

      markNodeDirty(fragment);

      expect(fragment._dirty).toBe(true);
      expect(parent._dirty).toBe(true);
    });

    it('should propagate through nested text nodes', () => {
      const grandparent = createNode('box');
      const parent = createNode('text');
      const child = createNode('text');

      parent.parentNode = grandparent;
      child.parentNode = parent;
      grandparent.children.push(parent);
      parent.children.push(child);

      markNodeDirty(child);

      expect(child._dirty).toBe(true);
      expect(parent._dirty).toBe(true);
      expect(grandparent._dirty).toBe(true);
    });

    it('should stop propagation at box nodes', () => {
      const root = createNode('box');
      const outer = createNode('box');
      const text = createNode('text');

      outer.parentNode = root;
      text.parentNode = outer;
      root.children.push(outer);
      outer.children.push(text);

      markNodeDirty(text);

      expect(text._dirty).toBe(true);
      expect(outer._dirty).toBe(true);
      // Should stop at outer (box), not propagate to root
      expect(root._dirty).toBeUndefined();
    });

    it('should add all propagated nodes to dirtyNodes set', () => {
      const parent = createNode('text');
      const child = createNode('text');
      child.parentNode = parent;
      parent.children.push(child);

      markNodeDirty(child);

      expect(mock.getDirtyNodes().has(child)).toBe(true);
      expect(mock.getDirtyNodes().has(parent)).toBe(true);
    });

    it('should not propagate from box nodes', () => {
      const parent = createNode('box');
      const child = createNode('box');
      child.parentNode = parent;
      parent.children.push(child);

      markNodeDirty(child);

      expect(child._dirty).toBe(true);
      expect(parent._dirty).toBeUndefined();
    });

    it('should handle nodes without parentNode', () => {
      const orphan = createNode('text');

      markNodeDirty(orphan);

      expect(orphan._dirty).toBe(true);
      // Should not throw
    });
  });

  // ==========================================================================
  // markLayoutDirty
  // ==========================================================================

  describe('markLayoutDirty', () => {
    it('should set _layoutDirty flag on node', () => {
      const node = createNode('box');

      markLayoutDirty(node);

      expect(node._layoutDirty).toBe(true);
    });

    it('should also set _dirty flag', () => {
      const node = createNode('box');

      markLayoutDirty(node);

      expect(node._dirty).toBe(true);
    });

    it('should add node to dirtyNodes set', () => {
      const node = createNode('box');

      markLayoutDirty(node);

      expect(mock.getDirtyNodes().has(node)).toBe(true);
    });

    it('should do nothing without context', () => {
      setRenderContext(null as any);
      const node = createNode('box');

      expect(() => markLayoutDirty(node)).not.toThrow();
    });
  });

  // ==========================================================================
  // clearDirtyFlags
  // ==========================================================================

  describe('clearDirtyFlags', () => {
    it('should clear _dirty flag from all nodes', () => {
      const node1 = createNode('box');
      const node2 = createNode('text');

      markNodeDirty(node1);
      markNodeDirty(node2);

      clearDirtyFlags();

      expect(node1._dirty).toBe(false);
      expect(node2._dirty).toBe(false);
    });

    it('should clear _layoutDirty flag from all nodes', () => {
      const node = createNode('box');

      markLayoutDirty(node);

      clearDirtyFlags();

      expect(node._layoutDirty).toBe(false);
    });

    it('should clear dirtyNodes set', () => {
      const node = createNode('box');

      markNodeDirty(node);
      clearDirtyFlags();

      expect(mock.getDirtyNodes().size).toBe(0);
    });

    it('should handle empty dirtyNodes set', () => {
      expect(() => clearDirtyFlags()).not.toThrow();
    });
  });

  // ==========================================================================
  // getRenderContext
  // ==========================================================================

  describe('getRenderContext', () => {
    it('should return the current context', () => {
      const context = getRenderContext();

      expect(context).toBe(mock.context);
    });

    it('should return null when no context set', () => {
      setRenderContext(null as any);

      const context = getRenderContext();

      expect(context).toBeNull();
    });
  });

  // ==========================================================================
  // Edge Cases
  // ==========================================================================

  describe('Edge Cases', () => {
    it('should handle marking same node dirty multiple times', () => {
      const node = createNode('box');

      markNodeDirty(node);
      markNodeDirty(node);
      markNodeDirty(node);

      expect(node._dirty).toBe(true);
      expect(mock.getDirtyNodes().size).toBe(1);
    });

    it('should handle very deep nesting', () => {
      const nodes: TUINode[] = [];
      let current = createNode('box');
      nodes.push(current);

      // Create 50 levels of text nodes
      for (let i = 0; i < 50; i++) {
        const child = createNode('text');
        child.parentNode = current;
        current.children.push(child);
        nodes.push(child);
        current = child;
      }

      // Mark the deepest node dirty
      markNodeDirty(current);

      // All text nodes should be dirty, stopping at the root box
      expect(current._dirty).toBe(true);
    });

    it('should handle nodes with no type gracefully', () => {
      const weirdNode = { props: {}, children: [] } as any;

      // Should not throw
      expect(() => markNodeDirty(weirdNode)).not.toThrow();
    });
  });

  // ==========================================================================
  // invalidateLayout
  // ==========================================================================

  describe('invalidateLayout', () => {
    it('should call context invalidateLayout', () => {
      invalidateLayout();

      expect(mock.isLayoutDirty()).toBe(true);
    });

    it('should do nothing without context', () => {
      setRenderContext(null as any);

      // Should not throw
      expect(() => invalidateLayout()).not.toThrow();
    });
  });

  // ==========================================================================
  // hasDirtyNodes
  // ==========================================================================

  describe('hasDirtyNodes', () => {
    it('should return false when no dirty nodes', () => {
      expect(hasDirtyNodes()).toBe(false);
    });

    it('should return true when nodes are dirty', () => {
      const node = createNode('box');

      markNodeDirty(node);

      expect(hasDirtyNodes()).toBe(true);
    });

    it('should return true when layout is dirty', () => {
      // Manually set layoutDirty to true
      (mock.context as any).layoutDirty = true;

      expect(hasDirtyNodes()).toBe(true);
    });

    it('should return false without context', () => {
      setRenderContext(null as any);

      expect(hasDirtyNodes()).toBe(false);
    });

    it('should return false after clearing dirty flags', () => {
      const node = createNode('box');

      markNodeDirty(node);
      expect(hasDirtyNodes()).toBe(true);

      clearDirtyFlags();
      expect(hasDirtyNodes()).toBe(false);
    });
  });

  // ==========================================================================
  // scheduleNodeUpdate (legacy API)
  // ==========================================================================

  describe('scheduleNodeUpdate', () => {
    it('should mark node dirty (same as markNodeDirty)', () => {
      const node = createNode('box');

      scheduleNodeUpdate(node, 'any content');

      expect(node._dirty).toBe(true);
      expect(mock.getDirtyNodes().has(node)).toBe(true);
    });

    it('should schedule an update', () => {
      const node = createNode('box');

      scheduleNodeUpdate(node, 'content');

      expect(mock.isUpdateScheduled()).toBe(true);
    });

    it('should ignore content parameter', () => {
      const node1 = createNode('box');
      const node2 = createNode('box');

      scheduleNodeUpdate(node1, 'content1');
      scheduleNodeUpdate(node2, 'content2');

      // Both nodes should be dirty regardless of content
      expect(node1._dirty).toBe(true);
      expect(node2._dirty).toBe(true);
    });
  });

  // ==========================================================================
  // Integration Scenarios
  // ==========================================================================

  describe('Integration Scenarios', () => {
    it('should handle typical signal update flow', () => {
      // Simulate a signal changing a text node
      const parent = createNode('box');
      const textNode = createNode('text');
      textNode.parentNode = parent;
      parent.children.push(textNode);

      // Step 1: Signal changes -> markNodeDirty
      markNodeDirty(textNode);

      // Verify state after marking
      expect(textNode._dirty).toBe(true);
      expect(parent._dirty).toBe(true);
      expect(hasDirtyNodes()).toBe(true);
      expect(mock.isUpdateScheduled()).toBe(true);

      // Step 2: After flush -> clearDirtyFlags
      clearDirtyFlags();

      // Verify state after clear
      expect(textNode._dirty).toBe(false);
      expect(parent._dirty).toBe(false);
      expect(hasDirtyNodes()).toBe(false);
    });

    it('should handle layout-affecting changes', () => {
      const node = createNode('box');

      // Layout change (e.g., width changed)
      markLayoutDirty(node);

      expect(node._dirty).toBe(true);
      expect(node._layoutDirty).toBe(true);
      expect(mock.isLayoutDirty()).toBe(true);

      clearDirtyFlags();

      expect(node._dirty).toBe(false);
      expect(node._layoutDirty).toBe(false);
    });

    it('should handle multiple nodes with mixed dirty states', () => {
      const box1 = createNode('box');
      const box2 = createNode('box');
      const text1 = createNode('text');

      // Different operations
      markNodeDirty(box1); // Content only
      markLayoutDirty(box2); // Content + layout
      markNodeDirty(text1); // Content only

      expect(mock.getDirtyNodes().size).toBe(3);
      expect(box1._dirty).toBe(true);
      expect(box1._layoutDirty).toBeUndefined();
      expect(box2._dirty).toBe(true);
      expect(box2._layoutDirty).toBe(true);
      expect(text1._dirty).toBe(true);

      clearDirtyFlags();

      expect(mock.getDirtyNodes().size).toBe(0);
    });

    it('should handle context switch during operation', () => {
      const node = createNode('box');
      markNodeDirty(node);

      // Clear context
      setRenderContext(null as any);

      // Operations should be no-ops now
      const node2 = createNode('text');
      markNodeDirty(node2);
      expect(node2._dirty).toBeUndefined();

      // Restore context
      setRenderContext(mock.context);
      markNodeDirty(node2);
      expect(node2._dirty).toBe(true);
    });
  });
});
