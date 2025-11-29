/** @jsxImportSource @zen/tui */
/**
 * useInput Hook Tests
 *
 * Tests for keyboard input handling with parseKey and dispatchInput.
 */
import { describe, expect, it, beforeEach } from 'bun:test';
import { createRoot, signal } from '@zen/runtime';
import {
  parseKey,
  dispatchInput,
  useInput,
  clearInputHandlers,
  type Key,
  type InputHandler,
} from './useInput.js';

describe('parseKey', () => {
  // ==========================================================================
  // Basic Keys
  // ==========================================================================

  describe('Basic Keys', () => {
    it('should parse lowercase letters', () => {
      const result = parseKey('a');
      expect(result.input).toBe('a');
      expect(result.key.shift).toBe(false);
      expect(result.key.ctrl).toBe(false);
    });

    it('should parse uppercase letters with shift', () => {
      const result = parseKey('A');
      expect(result.input).toBe('A');
      expect(result.key.shift).toBe(true);
    });

    it('should parse numbers', () => {
      const result = parseKey('5');
      expect(result.input).toBe('5');
    });

    it('should parse symbols', () => {
      const result = parseKey('!');
      expect(result.input).toBe('!');
    });

    it('should parse space', () => {
      const result = parseKey(' ');
      expect(result.input).toBe(' ');
    });
  });

  // ==========================================================================
  // Control Keys
  // ==========================================================================

  describe('Control Keys', () => {
    it('should parse Ctrl+C', () => {
      const result = parseKey('\x03');
      expect(result.key.ctrl).toBe(true);
      expect(result.input).toBe('c');
    });

    it('should parse Ctrl+A', () => {
      const result = parseKey('\x01');
      expect(result.key.ctrl).toBe(true);
      expect(result.input).toBe('a');
    });

    it('should parse Ctrl+Z', () => {
      const result = parseKey('\x1a');
      expect(result.key.ctrl).toBe(true);
      expect(result.input).toBe('z');
    });
  });

  // ==========================================================================
  // Special Keys
  // ==========================================================================

  describe('Special Keys', () => {
    it('should parse Return/Enter', () => {
      const result = parseKey('\r');
      expect(result.key.return).toBe(true);
      expect(result.input).toBe('');
    });

    it('should parse Enter (newline)', () => {
      const result = parseKey('\n');
      expect(result.input).toBe('');
    });

    it('should parse Tab', () => {
      const result = parseKey('\t');
      expect(result.key.tab).toBe(true);
      expect(result.input).toBe('');
    });

    it('should parse Escape', () => {
      const result = parseKey('\x1b');
      expect(result.key.escape).toBe(true);
      expect(result.input).toBe('');
    });

    it('should parse Backspace (0x7f)', () => {
      const result = parseKey('\x7f');
      expect(result.key.backspace).toBe(true);
      expect(result.input).toBe('');
    });

    it('should parse Backspace (0x08)', () => {
      const result = parseKey('\b');
      expect(result.key.backspace).toBe(true);
      expect(result.input).toBe('');
    });

    it('should parse Delete key', () => {
      const result = parseKey('\x1b[3~');
      expect(result.key.delete).toBe(true);
      expect(result.input).toBe('');
    });
  });

  // ==========================================================================
  // Arrow Keys
  // ==========================================================================

  describe('Arrow Keys', () => {
    it('should parse Up arrow (xterm)', () => {
      const result = parseKey('\x1b[A');
      expect(result.key.upArrow).toBe(true);
      expect(result.input).toBe('');
    });

    it('should parse Down arrow (xterm)', () => {
      const result = parseKey('\x1b[B');
      expect(result.key.downArrow).toBe(true);
      expect(result.input).toBe('');
    });

    it('should parse Right arrow (xterm)', () => {
      const result = parseKey('\x1b[C');
      expect(result.key.rightArrow).toBe(true);
      expect(result.input).toBe('');
    });

    it('should parse Left arrow (xterm)', () => {
      const result = parseKey('\x1b[D');
      expect(result.key.leftArrow).toBe(true);
      expect(result.input).toBe('');
    });

    it('should parse Up arrow (gnome)', () => {
      const result = parseKey('\x1bOA');
      expect(result.key.upArrow).toBe(true);
    });

    it('should parse Down arrow (gnome)', () => {
      const result = parseKey('\x1bOB');
      expect(result.key.downArrow).toBe(true);
    });
  });

  // ==========================================================================
  // Navigation Keys
  // ==========================================================================

  describe('Navigation Keys', () => {
    it('should parse Home key', () => {
      const result = parseKey('\x1b[H');
      expect(result.key.home).toBe(true);
      expect(result.input).toBe('');
    });

    it('should parse End key', () => {
      const result = parseKey('\x1b[F');
      expect(result.key.end).toBe(true);
      expect(result.input).toBe('');
    });

    it('should parse Page Up', () => {
      const result = parseKey('\x1b[5~');
      expect(result.key.pageUp).toBe(true);
      expect(result.input).toBe('');
    });

    it('should parse Page Down', () => {
      const result = parseKey('\x1b[6~');
      expect(result.key.pageDown).toBe(true);
      expect(result.input).toBe('');
    });
  });

  // ==========================================================================
  // Function Keys
  // ==========================================================================

  describe('Function Keys', () => {
    it('should parse F1 (xterm)', () => {
      const result = parseKey('\x1bOP');
      expect(result.key.f1).toBe(true);
      expect(result.input).toBe('');
    });

    it('should parse F2 (xterm)', () => {
      const result = parseKey('\x1bOQ');
      expect(result.key.f2).toBe(true);
    });

    it('should parse F3 (xterm)', () => {
      const result = parseKey('\x1bOR');
      expect(result.key.f3).toBe(true);
    });

    it('should parse F4 (xterm)', () => {
      const result = parseKey('\x1bOS');
      expect(result.key.f4).toBe(true);
    });

    it('should parse F5 (rxvt)', () => {
      const result = parseKey('\x1b[15~');
      expect(result.key.f5).toBe(true);
    });

    it('should parse F6 (rxvt)', () => {
      const result = parseKey('\x1b[17~');
      expect(result.key.f6).toBe(true);
    });

    it('should parse F7 (rxvt)', () => {
      const result = parseKey('\x1b[18~');
      expect(result.key.f7).toBe(true);
    });

    it('should parse F8 (rxvt)', () => {
      const result = parseKey('\x1b[19~');
      expect(result.key.f8).toBe(true);
    });

    it('should parse F9 (rxvt)', () => {
      const result = parseKey('\x1b[20~');
      expect(result.key.f9).toBe(true);
    });

    it('should parse F10 (rxvt)', () => {
      const result = parseKey('\x1b[21~');
      expect(result.key.f10).toBe(true);
    });

    it('should parse F11 (rxvt)', () => {
      const result = parseKey('\x1b[23~');
      expect(result.key.f11).toBe(true);
    });

    it('should parse F12 (rxvt)', () => {
      const result = parseKey('\x1b[24~');
      expect(result.key.f12).toBe(true);
    });
  });

  // ==========================================================================
  // Shift+Tab
  // ==========================================================================

  describe('Shift+Tab', () => {
    it('should parse Shift+Tab', () => {
      const result = parseKey('\x1b[Z');
      expect(result.key.tab).toBe(true);
      expect(result.key.shift).toBe(true);
    });
  });

  // ==========================================================================
  // Meta Key
  // ==========================================================================

  describe('Meta Key', () => {
    it('should parse Meta+Backspace', () => {
      const result = parseKey('\x1b\x7f');
      expect(result.key.backspace).toBe(true);
      expect(result.key.meta).toBe(true);
    });

    it('should parse Meta+Space', () => {
      const result = parseKey('\x1b ');
      expect(result.key.meta).toBe(true);
    });

    it('should set meta for escape', () => {
      const result = parseKey('\x1b');
      expect(result.key.meta).toBe(true);
    });
  });
});

describe('dispatchInput', () => {
  beforeEach(() => {
    clearInputHandlers();
  });

  // ==========================================================================
  // Basic Dispatching
  // ==========================================================================

  describe('Basic Dispatching', () => {
    it('should dispatch to registered handlers', () => {
      let received: { input: string; key: Key } | null = null;

      createRoot(() => {
        useInput((input, key) => {
          received = { input, key };
        });

        dispatchInput('a');
      });

      expect(received).not.toBeNull();
      expect(received?.input).toBe('a');
    });

    it('should dispatch to multiple handlers', () => {
      const calls: string[] = [];

      createRoot(() => {
        useInput((input) => {
          calls.push(`handler1: ${input}`);
        });

        useInput((input) => {
          calls.push(`handler2: ${input}`);
        });

        dispatchInput('x');
      });

      expect(calls).toContain('handler1: x');
      expect(calls).toContain('handler2: x');
    });

    it('should stop propagation when handler returns true', () => {
      const calls: string[] = [];

      createRoot(() => {
        useInput(() => {
          calls.push('handler1');
          return true; // Stop propagation
        });

        useInput(() => {
          calls.push('handler2');
        });

        dispatchInput('x');
      });

      expect(calls).toEqual(['handler1']);
    });
  });

  // ==========================================================================
  // isActive Option
  // ==========================================================================

  describe('isActive Option', () => {
    it('should not dispatch when isActive is false', () => {
      let called = false;

      createRoot(() => {
        useInput(
          () => {
            called = true;
          },
          { isActive: false },
        );

        dispatchInput('a');
      });

      expect(called).toBe(false);
    });

    it('should dispatch when isActive is true', () => {
      let called = false;

      createRoot(() => {
        useInput(
          () => {
            called = true;
          },
          { isActive: true },
        );

        dispatchInput('a');
      });

      expect(called).toBe(true);
    });

    it('should support reactive isActive', () => {
      const isActive = signal(false);
      let callCount = 0;

      createRoot(() => {
        useInput(
          () => {
            callCount++;
          },
          { isActive },
        );

        // Should not be called when inactive
        dispatchInput('a');
        expect(callCount).toBe(0);

        // Activate
        isActive.value = true;

        // Should be called when active
        dispatchInput('b');
        expect(callCount).toBe(1);
      });
    });

    it('should support getter function for isActive', () => {
      let active = false;
      let called = false;

      createRoot(() => {
        useInput(
          () => {
            called = true;
          },
          { isActive: () => active },
        );

        dispatchInput('a');
        expect(called).toBe(false);

        active = true;

        // Note: getter is evaluated during effect, so need to re-register
        // This test just verifies the getter is accepted
      });
    });
  });

  // ==========================================================================
  // Cleanup
  // ==========================================================================

  describe('Cleanup', () => {
    it('should remove handler on cleanup', () => {
      let called = false;

      const dispose = createRoot((dispose) => {
        useInput(() => {
          called = true;
        });
        return dispose;
      });

      dispatchInput('a');
      expect(called).toBe(true);

      called = false;
      dispose();

      dispatchInput('b');
      expect(called).toBe(false);
    });
  });
});

describe('clearInputHandlers', () => {
  it('should clear all handlers', () => {
    let called = false;

    createRoot(() => {
      useInput(() => {
        called = true;
      });
    });

    clearInputHandlers();
    dispatchInput('a');

    expect(called).toBe(false);
  });
});
