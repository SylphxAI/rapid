/**
 * Render Context for Fine-Grained Updates (ADR-014)
 *
 * This module provides the global context for fine-grained reactivity in the TUI.
 * It enables incremental updates by tracking which nodes are dirty and need re-rendering.
 *
 * ## Architecture Overview
 *
 * ```
 * Signal changes
 *     ↓
 * Effect in jsx-runtime runs
 *     ↓
 * markNodeDirty(node) called
 *     ↓
 * Node added to dirtyNodes Set
 *     ↓
 * scheduleUpdate() queues flush
 *     ↓
 * flushUpdates() renders only dirty nodes
 * ```
 *
 * ## Key Concepts
 *
 * 1. **Content Dirty**: Node's text/children changed, needs buffer update
 * 2. **Layout Dirty**: Node's size/position might change, needs Yoga recompute
 * 3. **Batching**: Multiple signal changes batched into single flush via queueMicrotask
 *
 * ## Performance Benefits
 *
 * - Skip Yoga layout when only content changes (biggest win)
 * - Skip buffer writes for non-dirty nodes
 * - Terminal diff already outputs only changed lines
 */

import type { TUINode } from './types.js';
import type { LayoutMap } from './yoga-layout.js';

// ============================================================================
// Types
// ============================================================================

/**
 * Render context interface - provides all state needed for fine-grained updates
 */
export interface RenderContext {
  /**
   * Map of nodes to their computed layout positions.
   * Used to know where to render each node in the buffer.
   * Updated when layout is recomputed.
   */
  layoutMap: LayoutMap;

  /**
   * Set of nodes that need re-rendering.
   * Populated by markNodeDirty(), cleared after flush.
   */
  dirtyNodes: Set<TUINode>;

  /**
   * Whether layout needs to be recomputed.
   * Set to true on:
   * - Terminal resize
   * - Structural changes (add/remove nodes)
   * - Size-affecting style changes
   *
   * When true, computeLayout() is called and ALL nodes are marked dirty.
   * When false, we reuse cached layout positions (big performance win).
   */
  layoutDirty: boolean;

  /**
   * Schedule a render flush.
   * Called after marking nodes dirty.
   * Uses queueMicrotask to batch multiple updates.
   */
  scheduleUpdate: () => void;

  /**
   * Invalidate layout - called when structure changes.
   * This is expensive, so only call when truly needed.
   */
  invalidateLayout: () => void;
}

// ============================================================================
// Global State
// ============================================================================

/**
 * Global render context instance.
 * Set by unified-render.ts when app starts.
 * Accessed by jsx-runtime.ts when effects update nodes.
 */
let globalRenderContext: RenderContext | null = null;

// ============================================================================
// Context Management
// ============================================================================

/**
 * Set the global render context.
 * Called by unified-render.ts during app initialization.
 *
 * @param context - The render context, or null to clear
 */
export function setRenderContext(context: RenderContext | null): void {
  globalRenderContext = context;
}

/**
 * Get the global render context.
 * Returns null if no app is running.
 */
export function getRenderContext(): RenderContext | null {
  return globalRenderContext;
}

// ============================================================================
// Dirty Tracking API
// ============================================================================

/**
 * Mark a node as dirty (content changed, needs re-render).
 *
 * This is the primary API for fine-grained updates. When a signal changes,
 * the effect in jsx-runtime calls this to mark the affected node.
 *
 * The node will be re-rendered to the buffer on next flush, while non-dirty
 * nodes are skipped (their previous buffer content is preserved).
 *
 * ## Parent Propagation
 *
 * For text nodes nested inside other text nodes (e.g., signal children),
 * we must also mark the parent as dirty. This is because text rendering
 * happens at the parent level - it collects all nested text content and
 * writes it together. If only the nested node is dirty but the parent
 * isn't, the parent skips rendering and the update is lost.
 *
 * @param node - The TUINode that needs re-rendering
 *
 * @example
 * ```typescript
 * // In jsx-runtime handleSignal:
 * effect(() => {
 *   const newValue = String(signal.value);
 *   textNode.children[0] = newValue;
 *   markNodeDirty(textNode);  // Schedule re-render
 * });
 * ```
 */
export function markNodeDirty(node: TUINode): void {
  if (!globalRenderContext) {
    return;
  }

  // Set dirty flag on node itself (for renderer to check)
  node._dirty = true;

  // Add to dirty set (for tracking what needs update)
  globalRenderContext.dirtyNodes.add(node);

  // ============================================================================
  // CRITICAL: Propagate dirty flag to parent for text/fragment nodes
  // ============================================================================
  // Text and fragment nodes are rendered by their parent (the parent collects
  // all nested text content). If a nested node is dirty but its parent isn't,
  // the parent will skip rendering and the update won't appear.
  //
  // We bubble up the dirty flag to ensure the parent re-renders.
  // This applies to:
  // - text nodes (e.g., created by handleSignal for direct signal children)
  // - fragment nodes (e.g., created by handleReactiveFunction for {() => expr})
  if ((node.type === 'text' || node.type === 'fragment') && node.parentNode) {
    let parent = node.parentNode;
    while (parent) {
      // Mark parent as dirty
      parent._dirty = true;
      globalRenderContext.dirtyNodes.add(parent);

      // Stop bubbling at box nodes
      // Box nodes render their own content and children separately
      if (parent.type !== 'text' && parent.type !== 'fragment') {
        break;
      }

      parent = parent.parentNode;
    }
  }

  // Schedule a flush (batched via queueMicrotask)
  globalRenderContext.scheduleUpdate();
}

/**
 * Mark a node as layout-dirty (size/position might change).
 *
 * This is more expensive than content-dirty because it triggers
 * Yoga layout recomputation. Only call when truly needed:
 * - Node added/removed
 * - width/height/flex changes
 * - Text content changes length significantly
 *
 * @param node - The TUINode whose layout changed
 */
export function markLayoutDirty(node: TUINode): void {
  if (!globalRenderContext) return;

  // Set layout dirty flag on node
  node._layoutDirty = true;

  // Mark content dirty too (will need re-render after layout)
  node._dirty = true;
  globalRenderContext.dirtyNodes.add(node);

  // Invalidate global layout (triggers full Yoga recompute)
  globalRenderContext.invalidateLayout();
}

/**
 * Invalidate the entire layout.
 *
 * Called when something changes that affects the whole tree:
 * - Terminal resize
 * - Root structure changes
 *
 * This triggers a full Yoga recompute on next flush.
 */
export function invalidateLayout(): void {
  if (!globalRenderContext) return;
  globalRenderContext.invalidateLayout();
}

/**
 * Check if any nodes are dirty.
 * Used by flush to skip work when nothing changed.
 */
export function hasDirtyNodes(): boolean {
  if (!globalRenderContext) return false;
  return globalRenderContext.dirtyNodes.size > 0 || globalRenderContext.layoutDirty;
}

/**
 * Clear all dirty flags after flush.
 * Called by unified-render.ts after rendering completes.
 */
export function clearDirtyFlags(): void {
  if (!globalRenderContext) return;

  // Clear dirty flag on each node
  for (const node of globalRenderContext.dirtyNodes) {
    node._dirty = false;
    node._layoutDirty = false;
  }

  // Clear the set
  globalRenderContext.dirtyNodes.clear();
}

// ============================================================================
// Legacy API (for backward compatibility)
// ============================================================================

/**
 * Schedule an update for a specific node.
 *
 * @deprecated Use markNodeDirty() instead for clearer semantics.
 * This function is kept for backward compatibility with existing code.
 *
 * @param node - The node that changed
 * @param _content - Unused, kept for API compatibility
 */
export function scheduleNodeUpdate(node: TUINode, _content: string): void {
  markNodeDirty(node);
}
