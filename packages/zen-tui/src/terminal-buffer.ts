/**
 * Terminal Screen Buffer
 *
 * Maintains a line-based representation of the terminal screen with ANSI codes preserved.
 */

import stringWidth from 'string-width';
import stripAnsi from 'strip-ansi';

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
   */
  writeAt(
    x: number,
    y: number,
    text: string,
    _maxWidth?: number,
  ): { x: number; y: number; width: number; height: number } {
    const lines = text.split('\n');
    let maxLineWidth = 0;

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const line = lines[lineIndex];
      const targetY = y + lineIndex;

      if (targetY >= this.height) break;

      // Store the line with ANSI codes intact
      this.buffer[targetY] = line;

      // Track max visual width (without ANSI codes)
      const visualWidth = stringWidth(line);
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
   */
  getLine(y: number): string {
    if (y >= 0 && y < this.height) {
      return this.buffer[y];
    }
    return '';
  }

  /**
   * Render the entire buffer to terminal
   */
  renderFull(): string {
    return this.buffer.join('\n');
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
