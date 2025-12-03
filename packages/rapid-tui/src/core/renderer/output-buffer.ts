/**
 * Output Buffer with Synchronized Output Support
 *
 * Buffers all terminal output and writes in a single operation.
 * Uses synchronized output protocol (DEC mode 2026) to prevent tearing.
 *
 * @see https://gist.github.com/christianparpart/d8a62cc1ab659194337d73e399004036
 */

/**
 * Escape sequences for synchronized output.
 */
const SYNC_START = '\x1b[?2026h'; // Begin synchronized update
const SYNC_END = '\x1b[?2026l'; // End synchronized update

/**
 * Common escape sequences.
 */
export const ESC = {
  // Cursor movement
  cursorTo: (row: number, col: number) => `\x1b[${row};${col}H`,
  cursorUp: (n: number) => (n > 0 ? `\x1b[${n}A` : ''),
  cursorDown: (n: number) => (n > 0 ? `\x1b[${n}B` : ''),
  cursorForward: (n: number) => (n > 0 ? `\x1b[${n}C` : ''),
  cursorBack: (n: number) => (n > 0 ? `\x1b[${n}D` : ''),
  cursorHome: '\x1b[H',
  cursorReturn: '\r',

  // Erase
  clearLine: '\x1b[2K',
  clearToEndOfLine: '\x1b[K',
  clearScreen: '\x1b[2J',
  clearToEndOfScreen: '\x1b[J',

  // Cursor visibility
  hideCursor: '\x1b[?25l',
  showCursor: '\x1b[?25h',

  // Alternate screen buffer
  enterAltScreen: '\x1b[?1049h',
  exitAltScreen: '\x1b[?1049l',

  // Mouse
  enableMouse: '\x1b[?1000h',
  disableMouse: '\x1b[?1000l',
  enableMouseSGR: '\x1b[?1006h',
  disableMouseSGR: '\x1b[?1006l',

  // Style reset
  reset: '\x1b[0m',
  resetFg: '\x1b[39m',
  resetBg: '\x1b[49m',

  // Synchronized output
  syncStart: SYNC_START,
  syncEnd: SYNC_END,
};

/**
 * Output buffer that collects all writes and flushes in a single operation.
 */
export class OutputBuffer {
  /** Buffered output chunks */
  private chunks: string[] = [];

  /** Whether synchronized output is supported/enabled */
  private syncEnabled = true;

  /** Whether we're currently in a synchronized block */
  private inSyncBlock = false;

  /**
   * Enable or disable synchronized output.
   * @param enabled - Whether to enable synchronized output
   */
  setSyncEnabled(enabled: boolean): void {
    this.syncEnabled = enabled;
  }

  /**
   * Check if synchronized output is enabled.
   */
  isSyncEnabled(): boolean {
    return this.syncEnabled;
  }

  /**
   * Begin a synchronized update block.
   * Terminal will buffer all updates until endSync() is called.
   */
  beginSync(): void {
    if (this.syncEnabled && !this.inSyncBlock) {
      this.chunks.push(SYNC_START);
      this.inSyncBlock = true;
    }
  }

  /**
   * End a synchronized update block.
   * Terminal will now render all buffered updates at once.
   */
  endSync(): void {
    if (this.syncEnabled && this.inSyncBlock) {
      this.chunks.push(SYNC_END);
      this.inSyncBlock = false;
    }
  }

  /**
   * Write content to the buffer.
   */
  write(content: string): void {
    if (content) {
      this.chunks.push(content);
    }
  }

  /**
   * Write multiple content pieces to the buffer.
   */
  writeAll(...contents: string[]): void {
    for (const content of contents) {
      if (content) {
        this.chunks.push(content);
      }
    }
  }

  /**
   * Move cursor to absolute position (1-indexed).
   */
  moveTo(row: number, col = 1): void {
    this.chunks.push(ESC.cursorTo(row, col));
  }

  /**
   * Move cursor up by n lines.
   */
  moveUp(n: number): void {
    if (n > 0) {
      this.chunks.push(ESC.cursorUp(n));
    }
  }

  /**
   * Move cursor down by n lines.
   */
  moveDown(n: number): void {
    if (n > 0) {
      this.chunks.push(ESC.cursorDown(n));
    }
  }

  /**
   * Move cursor to beginning of line.
   */
  carriageReturn(): void {
    this.chunks.push(ESC.cursorReturn);
  }

  /**
   * Clear the current line.
   */
  clearLine(): void {
    this.chunks.push(ESC.clearLine);
  }

  /**
   * Clear from cursor to end of line.
   */
  clearToEOL(): void {
    this.chunks.push(ESC.clearToEndOfLine);
  }

  /**
   * Clear from cursor to end of screen.
   */
  clearToEOS(): void {
    this.chunks.push(ESC.clearToEndOfScreen);
  }

  /**
   * Clear entire screen.
   */
  clearScreen(): void {
    this.chunks.push(ESC.clearScreen);
  }

  /**
   * Move to position and clear line, then write content.
   * Common pattern for updating a single line.
   */
  updateLine(row: number, content: string): void {
    this.chunks.push(ESC.cursorTo(row, 1), ESC.clearLine, content);
  }

  /**
   * Clear and write content at current position.
   */
  replaceLine(content: string): void {
    this.chunks.push(ESC.cursorReturn, ESC.clearLine, content);
  }

  /**
   * Get the current buffer content without flushing.
   */
  getContent(): string {
    return this.chunks.join('');
  }

  /**
   * Get the number of chunks in the buffer.
   */
  get length(): number {
    return this.chunks.length;
  }

  /**
   * Check if buffer is empty.
   */
  get isEmpty(): boolean {
    return this.chunks.length === 0;
  }

  /**
   * Clear the buffer without writing to terminal.
   */
  clear(): void {
    this.chunks = [];
    this.inSyncBlock = false;
  }

  /**
   * Flush all buffered content to stdout in a single write.
   * This is the key to preventing flickering - all updates are atomic.
   */
  flush(): void {
    if (this.chunks.length === 0) return;

    const output = this.chunks.join('');
    this.chunks = [];
    this.inSyncBlock = false;

    // Single write to stdout
    process.stdout.write(output);
  }

  /**
   * Flush to a custom stream (for testing or alternative outputs).
   */
  flushTo(stream: NodeJS.WriteStream): void {
    if (this.chunks.length === 0) return;

    const output = this.chunks.join('');
    this.chunks = [];
    this.inSyncBlock = false;

    stream.write(output);
  }

  /**
   * Get buffer content and clear, but don't write to stdout.
   * Useful for testing.
   */
  collect(): string {
    const output = this.chunks.join('');
    this.chunks = [];
    this.inSyncBlock = false;
    return output;
  }
}

/**
 * Create an output buffer with common initial setup.
 */
export function createOutputBuffer(options?: {
  syncEnabled?: boolean;
}): OutputBuffer {
  const buffer = new OutputBuffer();
  if (options?.syncEnabled !== undefined) {
    buffer.setSyncEnabled(options.syncEnabled);
  }
  return buffer;
}
