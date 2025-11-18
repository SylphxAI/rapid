/**
 * Lifecycle utilities for ZenJS
 *
 * Even though components render once, lifecycle hooks are essential
 * for side effects that depend on DOM insertion.
 *
 * Owner system provides component cleanup tracking similar to SolidJS.
 */

type CleanupFunction = () => void;

/**
 * Owner represents a component's lifecycle context
 * Tracks cleanups to run when component is disposed
 */
type Owner = {
  cleanups: CleanupFunction[];
  disposed: boolean;
};

// Current owner context (set during component rendering)
let currentOwner: Owner | null = null;

// Map DOM nodes to their owners for cleanup tracking
const nodeOwners = new WeakMap<Node, Owner>();

/**
 * Run callback after component is mounted (inserted into DOM)
 *
 * Critical for:
 * - DOM measurements (offsetWidth, getBoundingClientRect)
 * - Third-party library initialization
 * - Focus/scroll operations
 * - Window/document event listeners
 * - Initial data fetching
 *
 * @example
 * ```tsx
 * function Component() {
 *   const ref = signal<HTMLElement | null>(null);
 *
 *   onMount(() => {
 *     console.log(ref.value?.offsetWidth); // Works!
 *     ref.value?.focus();
 *
 *     // Return cleanup function
 *     return () => console.log('Cleanup');
 *   });
 *
 *   return <div ref={(el) => ref.value = el}>Content</div>;
 * }
 * ```
 */
export function onMount(callback: () => undefined | CleanupFunction): void {
  // Use queueMicrotask to ensure DOM is inserted
  queueMicrotask(() => {
    const cleanup = callback();

    // Track cleanup function in current owner
    if (typeof cleanup === 'function' && currentOwner && !currentOwner.disposed) {
      currentOwner.cleanups.push(cleanup);
    }
  });
}

/**
 * Register cleanup function to run when component is removed
 *
 * @example
 * ```tsx
 * function Component() {
 *   onMount(() => {
 *     const handler = () => console.log('resize');
 *     window.addEventListener('resize', handler);
 *
 *     onCleanup(() => {
 *       window.removeEventListener('resize', handler);
 *     });
 *   });
 *
 *   return <div>Content</div>;
 * }
 * ```
 */
export function onCleanup(cleanup: CleanupFunction): void {
  if (currentOwner && !currentOwner.disposed) {
    currentOwner.cleanups.push(cleanup);
  }
}

/**
 * Create effect that runs after mount and cleans up on unmount
 *
 * Similar to React's useEffect, but runs once like Solid's createEffect
 *
 * @example
 * ```tsx
 * function Component() {
 *   const count = signal(0);
 *
 *   createEffect(() => {
 *     console.log('Count:', count.value);
 *
 *     return () => {
 *       console.log('Cleanup for count:', count.value);
 *     };
 *   });
 *
 *   return <button onClick={() => count.value++}>{count.value}</button>;
 * }
 * ```
 */
export function createEffect(effectFn: () => undefined | CleanupFunction): void {
  let cleanup: CleanupFunction | undefined;

  // Run effect after mount
  onMount(() => {
    cleanup = effectFn();

    // Return cleanup to onMount
    return () => {
      if (typeof cleanup === 'function') {
        cleanup();
      }
    };
  });
}

// ============================================================================
// OWNER SYSTEM (Component Lifecycle Management)
// ============================================================================

/**
 * Create a new owner context for a component
 * Owner tracks all cleanups registered during component rendering
 */
export function createOwner(): Owner {
  return {
    cleanups: [],
    disposed: false,
  };
}

/**
 * Set the current owner context
 * Called by jsx-runtime when rendering components
 */
export function setOwner(owner: Owner | null): void {
  currentOwner = owner;
}

/**
 * Get the current owner context
 */
export function getOwner(): Owner | null {
  return currentOwner;
}

/**
 * Dispose an owner, running all registered cleanups
 * Called when a component is removed from the DOM
 */
export function disposeOwner(owner: Owner): void {
  if (owner.disposed) return;

  owner.disposed = true;

  // Run all cleanups in reverse order (LIFO)
  for (let i = owner.cleanups.length - 1; i >= 0; i--) {
    try {
      owner.cleanups[i]();
    } catch (error) {
      console.error('Error in cleanup function:', error);
    }
  }

  owner.cleanups = [];
}

/**
 * Attach a DOM node to an owner for cleanup tracking
 * Called by jsx-runtime after component renders
 */
export function attachNodeToOwner(node: Node, owner: Owner): void {
  nodeOwners.set(node, owner);
}

/**
 * Get the owner for a DOM node
 */
export function getNodeOwner(node: Node): Owner | undefined {
  return nodeOwners.get(node);
}

/**
 * Dispose a DOM node and its owner
 * Called when removing nodes from DOM
 */
export function disposeNode(node: Node): void {
  const owner = nodeOwners.get(node);
  if (owner) {
    disposeOwner(owner);
    nodeOwners.delete(node);
  }
}
