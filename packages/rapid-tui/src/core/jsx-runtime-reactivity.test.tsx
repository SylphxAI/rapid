/**
 * Comprehensive tests for JSX runtime reactivity
 *
 * Tests edge cases for signal updates:
 * - Text width changes (shrink, grow, same length)
 * - Multi-digit numbers
 * - Unicode/CJK characters
 * - Empty strings
 * - Rapid batched updates
 */

import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { batch, effect, signal } from '@rapid/signal';
import { terminalWidth } from '../utils/terminal-width.js';

describe('terminalWidth utility', () => {
  it('calculates width of ASCII text', () => {
    expect(terminalWidth('Hello')).toBe(5);
    expect(terminalWidth('World')).toBe(5);
    expect(terminalWidth('0')).toBe(1);
    expect(terminalWidth('10')).toBe(2);
    expect(terminalWidth('100')).toBe(3);
  });

  it('handles empty strings', () => {
    expect(terminalWidth('')).toBe(0);
  });

  it('calculates width of CJK characters (double-width)', () => {
    // Chinese characters are typically double-width in terminals
    expect(terminalWidth('中')).toBe(2);
    expect(terminalWidth('中文')).toBe(4);
    expect(terminalWidth('Hello中文')).toBe(9); // 5 + 4
  });

  it('handles emoji', () => {
    // Most emoji are double-width
    expect(terminalWidth('😀')).toBeGreaterThanOrEqual(1);
  });
});

describe('signal width tracking', () => {
  it('detects width change from single to double digit', () => {
    const s = signal(9);
    const prevWidth = terminalWidth(String(s.value));

    s.value = 10;
    const newWidth = terminalWidth(String(s.value));

    expect(prevWidth).toBe(1);
    expect(newWidth).toBe(2);
    expect(newWidth).not.toBe(prevWidth);
  });

  it('detects no width change for same length values', () => {
    const s = signal(1);
    const prevWidth = terminalWidth(String(s.value));

    s.value = 2;
    const newWidth = terminalWidth(String(s.value));

    expect(prevWidth).toBe(1);
    expect(newWidth).toBe(1);
    expect(newWidth).toBe(prevWidth);
  });

  it('detects width change from double to triple digit', () => {
    const s = signal(99);
    const prevWidth = terminalWidth(String(s.value));

    s.value = 100;
    const newWidth = terminalWidth(String(s.value));

    expect(prevWidth).toBe(2);
    expect(newWidth).toBe(3);
  });

  it('detects width change for shrinking text', () => {
    const s = signal('Hello World');
    const prevWidth = terminalWidth(String(s.value));

    s.value = 'Hi';
    const newWidth = terminalWidth(String(s.value));

    expect(prevWidth).toBe(11);
    expect(newWidth).toBe(2);
  });

  it('detects width change for growing text', () => {
    const s = signal('Hi');
    const prevWidth = terminalWidth(String(s.value));

    s.value = 'Hello World';
    const newWidth = terminalWidth(String(s.value));

    expect(prevWidth).toBe(2);
    expect(newWidth).toBe(11);
  });

  it('detects width change from empty to non-empty', () => {
    const s = signal('');
    const prevWidth = terminalWidth(String(s.value));

    s.value = 'Hello';
    const newWidth = terminalWidth(String(s.value));

    expect(prevWidth).toBe(0);
    expect(newWidth).toBe(5);
  });

  it('detects width change from non-empty to empty', () => {
    const s = signal('Hello');
    const prevWidth = terminalWidth(String(s.value));

    s.value = '';
    const newWidth = terminalWidth(String(s.value));

    expect(prevWidth).toBe(5);
    expect(newWidth).toBe(0);
  });
});

describe('effect reactivity', () => {
  it('effect re-runs when signal changes', () => {
    const count = signal(0);
    const values: number[] = [];

    effect(() => {
      values.push(count.value);
    });

    expect(values).toEqual([0]); // Initial run

    count.value = 1;
    expect(values).toEqual([0, 1]);

    count.value = 2;
    expect(values).toEqual([0, 1, 2]);
  });

  it('batch groups multiple updates', () => {
    const a = signal(0);
    const b = signal(0);
    let runCount = 0;

    effect(() => {
      a.value;
      b.value;
      runCount++;
    });

    expect(runCount).toBe(1); // Initial

    batch(() => {
      a.value = 1;
      b.value = 1;
    });

    expect(runCount).toBe(2); // Only one more run despite two changes
  });

  it('handles rapid sequential updates', () => {
    const s = signal(0);
    const values: number[] = [];

    effect(() => {
      values.push(s.value);
    });

    // Rapid updates
    for (let i = 1; i <= 10; i++) {
      s.value = i;
    }

    expect(values[0]).toBe(0);
    expect(values[values.length - 1]).toBe(10);
  });

  it('tracks width changes correctly through effect', () => {
    const count = signal(8);
    const widthChanges: Array<{ old: number; new: number }> = [];
    let prevWidth = terminalWidth(String(count.value));

    effect(() => {
      const newWidth = terminalWidth(String(count.value));
      if (newWidth !== prevWidth) {
        widthChanges.push({ old: prevWidth, new: newWidth });
        prevWidth = newWidth;
      }
    });

    // No width change for same-length numbers
    count.value = 9;
    expect(widthChanges.length).toBe(0);

    // Width change: 9 -> 10
    count.value = 10;
    expect(widthChanges.length).toBe(1);
    expect(widthChanges[0]).toEqual({ old: 1, new: 2 });

    // No width change for same-length numbers
    count.value = 50;
    expect(widthChanges.length).toBe(1);

    // Width change: 99 -> 100
    count.value = 99;
    count.value = 100;
    expect(widthChanges.length).toBe(2);
    expect(widthChanges[1]).toEqual({ old: 2, new: 3 });
  });
});

describe('reactive function edge cases', () => {
  it('handles null and undefined values', () => {
    const s = signal<string | null | undefined>('test');

    effect(() => {
      const val = s.value;
      const str = String(val ?? '');
      expect(typeof str).toBe('string');
    });

    s.value = null;
    s.value = undefined;
    s.value = '';
    s.value = 'back';
  });

  it('handles boolean to string conversion', () => {
    const s = signal<boolean | number>(true);
    const values: string[] = [];

    effect(() => {
      values.push(String(s.value));
    });

    s.value = false;
    s.value = 0;
    s.value = 1;

    expect(values).toContain('true');
    expect(values).toContain('false');
    expect(values).toContain('0');
    expect(values).toContain('1');
  });

  it('handles object toString', () => {
    const s = signal<{ value: number }>({ value: 42 });

    effect(() => {
      const str = String(s.value);
      expect(str).toBe('[object Object]');
    });

    s.value = { value: 100 };
  });

  it('handles array toString', () => {
    const s = signal([1, 2, 3]);
    const values: string[] = [];

    effect(() => {
      values.push(String(s.value));
    });

    s.value = [4, 5, 6, 7];

    expect(values).toContain('1,2,3');
    expect(values).toContain('4,5,6,7');
  });
});

describe('multi-digit number transitions', () => {
  const transitions = [
    { from: 0, to: 1, widthChange: false },
    { from: 9, to: 10, widthChange: true },
    { from: 10, to: 11, widthChange: false },
    { from: 99, to: 100, widthChange: true },
    { from: 100, to: 101, widthChange: false },
    { from: 999, to: 1000, widthChange: true },
    { from: 10, to: 9, widthChange: true }, // shrink
    { from: 100, to: 99, widthChange: true }, // shrink
    { from: 1000, to: 999, widthChange: true }, // shrink
  ];

  for (const { from, to, widthChange } of transitions) {
    it(`${from} -> ${to}: width ${widthChange ? 'changes' : 'stays same'}`, () => {
      const fromWidth = terminalWidth(String(from));
      const toWidth = terminalWidth(String(to));

      if (widthChange) {
        expect(fromWidth).not.toBe(toWidth);
      } else {
        expect(fromWidth).toBe(toWidth);
      }
    });
  }
});

describe('Unicode width calculations', () => {
  it('ASCII characters are 1 width each', () => {
    expect(terminalWidth('a')).toBe(1);
    expect(terminalWidth('Z')).toBe(1);
    expect(terminalWidth('1')).toBe(1);
    expect(terminalWidth(' ')).toBe(1);
  });

  it('CJK ideographs are typically 2 width each', () => {
    // Common CJK characters
    expect(terminalWidth('中')).toBe(2);
    expect(terminalWidth('文')).toBe(2);
    expect(terminalWidth('日')).toBe(2);
    expect(terminalWidth('本')).toBe(2);
  });

  it('mixed ASCII and CJK calculates correctly', () => {
    // "Hello中文" = 5 (Hello) + 4 (中文) = 9
    expect(terminalWidth('Hello中文')).toBe(9);
    // "中文Hello" = 4 (中文) + 5 (Hello) = 9
    expect(terminalWidth('中文Hello')).toBe(9);
    // "A中B文C" = 1 + 2 + 1 + 2 + 1 = 7
    expect(terminalWidth('A中B文C')).toBe(7);
  });

  it('detects width change when switching between ASCII and CJK', () => {
    const s = signal('AB');
    let prevWidth = terminalWidth(s.value);

    // "AB" (2) -> "中" (2) - same width!
    s.value = '中';
    const newWidth1 = terminalWidth(s.value);
    expect(prevWidth).toBe(2);
    expect(newWidth1).toBe(2);

    // "中" (2) -> "中文" (4) - width changes
    prevWidth = newWidth1;
    s.value = '中文';
    const newWidth2 = terminalWidth(s.value);
    expect(newWidth2).toBe(4);
    expect(newWidth2).not.toBe(prevWidth);
  });
});

describe('multiline text dimension tracking', () => {
  // Helper to calculate text dimensions (same as jsx-runtime.ts)
  function getTextDimensions(text: string): { width: number; height: number } {
    const lines = text.split('\n');
    const height = lines.length;
    const width = lines.length > 0 ? Math.max(...lines.map((line) => terminalWidth(line))) : 0;
    return { width, height };
  }

  it('single line has height 1', () => {
    const dims = getTextDimensions('Hello');
    expect(dims.width).toBe(5);
    expect(dims.height).toBe(1);
  });

  it('two lines has height 2', () => {
    const dims = getTextDimensions('Hello\nWorld');
    expect(dims.width).toBe(5); // max(5, 5) = 5
    expect(dims.height).toBe(2);
  });

  it('detects height change when adding newline', () => {
    const text1 = 'AAAAA';
    const text2 = 'AA\nBBB';

    const dims1 = getTextDimensions(text1);
    const dims2 = getTextDimensions(text2);

    // Same width (max line width is 5 vs 3, different)
    expect(dims1.width).toBe(5);
    expect(dims2.width).toBe(3);

    // Different height
    expect(dims1.height).toBe(1);
    expect(dims2.height).toBe(2);
  });

  it('detects height change with same max line width', () => {
    // Crafted to have same max width but different heights
    const text1 = 'ABCDE'; // width=5, height=1
    const _text2 = 'ABC\nDE'; // width=3, height=2
    const text3 = 'ABCDE\nFGHIJ'; // width=5, height=2

    const dims1 = getTextDimensions(text1);
    const dims3 = getTextDimensions(text3);

    // Same width, different height
    expect(dims1.width).toBe(5);
    expect(dims3.width).toBe(5);
    expect(dims1.height).toBe(1);
    expect(dims3.height).toBe(2);

    // This is the key case: same width means we'd miss this without height tracking
    expect(dims1.width).toBe(dims3.width);
    expect(dims1.height).not.toBe(dims3.height);
  });

  it('tracks dimension changes in effect', () => {
    const text = signal('Line 1');
    const dimensionChanges: Array<{
      oldWidth: number;
      oldHeight: number;
      newWidth: number;
      newHeight: number;
    }> = [];
    let prev = getTextDimensions(text.value);

    effect(() => {
      const curr = getTextDimensions(text.value);
      if (curr.width !== prev.width || curr.height !== prev.height) {
        dimensionChanges.push({
          oldWidth: prev.width,
          oldHeight: prev.height,
          newWidth: curr.width,
          newHeight: curr.height,
        });
        prev = curr;
      }
    });

    // Add second line
    text.value = 'Line 1\nLine 2';
    expect(dimensionChanges.length).toBe(1);
    expect(dimensionChanges[0]).toEqual({
      oldWidth: 6,
      oldHeight: 1,
      newWidth: 6,
      newHeight: 2,
    });

    // Add third line
    text.value = 'Line 1\nLine 2\nLine 3';
    expect(dimensionChanges.length).toBe(2);
    expect(dimensionChanges[1]).toEqual({
      oldWidth: 6,
      oldHeight: 2,
      newWidth: 6,
      newHeight: 3,
    });

    // Same dimensions, just different content
    text.value = 'Line A\nLine B\nLine C';
    expect(dimensionChanges.length).toBe(2); // No new change

    // Remove lines
    text.value = 'Line A';
    expect(dimensionChanges.length).toBe(3);
    expect(dimensionChanges[2]).toEqual({
      oldWidth: 6,
      oldHeight: 3,
      newWidth: 6,
      newHeight: 1,
    });
  });

  it('handles empty lines correctly', () => {
    const text1 = 'A\n\nB'; // Empty line in middle
    const dims = getTextDimensions(text1);
    expect(dims.height).toBe(3);
    expect(dims.width).toBe(1); // max of 'A', '', 'B' = 1
  });

  it('handles trailing newline', () => {
    const text1 = 'Hello\n'; // Trailing newline
    const dims = getTextDimensions(text1);
    expect(dims.height).toBe(2); // 'Hello' and ''
    expect(dims.width).toBe(5);
  });

  it('handles multiple trailing newlines', () => {
    const text1 = 'Hello\n\n\n'; // Multiple trailing newlines
    const dims = getTextDimensions(text1);
    expect(dims.height).toBe(4); // 'Hello', '', '', ''
    expect(dims.width).toBe(5);
  });

  it('handles CJK in multiline text', () => {
    const text = '中文\nHello';
    const dims = getTextDimensions(text);
    expect(dims.width).toBe(5); // max(4, 5) = 5
    expect(dims.height).toBe(2);
  });

  it('handles varying line widths', () => {
    const text = 'A\nABC\nABCDE\nAB';
    const dims = getTextDimensions(text);
    expect(dims.width).toBe(5); // max of all lines
    expect(dims.height).toBe(4);
  });
});

describe('stress tests', () => {
  it('handles 1000 rapid updates', () => {
    const s = signal(0);
    let updateCount = 0;

    effect(() => {
      s.value;
      updateCount++;
    });

    for (let i = 1; i <= 1000; i++) {
      s.value = i;
    }

    // Effect should have run for each update + initial
    expect(updateCount).toBe(1001);
  });

  it('handles alternating width changes', () => {
    const s = signal(9);
    const widthHistory: number[] = [];

    effect(() => {
      widthHistory.push(terminalWidth(String(s.value)));
    });

    // Alternating between 1-digit and 2-digit
    s.value = 10; // width 2
    s.value = 5; // width 1
    s.value = 15; // width 2
    s.value = 8; // width 1
    s.value = 99; // width 2

    expect(widthHistory).toEqual([1, 2, 1, 2, 1, 2]);
  });
});
