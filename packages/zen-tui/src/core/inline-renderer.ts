/**
 * Inline Renderer
 *
 * Handles rendering for console applications in the main screen buffer.
 * Content can be arbitrarily long and the terminal naturally scrolls.
 *
 * Key characteristics:
 * - Dynamic content height (no buffer size limit)
 * - Clear + rewrite strategy for re-renders
 * - Works in main screen buffer (not alternate)
 * - Supports mouse events
 *
 * @see ADR-001 for architecture details
 */

import stripAnsi from 'strip-ansi';

/**
 * State of the inline renderer
 */
export type InlineRendererState = 'idle' | 'active' | 'paused';

/**
 * InlineRenderer class
 *
 * Renders content to the terminal without size limits.
 * Each render clears previous content and rewrites entirely.
 */
export class InlineRenderer {
  /** Current state of the renderer */
  private state: InlineRendererState = 'idle';

  /** Number of lines currently rendered */
  private contentHeight = 0;

  /** Whether cursor is at the top of content (for re-renders) */
  private cursorAtTop = true;

  /** Saved content height when paused (for resume) */
  private savedContentHeight = 0;

  /**
   * Start the renderer
   * Called when render() begins in inline mode
   */
  start(): void {
    if (this.state !== 'idle') {
      throw new Error(`Cannot start InlineRenderer: already ${this.state}`);
    }
    this.state = 'active';
    this.contentHeight = 0;
    this.cursorAtTop = true;
  }

  /**
   * Render content to terminal
   *
   * @param content - The content string to render (may contain newlines)
   */
  render(content: string): void {
    if (this.state !== 'active') {
      throw new Error(`Cannot render: InlineRenderer is ${this.state}`);
    }

    const lines = content.split('\n');
    const newHeight = lines.length;

    // Clear previous content if any
    if (this.contentHeight > 0 && this.cursorAtTop) {
      this.clearPreviousContent();
    }

    // Write new content
    process.stdout.write(content);

    // Update height tracking
    this.contentHeight = newHeight;

    // Move cursor back to top for next render
    // After writing, cursor is at end of last line
    // Move up (newHeight - 1) lines to get to first line
    if (newHeight > 1) {
      process.stdout.write(`\x1b[${newHeight - 1}A`);
    }
    process.stdout.write('\r');
    this.cursorAtTop = true;
  }

  /**
   * Clear previously rendered content
   * Clears all lines and moves cursor back to start
   */
  private clearPreviousContent(): void {
    // We're at the top of content
    // Clear each line and move down, then move back up
    for (let i = 0; i < this.contentHeight; i++) {
      process.stdout.write('\x1b[2K'); // Clear entire line
      if (i < this.contentHeight - 1) {
        process.stdout.write('\x1b[1B'); // Move down
      }
    }

    // Move back to top
    if (this.contentHeight > 1) {
      process.stdout.write(`\x1b[${this.contentHeight - 1}A`);
    }
    process.stdout.write('\r');
  }

  /**
   * Pause the renderer
   * Called before switching to fullscreen mode
   * Saves current state so we can resume later
   */
  pause(): void {
    if (this.state !== 'active') {
      throw new Error(`Cannot pause InlineRenderer: is ${this.state}`);
    }

    this.savedContentHeight = this.contentHeight;

    // Move cursor to bottom of content before pausing
    // This way, when we resume, the previous content is still visible above
    if (this.cursorAtTop && this.contentHeight > 0) {
      process.stdout.write(`\x1b[${this.contentHeight - 1}B`);
      process.stdout.write('\n');
      this.cursorAtTop = false;
    }

    this.state = 'paused';
  }

  /**
   * Resume the renderer
   * Called when returning from fullscreen mode
   */
  resume(): void {
    if (this.state !== 'paused') {
      throw new Error(`Cannot resume InlineRenderer: is ${this.state}`);
    }

    // When resuming, we start fresh below the previous content
    // The old content is still in scrollback
    this.state = 'active';
    this.contentHeight = 0;
    this.cursorAtTop = true;
  }

  /**
   * Clean up and stop the renderer
   * Positions cursor at end of content for shell prompt
   */
  cleanup(): void {
    if (this.state === 'idle') {
      return;
    }

    // Move cursor to bottom of content
    if (this.cursorAtTop && this.contentHeight > 0) {
      process.stdout.write(`\x1b[${this.contentHeight - 1}B`);
    }

    // Add newline so prompt appears below content
    process.stdout.write('\n');

    this.state = 'idle';
    this.contentHeight = 0;
    this.cursorAtTop = true;
  }

  /**
   * Get current state
   */
  getState(): InlineRendererState {
    return this.state;
  }

  /**
   * Get current content height
   */
  getContentHeight(): number {
    return this.contentHeight;
  }
}
