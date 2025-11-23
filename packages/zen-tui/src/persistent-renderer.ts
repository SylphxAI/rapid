/**
 * Persistent Renderer - Fine-Grained TUI Rendering
 *
 * Uses persistent virtual nodes with incremental updates.
 * No reconciler needed - effects handle updates directly.
 */

import { createRoot } from '@zen/signal';
import { executeDescriptor, isDescriptor } from '@zen/runtime';
import { TUIElement, TUITextNode } from './element.js';
import { buildPersistentTree } from './tree-builder.js';
import { TerminalBuffer } from './terminal-buffer.js';
import { dispatchInput } from './useInput.js';
import type { TUINode } from './types.js';

// Global dirty elements set
globalThis.__tuiDirtyElements = new Set<TUIElement>();

/**
 * Render element to string (like current renderNode but for TUIElement)
 */
function renderElementToString(element: TUIElement | TUITextNode): string {
  if (element instanceof TUITextNode) {
    return element.content;
  }

  // For now, simple text concatenation
  // TODO: Apply styling, borders, layout
  const childrenStrings = element.children.map(renderElementToString);
  return childrenStrings.join('\n');
}

/**
 * Collect all dirty elements in tree
 */
function collectDirtyElements(root: TUIElement): Set<TUIElement> {
  const dirty = new Set<TUIElement>();

  function traverse(element: TUIElement) {
    if (element.isDirty()) {
      dirty.add(element);
    }
    for (const child of element.children) {
      if (child instanceof TUIElement) {
        traverse(child);
      }
    }
  }

  traverse(root);
  return dirty;
}

/**
 * Render to terminal with persistent tree (new architecture)
 */
export async function renderToTerminalPersistent(
  createNode: () => TUINode,
  options: {
    onKeyPress?: (key: string) => void;
    fps?: number;
  } = {},
): Promise<() => void> {
  const { onKeyPress } = options;

  // Enable raw mode for keyboard input
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
  }

  // Hide cursor during rendering
  process.stdout.write('\x1b[?25l');

  let isRunning = true;
  const terminalWidth = process.stdout.columns || 80;
  const terminalHeight = process.stdout.rows || 24;

  // Build persistent tree ONCE
  let rootElement: TUIElement | null = null;

  createRoot(() => {
    // Execute component to get node descriptor
    const node = createNode();

    // Handle descriptor if needed
    const resolvedNode = isDescriptor(node) ? executeDescriptor(node) : node;

    // Build persistent tree
    rootElement = buildPersistentTree(resolvedNode) as TUIElement;
  });

  if (!rootElement) {
    console.error('Failed to build persistent tree');
    return () => {};
  }

  // Terminal buffers for diff-based updates
  let currentBuffer = new TerminalBuffer(terminalWidth, terminalHeight);
  let previousBuffer = new TerminalBuffer(terminalWidth, terminalHeight);

  // Track last output height
  let lastOutputHeight = 0;

  // Flush updates - render dirty nodes only
  const flushUpdates = async () => {
    if (!isRunning || !rootElement) return;

    // Collect dirty elements
    const dirtyElements = collectDirtyElements(rootElement);

    if (dirtyElements.size === 0) {
      return; // Nothing to update
    }

    // For MVP: Re-render entire tree (Phase 3 will optimize this)
    // TODO: Incremental rendering of only dirty subtrees
    const output = renderElementToString(rootElement);
    const newLines = output.split('\n');
    const newOutputHeight = newLines.length;

    // Update buffer
    currentBuffer.clear();
    for (let i = 0; i < newLines.length && i < terminalHeight; i++) {
      currentBuffer.writeAt(0, i, newLines[i], terminalWidth);
    }

    // Diff and update only changed lines
    const changes = currentBuffer.diff(previousBuffer);

    if (changes.length > 0) {
      // Update only changed lines
      for (const change of changes) {
        // Move to line
        if (change.y > 0) {
          for (let i = 0; i < change.y; i++) {
            process.stdout.write('\x1b[1B');
          }
        }
        process.stdout.write('\r');
        process.stdout.write(change.line);
        process.stdout.write('\x1b[K');

        // Move back to top
        if (change.y > 0) {
          for (let i = 0; i < change.y; i++) {
            process.stdout.write('\x1b[1A');
          }
        }
        process.stdout.write('\r');
      }

      // Clear extra lines if app got smaller
      if (newOutputHeight < lastOutputHeight) {
        for (let i = newOutputHeight; i < lastOutputHeight; i++) {
          for (let j = 0; j < i; j++) {
            process.stdout.write('\x1b[1B');
          }
          process.stdout.write('\r');
          process.stdout.write('\x1b[2K');
          for (let j = 0; j < i; j++) {
            process.stdout.write('\x1b[1A');
          }
          process.stdout.write('\r');
        }
      }

      process.stdout.write('\r');
      lastOutputHeight = newOutputHeight;
    }

    // Swap buffers
    const temp = previousBuffer;
    previousBuffer = currentBuffer;
    currentBuffer = temp;

    // Clear dirty flags
    for (const element of dirtyElements) {
      element.clearDirty();
    }

    // Clear global dirty set
    globalThis.__tuiDirtyElements?.clear();
  };

  // Initial render
  const initialOutput = renderElementToString(rootElement);
  process.stdout.write(initialOutput);

  // Track how many lines we rendered
  lastOutputHeight = initialOutput.split('\n').length;

  // Move cursor to TOP of app
  const newlineCount = (initialOutput.match(/\n/g) || []).length;
  for (let i = 0; i < newlineCount; i++) {
    process.stdout.write('\x1b[1A'); // Move up
  }
  process.stdout.write('\r');

  // Initialize current buffer with initial output
  const initialLines = initialOutput.split('\n');
  for (let i = 0; i < initialLines.length && i < terminalHeight; i++) {
    currentBuffer.writeAt(0, i, initialLines[i], terminalWidth);
  }

  // Set up reactive update scheduler
  // When signals change → effects mark elements dirty → schedule flush
  let updateScheduled = false;
  const scheduleUpdate = () => {
    if (!updateScheduled) {
      updateScheduled = true;
      queueMicrotask(() => {
        updateScheduled = false;
        flushUpdates();
      });
    }
  };

  // Watch for dirty elements
  const checkDirtyInterval = setInterval(() => {
    if (globalThis.__tuiDirtyElements && globalThis.__tuiDirtyElements.size > 0) {
      scheduleUpdate();
    }
  }, 1000 / (options.fps || 10));

  // Set up keyboard handler
  const keyHandler = (key: string) => {
    // Ctrl+C to exit
    if (key === '\u0003') {
      cleanup();
      process.exit(0);
    }

    // 'q' to quit
    if (key === 'q' || key === 'Q') {
      cleanup();
      process.exit(0);
    }

    dispatchInput(key);

    // Custom key handler
    if (onKeyPress) {
      onKeyPress(key);
    }

    // Schedule update after input
    scheduleUpdate();
  };

  if (process.stdin.isTTY) {
    process.stdin.on('data', keyHandler);
  }

  // Cleanup function
  const cleanup = () => {
    isRunning = false;
    clearInterval(checkDirtyInterval);

    // Dispose root element
    if (rootElement) {
      rootElement.dispose();
    }

    // Move cursor to bottom
    const finalNewlineCount = lastOutputHeight;
    for (let i = 0; i < finalNewlineCount; i++) {
      process.stdout.write('\x1b[1B');
    }
    process.stdout.write('\n');

    // Show cursor
    process.stdout.write('\x1b[?25h');

    if (process.stdin.isTTY) {
      process.stdin.removeListener('data', keyHandler);
      process.stdin.setRawMode(false);
      process.stdin.pause();
    }
  };

  return cleanup;
}
