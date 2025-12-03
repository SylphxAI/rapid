/**
 * Text Wrapping Engine
 *
 * Pure utility functions for wrapping text into visual lines.
 * No state, no side effects - just text transformation.
 */
import { getGraphemes, sliceByWidth, terminalWidth } from '@rapid/tui';

/**
 * A visual line represents one row of displayed text.
 * Multiple visual lines may come from a single logical line (when wrapped).
 */
export interface VisualLine {
  /** The text content of this visual line */
  text: string;
  /** Index of the logical line this came from */
  logicalRow: number;
  /** Character index where this visual line starts in the logical line */
  startCol: number;
  /** Visual column offset (cumulative width of previous visual lines from same logical line) */
  startVisualCol: number;
}

/**
 * Result of wrapping text into visual lines
 */
export interface WrapResult {
  /** All visual lines */
  lines: VisualLine[];
  /** Maps logical row to range of visual line indices */
  logicalToVisual: Map<number, { start: number; end: number }>;
}

/**
 * Options for text wrapping
 */
export interface WrapOptions {
  /** Maximum width in terminal columns */
  contentWidth: number;
  /** Enable word wrapping (break at spaces when possible) */
  wordWrap?: boolean;
  /** Reserve space for cursor at end of lines */
  reserveCursorSpace?: boolean;
}

/**
 * Slice text at word boundary if possible.
 * Falls back to character boundary if no space found.
 *
 * @param str - Text to slice
 * @param maxWidth - Maximum width in terminal columns
 * @param reserveCursorSpace - Reserve 1 column for cursor
 * @returns Sliced text info
 */
export function sliceAtWordBoundary(
  str: string,
  maxWidth: number,
  reserveCursorSpace = false,
): { text: string; charCount: number; width: number } {
  const effectiveWidth = reserveCursorSpace ? maxWidth - 1 : maxWidth;
  const charSliced = sliceByWidth(str, effectiveWidth);

  // If slice ends at string end or at a space, it's a clean break
  if (charSliced.charCount >= str.length || str[charSliced.charCount] === ' ') {
    return charSliced;
  }

  // If sliced text ends with space, it's a clean break
  if (charSliced.text.endsWith(' ')) {
    return charSliced;
  }

  // Find last space in sliced portion
  const lastSpace = charSliced.text.lastIndexOf(' ');
  if (lastSpace > 0) {
    const text = charSliced.text.slice(0, lastSpace + 1);
    return {
      text,
      charCount: lastSpace + 1,
      width: terminalWidth(text),
    };
  }

  // No word boundary - fall back to character wrap at full width
  return sliceByWidth(str, maxWidth);
}

/**
 * Wrap a single logical line into multiple visual lines.
 *
 * @param line - The logical line text
 * @param logicalRow - Index of this logical line
 * @param options - Wrapping options
 * @returns Array of visual lines
 */
export function wrapLine(line: string, logicalRow: number, options: WrapOptions): VisualLine[] {
  const { contentWidth, wordWrap = true, reserveCursorSpace = true } = options;
  const result: VisualLine[] = [];
  const lineWidth = terminalWidth(line);

  // Threshold for wrapping: leave room for cursor
  const wrapThreshold = reserveCursorSpace ? contentWidth - 1 : contentWidth;

  // No wrapping needed - line fits with cursor space
  if (!wordWrap || lineWidth < wrapThreshold) {
    result.push({ text: line, logicalRow, startCol: 0, startVisualCol: 0 });
    return result;
  }

  // Wrap the line into chunks
  let startCol = 0;
  let startVisualCol = 0;
  const graphemes = getGraphemes(line);

  while (startCol < line.length) {
    const remaining = line.slice(startCol);
    const remainingWidth = terminalWidth(remaining);

    // Reserve cursor space only on the last chunk
    const isLastChunk = remainingWidth <= contentWidth;
    const sliced = sliceAtWordBoundary(remaining, contentWidth, isLastChunk && reserveCursorSpace);

    if (sliced.charCount === 0) {
      // Edge case: character wider than contentWidth (e.g., CJK in narrow terminal)
      // Take at least one grapheme to avoid infinite loop
      const graphemeAtStart = findGraphemeAt(graphemes, startCol);
      if (graphemeAtStart) {
        result.push({
          text: graphemeAtStart,
          logicalRow,
          startCol,
          startVisualCol,
        });
        startCol += graphemeAtStart.length;
        startVisualCol += terminalWidth(graphemeAtStart);
      } else {
        break; // Safety: shouldn't happen, but avoid infinite loop
      }
    } else {
      result.push({
        text: sliced.text,
        logicalRow,
        startCol,
        startVisualCol,
      });
      startCol += sliced.charCount;
      startVisualCol += sliced.width;
    }
  }

  // Handle empty line case
  if (result.length === 0) {
    result.push({ text: '', logicalRow, startCol: 0, startVisualCol: 0 });
  }

  return result;
}

/**
 * Find the grapheme at a specific character index.
 */
function findGraphemeAt(graphemes: string[], charIndex: number): string | null {
  let index = 0;
  for (const g of graphemes) {
    if (index >= charIndex) return g;
    index += g.length;
  }
  return null;
}

/**
 * Wrap text into visual lines.
 *
 * @param text - Full text content (may contain newlines)
 * @param options - Wrapping options
 * @returns Wrap result with visual lines and mapping
 */
export function wrapText(text: string, options: WrapOptions): WrapResult {
  const logicalLines = text ? text.split('\n') : [''];
  const lines: VisualLine[] = [];
  const logicalToVisual = new Map<number, { start: number; end: number }>();

  for (let logicalRow = 0; logicalRow < logicalLines.length; logicalRow++) {
    const startVisualIndex = lines.length;
    const visualLines = wrapLine(logicalLines[logicalRow], logicalRow, options);
    lines.push(...visualLines);
    logicalToVisual.set(logicalRow, {
      start: startVisualIndex,
      end: lines.length - 1,
    });
  }

  return { lines, logicalToVisual };
}

/**
 * Find which visual line contains a cursor position.
 * Uses isCursorOnLine for consistent logic.
 *
 * @param lines - Visual lines from wrapText
 * @param logicalRow - Cursor's logical row
 * @param logicalCol - Cursor's logical column
 * @returns Visual line index, or 0 if not found
 */
export function findCursorVisualLine(
  lines: VisualLine[],
  logicalRow: number,
  logicalCol: number,
): number {
  for (let i = 0; i < lines.length; i++) {
    if (isCursorOnLine(lines[i], lines[i + 1], logicalRow, logicalCol)) {
      return i;
    }
  }
  return 0;
}

/**
 * Check if cursor is on a specific visual line.
 * Used in render to determine which line shows the cursor.
 *
 * @param vl - The visual line to check
 * @param nextVl - The next visual line (for boundary check)
 * @param cursorRow - Cursor's logical row
 * @param cursorCol - Cursor's logical column
 * @returns True if cursor is on this visual line
 */
export function isCursorOnLine(
  vl: VisualLine,
  nextVl: VisualLine | undefined,
  cursorRow: number,
  cursorCol: number,
): boolean {
  if (vl.logicalRow !== cursorRow) return false;
  if (cursorCol < vl.startCol) return false;

  const lineEnd = vl.startCol + vl.text.length;
  const isLastOfLogical = !nextVl || nextVl.logicalRow !== vl.logicalRow;

  // For last visual line of logical row: cursor can be AT the end (<=)
  // For other visual lines: cursor must be BEFORE the end (<)
  return isLastOfLogical ? cursorCol <= lineEnd : cursorCol < lineEnd;
}
