/**
 * Terminal Screen Buffer (ADR-014 Fine-Grained Reactivity)
 *
 * Maintains a line-based representation of the terminal screen with ANSI codes preserved.
 *
 * ## Role in Fine-Grained Reactivity
 *
 * This buffer is central to efficient terminal updates:
 *
 * 1. **Persistent Buffer**: Content persists between frames. When only some nodes
 *    are dirty, unchanged content remains in the buffer without re-rendering.
 *
 * 2. **Line-Based Diffing**: The diff() method compares buffers line-by-line,
 *    returning only changed lines. This enables minimal terminal output.
 *
 * 3. **Incremental Updates**: The setLine() method allows efficient updates
 *    to the diff buffer after rendering, copying only changed lines.
 *
 * ## Buffer Pattern for Fine-Grained Updates
 *
 * ```
 * renderBuffer: Current frame, updated incrementally (dirty nodes only)
 * diffBuffer: Previous frame copy, used for comparison
 *
 * On update:
 * 1. Render dirty nodes to renderBuffer (unchanged areas preserved)
 * 2. diff(renderBuffer, diffBuffer) → only changed lines
 * 3. Output changed lines to terminal
 * 4. Copy changed lines from renderBuffer to diffBuffer
 * ```
 */

import stripAnsi from 'strip-ansi';
import { terminalWidth } from '../utils/terminal-width.js';

// Grapheme segmenter for proper Unicode handling (handles emojis, Hindi, Thai, etc.)
const segmenter = new Intl.Segmenter('en', { granularity: 'grapheme' });

/**
 * Iterate through a string by grapheme clusters
 * This correctly handles complex Unicode like:
 * - Emojis with ZWJ (👨‍👩‍👧)
 * - Flag emojis (🇺🇸)
 * - Skin tone modifiers (👋🏻)
 * - Hindi/Thai combining characters
 * - Keycap emojis (1️⃣)
 */
function* iterateGraphemes(str: string): Generator<string> {
  for (const { segment } of segmenter.segment(str)) {
    yield segment;
  }
}

/**
 * Extract the last active background color code from a string
 * Returns empty string if no background color is found
 */
function extractActiveBackground(str: string): string {
  // biome-ignore lint/suspicious/noControlCharactersInRegex: ANSI escape codes require control characters
  const ansiCodePattern = /\x1b\[([0-9;]+)m/g;
  let lastBgCode = '';
  let match: RegExpExecArray | null;

  // biome-ignore lint/suspicious/noAssignInExpressions: Standard pattern for regex.exec() iteration
  while ((match = ansiCodePattern.exec(str)) !== null) {
    const codes = match[1].split(';');
    for (const code of codes) {
      const num = Number.parseInt(code, 10);
      // Background color codes: 40-49 (standard), 100-107 (bright)
      if ((num >= 40 && num <= 49) || (num >= 100 && num <= 107)) {
        lastBgCode = `\x1b[${code}m`;
      }
      // Background reset code: 49
      if (num === 49) {
        lastBgCode = '';
      }
    }
  }

  return lastBgCode;
}

export class TerminalBuffer {
  private buffer: string[];
  private width: number;
  private height: number;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.buffer = Array(height).fill('');
  }

  /**
   * Clear the entire buffer
   */
  clear(): void {
    for (let y = 0; y < this.height; y++) {
      this.buffer[y] = '';
    }
  }

  /**
   * Write text at a specific position
   * Returns the bounding box of what was written
   * @param replace If true, don't preserve content after the written text (used for clearing areas)
   */
  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Complex buffer merging logic requires detailed control flow
  writeAt(
    x: number,
    y: number,
    text: string,
    maxWidth?: number,
    replace = false,
  ): { x: number; y: number; width: number; height: number } {
    const lines = text.split('\n');
    let maxLineWidth = 0;

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      let line = lines[lineIndex];
      const targetY = y + lineIndex;

      if (targetY >= this.height) break;

      // Clip line to maxWidth if specified
      if (maxWidth !== undefined) {
        const strippedLine = stripAnsi(line);
        const visualWidth = terminalWidth(strippedLine);

        if (visualWidth > maxWidth) {
          // Truncate to maxWidth, preserving ANSI codes
          // Use grapheme segmenter for proper Unicode handling
          let currentWidth = 0;
          let truncated = '';
          let inAnsiCode = false;
          let ansiCode = '';

          for (const grapheme of iterateGraphemes(line)) {
            if (grapheme === '\x1b') {
              inAnsiCode = true;
              ansiCode = grapheme;
              continue;
            }

            if (inAnsiCode) {
              ansiCode += grapheme;
              if (grapheme === 'm') {
                inAnsiCode = false;
                truncated += ansiCode;
                ansiCode = '';
              }
              continue;
            }

            const graphemeWidth = terminalWidth(grapheme);
            if (currentWidth + graphemeWidth > maxWidth) break;

            truncated += grapheme;
            currentWidth += graphemeWidth;
          }

          line = truncated;
        }
      }

      // Get existing line content (if any)
      const existingLine = this.buffer[targetY] || '';

      // Merge new text at position x with existing content
      // We need to preserve content before x and after x + line width
      const lineWidth = terminalWidth(stripAnsi(line));

      // Build the new line: existing content before x + new text + existing content after
      let newLine = '';

      // Add existing content before position x (or spaces if needed)
      // IMPORTANT: We must walk through existingLine accounting for ANSI codes,
      // as substring() would cut ANSI codes incorrectly
      // Use grapheme segmenter for proper Unicode handling
      let beforeX = '';
      let activeBackground = '';

      if (x > 0) {
        let visualPos = 0;
        let inAnsiCode = false;

        for (const grapheme of iterateGraphemes(existingLine)) {
          // Track ANSI codes
          if (grapheme === '\x1b') {
            inAnsiCode = true;
            beforeX += grapheme;
            continue;
          }

          if (inAnsiCode) {
            beforeX += grapheme;
            if (grapheme === 'm') {
              inAnsiCode = false;
            }
            continue; // ANSI codes don't contribute to visual width
          }

          // Check if we've reached the target visual position
          if (visualPos >= x) {
            break;
          }

          beforeX += grapheme;
          visualPos += terminalWidth(grapheme);
        }

        newLine += beforeX;

        // Pad with spaces if existing content doesn't reach position x
        if (visualPos < x) {
          newLine += ' '.repeat(x - visualPos);
        }

        // Extract active background color at position x
        activeBackground = extractActiveBackground(beforeX);
      } else if (x === 0) {
        // Special case: x = 0 (start of line)
        // Only inherit background if it appears at the very start of existing line
        // This prevents background from bleeding from middle of line to start
        // but allows fillArea backgrounds at x=0 to be inherited
        // biome-ignore lint/suspicious/noControlCharactersInRegex: ANSI escape codes require control characters
        const leadingAnsi = existingLine.match(/^(\x1b\[[0-9;]+m)+/);
        if (leadingAnsi) {
          activeBackground = extractActiveBackground(leadingAnsi[0]);
        }
      }

      // Add new text (with background code prepended if present)
      // This ensures text inherits the parent container's background color
      newLine += activeBackground + line;

      // If activeBackground was inherited but line doesn't contain its own background reset,
      // add reset after the line to prevent bleeding
      // biome-ignore lint/suspicious/noControlCharactersInRegex: ANSI escape codes require control characters
      const lineHasOwnBg = /\x1b\[4[0-9]m/.test(line);
      const lineEndsWithBgReset = line.endsWith('\x1b[49m');
      if (activeBackground && !lineHasOwnBg && !lineEndsWithBgReset) {
        newLine += '\x1b[49m';
      }

      // Add existing content after the new text (if any)
      // Need to preserve content that comes after our written text (e.g., right border)
      // Skip this if replace mode is enabled (used for clearing/filling areas)
      // Use grapheme segmenter for proper Unicode handling
      const afterX = x + lineWidth;
      const existingVisualWidth = terminalWidth(stripAnsi(existingLine));

      if (!replace && afterX < existingVisualWidth) {
        // Extract the portion of existingLine that starts at visual position afterX
        // Use grapheme iteration to properly handle multi-code-unit characters like emojis
        let visualPos = 0;
        let stringPos = 0;
        let inAnsiCode = false;
        let beforeAfterX = ''; // Accumulate content before afterX to extract active background
        let stringPosBeforeAnsi = 0; // Track position before ANSI codes started

        // Walk through existingLine by graphemes to find where visual position afterX starts
        for (const grapheme of iterateGraphemes(existingLine)) {
          // Track ANSI codes
          if (grapheme === '\x1b') {
            // Remember position before ANSI codes
            stringPosBeforeAnsi = stringPos;
            inAnsiCode = true;
            beforeAfterX += grapheme;
            stringPos += grapheme.length;
            continue;
          }

          if (inAnsiCode) {
            beforeAfterX += grapheme;
            stringPos += grapheme.length;
            if (grapheme === 'm') {
              inAnsiCode = false;
            }
            continue; // ANSI codes don't contribute to visual width
          }

          // Save position before processing this grapheme (includes any preceding ANSI codes)
          const savedStringPos = stringPosBeforeAnsi;

          // Advance positions
          beforeAfterX += grapheme;
          const graphemeWidth = terminalWidth(grapheme);
          visualPos += graphemeWidth;
          stringPos += grapheme.length;

          // Check if we've crossed the target visual position after advancing
          // This ensures wide characters (like emojis) that overlap with afterX are included
          if (visualPos > afterX) {
            // Extract active background from content before afterX
            const trailingBg = extractActiveBackground(beforeAfterX);
            // Use savedStringPos which points to before this grapheme (and any ANSI codes before it)
            // This ensures border colors and wide characters are preserved correctly
            const remainingContent = existingLine.substring(savedStringPos);

            // Simply include remaining content with background
            newLine += trailingBg + remainingContent;
            break;
          }

          // Update for next iteration - point to after this grapheme
          stringPosBeforeAnsi = stringPos;
        }
      }

      // Store the merged line
      this.buffer[targetY] = newLine;

      // Track max visual width (without ANSI codes)
      const visualWidth = terminalWidth(line);
      maxLineWidth = Math.max(maxLineWidth, visualWidth);
    }

    return {
      x,
      y,
      width: maxLineWidth,
      height: lines.length,
    };
  }

  /**
   * Clear a rectangular region
   */
  clearRegion(_x: number, y: number, _width: number, height: number): void {
    for (let row = y; row < y + height && row < this.height; row++) {
      this.buffer[row] = '';
    }
  }

  /**
   * Get the current content at a position (not really meaningful with ANSI codes, returns full line)
   */
  getAt(_x: number, y: number): string {
    if (y >= 0 && y < this.height) {
      return this.buffer[y];
    }
    return '';
  }

  /**
   * Get a line as a string
   * Appends ANSI reset codes to prevent formatting from bleeding beyond the line
   */
  getLine(y: number): string {
    if (y >= 0 && y < this.height) {
      const line = this.buffer[y];
      // Add reset codes at end of line to prevent background/foreground bleeding
      // Only add if line is non-empty and doesn't already end with reset
      if (line.length > 0 && !line.endsWith('\x1b[49m\x1b[39m')) {
        // Check if line has any active background/foreground colors
        // biome-ignore lint/suspicious/noControlCharactersInRegex: ANSI escape codes require control characters
        const hasBackgroundColor = /\x1b\[4[0-9]m/.test(line) || /\x1b\[10[0-7]m/.test(line);
        // biome-ignore lint/suspicious/noControlCharactersInRegex: ANSI escape codes require control characters
        const hasForegroundColor = /\x1b\[[39][0-9]m/.test(line);

        // Only add reset codes if there are active colors
        if (hasBackgroundColor || hasForegroundColor) {
          return `${line}\x1b[49m\x1b[39m`;
        }
      }
      return line;
    }
    return '';
  }

  /**
   * Set a line directly (for efficient diff buffer updates)
   *
   * ## Fine-Grained Reactivity Usage
   *
   * After diffing and outputting changed lines, use this to update
   * the diff buffer with only the changed lines:
   *
   * ```typescript
   * const changes = renderBuffer.diff(diffBuffer);
   * // ... output changes to terminal ...
   * for (const change of changes) {
   *   diffBuffer.setLine(change.y, change.line);
   * }
   * ```
   *
   * This is more efficient than copying the entire buffer because
   * we only update the lines that actually changed.
   *
   * @param y - Line index (0-based)
   * @param line - Line content (raw, without reset codes added by getLine)
   */
  setLine(y: number, line: string): void {
    if (y >= 0 && y < this.height) {
      // Store raw line - getLine() will add reset codes when reading
      // Note: The line from diff() includes reset codes from getLine(),
      // but storing them is fine - they won't be duplicated on output
      this.buffer[y] = line;
    }
  }

  /**
   * Get the raw line content without reset codes
   * Used internally and for efficient buffer operations
   *
   * @param y - Line index (0-based)
   * @returns Raw line content
   */
  getRawLine(y: number): string {
    if (y >= 0 && y < this.height) {
      return this.buffer[y];
    }
    return '';
  }

  /**
   * Render the entire buffer to terminal
   */
  renderFull(): string {
    // Use getLine() to ensure reset codes are appended to each line
    const lines: string[] = [];
    for (let y = 0; y < this.height; y++) {
      lines.push(this.getLine(y));
    }
    return lines.join('\n');
  }

  /**
   * Get diff between this buffer and another
   * Returns array of changes: { y: number, line: string }
   */
  diff(other: TerminalBuffer): Array<{ y: number; line: string }> {
    const changes: Array<{ y: number; line: string }> = [];

    for (let y = 0; y < Math.min(this.height, other.height); y++) {
      const thisLine = this.getLine(y);
      const otherLine = other.getLine(y);

      if (thisLine !== otherLine) {
        changes.push({ y, line: thisLine });
      }
    }

    return changes;
  }

  /**
   * Clone the buffer
   */
  clone(): TerminalBuffer {
    const cloned = new TerminalBuffer(this.width, this.height);
    for (let y = 0; y < this.height; y++) {
      cloned.buffer[y] = this.buffer[y];
    }
    return cloned;
  }

  /**
   * Resize buffer (for terminal resize events)
   */
  resize(newWidth: number, newHeight: number): void {
    const newBuffer = Array(newHeight).fill('');

    // Copy existing content
    for (let y = 0; y < Math.min(this.height, newHeight); y++) {
      newBuffer[y] = this.buffer[y];
    }

    this.buffer = newBuffer;
    this.width = newWidth;
    this.height = newHeight;
  }
}
