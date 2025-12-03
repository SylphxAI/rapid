/**
 * Terminal Width Calculation
 *
 * Provides consistent character width calculation for TUI layout.
 *
 * Problem:
 * - string-width library may not match actual terminal rendering
 * - Variation Selector 16 (U+FE0F) affects emoji width inconsistently
 * - Different terminals have different Unicode version support
 *
 * Solution:
 * - Auto-detect terminal emoji rendering capabilities
 * - Use profile-based width calculation for known terminals
 * - Normalize emoji by handling VS16 consistently
 * - Use grapheme-aware iteration for proper cluster handling
 * - Provide fallback to string-width for standard characters
 */

import stringWidth from 'string-width';
import { getEmojiWidthProfile } from './emoji-width-detector.js';

// Variation Selector 16 - forces emoji presentation
const VS16 = '\uFE0F';

// Emoji ZWJ sequences use this
const ZWJ = '\u200D';

// Common emoji that should be width 2
const WIDE_EMOJI = new Set([
  '📁',
  '📂',
  '📄',
  '📋',
  '📌',
  '📍',
  '🤖',
  '🔥',
  '💡',
  '⚡',
  '✨',
  '❤',
  '💔',
  '💕',
  '💖',
  '💗',
  '💘',
  '💙',
  '💚',
  '💛',
  '💜',
  '🖤',
  '🤍',
  '🤎',
  '✅',
  '❌',
  '⭐',
  '🌟',
]);

// Emoji that should be width 1 (narrow presentation by default)
// These are symbols that have emoji variants but are traditionally narrow
const NARROW_EMOJI_BASE = new Set([
  '⚛', // Atom (base character without VS16)
  '☢', // Radioactive
  '☣', // Biohazard
  '♻', // Recycling
  '⚠', // Warning
  '✓',
  '✔', // Check marks
  '✗',
  '✘', // X marks
  '▶',
  '▷',
  '◀',
  '◁', // Triangles
  '▲',
  '△',
  '▼',
  '▽',
  '►',
  '▻',
  '◄',
  '◅',
  '▸',
  '▹',
  '◂',
  '◃',
  '●',
  '○',
  '◉',
  '◎',
  '■',
  '□',
  '▪',
  '▫',
  '♠',
  '♣',
  '♥',
  '♦', // Card suits
  '🖥', // Desktop computer (displays as width 1 in many terminals despite Unicode width 2)
]);

// Cached segmenter for performance
const segmenter = new Intl.Segmenter('en', { granularity: 'grapheme' });

/**
 * Segment text into grapheme clusters using Intl.Segmenter
 */
function* graphemeClusters(text: string): Generator<string> {
  for (const segment of segmenter.segment(text)) {
    yield segment.segment;
  }
}

/**
 * Get base character (strip VS16 if present)
 */
function getBaseChar(grapheme: string): string {
  return grapheme.replace(VS16, '');
}

/**
 * Check if grapheme is an emoji with VS16
 */
function hasVS16(grapheme: string): boolean {
  return grapheme.includes(VS16);
}

/**
 * Check if grapheme contains ZWJ (emoji sequence)
 */
function hasZWJ(grapheme: string): boolean {
  return grapheme.includes(ZWJ);
}

/**
 * Calculate width of a single grapheme cluster
 */
function graphemeWidth(grapheme: string): number {
  // Empty string
  if (grapheme.length === 0) return 0;

  // Get base character (without VS16)
  const base = getBaseChar(grapheme);

  // Check if base is in narrow emoji set
  if (NARROW_EMOJI_BASE.has(base)) {
    // Force width 1 for these symbols regardless of VS16
    return 1;
  }

  // Check if it's in wide emoji set
  if (WIDE_EMOJI.has(base)) {
    return 2;
  }

  // ZWJ sequences (family emoji, etc.) - use string-width
  if (hasZWJ(grapheme)) {
    return stringWidth(grapheme);
  }

  // Auto-detect terminal emoji width behavior
  const profile = getEmojiWidthProfile();

  // For emoji with VS16, handle based on terminal capabilities
  if (hasVS16(grapheme)) {
    // If terminal doesn't support VS16, strip it and calculate base width
    if (!profile.vs16Supported) {
      return stringWidth(base);
    }

    // Terminal supports VS16, but check if base is already narrow
    const baseWidth = stringWidth(base);
    if (baseWidth === 1) {
      // Base is narrow, VS16 might make it wide (if terminal supports it)
      // But most terminals that support VS16 still keep narrow emojis narrow
      return 1;
    }
  }

  // Default: use string-width
  return stringWidth(grapheme);
}

/**
 * Calculate terminal display width of a string
 *
 * This function provides consistent width calculation by:
 * 1. Using grapheme cluster segmentation
 * 2. Handling VS16 (Variation Selector 16) consistently
 * 3. Treating narrow emoji as width 1 even with VS16
 */
export function terminalWidth(text: string): number {
  let totalWidth = 0;

  for (const grapheme of graphemeClusters(text)) {
    totalWidth += graphemeWidth(grapheme);
  }

  return totalWidth;
}

/**
 * Alternative: Strip VS16 before calculating width
 * This provides the most consistent results across terminals
 */
export function terminalWidthStripped(text: string): number {
  // Remove all VS16 characters, then calculate with string-width
  const stripped = text.replace(/\uFE0F/g, '');
  return stringWidth(stripped);
}

/**
 * Slice a string to fit within a maximum visual width.
 * Returns { text, width, charCount } where:
 * - text: the sliced string
 * - width: the actual visual width of the sliced string
 * - charCount: the number of characters (not graphemes) included
 *
 * This properly handles wide characters (CJK, emoji) that take 2 columns.
 */
export function sliceByWidth(
  text: string,
  maxWidth: number,
): { text: string; width: number; charCount: number } {
  let width = 0;
  let result = '';

  for (const grapheme of graphemeClusters(text)) {
    const gWidth = graphemeWidth(grapheme);
    if (width + gWidth > maxWidth) {
      break;
    }
    width += gWidth;
    result += grapheme;
  }

  return { text: result, width, charCount: result.length };
}

/**
 * Slice a string starting from a visual column offset.
 * Returns the remaining string after skipping `startColumn` visual columns.
 */
export function sliceFromColumn(text: string, startColumn: number): string {
  let currentCol = 0;
  let result = '';
  let started = false;

  for (const grapheme of graphemeClusters(text)) {
    if (started) {
      result += grapheme;
    } else {
      const gWidth = graphemeWidth(grapheme);
      if (currentCol + gWidth > startColumn) {
        // This grapheme overlaps the start column
        started = true;
        result += grapheme;
      }
      currentCol += gWidth;
      if (currentCol >= startColumn && !started) {
        started = true;
      }
    }
  }

  return result;
}

/**
 * Convert a character index to a visual column position.
 * Character index is the position in the string (0-based).
 * Visual column is the terminal column where that character appears.
 */
export function charIndexToColumn(text: string, charIndex: number): number {
  let column = 0;
  let index = 0;

  for (const grapheme of graphemeClusters(text)) {
    if (index >= charIndex) break;
    column += graphemeWidth(grapheme);
    index += grapheme.length;
  }

  return column;
}

/**
 * Convert a visual column position to a character index.
 * Returns the character index at or after the given column.
 */
export function columnToCharIndex(text: string, column: number): number {
  let currentCol = 0;
  let charIndex = 0;

  for (const grapheme of graphemeClusters(text)) {
    if (currentCol >= column) break;
    const gWidth = graphemeWidth(grapheme);
    currentCol += gWidth;
    charIndex += grapheme.length;
  }

  return charIndex;
}

/**
 * Get an array of grapheme clusters from a string.
 * Each element is a single grapheme (which may be multiple code points).
 */
export function getGraphemes(text: string): string[] {
  return [...graphemeClusters(text)];
}

/**
 * Get the grapheme at a specific character index.
 * Returns the entire grapheme cluster that contains the character at `charIndex`.
 */
export function graphemeAt(text: string, charIndex: number): string {
  let currentIndex = 0;
  for (const grapheme of graphemeClusters(text)) {
    if (charIndex >= currentIndex && charIndex < currentIndex + grapheme.length) {
      return grapheme;
    }
    currentIndex += grapheme.length;
  }
  return '';
}

/**
 * Get the visual width of a grapheme at a specific character index.
 */
export function graphemeWidthAt(text: string, charIndex: number): number {
  const grapheme = graphemeAt(text, charIndex);
  return grapheme ? graphemeWidth(grapheme) : 0;
}

// Export as default
export default terminalWidth;
