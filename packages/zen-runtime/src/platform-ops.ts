/**
 * Platform Operations Abstraction
 *
 * Defines platform-agnostic operations for DOM-like manipulation.
 * Each renderer (web, tui, native) implements these operations
 * for their specific platform.
 *
 * This abstraction allows @zen/runtime components to work across
 * all platforms without direct DOM dependencies.
 */

export interface PlatformOps<TNode = any, TMarker = any, TFragment = any> {
  /**
   * Create a marker node to track insertion points
   * Web: document.createComment()
   * TUI: Virtual marker object
   * Native: Placeholder view
   */
  createMarker(name: string): TMarker;

  /**
   * Create a fragment to batch multiple node operations
   * Web: document.createDocumentFragment()
   * TUI: Array of virtual nodes
   * Native: Container view
   */
  createFragment(): TFragment;

  /**
   * Insert a child node before a reference node
   * Web: parentNode.insertBefore(child, ref)
   * TUI: Insert in virtual tree
   * Native: Add subview at index
   */
  insertBefore(parent: TNode, child: TNode | TFragment, reference: TNode | TMarker): void;

  /**
   * Remove a child node from its parent
   * Web: parentNode.removeChild(child)
   * TUI: Remove from virtual tree
   * Native: Remove subview
   */
  removeChild(parent: TNode, child: TNode): void;

  /**
   * Get the parent of a node
   * Web: node.parentNode
   * TUI: node.parentNode from virtual tree
   * Native: view.superview
   */
  getParent(node: TNode | TMarker): TNode | null;

  /**
   * Append child to fragment
   * Web: fragment.appendChild(child)
   * TUI: Push to virtual array
   * Native: Add to container
   */
  appendToFragment(fragment: TFragment, child: TNode): void;
}

/**
 * Current platform operations
 * Set by each renderer during initialization
 */
let currentPlatformOps: PlatformOps | null = null;

/**
 * Set the platform operations for the current environment
 * Called by renderer initialization (@zen/web, @zen/tui, etc.)
 */
export function setPlatformOps(ops: PlatformOps): void {
  currentPlatformOps = ops;
}

/**
 * Get the current platform operations
 * Throws if not initialized (helps catch missing renderer setup)
 */
export function getPlatformOps(): PlatformOps {
  if (!currentPlatformOps) {
    throw new Error(
      'Platform operations not initialized. ' +
        'Import and use a renderer (@zen/web, @zen/tui, or @zen/native) before using components.',
    );
  }
  return currentPlatformOps;
}

/**
 * Check if platform operations are available
 */
export function hasPlatformOps(): boolean {
  return currentPlatformOps !== null;
}
