/**
 * TUI Renderer
 *
 * Unified renderer for terminal UI applications.
 * Encapsulates all terminal-specific logic:
 * - Lifecycle management (mount/unmount)
 * - Input handling (keyboard, mouse)
 * - Terminal setup (raw mode, cursor, alternate screen)
 * - Layout computation (Yoga)
 * - Buffer management (double buffer + diff)
 * - Output (synchronized writes)
 *
 * Architecture mirrors @zen/web's simple render() API:
 * - Web: render(component, container) → appendChild to DOM
 * - TUI: render(component) → TUIRenderer manages everything
 *
 * @see docs/adr/003-final-renderer-architecture.md
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
import {
  type Renderer as BufferRenderer,
  ESC,
  createRenderer as createBufferRenderer,
  setDirtyTracker,
} from './renderer/index.js';
import type { TUINode, TUIStyle } from './types.js';
import { type LayoutMap, computeLayout } from './yoga-layout.js';
import { executeDescriptor, isDescriptor } from '@zen/runtime';

// ============================================================================
// Static Component Helpers
// ============================================================================

/**
 * Find all Static nodes in the tree.
 */
function findStaticNodes(node: TUINode): TUINode[] {
  const result: TUINode[] = [];

  if (node.tagName === 'static') {
    result.push(node);
  }

  if (node.children) {
    for (const child of node.children) {
      if (typeof child === 'object' && child !== null && 'type' in child) {
        result.push(...findStaticNodes(child as TUINode));
      }
    }
  }

  return result;
}

/**
 * Get ANSI color code
 */
function getColorCode(color: string): string {
  const colorMap: Record<string, string> = {
    black: '\x1b[30m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    gray: '\x1b[90m',
    grey: '\x1b[90m',
  };
  return colorMap[color.toLowerCase()] || '\x1b[37m';
}

/**
 * Apply text styling for static output
 */
function applyStaticTextStyle(text: string, style: TUIStyle = {}): string {
  if (!text) return '';

  let codes = '';
  let resetCodes = '';

  if (style.color) {
    const color = typeof style.color === 'function' ? style.color() : style.color;
    codes += getColorCode(color);
    resetCodes = `\x1b[39m${resetCodes}`;
  }
  if (style.bold) {
    const bold = typeof style.bold === 'function' ? style.bold() : style.bold;
    if (bold) {
      codes += '\x1b[1m';
      resetCodes = `\x1b[22m${resetCodes}`;
    }
  }
  if (style.dim) {
    codes += '\x1b[2m';
    resetCodes = `\x1b[22m${resetCodes}`;
  }

  return codes + text + resetCodes;
}

/**
 * Render a TUINode to a string for static output.
 */
function renderNodeToString(node: TUINode | string, parentStyle: TUIStyle = {}): string {
  if (typeof node === 'string') {
    return applyStaticTextStyle(node, parentStyle);
  }

  if (!node || typeof node !== 'object') {
    return '';
  }

  const style = typeof node.style === 'function' ? node.style() : node.style || {};
  const mergedStyle = { ...parentStyle, ...style };

  // Text node - render children as styled text
  if (node.type === 'text') {
    return node.children
      .map((child) => {
        if (typeof child === 'string') {
          return applyStaticTextStyle(child, mergedStyle);
        }
        return renderNodeToString(child as TUINode, mergedStyle);
      })
      .join('');
  }

  // Box or other container - render children
  if (node.children) {
    return node.children
      .map((child) => {
        if (typeof child === 'string') {
          return applyStaticTextStyle(child, mergedStyle);
        }
        return renderNodeToString(child as TUINode, mergedStyle);
      })
      .join('');
  }

  return '';
}

/**
 * Process static nodes and print new items to stdout.
 * Returns the number of lines printed.
 */
function processStaticNodes(rootNode: TUINode, isInlineMode: boolean): number {
  if (!isInlineMode) {
    // Static output only works in inline mode (scrollback)
    return 0;
  }

  const staticNodes = findStaticNodes(rootNode);
  let linesPrinted = 0;

  for (const staticNode of staticNodes) {
    const itemsGetter = staticNode.props?.__itemsGetter as (() => unknown[]) | undefined;
    const renderChild = staticNode.props?.__renderChild as
      | ((item: unknown, index: number) => TUINode | string)
      | undefined;
    const lastCount = (staticNode.props?.__lastRenderedCount as number) || 0;

    if (!itemsGetter || !renderChild) continue;

    const items = itemsGetter();
    const newCount = items?.length || 0;

    // Check for new items
    if (newCount > lastCount) {
      const newItems = items.slice(lastCount);

      // Move cursor to start of current UI area (we'll print above it)
      // Actually, for scrollback, we just print directly - the dynamic UI
      // will be re-rendered below
      for (let i = 0; i < newItems.length; i++) {
        const item = newItems[i];
        const index = lastCount + i;
        let rendered = renderChild(item, index);
        // Execute descriptor if needed (JSX returns descriptors)
        if (isDescriptor(rendered)) {
          rendered = executeDescriptor(rendered);
        }
        const line = renderNodeToString(rendered as TUINode);
        // Print to stdout directly (goes to scrollback)
        process.stdout.write(`${line}\n`);
        linesPrinted++;
      }

      // Update the rendered count
      if (staticNode.props) {
        staticNode.props.__lastRenderedCount = newCount;
      }
    }
  }

  return linesPrinted;
}

// ============================================================================
// Types
// ============================================================================

export interface TUIRendererOptions {
  /**
   * Initial terminal width (defaults to process.stdout.columns)
   */
  width?: number;

  /**
   * Initial terminal height (defaults to process.stdout.rows)
   */
  height?: number;

  /**
   * Enable synchronized output to prevent tearing
   * @default true
   */
  syncEnabled?: boolean;
}

// ============================================================================
// Constants
// ============================================================================

const INLINE_MAX_HEIGHT = 1000;

// ============================================================================
// Mouse Registration
// ============================================================================

const mouseConsumers = new Set<string>();
let mouseEnabled = false;

function enableTerminalMouse() {
  if (!mouseEnabled) {
    process.stdout.write(ESC.enableMouse);
    process.stdout.write(ESC.enableMouseSGR);
    mouseEnabled = true;
  }
}

function disableTerminalMouse() {
  process.stdout.write(ESC.disableMouseSGR);
  process.stdout.write(ESC.disableMouse);
  mouseEnabled = false;
}

/**
 * Register interest in mouse events.
 */
export function registerMouseInterest(consumerId: string): () => void {
  mouseConsumers.add(consumerId);

  if (mouseConsumers.size === 1) {
    enableTerminalMouse();
  }

  return () => {
    mouseConsumers.delete(consumerId);
    if (mouseConsumers.size === 0) {
      disableTerminalMouse();
    }
  };
}

function forceDisableMouse() {
  mouseConsumers.clear();
  disableTerminalMouse();
}

// ============================================================================
// TUIRenderer Class
// ============================================================================

/**
 * Main TUI Renderer class.
 *
 * Manages the complete lifecycle of a TUI application:
 * 1. Terminal setup (raw mode, cursor hiding)
 * 2. Component tree creation
 * 3. Layout computation
 * 4. Rendering loop
 * 5. Input handling
 * 6. Cleanup on exit
 */
export class TUIRenderer {
  // State
  private isRunning = false;
  private terminalWidth: number;
  private terminalHeight: number;

  // Component tree
  private rootNode: TUINode | null = null;
  private settings: RenderSettings | null = null;

  // Layout
  private layoutMap: LayoutMap | null = null;
  private layoutDirty = false;
  private dirtyNodes = new Set<TUINode>();

  // Rendering
  private bufferRenderer: BufferRenderer | null = null;
  private updatePending = false;
  private lastMode: 'inline' | 'fullscreen' = 'inline';

  // Event handlers (stored for cleanup)
  private keyHandler: ((data: Buffer | string) => void) | null = null;
  private resizeHandler: (() => void) | null = null;
  private keepaliveInterval: ReturnType<typeof setInterval> | null = null;

  constructor(options: TUIRendererOptions = {}) {
    this.terminalWidth = options.width ?? process.stdout.columns ?? 80;
    this.terminalHeight = options.height ?? process.stdout.rows ?? 24;
  }

  // ==========================================================================
  // Public API
  // ==========================================================================

  /**
   * Mount and start rendering a component.
   */
  async mount(createApp: () => unknown): Promise<void> {
    if (this.isRunning) {
      throw new Error('TUIRenderer is already running. Call unmount() first.');
    }

    this.isRunning = true;

    // Setup render settings
    this.settings = { fullscreen: signal(false) };
    setGlobalRenderSettings(this.settings);

    // Create buffer renderer
    this.bufferRenderer = createBufferRenderer({
      width: this.terminalWidth,
      height: this.terminalHeight,
      mode: this.getMode(),
      syncEnabled: true,
    });

    this.bufferRenderer.setRenderNodeFn((root, buffer, layoutMap, fullRender) => {
      renderToBuffer(root, buffer, layoutMap, fullRender);
    });

    setDirtyTracker(this.bufferRenderer.getDirtyTracker());

    // Create component tree
    this.rootNode = createRoot(() => {
      const app = createApp();
      return RenderSettingsProvider({
        get children() {
          return app;
        },
      });
    }) as TUINode;

    // Initial layout
    this.layoutMap = await computeLayout(this.rootNode, this.terminalWidth, this.getLayoutHeight());
    setHitTestLayout(this.layoutMap, this.rootNode);

    // Setup render context
    this.setupRenderContext();

    // Setup terminal
    this.setupTerminal();

    // Setup event handlers
    this.setupEventHandlers();

    // Initial render
    await this.flushUpdates();
  }

  /**
   * Unmount and cleanup.
   */
  unmount(): void {
    if (!this.isRunning) return;

    this.isRunning = false;

    // Cleanup global state
    setGlobalRenderSettings(null);
    setRenderContext(null);
    setDirtyTracker(null);
    clearHitTestLayout();

    // Remove event handlers
    this.cleanupEventHandlers();

    // Restore terminal
    this.cleanupTerminal();

    // Clear references
    this.rootNode = null;
    this.layoutMap = null;
    this.bufferRenderer = null;
    this.settings = null;
  }

  // ==========================================================================
  // Private - Mode & Layout
  // ==========================================================================

  private getMode(): 'inline' | 'fullscreen' {
    return isFullscreenActive() ? 'fullscreen' : 'inline';
  }

  private getLayoutHeight(): number {
    return isFullscreenActive() ? this.terminalHeight : INLINE_MAX_HEIGHT;
  }

  // ==========================================================================
  // Private - Render Context
  // ==========================================================================

  private setupRenderContext(): void {
    setRenderContext({
      // biome-ignore lint/style/noNonNullAssertion: layoutMap is set before this is called
      layoutMap: this.layoutMap!,
      dirtyNodes: this.dirtyNodes,
      layoutDirty: false,
      scheduleUpdate: () => this.scheduleUpdate(),
      invalidateLayout: () => this.invalidateLayout(),
    });
  }

  private scheduleUpdate(): void {
    if (!this.updatePending) {
      this.updatePending = true;
      queueMicrotask(() => {
        this.updatePending = false;
        if (this.isRunning) this.flushUpdates();
      });
    }
  }

  private invalidateLayout(): void {
    this.layoutDirty = true;
    this.scheduleUpdate();
  }

  // ==========================================================================
  // Private - Flush Updates
  // ==========================================================================

  private async flushUpdates(): Promise<void> {
    if (!this.isRunning || !this.rootNode || !this.bufferRenderer) return;

    const currentMode = this.getMode();
    const dirtyTracker = this.bufferRenderer.getDirtyTracker();

    // Handle mode change
    if (currentMode !== this.lastMode) {
      this.bufferRenderer.switchMode(currentMode, this.terminalHeight);
      this.layoutDirty = true;
      this.lastMode = currentMode;
      dirtyTracker.markFullDirty();
    }

    // Recompute layout if dirty
    if (this.layoutDirty) {
      this.layoutMap = await computeLayout(
        this.rootNode,
        this.terminalWidth,
        this.getLayoutHeight(),
      );
      setHitTestLayout(this.layoutMap, this.rootNode);

      dirtyTracker.updateNodeRegions(this.layoutMap);

      setRenderContext({
        layoutMap: this.layoutMap,
        dirtyNodes: this.dirtyNodes,
        layoutDirty: false,
        scheduleUpdate: () => this.scheduleUpdate(),
        invalidateLayout: () => this.invalidateLayout(),
      });

      this.layoutDirty = false;
      dirtyTracker.markFullDirty();
    }

    // Process Static nodes - print new items to scrollback (inline mode only)
    // This must happen BEFORE the main render so static content appears above dynamic UI
    const isInlineMode = !isFullscreenActive();
    const staticLinesPrinted = processStaticNodes(this.rootNode, isInlineMode);

    // If static content was printed, reset cursor tracking so we don't clear the static content
    if (staticLinesPrinted > 0) {
      this.bufferRenderer.resetCursorForStaticContent(staticLinesPrinted);
    }

    // Render
    // For inline mode, let renderer calculate content height from buffer (finds last non-empty line)
    // For fullscreen mode, use layout height
    const rootLayout = this.layoutMap?.get(this.rootNode);
    const contentHeight = isFullscreenActive()
      ? rootLayout
        ? Math.ceil(rootLayout.height)
        : undefined
      : undefined;
    // biome-ignore lint/style/noNonNullAssertion: layoutMap is guaranteed non-null after initial layout
    this.bufferRenderer.render(this.rootNode, this.layoutMap!, contentHeight);

    // Clear dirty flags
    clearDirtyFlags();
  }

  // ==========================================================================
  // Private - Terminal Setup
  // ==========================================================================

  private setupTerminal(): void {
    // Enable raw mode
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true);
    }
    // Always resume and set encoding to keep process alive
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    // Ensure stdin keeps the process alive (ref() is default, but explicit is safer)
    if (typeof process.stdin.ref === 'function') {
      process.stdin.ref();
    }

    // Hide cursor
    process.stdout.write(ESC.hideCursor);
  }

  private cleanupTerminal(): void {
    // Exit alternate screen if in fullscreen
    if (isFullscreenActive()) {
      process.stdout.write(ESC.exitAltScreen);
    }

    // Disable mouse
    forceDisableMouse();

    // Show cursor
    process.stdout.write(ESC.showCursor);

    // Renderer cleanup (cursor positioning for inline mode)
    this.bufferRenderer?.cleanup();

    // Restore stdin
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(false);
      process.stdin.pause();
    }
  }

  // ==========================================================================
  // Private - Event Handlers
  // ==========================================================================

  private setupEventHandlers(): void {
    // Keyboard/Mouse input
    this.keyHandler = (data: Buffer | string) => {
      if (!this.isRunning) return;

      const key = typeof data === 'string' ? data : data.toString('utf8');

      // Mouse events
      const mouseEvent = parseMouseEvent(key);
      if (mouseEvent) {
        this.handleMouseEvent(mouseEvent);
        return;
      }

      // Ctrl+C / q to exit
      if (key === '\u0003' || key === 'q' || key === 'Q') {
        this.emergencyCleanup();
        this.unmount();
        process.exit(key === '\u0003' ? 130 : 0);
      }

      // Dispatch to useInput handlers
      dispatchInput(key);
      this.scheduleUpdate();
    };

    process.stdin.on('data', this.keyHandler);

    // Resize
    this.resizeHandler = () => {
      const newWidth = process.stdout.columns || 80;
      const newHeight = process.stdout.rows || 24;

      if (newWidth === this.terminalWidth && newHeight === this.terminalHeight) return;

      this.terminalWidth = newWidth;
      this.terminalHeight = newHeight;

      terminalWidthSignal.value = newWidth;
      terminalHeightSignal.value = newHeight;

      this.bufferRenderer?.resize(newWidth, newHeight);

      if (isFullscreenActive()) {
        process.stdout.write(ESC.clearScreen);
        process.stdout.write(ESC.cursorHome);
      }

      this.layoutDirty = true;
      this.scheduleUpdate();
    };

    if (process.stdout.isTTY) {
      process.stdout.on('resize', this.resizeHandler);
    }

    // Process exit handlers
    process.on('exit', () => this.handleExit());
    process.on('SIGINT', () => this.handleSignal(130));
    process.on('SIGTERM', () => this.handleSignal(143));
    process.on('uncaughtException', () => {
      this.emergencyCleanup();
      this.unmount();
      process.exit(1);
    });

    // Keepalive interval - ensures process doesn't exit when stdin closes
    // This is needed because stdin may close in non-TTY environments
    this.keepaliveInterval = setInterval(
      () => {
        // Empty interval just to keep the event loop alive
      },
      1000 * 60 * 60,
    ); // 1 hour (effectively infinite)
  }

  private cleanupEventHandlers(): void {
    if (this.keyHandler) {
      process.stdin.removeListener('data', this.keyHandler);
      this.keyHandler = null;
    }

    if (this.resizeHandler && process.stdout.isTTY) {
      process.stdout.removeListener('resize', this.resizeHandler);
      this.resizeHandler = null;
    }

    if (this.keepaliveInterval) {
      clearInterval(this.keepaliveInterval);
      this.keepaliveInterval = null;
    }
  }

  // ==========================================================================
  // Private - Mouse Handling
  // ==========================================================================

  private handleMouseEvent(mouseEvent: ReturnType<typeof parseMouseEvent>): void {
    if (!mouseEvent || !this.rootNode) return;

    const hits = hitTestAll(mouseEvent.x, mouseEvent.y);
    const mouseContext = this.findMouseContext(hits);

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

    this.scheduleUpdate();
  }

  private findMouseContext(hits: Array<{ node: TUINode }>): MouseContextValue | null {
    for (const hit of hits) {
      const ctx = hit.node.props?.__mouseContext as MouseContextValue | undefined;
      if (ctx) return ctx;
    }
    return null;
  }

  // ==========================================================================
  // Private - Exit Handling
  // ==========================================================================

  private emergencyCleanup(): void {
    // Only exit alternate screen if in fullscreen mode
    const exitAlt = isFullscreenActive() ? ESC.exitAltScreen : '';
    process.stdout.write(ESC.disableMouseSGR + ESC.disableMouse + ESC.showCursor + exitAlt);
  }

  private handleExit(): void {
    this.emergencyCleanup();
    this.unmount();
  }

  private handleSignal(exitCode: number): void {
    this.emergencyCleanup();
    this.unmount();
    process.exit(exitCode);
  }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Create a TUI renderer instance.
 */
export function createTUIRenderer(options?: TUIRendererOptions): TUIRenderer {
  return new TUIRenderer(options);
}

// ============================================================================
// Simple render() API - mirrors @zen/web
// ============================================================================

/**
 * Render a TUI application.
 *
 * This is the main entry point for TUI apps, mirroring @zen/web's API:
 * - Web: render(component, container)
 * - TUI: render(component)
 *
 * @example
 * ```tsx
 * import { render } from '@zen/tui';
 *
 * // Simple inline app
 * const cleanup = await render(() => <App />);
 *
 * // Fullscreen app
 * const cleanup = await render(() => (
 *   <FullscreenLayout>
 *     <App />
 *   </FullscreenLayout>
 * ));
 *
 * // Cleanup when done
 * cleanup();
 * ```
 */
export async function render(
  createApp: () => unknown,
  options?: TUIRendererOptions,
): Promise<() => void> {
  const renderer = new TUIRenderer(options);
  await renderer.mount(createApp);
  return () => renderer.unmount();
}
