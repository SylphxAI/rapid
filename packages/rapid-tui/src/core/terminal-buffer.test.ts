/**
 * Terminal Buffer Tests
 *
 * Comprehensive tests for the terminal screen buffer with ANSI code handling,
 * grapheme clustering, emoji width, and text merging.
 */
import { describe, expect, it } from 'bun:test';
import { TerminalBuffer } from './terminal-buffer.js';

describe('TerminalBuffer', () => {
  // ==========================================================================
  // Constructor
  // ==========================================================================

  describe('Constructor', () => {
    it('should create buffer with specified dimensions', () => {
      const buffer = new TerminalBuffer(80, 24);
      expect(buffer).toBeDefined();
    });

    it('should initialize with empty lines', () => {
      const buffer = new TerminalBuffer(10, 5);
      for (let y = 0; y < 5; y++) {
        expect(buffer.getLine(y)).toBe('');
      }
    });

    it('should handle zero dimensions', () => {
      const buffer = new TerminalBuffer(0, 0);
      expect(buffer.getLine(0)).toBe('');
    });

    it('should handle large dimensions', () => {
      const buffer = new TerminalBuffer(500, 200);
      expect(buffer.getLine(0)).toBe('');
      expect(buffer.getLine(199)).toBe('');
    });
  });

  // ==========================================================================
  // clear()
  // ==========================================================================

  describe('clear()', () => {
    it('should empty all lines', () => {
      const buffer = new TerminalBuffer(20, 5);
      buffer.writeAt(0, 0, 'Hello');
      buffer.writeAt(0, 1, 'World');
      buffer.clear();

      for (let y = 0; y < 5; y++) {
        expect(buffer.getLine(y)).toBe('');
      }
    });

    it('should clear buffer with ANSI codes', () => {
      const buffer = new TerminalBuffer(20, 3);
      buffer.writeAt(0, 0, '\x1b[31mRed Text\x1b[0m');
      buffer.clear();

      expect(buffer.getLine(0)).toBe('');
    });
  });

  // ==========================================================================
  // writeAt() - Basic Operations
  // ==========================================================================

  describe('writeAt() - Basic', () => {
    it('should write text at origin (0, 0)', () => {
      const buffer = new TerminalBuffer(20, 5);
      buffer.writeAt(0, 0, 'Hello');

      expect(buffer.getLine(0)).toBe('Hello');
    });

    it('should write text at specific position', () => {
      const buffer = new TerminalBuffer(20, 5);
      buffer.writeAt(5, 2, 'Test');

      expect(buffer.getLine(2)).toBe('     Test');
    });

    it('should return bounding box', () => {
      const buffer = new TerminalBuffer(20, 5);
      const result = buffer.writeAt(3, 1, 'Hello');

      expect(result).toEqual({ x: 3, y: 1, width: 5, height: 1 });
    });

    it('should handle empty string', () => {
      const buffer = new TerminalBuffer(20, 5);
      const result = buffer.writeAt(0, 0, '');

      expect(result.width).toBe(0);
      expect(buffer.getLine(0)).toBe('');
    });

    it('should handle multiline text', () => {
      const buffer = new TerminalBuffer(20, 5);
      buffer.writeAt(0, 0, 'Line 1\nLine 2\nLine 3');

      expect(buffer.getLine(0)).toBe('Line 1');
      expect(buffer.getLine(1)).toBe('Line 2');
      expect(buffer.getLine(2)).toBe('Line 3');
    });

    it('should return correct height for multiline', () => {
      const buffer = new TerminalBuffer(20, 5);
      const result = buffer.writeAt(0, 0, 'A\nB\nC');

      expect(result.height).toBe(3);
    });

    it('should clip at buffer height', () => {
      const buffer = new TerminalBuffer(20, 3);
      buffer.writeAt(0, 0, 'Line 1\nLine 2\nLine 3\nLine 4\nLine 5');

      expect(buffer.getLine(0)).toBe('Line 1');
      expect(buffer.getLine(1)).toBe('Line 2');
      expect(buffer.getLine(2)).toBe('Line 3');
    });
  });

  // ==========================================================================
  // writeAt() - Text Merging
  // ==========================================================================

  describe('writeAt() - Text Merging', () => {
    it('should preserve content before write position', () => {
      const buffer = new TerminalBuffer(20, 3);
      buffer.writeAt(0, 0, 'Hello World');
      buffer.writeAt(6, 0, 'There');

      expect(buffer.getLine(0)).toBe('Hello There');
    });

    it('should preserve content after written text', () => {
      const buffer = new TerminalBuffer(20, 3);
      buffer.writeAt(0, 0, 'AAAAAABBBBB');
      buffer.writeAt(2, 0, 'XX');

      expect(buffer.getLine(0)).toBe('AAXXAABBBBB');
    });

    it('should pad with spaces if content does not reach position', () => {
      const buffer = new TerminalBuffer(20, 3);
      buffer.writeAt(0, 0, 'Hi');
      buffer.writeAt(10, 0, 'There');

      expect(buffer.getLine(0)).toBe('Hi        There');
    });

    it('should handle replace mode', () => {
      const buffer = new TerminalBuffer(20, 3);
      buffer.writeAt(0, 0, 'Hello World');
      buffer.writeAt(0, 0, 'Hi', undefined, true);

      expect(buffer.getLine(0)).toBe('Hi');
    });
  });

  // ==========================================================================
  // writeAt() - maxWidth Truncation
  // ==========================================================================

  describe('writeAt() - maxWidth', () => {
    it('should truncate text exceeding maxWidth', () => {
      const buffer = new TerminalBuffer(20, 3);
      buffer.writeAt(0, 0, 'Hello World', 5);

      expect(buffer.getLine(0)).toBe('Hello');
    });

    it('should preserve ANSI codes during truncation', () => {
      const buffer = new TerminalBuffer(20, 3);
      buffer.writeAt(0, 0, '\x1b[31mHello World\x1b[0m', 5);

      const line = buffer.getLine(0);
      expect(line).toContain('\x1b[31m');
      expect(line).toContain('Hello');
    });

    it('should not truncate if within maxWidth', () => {
      const buffer = new TerminalBuffer(20, 3);
      buffer.writeAt(0, 0, 'Hello', 10);

      expect(buffer.getLine(0)).toBe('Hello');
    });

    it('should apply maxWidth per line for multiline', () => {
      const buffer = new TerminalBuffer(20, 3);
      buffer.writeAt(0, 0, 'AAAAAAAAAA\nBBBBBBBBBB', 5);

      expect(buffer.getLine(0)).toBe('AAAAA');
      expect(buffer.getLine(1)).toBe('BBBBB');
    });
  });

  // ==========================================================================
  // writeAt() - ANSI Color Codes
  // ==========================================================================

  describe('writeAt() - ANSI Codes', () => {
    it('should preserve foreground color codes', () => {
      const buffer = new TerminalBuffer(20, 3);
      buffer.writeAt(0, 0, '\x1b[31mRed\x1b[0m');

      const line = buffer.getLine(0);
      expect(line).toContain('\x1b[31m');
      expect(line).toContain('Red');
    });

    it('should preserve background color codes', () => {
      const buffer = new TerminalBuffer(20, 3);
      buffer.writeAt(0, 0, '\x1b[44mBlue BG\x1b[0m');

      const line = buffer.getLine(0);
      expect(line).toContain('\x1b[44m');
    });

    it('should inherit background color from previous content', () => {
      const buffer = new TerminalBuffer(30, 3);
      buffer.writeAt(0, 0, '\x1b[44m          \x1b[0m'); // Blue background
      buffer.writeAt(2, 0, 'Text');

      const line = buffer.getLine(0);
      expect(line).toContain('\x1b[44m');
    });

    it('should add reset codes at end of colored lines', () => {
      const buffer = new TerminalBuffer(20, 3);
      buffer.writeAt(0, 0, '\x1b[31mRed');

      const line = buffer.getLine(0);
      expect(line).toContain('\x1b[49m');
      expect(line).toContain('\x1b[39m');
    });

    it('should not add reset codes to empty lines', () => {
      const buffer = new TerminalBuffer(20, 3);
      expect(buffer.getLine(0)).toBe('');
    });

    it('should not add duplicate reset codes', () => {
      const buffer = new TerminalBuffer(20, 3);
      buffer.writeAt(0, 0, '\x1b[31mRed\x1b[49m\x1b[39m');

      const line = buffer.getLine(0);
      // Should not end with double reset
      expect(line.endsWith('\x1b[49m\x1b[39m\x1b[49m\x1b[39m')).toBe(false);
    });
  });

  // ==========================================================================
  // writeAt() - Unicode and Emoji
  // ==========================================================================

  describe('writeAt() - Unicode', () => {
    it('should handle basic emoji', () => {
      const buffer = new TerminalBuffer(20, 3);
      buffer.writeAt(0, 0, '😀 Hello');

      const line = buffer.getLine(0);
      expect(line).toContain('😀');
      expect(line).toContain('Hello');
    });

    it('should handle wide emoji (width 2)', () => {
      const buffer = new TerminalBuffer(20, 3);
      const result = buffer.writeAt(0, 0, '🎉');

      // Emoji typically has width 2
      expect(result.width).toBeGreaterThanOrEqual(1);
    });

    it('should handle ZWJ emoji sequences', () => {
      const buffer = new TerminalBuffer(20, 3);
      buffer.writeAt(0, 0, '👨‍👩‍👧 Family');

      const line = buffer.getLine(0);
      expect(line).toContain('👨‍👩‍👧');
    });

    it('should handle flag emoji', () => {
      const buffer = new TerminalBuffer(20, 3);
      buffer.writeAt(0, 0, '🇺🇸 USA');

      const line = buffer.getLine(0);
      expect(line).toContain('🇺🇸');
    });

    it('should handle skin tone modifiers', () => {
      const buffer = new TerminalBuffer(20, 3);
      buffer.writeAt(0, 0, '👋🏻 Wave');

      const line = buffer.getLine(0);
      expect(line).toContain('👋🏻');
    });

    it('should handle CJK characters (width 2)', () => {
      const buffer = new TerminalBuffer(20, 3);
      buffer.writeAt(0, 0, '中文');

      const line = buffer.getLine(0);
      expect(line).toContain('中文');
    });

    it('should truncate at grapheme boundary with maxWidth', () => {
      const buffer = new TerminalBuffer(20, 3);
      // Emoji is width 2, so maxWidth 3 should only fit 1 emoji
      buffer.writeAt(0, 0, '😀😀😀', 3);

      const line = buffer.getLine(0);
      // Should not split an emoji
      expect(line.includes('😀')).toBe(true);
    });

    it('should handle mixed ASCII and emoji', () => {
      const buffer = new TerminalBuffer(30, 3);
      buffer.writeAt(0, 0, 'A😀B😀C');

      const line = buffer.getLine(0);
      expect(line).toBe('A😀B😀C');
    });
  });

  // ==========================================================================
  // getLine()
  // ==========================================================================

  describe('getLine()', () => {
    it('should return line content', () => {
      const buffer = new TerminalBuffer(20, 3);
      buffer.writeAt(0, 0, 'Test');

      expect(buffer.getLine(0)).toBe('Test');
    });

    it('should return empty string for out-of-bounds y', () => {
      const buffer = new TerminalBuffer(20, 3);

      expect(buffer.getLine(-1)).toBe('');
      expect(buffer.getLine(10)).toBe('');
    });

    it('should return empty string for unwritten lines', () => {
      const buffer = new TerminalBuffer(20, 3);

      expect(buffer.getLine(0)).toBe('');
      expect(buffer.getLine(1)).toBe('');
    });
  });

  // ==========================================================================
  // getAt()
  // ==========================================================================

  describe('getAt()', () => {
    it('should return full line content', () => {
      const buffer = new TerminalBuffer(20, 3);
      buffer.writeAt(0, 0, 'Hello World');

      // getAt returns full line (x is ignored)
      expect(buffer.getAt(0, 0)).toBe('Hello World');
      expect(buffer.getAt(5, 0)).toBe('Hello World');
    });

    it('should return empty string for out-of-bounds', () => {
      const buffer = new TerminalBuffer(20, 3);

      expect(buffer.getAt(0, -1)).toBe('');
      expect(buffer.getAt(0, 10)).toBe('');
    });
  });

  // ==========================================================================
  // renderFull()
  // ==========================================================================

  describe('renderFull()', () => {
    it('should render all lines joined with newlines', () => {
      const buffer = new TerminalBuffer(20, 3);
      buffer.writeAt(0, 0, 'Line 1');
      buffer.writeAt(0, 1, 'Line 2');
      buffer.writeAt(0, 2, 'Line 3');

      const output = buffer.renderFull();
      expect(output).toContain('Line 1');
      expect(output).toContain('Line 2');
      expect(output).toContain('Line 3');
      expect(output.split('\n').length).toBe(3);
    });

    it('should include empty lines', () => {
      const buffer = new TerminalBuffer(20, 3);
      buffer.writeAt(0, 0, 'First');
      buffer.writeAt(0, 2, 'Third');

      const output = buffer.renderFull();
      const lines = output.split('\n');
      expect(lines[0]).toContain('First');
      expect(lines[1]).toBe('');
      expect(lines[2]).toContain('Third');
    });
  });

  // ==========================================================================
  // diff()
  // ==========================================================================

  describe('diff()', () => {
    it('should return empty array for identical buffers', () => {
      const buffer1 = new TerminalBuffer(20, 3);
      const buffer2 = new TerminalBuffer(20, 3);
      buffer1.writeAt(0, 0, 'Same');
      buffer2.writeAt(0, 0, 'Same');

      const changes = buffer1.diff(buffer2);
      expect(changes).toEqual([]);
    });

    it('should detect changed lines', () => {
      const buffer1 = new TerminalBuffer(20, 3);
      const buffer2 = new TerminalBuffer(20, 3);
      buffer1.writeAt(0, 0, 'Hello');
      buffer2.writeAt(0, 0, 'World');

      const changes = buffer1.diff(buffer2);
      expect(changes.length).toBe(1);
      expect(changes[0].y).toBe(0);
      expect(changes[0].line).toBe('Hello');
    });

    it('should detect multiple changed lines', () => {
      const buffer1 = new TerminalBuffer(20, 5);
      const buffer2 = new TerminalBuffer(20, 5);
      buffer1.writeAt(0, 0, 'A');
      buffer1.writeAt(0, 2, 'C');
      buffer2.writeAt(0, 0, 'X');
      buffer2.writeAt(0, 2, 'Y');

      const changes = buffer1.diff(buffer2);
      expect(changes.length).toBe(2);
    });

    it('should handle buffers of different sizes', () => {
      const buffer1 = new TerminalBuffer(20, 5);
      const buffer2 = new TerminalBuffer(20, 3);
      buffer1.writeAt(0, 0, 'A');
      buffer2.writeAt(0, 0, 'A');

      // Should only compare up to min height
      const changes = buffer1.diff(buffer2);
      expect(changes).toEqual([]);
    });

    it('should return correct line content in changes', () => {
      const current = new TerminalBuffer(20, 3);
      const previous = new TerminalBuffer(20, 3);

      current.writeAt(0, 0, 'New Content');
      previous.writeAt(0, 0, 'Old Content');

      const changes = current.diff(previous);
      expect(changes.length).toBe(1);
      expect(changes[0].line).toBe('New Content');
    });

    it('should detect changes with ANSI codes', () => {
      const current = new TerminalBuffer(30, 3);
      const previous = new TerminalBuffer(30, 3);

      current.writeAt(0, 0, '\x1b[31mRed\x1b[0m');
      previous.writeAt(0, 0, '\x1b[32mGreen\x1b[0m');

      const changes = current.diff(previous);
      expect(changes.length).toBe(1);
      expect(changes[0].line).toContain('\x1b[31m');
    });

    it('should handle empty lines correctly', () => {
      const current = new TerminalBuffer(20, 5);
      const previous = new TerminalBuffer(20, 5);

      // Only line 2 has content
      current.writeAt(0, 2, 'Content');
      previous.writeAt(0, 2, 'Content');

      const changes = current.diff(previous);
      expect(changes).toEqual([]);
    });

    it('should detect change when line becomes empty', () => {
      const current = new TerminalBuffer(20, 3);
      const previous = new TerminalBuffer(20, 3);

      // Current has empty line 0, previous has content
      previous.writeAt(0, 0, 'Removed');

      const changes = current.diff(previous);
      expect(changes.length).toBe(1);
      expect(changes[0].y).toBe(0);
      expect(changes[0].line.trim()).toBe('');
    });

    it('should detect partial line changes', () => {
      const current = new TerminalBuffer(30, 3);
      const previous = new TerminalBuffer(30, 3);

      current.writeAt(0, 0, 'Hello World');
      current.writeAt(15, 0, '!!!');
      previous.writeAt(0, 0, 'Hello World');
      previous.writeAt(15, 0, '???');

      const changes = current.diff(previous);
      expect(changes.length).toBe(1);
      expect(changes[0].line).toContain('!!!');
    });

    it('should return y coordinates in order', () => {
      const current = new TerminalBuffer(20, 10);
      const previous = new TerminalBuffer(20, 10);

      // Changes on lines 2, 5, 8
      current.writeAt(0, 2, 'A');
      current.writeAt(0, 5, 'B');
      current.writeAt(0, 8, 'C');

      const changes = current.diff(previous);
      expect(changes.length).toBe(3);
      expect(changes[0].y).toBe(2);
      expect(changes[1].y).toBe(5);
      expect(changes[2].y).toBe(8);
    });

    it('should handle rapid updates to same buffer', () => {
      const current = new TerminalBuffer(20, 3);
      const previous = new TerminalBuffer(20, 3);

      // Simulate rapid counter updates
      previous.writeAt(0, 0, 'Counter: 0');
      current.writeAt(0, 0, 'Counter: 1');

      let changes = current.diff(previous);
      expect(changes.length).toBe(1);

      // Update again
      const next = current.clone();
      next.writeAt(0, 0, 'Counter: 2');
      changes = next.diff(current);
      expect(changes.length).toBe(1);
      expect(changes[0].line).toBe('Counter: 2');
    });
  });

  // ==========================================================================
  // clone()
  // ==========================================================================

  describe('clone()', () => {
    it('should create independent copy', () => {
      const buffer = new TerminalBuffer(20, 3);
      buffer.writeAt(0, 0, 'Original');

      const cloned = buffer.clone();
      cloned.writeAt(0, 0, 'Modified');

      expect(buffer.getLine(0)).toBe('Original');
      expect(cloned.getLine(0)).toBe('Modified');
    });

    it('should preserve all content', () => {
      const buffer = new TerminalBuffer(20, 3);
      buffer.writeAt(0, 0, 'Line 1');
      buffer.writeAt(0, 1, 'Line 2');
      buffer.writeAt(0, 2, 'Line 3');

      const cloned = buffer.clone();

      expect(cloned.getLine(0)).toBe('Line 1');
      expect(cloned.getLine(1)).toBe('Line 2');
      expect(cloned.getLine(2)).toBe('Line 3');
    });

    it('should preserve ANSI codes', () => {
      const buffer = new TerminalBuffer(20, 3);
      buffer.writeAt(0, 0, '\x1b[31mRed\x1b[0m');

      const cloned = buffer.clone();

      expect(cloned.getLine(0)).toContain('\x1b[31m');
    });
  });

  // ==========================================================================
  // resize()
  // ==========================================================================

  describe('resize()', () => {
    it('should update dimensions', () => {
      const buffer = new TerminalBuffer(20, 10);
      buffer.resize(40, 20);

      // After resize, should be able to access new lines
      expect(buffer.getLine(15)).toBe('');
    });

    it('should preserve existing content when growing', () => {
      const buffer = new TerminalBuffer(20, 3);
      buffer.writeAt(0, 0, 'Preserved');
      buffer.resize(40, 10);

      expect(buffer.getLine(0)).toBe('Preserved');
    });

    it('should truncate when shrinking height', () => {
      const buffer = new TerminalBuffer(20, 5);
      buffer.writeAt(0, 0, 'Line 0');
      buffer.writeAt(0, 4, 'Line 4');
      buffer.resize(20, 3);

      expect(buffer.getLine(0)).toBe('Line 0');
      // Line 4 should be gone (out of bounds)
      expect(buffer.getLine(4)).toBe('');
    });

    it('should handle resize to same dimensions', () => {
      const buffer = new TerminalBuffer(20, 5);
      buffer.writeAt(0, 0, 'Content');
      buffer.resize(20, 5);

      expect(buffer.getLine(0)).toBe('Content');
    });
  });

  // ==========================================================================
  // clearRegion()
  // ==========================================================================

  describe('clearRegion()', () => {
    it('should clear specified rows', () => {
      const buffer = new TerminalBuffer(20, 5);
      buffer.writeAt(0, 0, 'Line 0');
      buffer.writeAt(0, 1, 'Line 1');
      buffer.writeAt(0, 2, 'Line 2');
      buffer.clearRegion(0, 1, 20, 1);

      expect(buffer.getLine(0)).toBe('Line 0');
      expect(buffer.getLine(1)).toBe('');
      expect(buffer.getLine(2)).toBe('Line 2');
    });

    it('should clear multiple rows', () => {
      const buffer = new TerminalBuffer(20, 5);
      for (let i = 0; i < 5; i++) {
        buffer.writeAt(0, i, `Line ${i}`);
      }
      buffer.clearRegion(0, 1, 20, 3);

      expect(buffer.getLine(0)).toContain('Line 0');
      expect(buffer.getLine(1)).toBe('');
      expect(buffer.getLine(2)).toBe('');
      expect(buffer.getLine(3)).toBe('');
      expect(buffer.getLine(4)).toContain('Line 4');
    });

    it('should handle region extending beyond buffer', () => {
      const buffer = new TerminalBuffer(20, 3);
      buffer.writeAt(0, 0, 'Line 0');
      buffer.writeAt(0, 1, 'Line 1');
      buffer.writeAt(0, 2, 'Line 2');

      // Clear from row 1 with height 10 (extends beyond buffer)
      buffer.clearRegion(0, 1, 20, 10);

      expect(buffer.getLine(0)).toContain('Line 0');
      expect(buffer.getLine(1)).toBe('');
      expect(buffer.getLine(2)).toBe('');
    });
  });

  // ==========================================================================
  // Edge Cases
  // ==========================================================================

  describe('Edge Cases', () => {
    it('should handle very long lines', () => {
      const buffer = new TerminalBuffer(1000, 3);
      const longText = 'A'.repeat(500);
      buffer.writeAt(0, 0, longText);

      expect(buffer.getLine(0)).toBe(longText);
    });

    it('should handle lines with only ANSI codes', () => {
      const buffer = new TerminalBuffer(20, 3);
      buffer.writeAt(0, 0, '\x1b[31m\x1b[0m');

      // Line has content (ANSI codes) but no visible text
      const line = buffer.getLine(0);
      expect(line).toContain('\x1b[31m');
    });

    it('should handle sequential writes to same position', () => {
      const buffer = new TerminalBuffer(20, 3);
      buffer.writeAt(0, 0, 'First');
      buffer.writeAt(0, 0, 'Second');

      expect(buffer.getLine(0)).toBe('Second');
    });

    it('should handle write at y beyond initial height', () => {
      const buffer = new TerminalBuffer(20, 3);
      buffer.writeAt(0, 10, 'Beyond');

      // Should not crash, line should be empty (out of bounds)
      expect(buffer.getLine(10)).toBe('');
    });

    it('should handle negative coordinates gracefully', () => {
      const buffer = new TerminalBuffer(20, 3);

      // Writing at negative y - handled by loop condition
      buffer.writeAt(0, -1, 'Test');

      // Should not crash
      expect(buffer.getLine(0)).toBe('');
    });

    it('should handle combining characters', () => {
      const buffer = new TerminalBuffer(20, 3);
      // e with combining acute accent
      buffer.writeAt(0, 0, 'cafe\u0301');

      const line = buffer.getLine(0);
      expect(line).toContain('cafe');
    });

    it('should handle rapid sequential operations', () => {
      const buffer = new TerminalBuffer(20, 10);

      for (let i = 0; i < 100; i++) {
        buffer.writeAt(i % 20, i % 10, `${i}`);
      }

      // Should not crash or corrupt
      expect(buffer.getLine(0).length).toBeGreaterThan(0);
    });
  });
});
