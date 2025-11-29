/**
 * Mouse Hook Tests
 *
 * Tests for mouse event handling hooks.
 */
import { beforeEach, describe, expect, it } from 'bun:test';
import { createRoot } from '@zen/runtime';
import type { MouseEvent } from '../utils/mouse-parser.js';
import {
  clearMouseListeners,
  dispatchMouseEvent,
  useMouse,
  useMouseClick,
  useMouseDrag,
  useMouseScroll,
} from './useMouse.js';

// Helper to create mouse events
const createMouseEvent = (
  type: MouseEvent['type'],
  button: MouseEvent['button'],
  x = 10,
  y = 10,
  modifiers?: { ctrl?: boolean; shift?: boolean; meta?: boolean },
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
  // Basic Handler Registration
  // ==========================================================================

  describe('Basic Handler Registration', () => {
    it('should receive dispatched mouse events', () => {
      let received: MouseEvent | null = null;

      createRoot(() => {
        useMouse((event) => {
          received = event;
        });

        const event = createMouseEvent('mousedown', 'left', 15, 20);
        dispatchMouseEvent(event);
      });

      expect(received).not.toBeNull();
      expect(received?.type).toBe('mousedown');
      expect(received?.button).toBe('left');
      expect(received?.x).toBe(15);
      expect(received?.y).toBe(20);
    });

    it('should dispatch to multiple handlers', () => {
      const calls: string[] = [];

      createRoot(() => {
        useMouse(() => {
          calls.push('handler1');
        });

        useMouse(() => {
          calls.push('handler2');
        });

        dispatchMouseEvent(createMouseEvent('mousedown', 'left'));
      });

      expect(calls).toContain('handler1');
      expect(calls).toContain('handler2');
    });

    it('should cleanup handler when clearMouseListeners is called', () => {
      let callCount = 0;

      createRoot(() => {
        useMouse(() => {
          callCount++;
        });

        dispatchMouseEvent(createMouseEvent('mousedown', 'left'));
        expect(callCount).toBe(1);

        clearMouseListeners();

        dispatchMouseEvent(createMouseEvent('mousedown', 'left'));
        expect(callCount).toBe(1); // No increase after clear
      });
    });
  });

  // ==========================================================================
  // Event Types
  // ==========================================================================

  describe('Event Types', () => {
    it('should receive mousedown events', () => {
      let type: string | null = null;

      createRoot(() => {
        useMouse((event) => {
          type = event.type;
        });

        dispatchMouseEvent(createMouseEvent('mousedown', 'left'));
      });

      expect(type).toBe('mousedown');
    });

    it('should receive mouseup events', () => {
      let type: string | null = null;

      createRoot(() => {
        useMouse((event) => {
          type = event.type;
        });

        dispatchMouseEvent(createMouseEvent('mouseup', 'left'));
      });

      expect(type).toBe('mouseup');
    });

    it('should receive mousemove events', () => {
      let type: string | null = null;

      createRoot(() => {
        useMouse((event) => {
          type = event.type;
        });

        dispatchMouseEvent(createMouseEvent('mousemove', 'left'));
      });

      expect(type).toBe('mousemove');
    });

    it('should receive scroll events', () => {
      let type: string | null = null;

      createRoot(() => {
        useMouse((event) => {
          type = event.type;
        });

        dispatchMouseEvent(createMouseEvent('scroll', 'scroll-up'));
      });

      expect(type).toBe('scroll');
    });
  });
});

describe('useMouseClick', () => {
  beforeEach(() => {
    clearMouseListeners();
  });

  it('should only trigger on mouseup events', () => {
    const clicks: string[] = [];

    createRoot(() => {
      useMouseClick((x, y, button) => {
        clicks.push(`${button} at ${x},${y}`);
      });

      // mousedown should not trigger
      dispatchMouseEvent(createMouseEvent('mousedown', 'left', 5, 10));

      // mouseup should trigger
      dispatchMouseEvent(createMouseEvent('mouseup', 'left', 5, 10));
    });

    expect(clicks).toEqual(['left at 5,10']);
  });

  it('should handle different buttons', () => {
    const buttons: string[] = [];

    createRoot(() => {
      useMouseClick((_x, _y, button) => {
        buttons.push(button);
      });

      dispatchMouseEvent(createMouseEvent('mouseup', 'left'));
      dispatchMouseEvent(createMouseEvent('mouseup', 'middle'));
      dispatchMouseEvent(createMouseEvent('mouseup', 'right'));
    });

    expect(buttons).toEqual(['left', 'middle', 'right']);
  });

  it('should pass modifier keys', () => {
    let modifiers: { ctrl?: boolean; shift?: boolean; meta?: boolean } | undefined;

    createRoot(() => {
      useMouseClick((_x, _y, _button, mods) => {
        modifiers = mods;
      });

      dispatchMouseEvent(createMouseEvent('mouseup', 'left', 10, 10, { ctrl: true, shift: true }));
    });

    expect(modifiers?.ctrl).toBe(true);
    expect(modifiers?.shift).toBe(true);
  });

  it('should not trigger on scroll events', () => {
    let triggered = false;

    createRoot(() => {
      useMouseClick(() => {
        triggered = true;
      });

      dispatchMouseEvent(createMouseEvent('scroll', 'scroll-up'));
    });

    expect(triggered).toBe(false);
  });

  it('should not trigger on none button', () => {
    let triggered = false;

    createRoot(() => {
      useMouseClick(() => {
        triggered = true;
      });

      dispatchMouseEvent(createMouseEvent('mouseup', 'none'));
    });

    expect(triggered).toBe(false);
  });
});

describe('useMouseScroll', () => {
  beforeEach(() => {
    clearMouseListeners();
  });

  it('should trigger on scroll-up events', () => {
    let direction: string | null = null;

    createRoot(() => {
      useMouseScroll((dir) => {
        direction = dir;
      });

      dispatchMouseEvent(createMouseEvent('scroll', 'scroll-up'));
    });

    expect(direction).toBe('up');
  });

  it('should trigger on scroll-down events', () => {
    let direction: string | null = null;

    createRoot(() => {
      useMouseScroll((dir) => {
        direction = dir;
      });

      dispatchMouseEvent(createMouseEvent('scroll', 'scroll-down'));
    });

    expect(direction).toBe('down');
  });

  it('should pass position', () => {
    let pos: { x: number; y: number } | null = null;

    createRoot(() => {
      useMouseScroll((_dir, x, y) => {
        pos = { x, y };
      });

      dispatchMouseEvent(createMouseEvent('scroll', 'scroll-up', 25, 30));
    });

    expect(pos).toEqual({ x: 25, y: 30 });
  });

  it('should not trigger on click events', () => {
    let triggered = false;

    createRoot(() => {
      useMouseScroll(() => {
        triggered = true;
      });

      dispatchMouseEvent(createMouseEvent('mouseup', 'left'));
    });

    expect(triggered).toBe(false);
  });
});

describe('useMouseDrag', () => {
  beforeEach(() => {
    clearMouseListeners();
  });

  it('should track drag start', () => {
    let startPos: { x: number; y: number } | null = null;

    createRoot(() => {
      useMouseDrag({
        onDragStart: (x, y) => {
          startPos = { x, y };
        },
      });

      dispatchMouseEvent(createMouseEvent('mousedown', 'left', 10, 20));
    });

    expect(startPos).toEqual({ x: 10, y: 20 });
  });

  it('should track drag move after start', () => {
    const moves: { x: number; y: number; startX: number; startY: number }[] = [];

    createRoot(() => {
      useMouseDrag({
        onDragStart: () => true,
        onDragMove: (x, y, startX, startY) => {
          moves.push({ x, y, startX, startY });
        },
      });

      dispatchMouseEvent(createMouseEvent('mousedown', 'left', 10, 10));
      dispatchMouseEvent(createMouseEvent('mousemove', 'left', 15, 20));
      dispatchMouseEvent(createMouseEvent('mousemove', 'left', 25, 30));
    });

    expect(moves).toHaveLength(2);
    expect(moves[0]).toEqual({ x: 15, y: 20, startX: 10, startY: 10 });
    expect(moves[1]).toEqual({ x: 25, y: 30, startX: 10, startY: 10 });
  });

  it('should track drag end', () => {
    let endPos: { x: number; y: number } | null = null;

    createRoot(() => {
      useMouseDrag({
        onDragEnd: (x, y) => {
          endPos = { x, y };
        },
      });

      dispatchMouseEvent(createMouseEvent('mousedown', 'left', 10, 10));
      dispatchMouseEvent(createMouseEvent('mouseup', 'left', 50, 60));
    });

    expect(endPos).toEqual({ x: 50, y: 60 });
  });

  it('should not track move without drag start', () => {
    let moved = false;

    createRoot(() => {
      useMouseDrag({
        onDragMove: () => {
          moved = true;
        },
      });

      dispatchMouseEvent(createMouseEvent('mousemove', 'left', 15, 20));
    });

    expect(moved).toBe(false);
  });

  it('should stop drag after mouseup', () => {
    const moves: number[] = [];

    createRoot(() => {
      useMouseDrag({
        onDragMove: (x) => {
          moves.push(x);
        },
      });

      dispatchMouseEvent(createMouseEvent('mousedown', 'left', 10, 10));
      dispatchMouseEvent(createMouseEvent('mousemove', 'left', 15, 15));
      dispatchMouseEvent(createMouseEvent('mouseup', 'left', 20, 20));
      dispatchMouseEvent(createMouseEvent('mousemove', 'left', 25, 25)); // After drag ended
    });

    expect(moves).toEqual([15]); // Only one move before end
  });

  it('should prevent drag if onDragStart returns false', () => {
    let moved = false;

    createRoot(() => {
      useMouseDrag({
        onDragStart: () => false,
        onDragMove: () => {
          moved = true;
        },
      });

      dispatchMouseEvent(createMouseEvent('mousedown', 'left', 10, 10));
      dispatchMouseEvent(createMouseEvent('mousemove', 'left', 15, 15));
    });

    expect(moved).toBe(false);
  });

  it('should handle different mouse buttons', () => {
    const buttons: string[] = [];

    createRoot(() => {
      useMouseDrag({
        onDragStart: (_x, _y, button) => {
          buttons.push(button);
        },
      });

      dispatchMouseEvent(createMouseEvent('mousedown', 'left'));
      dispatchMouseEvent(createMouseEvent('mouseup', 'left'));
      dispatchMouseEvent(createMouseEvent('mousedown', 'right'));
      dispatchMouseEvent(createMouseEvent('mouseup', 'right'));
    });

    expect(buttons).toEqual(['left', 'right']);
  });
});

describe('dispatchMouseEvent', () => {
  beforeEach(() => {
    clearMouseListeners();
  });

  it('should call all registered handlers', () => {
    const calls: number[] = [];

    createRoot(() => {
      useMouse(() => calls.push(1));
      useMouse(() => calls.push(2));
      useMouse(() => calls.push(3));

      dispatchMouseEvent(createMouseEvent('mousedown', 'left'));
    });

    expect(calls).toEqual([1, 2, 3]);
  });

  it('should handle empty listener set', () => {
    // Should not throw
    expect(() => {
      dispatchMouseEvent(createMouseEvent('mousedown', 'left'));
    }).not.toThrow();
  });
});
