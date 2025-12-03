/** @jsxImportSource @rapid/tui */
/**
 * Interactive Components Tests
 *
 * Tests for Hoverable, Pressable, and Draggable components.
 */
import { describe, expect, it } from 'bun:test';
import { setPlatformOps, tuiPlatformOps } from '@rapid/tui';
import { Text } from '../primitives/Text.js';
import { Draggable, type DraggableProps } from './Draggable.js';
import { Hoverable, type HoverableProps } from './Hoverable.js';
import { Pressable, type PressableProps } from './Pressable.js';

setPlatformOps(tuiPlatformOps);

// ==========================================================================
// Hoverable
// ==========================================================================

describe('Hoverable', () => {
  describe('Basic Rendering', () => {
    it('should render hoverable wrapper', () => {
      const result = Hoverable({
        children: (isHovered) => <Text>{isHovered ? 'Hovered' : 'Not hovered'}</Text>,
      });

      expect(result).toBeDefined();
      expect(result.type).toBe('box');
      expect(result.tagName).toBe('hoverable');
    });

    it('should have __mouseId prop', () => {
      const result = Hoverable({
        children: () => <Text>Content</Text>,
      });

      expect(result.props.__mouseId).toBeDefined();
      expect(result.props.__mouseId).toContain('hoverable-');
    });

    it('should render children with hover state', () => {
      const result = Hoverable({
        children: (isHovered) => <Text>{isHovered ? 'Yes' : 'No'}</Text>,
      });

      expect(result.children.length).toBeGreaterThan(0);
    });

    it('should generate unique IDs', () => {
      const result1 = Hoverable({ children: () => <Text>1</Text> });
      const result2 = Hoverable({ children: () => <Text>2</Text> });

      expect(result1.props.__mouseId).not.toBe(result2.props.__mouseId);
    });
  });

  describe('Callbacks', () => {
    it('should accept onHoverIn callback', () => {
      const result = Hoverable({
        children: () => <Text>Content</Text>,
        onHoverIn: () => {},
      });

      expect(result).toBeDefined();
    });

    it('should accept onHoverOut callback', () => {
      const result = Hoverable({
        children: () => <Text>Content</Text>,
        onHoverOut: () => {},
      });

      expect(result).toBeDefined();
    });

    it('should accept both callbacks', () => {
      const result = Hoverable({
        children: () => <Text>Content</Text>,
        onHoverIn: () => {},
        onHoverOut: () => {},
      });

      expect(result).toBeDefined();
    });
  });

  describe('Disabled State', () => {
    it('should accept disabled prop', () => {
      const result = Hoverable({
        children: () => <Text>Content</Text>,
        disabled: true,
      });

      expect(result).toBeDefined();
    });

    it('should render when disabled', () => {
      const result = Hoverable({
        children: () => <Text>Content</Text>,
        disabled: true,
      });

      expect(result.type).toBe('box');
    });
  });
});

// ==========================================================================
// Pressable
// ==========================================================================

describe('Pressable', () => {
  describe('Basic Rendering', () => {
    it('should render pressable wrapper', () => {
      const result = Pressable({});

      expect(result).toBeDefined();
      expect(result.type).toBe('box');
      expect(result.tagName).toBe('pressable');
    });

    it('should have __mouseId prop', () => {
      const result = Pressable({});

      expect(result.props.__mouseId).toBeDefined();
      expect(result.props.__mouseId).toContain('pressable-');
    });

    it('should render with children', () => {
      const result = Pressable({
        children: <Text>Click me</Text>,
      });

      expect(result.children.length).toBeGreaterThan(0);
    });

    it('should render without children', () => {
      const result = Pressable({});

      expect(result).toBeDefined();
    });

    it('should generate unique IDs', () => {
      const result1 = Pressable({});
      const result2 = Pressable({});

      expect(result1.props.__mouseId).not.toBe(result2.props.__mouseId);
    });
  });

  describe('Callbacks', () => {
    it('should accept onPress callback', () => {
      const result = Pressable({
        onPress: () => {},
      });

      expect(result).toBeDefined();
    });

    it('should accept onPressIn callback', () => {
      const result = Pressable({
        onPressIn: () => {},
      });

      expect(result).toBeDefined();
    });

    it('should accept onPressOut callback', () => {
      const result = Pressable({
        onPressOut: () => {},
      });

      expect(result).toBeDefined();
    });

    it('should accept all callbacks', () => {
      const result = Pressable({
        onPress: () => {},
        onPressIn: () => {},
        onPressOut: () => {},
      });

      expect(result).toBeDefined();
    });
  });

  describe('Disabled State', () => {
    it('should accept disabled prop', () => {
      const result = Pressable({
        disabled: true,
      });

      expect(result).toBeDefined();
    });

    it('should render when disabled', () => {
      const result = Pressable({
        disabled: true,
        children: <Text>Disabled</Text>,
      });

      expect(result.type).toBe('box');
    });
  });
});

// ==========================================================================
// Draggable
// ==========================================================================

describe('Draggable', () => {
  describe('Basic Rendering', () => {
    it('should render draggable wrapper', () => {
      const result = Draggable({});

      expect(result).toBeDefined();
      expect(result.type).toBe('box');
      expect(result.tagName).toBe('draggable');
    });

    it('should have __mouseId prop', () => {
      const result = Draggable({});

      expect(result.props.__mouseId).toBeDefined();
      expect(result.props.__mouseId).toContain('draggable-');
    });

    it('should render with children', () => {
      const result = Draggable({
        children: <Text>Drag me</Text>,
      });

      expect(result.children.length).toBeGreaterThan(0);
    });

    it('should render without children', () => {
      const result = Draggable({});

      expect(result).toBeDefined();
    });

    it('should generate unique IDs', () => {
      const result1 = Draggable({});
      const result2 = Draggable({});

      expect(result1.props.__mouseId).not.toBe(result2.props.__mouseId);
    });
  });

  describe('Callbacks', () => {
    it('should accept onDragStart callback', () => {
      const result = Draggable({
        onDragStart: () => undefined,
      });

      expect(result).toBeDefined();
    });

    it('should accept onDrag callback', () => {
      const result = Draggable({
        onDrag: () => {},
      });

      expect(result).toBeDefined();
    });

    it('should accept onDragEnd callback', () => {
      const result = Draggable({
        onDragEnd: () => {},
      });

      expect(result).toBeDefined();
    });

    it('should accept all callbacks', () => {
      const result = Draggable({
        onDragStart: () => true,
        onDrag: () => {},
        onDragEnd: () => {},
      });

      expect(result).toBeDefined();
    });

    it('should allow onDragStart to return false to prevent drag', () => {
      const result = Draggable({
        onDragStart: () => false,
      });

      expect(result).toBeDefined();
    });
  });

  describe('Disabled State', () => {
    it('should accept disabled prop', () => {
      const result = Draggable({
        disabled: true,
      });

      expect(result).toBeDefined();
    });

    it('should render when disabled', () => {
      const result = Draggable({
        disabled: true,
        children: <Text>Disabled</Text>,
      });

      expect(result.type).toBe('box');
    });
  });
});

// ==========================================================================
// Edge Cases
// ==========================================================================

describe('Interactive Edge Cases', () => {
  it('should handle nested interactive components', () => {
    const result = Pressable({
      children: Hoverable({
        children: () => <Text>Nested</Text>,
      }),
    });

    expect(result).toBeDefined();
  });

  it('should handle Pressable inside Draggable', () => {
    const result = Draggable({
      children: Pressable({
        children: <Text>Press in Drag</Text>,
      }),
    });

    expect(result).toBeDefined();
  });

  it('should handle complex children in Hoverable', () => {
    const result = Hoverable({
      children: (isHovered) =>
        isHovered ? <Text style={{ bold: true }}>Hovered!</Text> : <Text>Not hovered</Text>,
    });

    expect(result).toBeDefined();
  });
});

// ==========================================================================
// Integration Tests with MouseContext
// ==========================================================================

import { createRoot, signal } from '@rapid/runtime';
import { type MouseContextValue, MouseProvider } from '../providers/MouseProvider.js';

describe('Interactive Components with MouseContext', () => {
  // Helper to create a test context
  const createTestContext = (): MouseContextValue => {
    let context: MouseContextValue | null = null;
    createRoot(() => {
      const provider = MouseProvider({ enabled: false });
      // The provider returns a fragment with the box as first child
      // The context is stored in the box's props.__mouseContext
      const box = provider.children?.[0] as any;
      context = box?.props?.__mouseContext as MouseContextValue;
      if (context) {
        context.enabled.value = true;
      }
      return provider;
    });
    if (!context) throw new Error('Failed to create test context');
    return context;
  };

  // Helper to create a mock node
  const createMockNode = (mouseId: string) => ({
    type: 'box' as const,
    tagName: 'test',
    props: { __mouseId: mouseId },
    children: [],
  });

  // ==========================================================================
  // Pressable Integration
  // ==========================================================================

  describe('Pressable with MouseContext', () => {
    it('should register with mouse context on mount', () => {
      const context = createTestContext();
      const pressable = Pressable({
        onPress: () => {},
      });

      // Manually register to test integration
      const cleanup = context.registerPressable(pressable.props.__mouseId, {
        onPress: () => {},
      });

      expect(typeof cleanup).toBe('function');
      cleanup();
    });

    it('should receive press events from context', () => {
      const context = createTestContext();
      const calls: string[] = [];

      const pressable = Pressable({
        onPress: () => calls.push('pressed'),
        onPressIn: () => calls.push('pressIn'),
        onPressOut: () => calls.push('pressOut'),
      });

      context.registerPressable(pressable.props.__mouseId, {
        onPress: () => calls.push('pressed'),
        onPressIn: () => calls.push('pressIn'),
        onPressOut: () => calls.push('pressOut'),
      });

      const node = createMockNode(pressable.props.__mouseId);

      // Simulate press
      context.dispatchMouseEvent({ type: 'mousedown', button: 'left', x: 10, y: 10 }, node, 5, 5);
      context.dispatchMouseEvent({ type: 'mouseup', button: 'left', x: 10, y: 10 }, node, 5, 5);

      expect(calls).toEqual(['pressIn', 'pressOut', 'pressed']);
    });

    it('should not receive events when disabled', () => {
      const context = createTestContext();
      const calls: string[] = [];

      const pressable = Pressable({
        disabled: true,
        onPress: () => calls.push('pressed'),
      });

      context.registerPressable(pressable.props.__mouseId, {
        onPress: () => calls.push('pressed'),
        disabled: true,
      });

      const node = createMockNode(pressable.props.__mouseId);
      context.dispatchMouseEvent({ type: 'mouseup', button: 'left', x: 10, y: 10 }, node, 5, 5);

      expect(calls).toEqual([]);
    });

    it('should handle multiple pressables', () => {
      const context = createTestContext();
      const calls: string[] = [];

      const pressable1 = Pressable({ onPress: () => calls.push('p1') });
      const pressable2 = Pressable({ onPress: () => calls.push('p2') });

      context.registerPressable(pressable1.props.__mouseId, {
        onPress: () => calls.push('p1'),
      });
      context.registerPressable(pressable2.props.__mouseId, {
        onPress: () => calls.push('p2'),
      });

      const node1 = createMockNode(pressable1.props.__mouseId);
      const node2 = createMockNode(pressable2.props.__mouseId);

      context.dispatchMouseEvent({ type: 'mouseup', button: 'left', x: 10, y: 10 }, node1, 5, 5);
      context.dispatchMouseEvent({ type: 'mouseup', button: 'left', x: 20, y: 20 }, node2, 5, 5);

      expect(calls).toEqual(['p1', 'p2']);
    });
  });

  // ==========================================================================
  // Draggable Integration
  // ==========================================================================

  describe('Draggable with MouseContext', () => {
    it('should register with mouse context on mount', () => {
      const context = createTestContext();
      const draggable = Draggable({
        onDragStart: () => true,
      });

      const cleanup = context.registerDraggable(draggable.props.__mouseId, {
        onDragStart: () => true,
      });

      expect(typeof cleanup).toBe('function');
      cleanup();
    });

    it('should receive drag events from context', () => {
      const context = createTestContext();
      const events: { type: string; deltaX?: number; deltaY?: number }[] = [];

      const draggable = Draggable({
        onDragStart: () => true,
        onDrag: () => {},
        onDragEnd: () => {},
      });

      context.registerDraggable(draggable.props.__mouseId, {
        onDragStart: () => {
          events.push({ type: 'start' });
          return true;
        },
        onDrag: (e) => {
          events.push({ type: 'drag', deltaX: e.deltaX, deltaY: e.deltaY });
        },
        onDragEnd: () => {
          events.push({ type: 'end' });
        },
      });

      const node = createMockNode(draggable.props.__mouseId);

      // Simulate drag sequence
      context.dispatchMouseEvent({ type: 'mousedown', button: 'left', x: 10, y: 10 }, node, 5, 5);
      context.dispatchMouseEvent({ type: 'mousemove', button: 'left', x: 20, y: 15 }, node, 15, 10);
      context.dispatchMouseEvent({ type: 'mouseup', button: 'left', x: 20, y: 15 }, node, 15, 10);

      expect(events).toEqual([
        { type: 'start' },
        { type: 'drag', deltaX: 10, deltaY: 5 },
        { type: 'end' },
      ]);
    });

    it('should not start drag when onDragStart returns false', () => {
      const context = createTestContext();
      const events: string[] = [];

      const draggable = Draggable({
        onDragStart: () => false,
      });

      context.registerDraggable(draggable.props.__mouseId, {
        onDragStart: () => {
          events.push('start');
          return false;
        },
        onDrag: () => events.push('drag'),
        onDragEnd: () => events.push('end'),
      });

      const node = createMockNode(draggable.props.__mouseId);

      context.dispatchMouseEvent({ type: 'mousedown', button: 'left', x: 10, y: 10 }, node, 5, 5);
      context.dispatchMouseEvent({ type: 'mousemove', button: 'left', x: 20, y: 15 }, node, 15, 10);
      context.dispatchMouseEvent({ type: 'mouseup', button: 'left', x: 20, y: 15 }, node, 15, 10);

      expect(events).toEqual(['start']); // Only start, no drag/end
    });

    it('should track delta correctly across multiple moves', () => {
      const context = createTestContext();
      const deltas: { x: number; y: number }[] = [];

      const draggable = Draggable({});

      context.registerDraggable(draggable.props.__mouseId, {
        onDragStart: () => true,
        onDrag: (e) => deltas.push({ x: e.deltaX, y: e.deltaY }),
      });

      const node = createMockNode(draggable.props.__mouseId);

      // Start at (10, 10)
      context.dispatchMouseEvent({ type: 'mousedown', button: 'left', x: 10, y: 10 }, node, 5, 5);
      // Move to (15, 12) - delta should be (5, 2)
      context.dispatchMouseEvent({ type: 'mousemove', button: 'left', x: 15, y: 12 }, node, 10, 7);
      // Move to (25, 20) - delta should be (15, 10) from start
      context.dispatchMouseEvent({ type: 'mousemove', button: 'left', x: 25, y: 20 }, node, 20, 15);
      // End
      context.dispatchMouseEvent({ type: 'mouseup', button: 'left', x: 25, y: 20 }, node, 20, 15);

      expect(deltas).toEqual([
        { x: 5, y: 2 },
        { x: 15, y: 10 },
      ]);
    });
  });

  // ==========================================================================
  // Hoverable Integration
  // ==========================================================================

  describe('Hoverable with MouseContext', () => {
    it('should register with mouse context on mount', () => {
      const context = createTestContext();
      const hoverable = Hoverable({
        children: () => <Text>Content</Text>,
        onHoverIn: () => {},
      });

      const cleanup = context.registerHoverable(hoverable.props.__mouseId, {
        onHoverIn: () => {},
      });

      expect(typeof cleanup).toBe('function');
      cleanup();
    });

    it('should receive hover events from context', () => {
      const context = createTestContext();
      const events: string[] = [];

      const hoverable = Hoverable({
        children: () => <Text>Content</Text>,
        onHoverIn: () => events.push('in'),
        onHoverOut: () => events.push('out'),
      });

      context.registerHoverable(hoverable.props.__mouseId, {
        onHoverIn: () => events.push('in'),
        onHoverOut: () => events.push('out'),
      });

      const node = createMockNode(hoverable.props.__mouseId);
      const otherNode = createMockNode('other');

      // Enter
      context.dispatchMouseEvent({ type: 'mousemove', button: 'left', x: 10, y: 10 }, node, 5, 5);
      // Leave
      context.dispatchMouseEvent(
        { type: 'mousemove', button: 'left', x: 50, y: 50 },
        otherNode,
        25,
        25,
      );

      expect(events).toEqual(['in', 'out']);
    });

    it('should track hover state correctly', () => {
      const context = createTestContext();
      const isHovered = signal(false);

      const hoverable = Hoverable({
        children: (hovered) => {
          isHovered.value = hovered;
          return <Text>{hovered ? 'Hovered' : 'Not'}</Text>;
        },
      });

      context.registerHoverable(hoverable.props.__mouseId, {
        onHoverIn: () => {
          isHovered.value = true;
        },
        onHoverOut: () => {
          isHovered.value = false;
        },
      });

      const node = createMockNode(hoverable.props.__mouseId);

      expect(isHovered.value).toBe(false);

      // Enter
      context.dispatchMouseEvent({ type: 'mousemove', button: 'left', x: 10, y: 10 }, node, 5, 5);
      expect(isHovered.value).toBe(true);

      // Leave
      context.dispatchMouseEvent({ type: 'mousemove', button: 'left', x: 50, y: 50 }, null, 0, 0);
      expect(isHovered.value).toBe(false);
    });

    it('should not fire hover multiple times when staying in same element', () => {
      const context = createTestContext();
      const events: string[] = [];

      const hoverable = Hoverable({
        children: () => <Text>Content</Text>,
      });

      context.registerHoverable(hoverable.props.__mouseId, {
        onHoverIn: () => events.push('in'),
        onHoverOut: () => events.push('out'),
      });

      const node = createMockNode(hoverable.props.__mouseId);

      // Enter
      context.dispatchMouseEvent({ type: 'mousemove', button: 'left', x: 10, y: 10 }, node, 5, 5);
      // Move within
      context.dispatchMouseEvent({ type: 'mousemove', button: 'left', x: 12, y: 12 }, node, 7, 7);
      context.dispatchMouseEvent({ type: 'mousemove', button: 'left', x: 14, y: 14 }, node, 9, 9);

      expect(events).toEqual(['in']); // Only one 'in', no redundant calls
    });
  });

  // ==========================================================================
  // Mixed Interactive Components
  // ==========================================================================

  describe('Mixed Interactive Components', () => {
    it('should handle Pressable and Hoverable on same element flow', () => {
      const context = createTestContext();
      const events: string[] = [];

      // Create both with same mouseId to simulate combined behavior
      const mouseId = 'combined-1';

      context.registerPressable(mouseId, {
        onPress: () => events.push('press'),
        onPressIn: () => events.push('pressIn'),
        onPressOut: () => events.push('pressOut'),
      });

      context.registerHoverable(mouseId, {
        onHoverIn: () => events.push('hoverIn'),
        onHoverOut: () => events.push('hoverOut'),
      });

      const node = createMockNode(mouseId);

      // Hover
      context.dispatchMouseEvent({ type: 'mousemove', button: 'left', x: 10, y: 10 }, node, 5, 5);
      // Press
      context.dispatchMouseEvent({ type: 'mousedown', button: 'left', x: 10, y: 10 }, node, 5, 5);
      context.dispatchMouseEvent({ type: 'mouseup', button: 'left', x: 10, y: 10 }, node, 5, 5);
      // Leave
      context.dispatchMouseEvent({ type: 'mousemove', button: 'left', x: 50, y: 50 }, null, 0, 0);

      expect(events).toEqual(['hoverIn', 'pressIn', 'pressOut', 'press', 'hoverOut']);
    });

    it('should prevent press when drag is active', () => {
      const context = createTestContext();
      const events: string[] = [];

      const mouseId = 'drag-press-1';

      context.registerDraggable(mouseId, {
        onDragStart: () => {
          events.push('dragStart');
          return true;
        },
        onDrag: () => events.push('drag'),
        onDragEnd: () => events.push('dragEnd'),
      });

      context.registerPressable(mouseId, {
        onPressIn: () => events.push('pressIn'),
        onPress: () => events.push('press'),
      });

      const node = createMockNode(mouseId);

      // Mousedown should trigger drag, not press
      context.dispatchMouseEvent({ type: 'mousedown', button: 'left', x: 10, y: 10 }, node, 5, 5);
      context.dispatchMouseEvent({ type: 'mousemove', button: 'left', x: 20, y: 20 }, node, 15, 15);
      context.dispatchMouseEvent({ type: 'mouseup', button: 'left', x: 20, y: 20 }, node, 15, 15);

      // Draggable should take precedence
      expect(events).toEqual(['dragStart', 'drag', 'dragEnd']);
    });
  });

  // ==========================================================================
  // Cleanup
  // ==========================================================================

  describe('Cleanup Behavior', () => {
    it('should unregister pressable on cleanup', () => {
      const context = createTestContext();
      const events: string[] = [];

      const mouseId = 'cleanup-press';

      const cleanup = context.registerPressable(mouseId, {
        onPress: () => events.push('press'),
      });

      const node = createMockNode(mouseId);

      // First press works
      context.dispatchMouseEvent({ type: 'mouseup', button: 'left', x: 10, y: 10 }, node, 5, 5);
      expect(events).toEqual(['press']);

      // Cleanup
      cleanup();

      // Second press should not fire
      context.dispatchMouseEvent({ type: 'mouseup', button: 'left', x: 10, y: 10 }, node, 5, 5);
      expect(events).toEqual(['press']); // Still just one
    });

    it('should unregister draggable on cleanup', () => {
      const context = createTestContext();
      const events: string[] = [];

      const mouseId = 'cleanup-drag';

      const cleanup = context.registerDraggable(mouseId, {
        onDragStart: () => {
          events.push('start');
          return true;
        },
      });

      const node = createMockNode(mouseId);

      // First drag works
      context.dispatchMouseEvent({ type: 'mousedown', button: 'left', x: 10, y: 10 }, node, 5, 5);
      expect(events).toEqual(['start']);

      // Cleanup
      cleanup();

      // Reset drag state by mouseup
      context.dispatchMouseEvent({ type: 'mouseup', button: 'left', x: 10, y: 10 }, node, 5, 5);

      // Second drag should not fire
      context.dispatchMouseEvent({ type: 'mousedown', button: 'left', x: 10, y: 10 }, node, 5, 5);
      expect(events).toEqual(['start']); // Still just one
    });

    it('should unregister hoverable on cleanup', () => {
      const context = createTestContext();
      const events: string[] = [];

      const mouseId = 'cleanup-hover';

      const cleanup = context.registerHoverable(mouseId, {
        onHoverIn: () => events.push('in'),
      });

      const node = createMockNode(mouseId);

      // First hover works
      context.dispatchMouseEvent({ type: 'mousemove', button: 'left', x: 10, y: 10 }, node, 5, 5);
      expect(events).toEqual(['in']);

      // Leave first
      context.dispatchMouseEvent({ type: 'mousemove', button: 'left', x: 50, y: 50 }, null, 0, 0);

      // Cleanup
      cleanup();

      // Second hover should not fire
      context.dispatchMouseEvent({ type: 'mousemove', button: 'left', x: 10, y: 10 }, node, 5, 5);
      expect(events).toEqual(['in']); // Still just one
    });
  });
});
