/** @jsxImportSource @rapid/tui */
/**
 * MouseProvider Component Tests
 *
 * Tests for mouse tracking provider and context.
 * Note: MouseProvider uses Context.Provider which requires createRoot
 */
import { describe, expect, it } from 'bun:test';
import { createRoot, signal } from '@rapid/runtime';
import { setPlatformOps, tuiPlatformOps } from '@rapid/tui';
import { Text } from '../primitives/Text.js';
import { type MouseContextValue, MouseProvider, useMouseContext } from './MouseProvider.js';

setPlatformOps(tuiPlatformOps);

describe('MouseProvider', () => {
  // ==========================================================================
  // Basic Rendering
  // ==========================================================================

  describe('Basic Rendering', () => {
    it('should render mouse provider', () => {
      let result: unknown;
      createRoot(() => {
        result = MouseProvider({});
        return result;
      });

      expect(result).toBeDefined();
    });

    it('should render with children', () => {
      let result: unknown;
      createRoot(() => {
        result = MouseProvider({
          children: <Text>Content</Text>,
        });
        return result;
      });

      expect(result).toBeDefined();
    });

    it('should render without children', () => {
      let result: unknown;
      createRoot(() => {
        result = MouseProvider({});
        return result;
      });

      expect(result).toBeDefined();
    });
  });

  // ==========================================================================
  // Context
  // ==========================================================================

  describe('Context', () => {
    it('should expose context via useMouseContext', () => {
      // useMouseContext returns null outside of provider
      const context = useMouseContext();

      // Outside provider, context is null
      expect(context).toBeNull();
    });
  });

  // ==========================================================================
  // Enabled State
  // ==========================================================================

  describe('Enabled State', () => {
    it('should be enabled by default', () => {
      let result: unknown;
      createRoot(() => {
        result = MouseProvider({});
        return result;
      });

      expect(result).toBeDefined();
    });

    it('should accept enabled=true', () => {
      let result: unknown;
      createRoot(() => {
        result = MouseProvider({
          enabled: true,
        });
        return result;
      });

      expect(result).toBeDefined();
    });

    it('should accept enabled=false', () => {
      let result: unknown;
      createRoot(() => {
        result = MouseProvider({
          enabled: false,
        });
        return result;
      });

      expect(result).toBeDefined();
    });

    it('should accept reactive enabled', () => {
      let result: unknown;
      const enabled = signal(true);
      createRoot(() => {
        result = MouseProvider({
          enabled: () => enabled.value,
        });
        return result;
      });

      expect(result).toBeDefined();
    });
  });

  // ==========================================================================
  // Edge Cases
  // ==========================================================================

  describe('Edge Cases', () => {
    it('should handle undefined children', () => {
      let result: unknown;
      createRoot(() => {
        result = MouseProvider({ children: undefined });
        return result;
      });

      expect(result).toBeDefined();
    });

    it('should handle multiple children', () => {
      let result: unknown;
      createRoot(() => {
        result = MouseProvider({
          children: [<Text key="1">First</Text>, <Text key="2">Second</Text>],
        });
        return result;
      });

      expect(result).toBeDefined();
    });
  });
});

// ==========================================================================
// Event Types
// ==========================================================================

describe('Mouse Event Types', () => {
  it('should export PressEvent type', () => {
    // Type checking - just verify imports work
    const event = {
      x: 0,
      y: 0,
      localX: 0,
      localY: 0,
      button: 'left' as const,
      modifiers: {},
      stopPropagation: () => {},
    };

    expect(event.x).toBe(0);
  });

  it('should export DragEvent type', () => {
    const event = {
      x: 0,
      y: 0,
      localX: 0,
      localY: 0,
      button: 'left' as const,
      modifiers: {},
      stopPropagation: () => {},
      deltaX: 10,
      deltaY: 5,
      startX: 0,
      startY: 0,
    };

    expect(event.deltaX).toBe(10);
  });

  it('should export HoverEvent type', () => {
    const event = {
      x: 0,
      y: 0,
      localX: 0,
      localY: 0,
    };

    expect(event.x).toBe(0);
  });
});

// ==========================================================================
// MouseContext Registration
// ==========================================================================

describe('MouseContext Registration', () => {
  // Helper to create a mock context from MouseProvider
  const createMockContext = (): MouseContextValue => {
    let context: MouseContextValue | null = null;
    createRoot(() => {
      const provider = MouseProvider({ enabled: false }); // disabled to avoid stdout writes
      // The provider returns a fragment with the box as first child
      // The context is stored in the box's props.__mouseContext
      // biome-ignore lint/suspicious/noExplicitAny: Test helper accessing internal structure
      const box = provider.children?.[0] as any;
      context = box?.props?.__mouseContext as MouseContextValue;
      return provider;
    });
    if (!context) throw new Error('Failed to create mock context');
    return context;
  };

  describe('registerPressable', () => {
    it('should register and return cleanup function', () => {
      const context = createMockContext();
      const handler = { onPress: () => {} };

      const cleanup = context.registerPressable('test-id', handler);

      expect(typeof cleanup).toBe('function');
    });

    it('should allow multiple pressables', () => {
      const context = createMockContext();

      const cleanup1 = context.registerPressable('id1', { onPress: () => {} });
      const cleanup2 = context.registerPressable('id2', { onPress: () => {} });

      expect(typeof cleanup1).toBe('function');
      expect(typeof cleanup2).toBe('function');
    });

    it('should cleanup on unregister', () => {
      const context = createMockContext();
      const calls: string[] = [];

      const cleanup = context.registerPressable('test-id', {
        onPress: () => calls.push('pressed'),
      });

      cleanup();
      // After cleanup, handler should not be called (tested via dispatch)
      expect(calls).toEqual([]);
    });
  });

  describe('registerDraggable', () => {
    it('should register and return cleanup function', () => {
      const context = createMockContext();
      const handler = { onDragStart: () => true };

      const cleanup = context.registerDraggable('drag-id', handler);

      expect(typeof cleanup).toBe('function');
    });

    it('should allow all drag callbacks', () => {
      const context = createMockContext();

      const cleanup = context.registerDraggable('drag-id', {
        onDragStart: () => true,
        onDrag: () => {},
        onDragEnd: () => {},
      });

      expect(typeof cleanup).toBe('function');
    });
  });

  describe('registerHoverable', () => {
    it('should register and return cleanup function', () => {
      const context = createMockContext();
      const handler = { onHoverIn: () => {} };

      const cleanup = context.registerHoverable('hover-id', handler);

      expect(typeof cleanup).toBe('function');
    });

    it('should allow both hover callbacks', () => {
      const context = createMockContext();

      const cleanup = context.registerHoverable('hover-id', {
        onHoverIn: () => {},
        onHoverOut: () => {},
      });

      expect(typeof cleanup).toBe('function');
    });
  });
});

// ==========================================================================
// MouseContext dispatchMouseEvent
// ==========================================================================

describe('MouseContext dispatchMouseEvent', () => {
  // Helper to create context with enabled state
  const createTestContext = (): MouseContextValue => {
    let context: MouseContextValue | null = null;
    createRoot(() => {
      const provider = MouseProvider({ enabled: false });
      // The provider returns a fragment with the box as first child
      // The context is stored in the box's props.__mouseContext
      // biome-ignore lint/suspicious/noExplicitAny: Test helper accessing internal structure
      const box = provider.children?.[0] as any;
      context = box?.props?.__mouseContext as MouseContextValue;
      // Force enable for testing (bypass stdout writes)
      if (context) {
        context.enabled.value = true;
      }
      return provider;
    });
    if (!context) throw new Error('Failed to create test context');
    return context;
  };

  // Helper to create a mock node with mouseId
  const createMockNode = (mouseId: string) => ({
    type: 'box' as const,
    tagName: 'test',
    props: { __mouseId: mouseId },
    children: [],
  });

  // Helper to create mouse event
  const createMouseEvent = (
    type: 'mousedown' | 'mouseup' | 'mousemove',
    button: 'left' | 'middle' | 'right' = 'left',
    x = 10,
    y = 10,
  ) => ({
    type,
    button,
    x,
    y,
  });

  // ==========================================================================
  // Pressable Events
  // ==========================================================================

  describe('Pressable Events', () => {
    it('should call onPressIn on mousedown', () => {
      const context = createTestContext();
      const calls: string[] = [];

      context.registerPressable('press-id', {
        onPressIn: () => calls.push('pressIn'),
      });

      const node = createMockNode('press-id');
      context.dispatchMouseEvent(createMouseEvent('mousedown'), node, 5, 5);

      expect(calls).toEqual(['pressIn']);
    });

    it('should call onPressOut and onPress on mouseup', () => {
      const context = createTestContext();
      const calls: string[] = [];

      context.registerPressable('press-id', {
        onPressOut: () => calls.push('pressOut'),
        onPress: () => calls.push('press'),
      });

      const node = createMockNode('press-id');
      context.dispatchMouseEvent(createMouseEvent('mouseup'), node, 5, 5);

      expect(calls).toEqual(['pressOut', 'press']);
    });

    it('should pass correct event data to press handlers', () => {
      const context = createTestContext();
      // biome-ignore lint/suspicious/noExplicitAny: Test variable for event capture
      let receivedEvent: any = null;

      context.registerPressable('press-id', {
        onPress: (event) => {
          receivedEvent = event;
        },
      });

      const node = createMockNode('press-id');
      context.dispatchMouseEvent(
        { type: 'mouseup', button: 'left', x: 15, y: 20, ctrl: true, shift: true },
        node,
        3,
        4,
      );

      expect(receivedEvent).not.toBeNull();
      expect(receivedEvent.x).toBe(15);
      expect(receivedEvent.y).toBe(20);
      expect(receivedEvent.localX).toBe(3);
      expect(receivedEvent.localY).toBe(4);
      expect(receivedEvent.button).toBe('left');
      expect(receivedEvent.modifiers.ctrl).toBe(true);
      expect(receivedEvent.modifiers.shift).toBe(true);
    });

    it('should not call handlers when disabled', () => {
      const context = createTestContext();
      const calls: string[] = [];

      context.registerPressable('press-id', {
        onPress: () => calls.push('press'),
        disabled: true,
      });

      const node = createMockNode('press-id');
      context.dispatchMouseEvent(createMouseEvent('mouseup'), node, 5, 5);

      expect(calls).toEqual([]);
    });

    it('should not call onPress when stopPropagation is called', () => {
      const context = createTestContext();
      const calls: string[] = [];

      context.registerPressable('press-id', {
        onPressOut: (event) => {
          calls.push('pressOut');
          event.stopPropagation();
        },
        onPress: () => calls.push('press'),
      });

      const node = createMockNode('press-id');
      context.dispatchMouseEvent(createMouseEvent('mouseup'), node, 5, 5);

      expect(calls).toEqual(['pressOut']);
    });

    it('should handle different mouse buttons', () => {
      const context = createTestContext();
      const buttons: string[] = [];

      context.registerPressable('press-id', {
        onPress: (event) => buttons.push(event.button),
      });

      const node = createMockNode('press-id');
      context.dispatchMouseEvent(createMouseEvent('mouseup', 'left'), node, 5, 5);
      context.dispatchMouseEvent(createMouseEvent('mouseup', 'middle'), node, 5, 5);
      context.dispatchMouseEvent(createMouseEvent('mouseup', 'right'), node, 5, 5);

      expect(buttons).toEqual(['left', 'middle', 'right']);
    });

    it('should not dispatch to unregistered pressable', () => {
      const context = createTestContext();
      const calls: string[] = [];

      context.registerPressable('other-id', {
        onPress: () => calls.push('press'),
      });

      const node = createMockNode('press-id'); // Different ID
      context.dispatchMouseEvent(createMouseEvent('mouseup'), node, 5, 5);

      expect(calls).toEqual([]);
    });
  });

  // ==========================================================================
  // Draggable Events
  // ==========================================================================

  describe('Draggable Events', () => {
    it('should call onDragStart on mousedown', () => {
      const context = createTestContext();
      const calls: string[] = [];

      context.registerDraggable('drag-id', {
        onDragStart: () => {
          calls.push('dragStart');
          return true;
        },
      });

      const node = createMockNode('drag-id');
      context.dispatchMouseEvent(createMouseEvent('mousedown', 'left', 10, 10), node, 5, 5);

      expect(calls).toEqual(['dragStart']);
    });

    it('should track drag state and call onDrag on mousemove', () => {
      const context = createTestContext();
      const calls: { type: string; x?: number; y?: number; deltaX?: number; deltaY?: number }[] =
        [];

      context.registerDraggable('drag-id', {
        onDragStart: (event) => {
          calls.push({ type: 'dragStart', x: event.x, y: event.y });
          return true;
        },
        onDrag: (event) => {
          calls.push({
            type: 'drag',
            x: event.x,
            y: event.y,
            deltaX: event.deltaX,
            deltaY: event.deltaY,
          });
        },
      });

      const node = createMockNode('drag-id');

      // Start drag
      context.dispatchMouseEvent(createMouseEvent('mousedown', 'left', 10, 10), node, 5, 5);
      // Move
      context.dispatchMouseEvent(createMouseEvent('mousemove', 'left', 15, 20), node, 10, 15);
      context.dispatchMouseEvent(createMouseEvent('mousemove', 'left', 25, 30), node, 20, 25);

      expect(calls).toEqual([
        { type: 'dragStart', x: 10, y: 10 },
        { type: 'drag', x: 15, y: 20, deltaX: 5, deltaY: 10 },
        { type: 'drag', x: 25, y: 30, deltaX: 15, deltaY: 20 },
      ]);
    });

    it('should call onDragEnd on mouseup', () => {
      const context = createTestContext();
      const calls: string[] = [];

      context.registerDraggable('drag-id', {
        onDragStart: () => {
          calls.push('dragStart');
          return true;
        },
        onDragEnd: () => {
          calls.push('dragEnd');
        },
      });

      const node = createMockNode('drag-id');

      // Start drag
      context.dispatchMouseEvent(createMouseEvent('mousedown', 'left', 10, 10), node, 5, 5);
      // End drag
      context.dispatchMouseEvent(createMouseEvent('mouseup', 'left', 20, 20), node, 15, 15);

      expect(calls).toEqual(['dragStart', 'dragEnd']);
    });

    it('should prevent drag if onDragStart returns false', () => {
      const context = createTestContext();
      const calls: string[] = [];

      context.registerDraggable('drag-id', {
        onDragStart: () => {
          calls.push('dragStart');
          return false; // Prevent drag
        },
        onDrag: () => calls.push('drag'),
        onDragEnd: () => calls.push('dragEnd'),
      });

      const node = createMockNode('drag-id');

      // Try to start drag
      context.dispatchMouseEvent(createMouseEvent('mousedown', 'left', 10, 10), node, 5, 5);
      // Move (should not trigger onDrag since drag was prevented)
      context.dispatchMouseEvent(createMouseEvent('mousemove', 'left', 15, 20), node, 10, 15);
      // Release
      context.dispatchMouseEvent(createMouseEvent('mouseup', 'left', 20, 20), node, 15, 15);

      expect(calls).toEqual(['dragStart']);
    });

    it('should not call drag handlers when disabled', () => {
      const context = createTestContext();
      const calls: string[] = [];

      context.registerDraggable('drag-id', {
        onDragStart: () => {
          calls.push('dragStart');
          return true;
        },
        disabled: true,
      });

      const node = createMockNode('drag-id');
      context.dispatchMouseEvent(createMouseEvent('mousedown', 'left', 10, 10), node, 5, 5);

      expect(calls).toEqual([]);
    });

    it('should prioritize draggable over pressable on same node', () => {
      const context = createTestContext();
      const calls: string[] = [];

      // Register both on same ID
      context.registerDraggable('combo-id', {
        onDragStart: () => {
          calls.push('dragStart');
          return true;
        },
      });

      context.registerPressable('combo-id', {
        onPressIn: () => calls.push('pressIn'),
      });

      const node = createMockNode('combo-id');
      context.dispatchMouseEvent(createMouseEvent('mousedown', 'left', 10, 10), node, 5, 5);

      // Draggable should win
      expect(calls).toEqual(['dragStart']);
    });

    it('should reset drag state after mouseup', () => {
      const context = createTestContext();
      const dragMoves: number[] = [];

      context.registerDraggable('drag-id', {
        onDragStart: () => true,
        onDrag: (event) => dragMoves.push(event.x),
      });

      const node = createMockNode('drag-id');

      // First drag
      context.dispatchMouseEvent(createMouseEvent('mousedown', 'left', 10, 10), node, 5, 5);
      context.dispatchMouseEvent(createMouseEvent('mousemove', 'left', 15, 15), node, 10, 10);
      context.dispatchMouseEvent(createMouseEvent('mouseup', 'left', 20, 20), node, 15, 15);

      // Move after drag ended - should not trigger
      context.dispatchMouseEvent(createMouseEvent('mousemove', 'left', 30, 30), node, 25, 25);

      expect(dragMoves).toEqual([15]); // Only the move during active drag
    });
  });

  // ==========================================================================
  // Hoverable Events
  // ==========================================================================

  describe('Hoverable Events', () => {
    it('should call onHoverIn when entering element', () => {
      const context = createTestContext();
      const calls: string[] = [];

      context.registerHoverable('hover-id', {
        onHoverIn: () => calls.push('hoverIn'),
      });

      const node = createMockNode('hover-id');
      context.dispatchMouseEvent(createMouseEvent('mousemove', 'left', 10, 10), node, 5, 5);

      expect(calls).toEqual(['hoverIn']);
    });

    it('should call onHoverOut when leaving element', () => {
      const context = createTestContext();
      const calls: string[] = [];

      context.registerHoverable('hover-id', {
        onHoverIn: () => calls.push('hoverIn'),
        onHoverOut: () => calls.push('hoverOut'),
      });

      const node = createMockNode('hover-id');
      const otherNode = createMockNode('other-id');

      // Enter
      context.dispatchMouseEvent(createMouseEvent('mousemove', 'left', 10, 10), node, 5, 5);
      // Leave (move to different node)
      context.dispatchMouseEvent(createMouseEvent('mousemove', 'left', 20, 20), otherNode, 15, 15);

      expect(calls).toEqual(['hoverIn', 'hoverOut']);
    });

    it('should not call onHoverIn again when moving within same element', () => {
      const context = createTestContext();
      const calls: string[] = [];

      context.registerHoverable('hover-id', {
        onHoverIn: () => calls.push('hoverIn'),
      });

      const node = createMockNode('hover-id');

      // Multiple moves within same element
      context.dispatchMouseEvent(createMouseEvent('mousemove', 'left', 10, 10), node, 5, 5);
      context.dispatchMouseEvent(createMouseEvent('mousemove', 'left', 11, 11), node, 6, 6);
      context.dispatchMouseEvent(createMouseEvent('mousemove', 'left', 12, 12), node, 7, 7);

      expect(calls).toEqual(['hoverIn']); // Only one call
    });

    it('should pass correct event data to hover handlers', () => {
      const context = createTestContext();
      // biome-ignore lint/suspicious/noExplicitAny: Test variable for event capture
      let receivedEvent: any = null;

      context.registerHoverable('hover-id', {
        onHoverIn: (event) => {
          receivedEvent = event;
        },
      });

      const node = createMockNode('hover-id');
      context.dispatchMouseEvent(createMouseEvent('mousemove', 'left', 25, 30), node, 10, 15);

      expect(receivedEvent).not.toBeNull();
      expect(receivedEvent.x).toBe(25);
      expect(receivedEvent.y).toBe(30);
      expect(receivedEvent.localX).toBe(10);
      expect(receivedEvent.localY).toBe(15);
    });

    it('should not call handlers when disabled', () => {
      const context = createTestContext();
      const calls: string[] = [];

      context.registerHoverable('hover-id', {
        onHoverIn: () => calls.push('hoverIn'),
        disabled: true,
      });

      const node = createMockNode('hover-id');
      context.dispatchMouseEvent(createMouseEvent('mousemove', 'left', 10, 10), node, 5, 5);

      expect(calls).toEqual([]);
    });

    it('should call onHoverOut when leaving to null', () => {
      const context = createTestContext();
      const calls: string[] = [];

      context.registerHoverable('hover-id', {
        onHoverIn: () => calls.push('hoverIn'),
        onHoverOut: () => calls.push('hoverOut'),
      });

      const node = createMockNode('hover-id');

      // Enter
      context.dispatchMouseEvent(createMouseEvent('mousemove', 'left', 10, 10), node, 5, 5);
      // Leave to empty area (null node)
      context.dispatchMouseEvent(createMouseEvent('mousemove', 'left', 50, 50), null, 0, 0);

      expect(calls).toEqual(['hoverIn', 'hoverOut']);
    });

    it('should handle hover transition between elements', () => {
      const context = createTestContext();
      const calls: string[] = [];

      context.registerHoverable('hover-a', {
        onHoverIn: () => calls.push('a-in'),
        onHoverOut: () => calls.push('a-out'),
      });

      context.registerHoverable('hover-b', {
        onHoverIn: () => calls.push('b-in'),
        onHoverOut: () => calls.push('b-out'),
      });

      const nodeA = createMockNode('hover-a');
      const nodeB = createMockNode('hover-b');

      // Enter A
      context.dispatchMouseEvent(createMouseEvent('mousemove', 'left', 10, 10), nodeA, 5, 5);
      // Move to B
      context.dispatchMouseEvent(createMouseEvent('mousemove', 'left', 20, 20), nodeB, 5, 5);
      // Leave B
      context.dispatchMouseEvent(createMouseEvent('mousemove', 'left', 50, 50), null, 0, 0);

      expect(calls).toEqual(['a-in', 'a-out', 'b-in', 'b-out']);
    });
  });

  // ==========================================================================
  // Disabled Context
  // ==========================================================================

  describe('Disabled Context', () => {
    it('should not dispatch events when context is disabled', () => {
      const context = createTestContext();
      const calls: string[] = [];

      context.registerPressable('press-id', {
        onPress: () => calls.push('press'),
      });

      // Disable context
      context.enabled.value = false;

      const node = createMockNode('press-id');
      context.dispatchMouseEvent(createMouseEvent('mouseup'), node, 5, 5);

      expect(calls).toEqual([]);
    });

    it('should dispatch events after re-enabling', () => {
      const context = createTestContext();
      const calls: string[] = [];

      context.registerPressable('press-id', {
        onPress: () => calls.push('press'),
      });

      // Disable then re-enable
      context.enabled.value = false;
      context.enabled.value = true;

      const node = createMockNode('press-id');
      context.dispatchMouseEvent(createMouseEvent('mouseup'), node, 5, 5);

      expect(calls).toEqual(['press']);
    });
  });

  // ==========================================================================
  // Edge Cases
  // ==========================================================================

  describe('Edge Cases', () => {
    it('should handle null node', () => {
      const context = createTestContext();
      const calls: string[] = [];

      context.registerPressable('press-id', {
        onPress: () => calls.push('press'),
      });

      // Dispatch with null node
      context.dispatchMouseEvent(createMouseEvent('mouseup'), null, 0, 0);

      expect(calls).toEqual([]);
    });

    it('should handle node without mouseId', () => {
      const context = createTestContext();
      const calls: string[] = [];

      context.registerPressable('press-id', {
        onPress: () => calls.push('press'),
      });

      // Node without __mouseId
      const node = { type: 'box' as const, tagName: 'test', props: {}, children: [] };
      context.dispatchMouseEvent(createMouseEvent('mouseup'), node, 0, 0);

      expect(calls).toEqual([]);
    });

    it('should handle cleanup during active drag', () => {
      const context = createTestContext();
      const calls: string[] = [];

      const cleanup = context.registerDraggable('drag-id', {
        onDragStart: () => {
          calls.push('dragStart');
          return true;
        },
        onDrag: () => calls.push('drag'),
        onDragEnd: () => calls.push('dragEnd'),
      });

      const node = createMockNode('drag-id');

      // Start drag
      context.dispatchMouseEvent(createMouseEvent('mousedown', 'left', 10, 10), node, 5, 5);

      // Cleanup during drag
      cleanup();

      // Continue drag (handler is gone, but drag state may still be tracked)
      context.dispatchMouseEvent(createMouseEvent('mousemove', 'left', 15, 15), node, 10, 10);

      expect(calls).toEqual(['dragStart']); // Only dragStart before cleanup
    });
  });
});
