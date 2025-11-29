/**
 * Mouse Input Hook Tests
 *
 * Tests for mouse event handling hooks.
 */
import { describe, expect, it, beforeEach } from 'bun:test';
import { createRoot } from '@zen/runtime';
import {
  useMouse,
  useMouseClick,
  useMouseScroll,
  useMouseDrag,
  dispatchMouseEvent,
  clearMouseListeners,
} from './useMouse.js';
import type { MouseEvent } from '../utils/mouse-parser.js';

// Helper to create mouse events
const createMouseEvent = (
  type: MouseEvent['type'],
  button: MouseEvent['button'],
  x: number,
  y: number,
  modifiers: { ctrl?: boolean; shift?: boolean; meta?: boolean } = {},
): MouseEvent => ({
  type,
  button,
  x,
  y,
  ...modifiers,
});

describe('useMouse', () => {
  beforeEach(() => {
    clearMouseListeners();
  });

  // ==========================================================================
  // useMouse - Basic Functionality
  // ==========================================================================

  describe('useMouse - Basic', () => {
    it('should receive dispatched mouse events', () => {
      let received: MouseEvent | null = null;

      createRoot(() => {
        useMouse((event) => {
          received = event;
        });

        dispatchMouseEvent(createMouseEvent('mousedown', 'left', 10, 20));
      });

      expect(received).not.toBeNull();
      expect(received?.type).toBe('mousedown');
      expect(received?.button).toBe('left');
      expect(received?.x).toBe(10);
      expect(received?.y).toBe(20);
    });

    it('should dispatch to multiple listeners', () => {
      const calls: string[] = [];

      createRoot(() => {
        useMouse(() => calls.push('listener1'));
        useMouse(() => calls.push('listener2'));

        dispatchMouseEvent(createMouseEvent('mousedown', 'left', 0, 0));
      });

      expect(calls).toContain('listener1');
      expect(calls).toContain('listener2');
    });

    it('should cleanup listener on dispose', () => {
      let called = false;

      // Note: useMouse uses onCleanup from @zen/signal
      // The cleanup happens when the reactive scope is disposed
      // We test this by clearing all listeners manually
      createRoot(() => {
        useMouse(() => {
          called = true;
        });
      });

      dispatchMouseEvent(createMouseEvent('mousedown', 'left', 0, 0));
      expect(called).toBe(true);

      // Verify clearMouseListeners works (simulates cleanup)
      called = false;
      clearMouseListeners();

      dispatchMouseEvent(createMouseEvent('mousedown', 'left', 0, 0));
      expect(called).toBe(false);
    });
  });

  // ==========================================================================
  // useMouseClick
  // ==========================================================================

  describe('useMouseClick', () => {
    it('should only fire on mouseup', () => {
      let clickCount = 0;

      createRoot(() => {
        useMouseClick(() => {
          clickCount++;
        });

        // mousedown should not trigger click
        dispatchMouseEvent(createMouseEvent('mousedown', 'left', 10, 20));
        expect(clickCount).toBe(0);

        // mouseup should trigger click
        dispatchMouseEvent(createMouseEvent('mouseup', 'left', 10, 20));
        expect(clickCount).toBe(1);
      });
    });

    it('should provide correct coordinates and button', () => {
      let lastClick: { x: number; y: number; button: string } | null = null;

      createRoot(() => {
        useMouseClick((x, y, button) => {
          lastClick = { x, y, button };
        });

        dispatchMouseEvent(createMouseEvent('mouseup', 'right', 50, 100));
      });

      expect(lastClick?.x).toBe(50);
      expect(lastClick?.y).toBe(100);
      expect(lastClick?.button).toBe('right');
    });

    it('should provide modifier keys', () => {
      let modifiers: { ctrl?: boolean; shift?: boolean; meta?: boolean } | undefined;

      createRoot(() => {
        useMouseClick((_x, _y, _button, mods) => {
          modifiers = mods;
        });

        dispatchMouseEvent(createMouseEvent('mouseup', 'left', 0, 0, { ctrl: true, shift: true }));
      });

      expect(modifiers?.ctrl).toBe(true);
      expect(modifiers?.shift).toBe(true);
    });

    it('should handle left, middle, right clicks', () => {
      const buttons: string[] = [];

      createRoot(() => {
        useMouseClick((_x, _y, button) => {
          buttons.push(button);
        });

        dispatchMouseEvent(createMouseEvent('mouseup', 'left', 0, 0));
        dispatchMouseEvent(createMouseEvent('mouseup', 'middle', 0, 0));
        dispatchMouseEvent(createMouseEvent('mouseup', 'right', 0, 0));
      });

      expect(buttons).toEqual(['left', 'middle', 'right']);
    });

    it('should not fire for scroll events', () => {
      let clicked = false;

      createRoot(() => {
        useMouseClick(() => {
          clicked = true;
        });

        dispatchMouseEvent(createMouseEvent('scroll', 'scroll-up', 0, 0));
        dispatchMouseEvent(createMouseEvent('scroll', 'scroll-down', 0, 0));
      });

      expect(clicked).toBe(false);
    });

    it('should not fire for none button mouseup', () => {
      let clicked = false;

      createRoot(() => {
        useMouseClick(() => {
          clicked = true;
        });

        dispatchMouseEvent(createMouseEvent('mouseup', 'none', 0, 0));
      });

      expect(clicked).toBe(false);
    });
  });

  // ==========================================================================
  // useMouseScroll
  // ==========================================================================

  describe('useMouseScroll', () => {
    it('should fire for scroll events', () => {
      const scrolls: Array<{ direction: 'up' | 'down'; x: number; y: number }> = [];

      createRoot(() => {
        useMouseScroll((direction, x, y) => {
          scrolls.push({ direction, x, y });
        });

        dispatchMouseEvent(createMouseEvent('scroll', 'scroll-up', 10, 20));
        dispatchMouseEvent(createMouseEvent('scroll', 'scroll-down', 30, 40));
      });

      expect(scrolls.length).toBe(2);
      expect(scrolls[0]).toEqual({ direction: 'up', x: 10, y: 20 });
      expect(scrolls[1]).toEqual({ direction: 'down', x: 30, y: 40 });
    });

    it('should not fire for click events', () => {
      let scrolled = false;

      createRoot(() => {
        useMouseScroll(() => {
          scrolled = true;
        });

        dispatchMouseEvent(createMouseEvent('mousedown', 'left', 0, 0));
        dispatchMouseEvent(createMouseEvent('mouseup', 'left', 0, 0));
      });

      expect(scrolled).toBe(false);
    });
  });

  // ==========================================================================
  // useMouseDrag
  // ==========================================================================

  describe('useMouseDrag', () => {
    it('should track drag lifecycle', () => {
      const events: string[] = [];
      let lastMove: { x: number; y: number; startX: number; startY: number } | null = null;

      createRoot(() => {
        useMouseDrag({
          onDragStart: (x, y, button) => {
            events.push(`start:${button}@${x},${y}`);
          },
          onDragMove: (x, y, startX, startY) => {
            events.push(`move:${x},${y}`);
            lastMove = { x, y, startX, startY };
          },
          onDragEnd: (x, y) => {
            events.push(`end:${x},${y}`);
          },
        });

        // Start drag
        dispatchMouseEvent(createMouseEvent('mousedown', 'left', 10, 10));

        // Move while dragging
        dispatchMouseEvent(createMouseEvent('mousemove', 'left', 20, 15));
        dispatchMouseEvent(createMouseEvent('mousemove', 'left', 30, 20));

        // End drag
        dispatchMouseEvent(createMouseEvent('mouseup', 'left', 30, 20));
      });

      expect(events).toContain('start:left@10,10');
      expect(events).toContain('move:20,15');
      expect(events).toContain('move:30,20');
      expect(events).toContain('end:30,20');

      expect(lastMove?.startX).toBe(10);
      expect(lastMove?.startY).toBe(10);
    });

    it('should not move if drag was not started', () => {
      let moved = false;

      createRoot(() => {
        useMouseDrag({
          onDragMove: () => {
            moved = true;
          },
        });

        // Move without mousedown
        dispatchMouseEvent(createMouseEvent('mousemove', 'none', 20, 15));
      });

      expect(moved).toBe(false);
    });

    it('should respect onDragStart returning false', () => {
      const events: string[] = [];

      createRoot(() => {
        useMouseDrag({
          onDragStart: () => {
            events.push('start');
            return false; // Prevent drag
          },
          onDragMove: () => {
            events.push('move');
          },
          onDragEnd: () => {
            events.push('end');
          },
        });

        dispatchMouseEvent(createMouseEvent('mousedown', 'left', 10, 10));
        dispatchMouseEvent(createMouseEvent('mousemove', 'left', 20, 15));
        dispatchMouseEvent(createMouseEvent('mouseup', 'left', 30, 20));
      });

      expect(events).toEqual(['start']);
    });

    it('should work with middle and right buttons', () => {
      const buttons: string[] = [];

      createRoot(() => {
        useMouseDrag({
          onDragStart: (_x, _y, button) => {
            buttons.push(button);
          },
        });

        dispatchMouseEvent(createMouseEvent('mousedown', 'middle', 0, 0));
        dispatchMouseEvent(createMouseEvent('mouseup', 'middle', 0, 0));

        dispatchMouseEvent(createMouseEvent('mousedown', 'right', 0, 0));
        dispatchMouseEvent(createMouseEvent('mouseup', 'right', 0, 0));
      });

      expect(buttons).toContain('middle');
      expect(buttons).toContain('right');
    });

    it('should reset drag state after mouseup', () => {
      let moveCount = 0;

      createRoot(() => {
        useMouseDrag({
          onDragMove: () => {
            moveCount++;
          },
        });

        // First drag
        dispatchMouseEvent(createMouseEvent('mousedown', 'left', 10, 10));
        dispatchMouseEvent(createMouseEvent('mousemove', 'left', 20, 15));
        dispatchMouseEvent(createMouseEvent('mouseup', 'left', 20, 15));

        // Move after drag ended should not trigger
        dispatchMouseEvent(createMouseEvent('mousemove', 'left', 30, 25));
      });

      expect(moveCount).toBe(1);
    });
  });

  // ==========================================================================
  // dispatchMouseEvent / clearMouseListeners
  // ==========================================================================

  describe('dispatchMouseEvent / clearMouseListeners', () => {
    it('should clear all listeners', () => {
      let called = false;

      createRoot(() => {
        useMouse(() => {
          called = true;
        });
      });

      clearMouseListeners();
      dispatchMouseEvent(createMouseEvent('mousedown', 'left', 0, 0));

      expect(called).toBe(false);
    });
  });

  // ==========================================================================
  // Edge Cases
  // ==========================================================================

  describe('Edge Cases', () => {
    it('should handle rapid events', () => {
      let count = 0;

      createRoot(() => {
        useMouse(() => {
          count++;
        });

        for (let i = 0; i < 100; i++) {
          dispatchMouseEvent(createMouseEvent('mousemove', 'left', i, i));
        }
      });

      expect(count).toBe(100);
    });

    it('should handle events with undefined modifiers', () => {
      let received = false;

      createRoot(() => {
        useMouseClick(() => {
          received = true;
        });

        // Event without modifiers
        dispatchMouseEvent({ type: 'mouseup', button: 'left', x: 0, y: 0 });
      });

      expect(received).toBe(true);
    });
  });
});
