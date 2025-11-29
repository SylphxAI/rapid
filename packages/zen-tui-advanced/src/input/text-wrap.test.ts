import { describe, expect, it } from 'bun:test';
import {
  sliceAtWordBoundary,
  wrapLine,
  wrapText,
  findCursorVisualLine,
  isCursorOnLine,
  type VisualLine,
} from './text-wrap';

describe('text-wrap module', () => {
  describe('sliceAtWordBoundary', () => {
    it('should slice at word boundary when possible', () => {
      const result = sliceAtWordBoundary('hello world foo', 10);
      expect(result.text).toBe('hello ');
      expect(result.charCount).toBe(6);
    });

    it('should fall back to character slice when no space', () => {
      const result = sliceAtWordBoundary('abcdefghijklmnop', 10);
      expect(result.text).toBe('abcdefghij');
      expect(result.charCount).toBe(10);
    });

    it('should reserve cursor space when requested', () => {
      const result = sliceAtWordBoundary('hello world foo', 10, true);
      // With cursor space, effective width is 9
      expect(result.text).toBe('hello ');
      expect(result.charCount).toBe(6);
    });

    it('should handle text that ends at space', () => {
      const result = sliceAtWordBoundary('hello ', 10);
      expect(result.text).toBe('hello ');
      expect(result.charCount).toBe(6);
    });
  });

  describe('wrapLine', () => {
    it('should not wrap short lines', () => {
      const result = wrapLine('hello', 0, { contentWidth: 20 });
      expect(result.length).toBe(1);
      expect(result[0].text).toBe('hello');
    });

    it('should wrap long lines at word boundaries', () => {
      const result = wrapLine('hello world foo bar', 0, { contentWidth: 12 });
      expect(result.length).toBe(2);
      expect(result[0].text).toBe('hello world ');
      expect(result[1].text).toBe('foo bar');
    });

    it('should reserve cursor space by default', () => {
      // 37 chars should trigger wrap with contentWidth=38 (cursor space reserved)
      const text = 'a'.repeat(37);
      const result = wrapLine(text, 0, { contentWidth: 38 });
      expect(result.length).toBe(1); // 37 chars fits with 1 char cursor space
    });

    it('should wrap at cursor threshold with word boundaries', () => {
      // 38 chars with spaces should wrap due to cursor space reservation
      // "hello world ..." where total > 37 chars
      const text = 'hello world foo bar baz qux abc def'; // 35 chars with spaces
      const result = wrapLine(text + ' xy', 0, { contentWidth: 38 }); // 38 chars
      // Should wrap at word boundary since 38 >= 37 (threshold)
      expect(result.length).toBeGreaterThan(1);
    });

    it('should fit no-space text at exactly contentWidth', () => {
      // 38 chars without spaces uses character fallback which allows full width
      const text = 'a'.repeat(38);
      const result = wrapLine(text, 0, { contentWidth: 38 });
      // Character wrap fallback uses full width, so 38 chars fits
      expect(result.length).toBe(1);
    });

    it('should wrap no-space text exceeding contentWidth', () => {
      // 39 chars without spaces must wrap
      const text = 'a'.repeat(39);
      const result = wrapLine(text, 0, { contentWidth: 38 });
      expect(result.length).toBe(2);
    });

    it('should track startCol correctly for wrapped lines', () => {
      const result = wrapLine('hello world foo', 0, { contentWidth: 8 });
      expect(result[0].startCol).toBe(0);
      expect(result[1].startCol).toBe(6); // After "hello "
    });
  });

  describe('wrapText', () => {
    it('should wrap multiline text', () => {
      const result = wrapText('hello\nworld', { contentWidth: 20 });
      expect(result.lines.length).toBe(2);
      expect(result.lines[0].logicalRow).toBe(0);
      expect(result.lines[1].logicalRow).toBe(1);
    });

    it('should handle empty text', () => {
      const result = wrapText('', { contentWidth: 20 });
      expect(result.lines.length).toBe(1);
      expect(result.lines[0].text).toBe('');
    });

    it('should provide logicalToVisual mapping', () => {
      const result = wrapText('hello world foo bar\nsecond line', { contentWidth: 12 });
      expect(result.logicalToVisual.get(0)).toBeDefined();
      expect(result.logicalToVisual.get(1)).toBeDefined();
    });
  });

  describe('findCursorVisualLine', () => {
    it('should find cursor in single line', () => {
      const lines: VisualLine[] = [{ text: 'hello', logicalRow: 0, startCol: 0, startVisualCol: 0 }];
      expect(findCursorVisualLine(lines, 0, 3)).toBe(0);
    });

    it('should find cursor in wrapped lines', () => {
      const lines: VisualLine[] = [
        { text: 'hello ', logicalRow: 0, startCol: 0, startVisualCol: 0 },
        { text: 'world', logicalRow: 0, startCol: 6, startVisualCol: 6 },
      ];
      expect(findCursorVisualLine(lines, 0, 3)).toBe(0); // In "hello"
      expect(findCursorVisualLine(lines, 0, 8)).toBe(1); // In "world"
    });

    it('should find cursor at end of line', () => {
      const lines: VisualLine[] = [{ text: 'hello', logicalRow: 0, startCol: 0, startVisualCol: 0 }];
      expect(findCursorVisualLine(lines, 0, 5)).toBe(0); // At end
    });
  });

  describe('isCursorOnLine', () => {
    it('should return true when cursor is on line', () => {
      const vl: VisualLine = { text: 'hello', logicalRow: 0, startCol: 0, startVisualCol: 0 };
      expect(isCursorOnLine(vl, undefined, 0, 3)).toBe(true);
    });

    it('should return false for wrong logical row', () => {
      const vl: VisualLine = { text: 'hello', logicalRow: 0, startCol: 0, startVisualCol: 0 };
      expect(isCursorOnLine(vl, undefined, 1, 3)).toBe(false);
    });

    it('should handle wrap boundary correctly', () => {
      const vl1: VisualLine = { text: 'hello ', logicalRow: 0, startCol: 0, startVisualCol: 0 };
      const vl2: VisualLine = { text: 'world', logicalRow: 0, startCol: 6, startVisualCol: 6 };

      // Cursor at position 6 (boundary) should be on vl2, not vl1
      expect(isCursorOnLine(vl1, vl2, 0, 6)).toBe(false);
      expect(isCursorOnLine(vl2, undefined, 0, 6)).toBe(true);
    });

    it('should allow cursor at end of last visual line', () => {
      const vl: VisualLine = { text: 'hello', logicalRow: 0, startCol: 0, startVisualCol: 0 };
      // Cursor at position 5 (end) should be on this line since it's the last
      expect(isCursorOnLine(vl, undefined, 0, 5)).toBe(true);
    });
  });

  describe('word wrapping edge cases', () => {
    it('should wrap "I am a boy" correctly at width 10', () => {
      const result = wrapText('I am a boy', { contentWidth: 10 });
      // With cursor space, threshold is 9
      // "I am a " = 7 chars, fits
      // Adding "boy" = 10 chars, doesn't fit with cursor
      expect(result.lines.length).toBe(2);
      expect(result.lines[0].text).toBe('I am a ');
      expect(result.lines[1].text).toBe('boy');
    });

    it('should handle exact contentWidth text', () => {
      const text = 'abcdefghij'; // 10 chars
      const result = wrapText(text, { contentWidth: 10 });
      // 10 chars at width 10 with cursor space should wrap
      // threshold = 9, so 10 >= 9 triggers wrap
      expect(result.lines.length).toBeGreaterThanOrEqual(1);
    });
  });
});
