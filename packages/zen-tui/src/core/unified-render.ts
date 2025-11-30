/**
 * Unified Render API
 *
 * Single entry point for rendering TUI apps with dual renderer architecture.
 * Supports both inline mode (unlimited height) and fullscreen mode (terminal-constrained).
 *
 * Uses the optimal renderer architecture from ADR-003:
 * - Double buffer with smart diffing
 * - Adaptive strategy (incremental vs full refresh)
 * - Synchronized output (prevents tearing)
 * - Fine-grained dirty tracking with region awareness
 *
 * @example
 * ```tsx
 * import { render } from '@zen/tui';
 *
 * // Inline mode (default) - unlimited content height
 * render(() => <App />);
 *
 * // Fullscreen mode - uses alternate screen buffer
 * render(() => (
 *   <FullscreenLayout>
 *     <App />
 *   </FullscreenLayout>
 * ));
 * ```
 *
 * @see ADR-001 for architecture details
 * @see ADR-003 for renderer architecture
 */

import { createRoot, signal } from '@zen/signal';
import { dispatchInput } from '../hooks/useInput.js';
import { dispatchMouseEvent as dispatchGlobalMouseEvent } from '../hooks/useMouse.js';
import { terminalHeightSignal, terminalWidthSignal } from '../hooks/useTerminalSize.js';
import { isFullscreenActive } from '../layout/FullscreenLayout.js';
import type { MouseContextValue } from '../providers/MouseProvider.js';
import {
  type RenderSettings,
  RenderSettingsProvider,
  setGlobalRenderSettings,
} from '../providers/RenderContext.js';
import { clearHitTestLayout, hitTestAll, setHitTestLayout } from '../utils/hit-test.js';
import { parseMouseEvent } from '../utils/mouse-parser.js';
import { renderToBuffer } from './layout-renderer.js';
import { clearDirtyFlags, setRenderContext } from './render-context.js';
import { ESC, type Renderer, createRenderer, setDirtyTracker } from './renderer/index.js';
import type { TUINode } from './types.js';
import { type LayoutMap, computeLayout } from './yoga-layout.js';

// ============================================================================
// Constants
// ============================================================================

/**
 * Maximum height for inline mode buffer.
 * This allows inline apps to render content of any practical size.
 * Terminal will naturally scroll to accommodate.
 */
const INLINE_MAX_HEIGHT = 1000;

// ============================================================================
// Mouse Registration (Reference Counting)
// ============================================================================

const mouseConsumers = new Set<string>();
let mouseEnabled = false;

function enableTerminalMouse() {
  if (!mouseEnabled) {
    process.stdout.write('\x1b[?1000h'); // Enable mouse tracking
    process.stdout.write('\x1b[?1006h'); // Enable SGR extended mode
    mouseEnabled = true;
  }
}

function disableTerminalMouse() {
  // Always write disable sequences - terminal ignores if not enabled
  // This ensures cleanup even if state tracking is wrong
  process.stdout.write('\x1b[?1006l'); // Disable SGR extended mode
  process.stdout.write('\x1b[?1000l'); // Disable mouse tracking
  mouseEnabled = false;
}

/**
 * Register interest in mouse events.
 * Mouse tracking is enabled when first consumer registers,
 * and disabled when last consumer unregisters.
 *
 * @param consumerId - Unique identifier for this consumer
 * @returns Cleanup function to unregister
 */
export function registerMouseInterest(consumerId: string): () => void {
  mouseConsumers.add(consumerId);

  // Enable mouse if this is the first consumer
  if (mouseConsumers.size === 1) {
    enableTerminalMouse();
  }

  // Return cleanup function
  return () => {
    mouseConsumers.delete(consumerId);

    // Disable mouse if no more consumers
    if (mouseConsumers.size === 0) {
      disableTerminalMouse();
    }
  };
}

/**
 * Force disable mouse tracking (used by renderer cleanup)
 */
function forceDisableMouse() {
  mouseConsumers.clear();
  disableTerminalMouse();
}

/**
 * Find MouseProvider context by walking up from hit results
 */
function findMouseContext(hits: Array<{ node: TUINode }>): MouseContextValue | null {
  for (const hit of hits) {
    const ctx = hit.node.props?.__mouseContext as MouseContextValue | undefined;
    if (ctx) {
      return ctx;
    }
  }
  return null;
}

/**
 * Render a TUI app to the terminal
 *
 * Uses dual renderer architecture:
 * - Inline mode (default): Unlimited content height, clear+rewrite updates
 * - Fullscreen mode: Terminal-constrained, fine-grained diff updates
 *
 * @param createApp - Function that returns the root component
 * @returns Cleanup function
 */
export async function render(createApp: () => unknown): Promise<() => void> {
  // Create render settings that components will update
  const settings: RenderSettings = {
    fullscreen: signal(false),
  };

  setGlobalRenderSettings(settings);

  let isRunning = true;
  let terminalWidth = process.stdout.columns || 80;
  let terminalHeight = process.stdout.rows || 24;

  // ============================================================================
  // Renderer Setup (ADR-003)
  // ============================================================================
  // Use the new optimal renderer with:
  // - Double buffer + smart diffing
  // - Adaptive strategy (incremental vs full refresh)
  // - Synchronized output (prevents tearing)
  // - Fine-grained dirty tracking

  const getMode = () => (isFullscreenActive() ? 'fullscreen' : 'inline') as const;

  const renderer: Renderer = createRenderer({
    width: terminalWidth,
    height: terminalHeight,
    mode: getMode(),
    syncEnabled: true,
  });

  // Set up the render function for the Renderer
  renderer.setRenderNodeFn((root, buffer, layoutMap, fullRender) => {
    renderToBuffer(root, buffer, layoutMap, fullRender);
  });

  // Connect the DirtyTracker to the global context
  setDirtyTracker(renderer.getDirtyTracker());

  // Create component tree with settings provider
  const node = createRoot(() => {
    const app = createApp();

    // Wrap with settings provider
    return RenderSettingsProvider({
      get children() {
        return app;
      },
    });
  }) as TUINode;

  // ============================================================================
  // Layout State
  // ============================================================================

  // Layout height constraint depends on mode
  const getLayoutHeight = () => (isFullscreenActive() ? terminalHeight : INLINE_MAX_HEIGHT);

  let layoutMap = await computeLayout(node, terminalWidth, getLayoutHeight());
  setHitTestLayout(layoutMap, node);

  // Use the DirtyTracker from the renderer
  const dirtyTracker = renderer.getDirtyTracker();
  const dirtyNodes = new Set<TUINode>();
  let layoutDirty = false;
  let updatePending = false;
  let lastMode: 'inline' | 'fullscreen' = 'inline';

  /**
   * Schedule an update flush.
   */
  const scheduleUpdate = () => {
    if (!updatePending) {
      updatePending = true;
      queueMicrotask(() => {
        updatePending = false;
        if (isRunning) flushUpdates();
      });
    }
  };

  /**
   * Invalidate layout - triggers full Yoga recomputation on next flush.
   */
  const invalidateLayout = () => {
    layoutDirty = true;
    scheduleUpdate();
  };

  // Set up render context
  setRenderContext({
    layoutMap,
    dirtyNodes,
    layoutDirty,
    scheduleUpdate,
    invalidateLayout,
  });

  // Enable raw mode for keyboard input
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
  }

  // Hide cursor
  process.stdout.write('\x1b[?25l');

  // ============================================================================
  // Flush Updates (Using Optimal Renderer - ADR-003)
  // ============================================================================

  const flushUpdates = async () => {
    if (!isRunning) return;

    const inFullscreen = isFullscreenActive();
    const currentMode = inFullscreen ? 'fullscreen' : 'inline';

    // Check for mode change
    if (currentMode !== lastMode) {
      // Mode changed - switch renderer mode
      renderer.switchMode(currentMode, terminalHeight);
      layoutDirty = true;
      lastMode = currentMode;

      // Mark full dirty for mode transition
      dirtyTracker.markFullDirty();
    }

    // Phase 1: Layout (recompute if dirty)
    const needsLayoutRecompute = layoutDirty;

    if (needsLayoutRecompute) {
      layoutMap = await computeLayout(node, terminalWidth, getLayoutHeight());
      setHitTestLayout(layoutMap, node);

      // Update renderer's dirty tracker with new layout regions
      dirtyTracker.updateNodeRegions(layoutMap);

      setRenderContext({
        layoutMap,
        dirtyNodes,
        layoutDirty: false,
        scheduleUpdate,
        invalidateLayout,
      });

      layoutDirty = false;

      // Mark layout dirty in tracker for strategy selection
      dirtyTracker.markFullDirty();
    }

    // Phase 2-5: Render, diff, and output (handled by Renderer)
    // The Renderer handles:
    // - Strategy selection (incremental vs full refresh)
    // - Buffer rendering via renderNodeFn
    // - Diffing current vs previous buffer
    // - Synchronized output
    // - Inline vs fullscreen mode specifics
    renderer.render(node, layoutMap);

    // Phase 6: Clear dirty flags
    clearDirtyFlags();
  };

  // Initial render
  await flushUpdates();

  // ============================================================================
  // Terminal Resize Handler
  // ============================================================================

  const handleResize = () => {
    const newWidth = process.stdout.columns || 80;
    const newHeight = process.stdout.rows || 24;

    if (newWidth === terminalWidth && newHeight === terminalHeight) return;

    terminalWidth = newWidth;
    terminalHeight = newHeight;

    terminalWidthSignal.value = newWidth;
    terminalHeightSignal.value = newHeight;

    // Resize renderer (handles buffer resizing internally)
    renderer.resize(newWidth, newHeight);

    // Clear screen in fullscreen mode
    if (isFullscreenActive()) {
      process.stdout.write(ESC.clearScreen);
      process.stdout.write(ESC.cursorHome);
    }

    layoutDirty = true;

    queueMicrotask(() => {
      if (isRunning) flushUpdates();
    });
  };

  if (process.stdout.isTTY) {
    process.stdout.on('resize', handleResize);
  }

  // ============================================================================
  // Input Handler
  // ============================================================================

  const keyHandler = (data: Buffer | string) => {
    const key = typeof data === 'string' ? data : data.toString('utf8');

    // Mouse events
    const mouseEvent = parseMouseEvent(key);
    if (mouseEvent) {
      const hits = hitTestAll(mouseEvent.x, mouseEvent.y);
      const mouseContext = findMouseContext(hits);

      if (mouseContext) {
        for (let i = hits.length - 1; i >= 0; i--) {
          const hit = hits[i];
          const mouseId = hit.node.props?.__mouseId as string | undefined;
          if (mouseId) {
            mouseContext.dispatchMouseEvent(mouseEvent, hit.node, hit.localX, hit.localY);
          }
        }
      }

      dispatchGlobalMouseEvent(mouseEvent);

      const hit = hits.length > 0 ? hits[hits.length - 1] : null;
      if (mouseEvent.type === 'mouseup' && hit?.node.props?.onClick) {
        hit.node.props.onClick({
          x: mouseEvent.x,
          y: mouseEvent.y,
          localX: hit.localX,
          localY: hit.localY,
          button: mouseEvent.button,
          ctrl: mouseEvent.ctrl,
          shift: mouseEvent.shift,
          meta: mouseEvent.meta,
        });
      }

      queueMicrotask(() => {
        if (isRunning) flushUpdates();
      });
      return;
    }

    // Ctrl+C to exit
    if (key === '\u0003') {
      process.stdout.write('\x1b[?1006l\x1b[?1000l\x1b[?25h');
      cleanup();
      process.exit(0);
    }

    // q to quit
    if (key === 'q' || key === 'Q') {
      process.stdout.write('\x1b[?1006l\x1b[?1000l\x1b[?25h');
      cleanup();
      process.exit(0);
    }

    dispatchInput(key);

    queueMicrotask(() => {
      if (isRunning) flushUpdates();
    });
  };

  process.stdin.on('data', keyHandler);

  // ============================================================================
  // Cleanup
  // ============================================================================

  const cleanup = () => {
    if (!isRunning) return;
    isRunning = false;
    setGlobalRenderSettings(null);
    setRenderContext(null);
    setDirtyTracker(null);
    clearHitTestLayout();

    if (process.stdout.isTTY) {
      process.stdout.off('resize', handleResize);
    }

    // Exit alternate screen if in fullscreen
    if (isFullscreenActive()) {
      process.stdout.write(ESC.exitAltScreen);
    }

    forceDisableMouse();
    process.stdout.write(ESC.showCursor);

    // Renderer handles cursor positioning for inline mode
    renderer.cleanup();

    if (process.stdin.isTTY) {
      process.stdin.removeListener('data', keyHandler);
      process.stdin.setRawMode(false);
      process.stdin.pause();
    }
  };

  // ============================================================================
  // Exit Handlers
  // ============================================================================

  const emergencyCleanup = () => {
    // Emergency escape sequence to restore terminal state
    process.stdout.write(
      ESC.disableMouseSGR + ESC.disableMouse + ESC.showCursor + ESC.exitAltScreen,
    );
  };

  const handleExit = () => {
    emergencyCleanup();
    cleanup();
  };

  const handleSignal = (sig: string) => () => {
    emergencyCleanup();
    cleanup();
    process.exit(sig === 'SIGINT' ? 130 : 143);
  };

  process.on('exit', handleExit);
  process.on('SIGINT', handleSignal('SIGINT'));
  process.on('SIGTERM', handleSignal('SIGTERM'));
  process.on('uncaughtException', (_err) => {
    emergencyCleanup();
    cleanup();
    process.exit(1);
  });

  return cleanup;
}
