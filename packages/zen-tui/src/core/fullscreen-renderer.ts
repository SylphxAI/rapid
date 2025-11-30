/**
 * Fullscreen Renderer
 *
 * Handles rendering for fullscreen applications using the alternate screen buffer.
 * Content is constrained to terminal dimensions with fine-grained updates.
 *
 * Key characteristics:
 * - Fixed buffer size (terminal dimensions)
 * - Uses alternate screen buffer (preserves main screen)
 * - Fine-grained diffing for efficient updates
 * - Only outputs changed lines
 *
 * @see ADR-001 for architecture details
 */

import { renderToBuffer } from './layout-renderer.js';
import { TerminalBuffer } from './terminal-buffer.js';
import type { TUINode } from './types.js';
import type { LayoutMap } from './yoga-layout.js';

/**
 * State of the fullscreen renderer
 */
export type FullscreenRendererState = 'idle' | 'active';

/**
 * FullscreenRenderer class
 *
 * Renders content using the alternate screen buffer with fine-grained updates.
 * Each render only outputs lines that have changed since the last render.
 */
export class FullscreenRenderer {
  /** Current state of the renderer */
  private state: FullscreenRendererState = 'idle';

  /** Current render buffer */
  private currentBuffer: TerminalBuffer | null = null;

  /** Previous render buffer (for diffing) */
  private previousBuffer: TerminalBuffer | null = null;

  /** Terminal width */
  private width = 0;

  /** Terminal height */
  private height = 0;

  /**
   * Enter fullscreen mode
   * Switches to alternate screen buffer and initializes buffers
   *
   * @param width - Terminal width
   * @param height - Terminal height
   */
  enter(width: number, height: number): void {
    if (this.state !== 'idle') {
      throw new Error(`Cannot enter fullscreen: already ${this.state}`);
    }

    this.width = width;
    this.height = height;

    // Create buffers sized to terminal dimensions
    this.currentBuffer = new TerminalBuffer(width, height);
    this.previousBuffer = new TerminalBuffer(width, height);

    // Enter alternate screen buffer
    process.stdout.write('\x1b[?1049h');

    // Clear screen and move to top-left
    process.stdout.write('\x1b[2J');
    process.stdout.write('\x1b[H');

    // Hide cursor (will be shown on exit)
    process.stdout.write('\x1b[?25l');

    this.state = 'active';
  }

  /**
   * Render node tree to terminal
   *
   * Uses fine-grained diffing to only output changed lines.
   *
   * @param node - Root node to render
   * @param layoutMap - Pre-computed layout information
   * @param fullRender - If true, skip diffing and render everything
   */
  render(node: TUINode, layoutMap: LayoutMap, fullRender = false): void {
    if (this.state !== 'active') {
      throw new Error(`Cannot render: FullscreenRenderer is ${this.state}`);
    }

    if (!this.currentBuffer || !this.previousBuffer) {
      throw new Error('Buffers not initialized');
    }

    // Render node tree to buffer
    renderToBuffer(node, this.currentBuffer, layoutMap, fullRender);

    // Diff buffers to find changed lines
    const changes = this.currentBuffer.diff(this.previousBuffer);

    // Output only changed lines using cursor positioning
    // This is the key to fine-grained updates
    for (const change of changes) {
      const row = change.y + 1; // Convert to 1-indexed
      // Move cursor to row, clear line, write content
      process.stdout.write(`\x1b[${row};1H\x1b[2K${change.line}`);
    }

    // Update previous buffer with changed lines only
    for (const change of changes) {
      this.previousBuffer.setLine(change.y, change.line);
    }
  }

  /**
   * Render string content directly (for simpler use cases)
   *
   * @param content - String content to render
   */
  renderString(content: string): void {
    if (this.state !== 'active') {
      throw new Error(`Cannot render: FullscreenRenderer is ${this.state}`);
    }

    if (!this.currentBuffer || !this.previousBuffer) {
      throw new Error('Buffers not initialized');
    }

    // Clear buffer and write content
    this.currentBuffer.clear();
    const lines = content.split('\n');
    for (let y = 0; y < Math.min(lines.length, this.height); y++) {
      this.currentBuffer.writeAt(0, y, lines[y], this.width);
    }

    // Diff and output
    const changes = this.currentBuffer.diff(this.previousBuffer);
    for (const change of changes) {
      const row = change.y + 1;
      process.stdout.write(`\x1b[${row};1H\x1b[2K${change.line}`);
    }

    for (const change of changes) {
      this.previousBuffer.setLine(change.y, change.line);
    }
  }

  /**
   * Handle terminal resize
   *
   * @param width - New terminal width
   * @param height - New terminal height
   */
  resize(width: number, height: number): void {
    if (this.state !== 'active') {
      return;
    }

    this.width = width;
    this.height = height;

    // Resize buffers
    this.currentBuffer?.resize(width, height);
    this.previousBuffer?.resize(width, height);

    // Clear previous buffer (all positions changed)
    this.previousBuffer?.clear();

    // Clear screen
    process.stdout.write('\x1b[2J');
    process.stdout.write('\x1b[H');
  }

  /**
   * Exit fullscreen mode
   * Returns to main screen buffer
   */
  exit(): void {
    if (this.state !== 'active') {
      return;
    }

    // Show cursor
    process.stdout.write('\x1b[?25h');

    // Exit alternate screen buffer (restores main screen)
    process.stdout.write('\x1b[?1049l');

    // Clean up buffers
    this.currentBuffer = null;
    this.previousBuffer = null;

    this.state = 'idle';
  }

  /**
   * Get current state
   */
  getState(): FullscreenRendererState {
    return this.state;
  }

  /**
   * Get current buffer (for advanced use cases)
   */
  getCurrentBuffer(): TerminalBuffer | null {
    return this.currentBuffer;
  }

  /**
   * Get dimensions
   */
  getDimensions(): { width: number; height: number } {
    return { width: this.width, height: this.height };
  }
}
