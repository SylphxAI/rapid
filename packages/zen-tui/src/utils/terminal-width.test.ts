/**
 * Terminal Width Tests
 *
 * Comprehensive tests for terminal width calculation including emoji handling,
 * grapheme clustering, CJK characters, and text slicing operations.
 */
import { describe, expect, it } from 'bun:test';
import {
  charIndexToColumn,
  columnToCharIndex,
  getGraphemes,
  graphemeAt,
  graphemeWidthAt,
  sliceByWidth,
  sliceFromColumn,
  terminalWidth,
  terminalWidthStripped,
} from './terminal-width.js';

describe('terminalWidth', () => {
  // ==========================================================================
  // Basic ASCII
  // ==========================================================================

  describe('ASCII characters', () => {
    it('should return correct width for ASCII string', () => {
      expect(terminalWidth('hello')).toBe(5);
    });

    it('should return 0 for empty string', () => {
      expect(terminalWidth('')).toBe(0);
    });

    it('should handle single character', () => {
      expect(terminalWidth('a')).toBe(1);
    });

    it('should handle spaces', () => {
      expect(terminalWidth('   ')).toBe(3);
    });

    it('should handle numbers', () => {
      expect(terminalWidth('12345')).toBe(5);
    });

    it('should handle special characters', () => {
      expect(terminalWidth('!@#$%')).toBe(5);
    });

    it('should handle mixed ASCII', () => {
      expect(terminalWidth('Hello, World!')).toBe(13);
    });
  });

  // ==========================================================================
  // CJK Characters (Width 2)
  // ==========================================================================

  describe('CJK characters', () => {
    it('should return width 2 for Chinese characters', () => {
      expect(terminalWidth('中')).toBe(2);
      expect(terminalWidth('中文')).toBe(4);
    });

    it('should return width 2 for Japanese characters', () => {
      expect(terminalWidth('日')).toBe(2);
      expect(terminalWidth('日本')).toBe(4);
    });

    it('should return width 2 for Korean characters', () => {
      expect(terminalWidth('한')).toBe(2);
      expect(terminalWidth('한글')).toBe(4);
    });

    it('should handle mixed CJK and ASCII', () => {
      expect(terminalWidth('A中B')).toBe(4); // 1 + 2 + 1
    });
  });

  // ==========================================================================
  // Emoji
  // ==========================================================================

  describe('Emoji', () => {
    it('should handle basic emoji', () => {
      const width = terminalWidth('😀');
      expect(width).toBeGreaterThanOrEqual(1);
    });

    it('should handle emoji from WIDE_EMOJI set', () => {
      expect(terminalWidth('🔥')).toBe(2);
      expect(terminalWidth('💡')).toBe(2);
      expect(terminalWidth('✨')).toBe(2);
    });

    it('should handle emoji from NARROW_EMOJI_BASE set', () => {
      // These should be width 1
      expect(terminalWidth('▶')).toBe(1);
      expect(terminalWidth('●')).toBe(1);
      expect(terminalWidth('■')).toBe(1);
    });

    it('should handle flag emoji', () => {
      const width = terminalWidth('🇺🇸');
      // Flag emoji is typically width 2
      expect(width).toBeGreaterThanOrEqual(1);
    });

    it('should handle multiple emoji', () => {
      const width = terminalWidth('😀😀');
      expect(width).toBeGreaterThanOrEqual(2);
    });

    it('should handle emoji with text', () => {
      const width = terminalWidth('Hello 😀');
      expect(width).toBeGreaterThan(6);
    });
  });

  // ==========================================================================
  // Emoji with VS16 (Variation Selector 16)
  // ==========================================================================

  describe('Emoji with VS16', () => {
    it('should handle emoji with VS16', () => {
      // ⚛️ = ⚛ + VS16
      const withVS16 = '⚛\uFE0F';
      const width = terminalWidth(withVS16);
      expect(width).toBeGreaterThanOrEqual(1);
    });

    it('should handle narrow emoji base with VS16', () => {
      // ▶️ = ▶ + VS16, should still be width 1
      const playButton = '▶\uFE0F';
      expect(terminalWidth(playButton)).toBe(1);
    });
  });

  // ==========================================================================
  // ZWJ Sequences (Family emoji, etc.)
  // ==========================================================================

  describe('ZWJ sequences', () => {
    it('should handle family emoji', () => {
      // 👨‍👩‍👧 = man + ZWJ + woman + ZWJ + girl
      const family = '👨‍👩‍👧';
      const width = terminalWidth(family);
      expect(width).toBeGreaterThanOrEqual(1);
    });

    it('should handle skin tone modifiers', () => {
      // 👋🏻 = waving hand + light skin tone
      const wave = '👋🏻';
      const width = terminalWidth(wave);
      expect(width).toBeGreaterThanOrEqual(1);
    });
  });

  // ==========================================================================
  // ANSI Codes
  // Note: terminalWidth does NOT strip ANSI codes - it calculates grapheme widths.
  // Use terminalWidthStripped for ANSI-stripped width calculation.
  // ==========================================================================

  describe('ANSI codes', () => {
    it('should include ANSI codes in width calculation', () => {
      // terminalWidth counts graphemes, including escape sequences
      // For ANSI-stripped width, use terminalWidthStripped
      const colored = '\x1b[31mRed\x1b[0m';
      expect(terminalWidth(colored)).toBeGreaterThan(3);
    });

    it('should handle multiple ANSI codes', () => {
      const styled = '\x1b[1m\x1b[31mBold Red\x1b[0m';
      // Includes escape sequences
      expect(terminalWidth(styled)).toBeGreaterThan(8);
    });

    it('should handle background colors', () => {
      const bg = '\x1b[44mBlue BG\x1b[0m';
      expect(terminalWidth(bg)).toBeGreaterThan(7);
    });
  });
});

// ==========================================================================
// terminalWidthStripped
// ==========================================================================

describe('terminalWidthStripped', () => {
  it('should strip VS16 before calculating', () => {
    const withVS16 = 'test\uFE0F';
    const width = terminalWidthStripped(withVS16);
    expect(width).toBe(4);
  });

  it('should handle string without VS16', () => {
    expect(terminalWidthStripped('hello')).toBe(5);
  });

  it('should strip multiple VS16', () => {
    const text = 'a\uFE0Fb\uFE0Fc';
    expect(terminalWidthStripped(text)).toBe(3);
  });
});

// ==========================================================================
// sliceByWidth
// ==========================================================================

describe('sliceByWidth', () => {
  describe('Basic slicing', () => {
    it('should slice ASCII text by width', () => {
      const result = sliceByWidth('Hello World', 5);
      expect(result.text).toBe('Hello');
      expect(result.width).toBe(5);
    });

    it('should return full text if within maxWidth', () => {
      const result = sliceByWidth('Hi', 10);
      expect(result.text).toBe('Hi');
      expect(result.width).toBe(2);
    });

    it('should handle empty string', () => {
      const result = sliceByWidth('', 5);
      expect(result.text).toBe('');
      expect(result.width).toBe(0);
    });

    it('should handle maxWidth 0', () => {
      const result = sliceByWidth('Hello', 0);
      expect(result.text).toBe('');
      expect(result.width).toBe(0);
    });
  });

  describe('Wide characters', () => {
    it('should not split wide characters', () => {
      // 中 is width 2, so maxWidth 1 should return empty
      const result = sliceByWidth('中文', 1);
      expect(result.text).toBe('');
      expect(result.width).toBe(0);
    });

    it('should include wide character if it fits', () => {
      const result = sliceByWidth('中文', 2);
      expect(result.text).toBe('中');
      expect(result.width).toBe(2);
    });

    it('should handle mixed ASCII and CJK', () => {
      const result = sliceByWidth('A中B', 3);
      expect(result.text).toBe('A中');
      expect(result.width).toBe(3);
    });
  });

  describe('Emoji handling', () => {
    it('should not split emoji', () => {
      const result = sliceByWidth('😀😀', 1);
      // Emoji is width 2, can't fit in 1
      expect(result.width).toBeLessThanOrEqual(1);
    });

    it('should return charCount correctly', () => {
      const result = sliceByWidth('abc', 2);
      expect(result.charCount).toBe(2);
    });
  });
});

// ==========================================================================
// sliceFromColumn
// ==========================================================================

describe('sliceFromColumn', () => {
  it('should slice from column 0', () => {
    const result = sliceFromColumn('Hello', 0);
    expect(result).toBe('Hello');
  });

  it('should slice from middle', () => {
    const result = sliceFromColumn('Hello', 2);
    expect(result).toBe('llo');
  });

  it('should handle slicing beyond text', () => {
    const result = sliceFromColumn('Hi', 10);
    expect(result).toBe('');
  });

  it('should handle wide characters', () => {
    // 中 is at column 0-1, 文 is at column 2-3
    const result = sliceFromColumn('中文', 2);
    expect(result).toBe('文');
  });

  it('should include overlapping wide character', () => {
    // If we start at column 1 (middle of 中), we should include 中
    const result = sliceFromColumn('中文', 1);
    expect(result).toContain('中');
  });

  it('should handle empty string', () => {
    const result = sliceFromColumn('', 5);
    expect(result).toBe('');
  });
});

// ==========================================================================
// charIndexToColumn
// ==========================================================================

describe('charIndexToColumn', () => {
  it('should return 0 for index 0', () => {
    expect(charIndexToColumn('Hello', 0)).toBe(0);
  });

  it('should calculate column for ASCII', () => {
    expect(charIndexToColumn('Hello', 2)).toBe(2);
  });

  it('should account for wide characters', () => {
    // In "中文a", 中 is index 0, 文 is index 1, a is index 2
    // 中 takes columns 0-1, 文 takes columns 2-3, a is at column 4
    expect(charIndexToColumn('中文a', 2)).toBe(4);
  });

  it('should handle index beyond string', () => {
    const column = charIndexToColumn('Hi', 10);
    // Should return column at end
    expect(column).toBe(2);
  });

  it('should handle empty string', () => {
    expect(charIndexToColumn('', 0)).toBe(0);
  });
});

// ==========================================================================
// columnToCharIndex
// ==========================================================================

describe('columnToCharIndex', () => {
  it('should return 0 for column 0', () => {
    expect(columnToCharIndex('Hello', 0)).toBe(0);
  });

  it('should convert column to char index for ASCII', () => {
    expect(columnToCharIndex('Hello', 2)).toBe(2);
  });

  it('should handle wide characters', () => {
    // Column 2 is at the start of 文
    expect(columnToCharIndex('中文a', 2)).toBe(1);
  });

  it('should handle column beyond text', () => {
    const index = columnToCharIndex('Hi', 10);
    expect(index).toBe(2);
  });

  it('should handle empty string', () => {
    expect(columnToCharIndex('', 5)).toBe(0);
  });
});

// ==========================================================================
// getGraphemes
// ==========================================================================

describe('getGraphemes', () => {
  it('should return array of ASCII characters', () => {
    const graphemes = getGraphemes('abc');
    expect(graphemes).toEqual(['a', 'b', 'c']);
  });

  it('should return empty array for empty string', () => {
    const graphemes = getGraphemes('');
    expect(graphemes).toEqual([]);
  });

  it('should treat each CJK character as one grapheme', () => {
    const graphemes = getGraphemes('中文');
    expect(graphemes).toEqual(['中', '文']);
  });

  it('should keep ZWJ sequences together', () => {
    const family = '👨‍👩‍👧';
    const graphemes = getGraphemes(family);
    // ZWJ sequence should be one grapheme
    expect(graphemes.length).toBe(1);
    expect(graphemes[0]).toBe(family);
  });

  it('should keep emoji with modifiers together', () => {
    const wave = '👋🏻';
    const graphemes = getGraphemes(wave);
    expect(graphemes.length).toBe(1);
  });

  it('should handle mixed content', () => {
    const graphemes = getGraphemes('A中😀');
    expect(graphemes.length).toBe(3);
    expect(graphemes[0]).toBe('A');
    expect(graphemes[1]).toBe('中');
    expect(graphemes[2]).toBe('😀');
  });
});

// ==========================================================================
// graphemeAt
// ==========================================================================

describe('graphemeAt', () => {
  it('should return grapheme at index 0', () => {
    expect(graphemeAt('Hello', 0)).toBe('H');
  });

  it('should return grapheme at middle index', () => {
    expect(graphemeAt('Hello', 2)).toBe('l');
  });

  it('should return empty string for out-of-bounds', () => {
    expect(graphemeAt('Hi', 10)).toBe('');
  });

  it('should return entire grapheme for multi-codepoint characters', () => {
    // 👨‍👩‍👧 is multiple code points but one grapheme
    const family = '👨‍👩‍👧';
    const grapheme = graphemeAt(family, 0);
    expect(grapheme).toBe(family);
  });

  it('should handle CJK characters', () => {
    expect(graphemeAt('中文', 0)).toBe('中');
    expect(graphemeAt('中文', 1)).toBe('文');
  });

  it('should handle empty string', () => {
    expect(graphemeAt('', 0)).toBe('');
  });
});

// ==========================================================================
// graphemeWidthAt
// ==========================================================================

describe('graphemeWidthAt', () => {
  it('should return width 1 for ASCII', () => {
    expect(graphemeWidthAt('Hello', 0)).toBe(1);
  });

  it('should return width 2 for CJK', () => {
    expect(graphemeWidthAt('中文', 0)).toBe(2);
  });

  it('should return 0 for out-of-bounds', () => {
    expect(graphemeWidthAt('Hi', 10)).toBe(0);
  });

  it('should return width for emoji', () => {
    const width = graphemeWidthAt('😀', 0);
    expect(width).toBeGreaterThanOrEqual(1);
  });

  it('should handle empty string', () => {
    expect(graphemeWidthAt('', 0)).toBe(0);
  });
});

// ==========================================================================
// Edge Cases
// ==========================================================================

describe('Edge Cases', () => {
  it('should handle combining characters', () => {
    // é = e + combining acute accent
    const cafe = 'cafe\u0301';
    const graphemes = getGraphemes(cafe);
    // 'e' + combining accent should be one grapheme
    expect(graphemes.length).toBe(4);
  });

  it('should handle newlines', () => {
    // Newlines have width 0, so 'a' + '\n' + 'b' = 1 + 0 + 1 = 2
    expect(terminalWidth('a\nb')).toBe(2);
  });

  it('should handle tabs', () => {
    // Tab width varies, but string-width handles it
    const width = terminalWidth('a\tb');
    expect(width).toBeGreaterThanOrEqual(2);
  });

  it('should handle very long strings', () => {
    const longString = 'a'.repeat(10000);
    expect(terminalWidth(longString)).toBe(10000);
  });

  it('should handle control characters', () => {
    // Control characters typically have width 0
    const ctrl = '\x00\x01\x02';
    expect(terminalWidth(ctrl)).toBe(0);
  });

  it('should handle RTL characters', () => {
    const arabic = 'مرحبا';
    const width = terminalWidth(arabic);
    expect(width).toBeGreaterThan(0);
  });

  it('should be consistent across multiple calls', () => {
    const text = '中文😀Hello';
    const width1 = terminalWidth(text);
    const width2 = terminalWidth(text);
    expect(width1).toBe(width2);
  });
});
