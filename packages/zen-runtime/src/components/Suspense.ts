/**
 * Suspense - Loading boundary for async components
 *
 * Shows fallback UI while lazy components are loading.
 * Works with lazy() for code splitting.
 *
 * Platform-agnostic implementation using marker pattern.
 *
 * @example
 * ```tsx
 * const Heavy = lazy(() => import('./Heavy'));
 *
 * <Suspense fallback={<div>Loading...</div>}>
 *   <Heavy />
 *   <AnotherLazy />
 * </Suspense>
 * ```
 */

import { effect, signal, untrack } from '@zen/signal';
import { disposeNode, onCleanup } from '@zen/signal';
import { getPlatformOps } from '../platform-ops.js';
import { children } from '../utils/children.js';

interface SuspenseProps {
  fallback: unknown;
  children: unknown;
}

/**
 * Check if a node is a lazy loading placeholder
 */
function isLazyLoading(node: any): boolean {
  return node && node.nodeType === 8 && (node as any)._zenLazyLoading === true;
}

/**
 * Check if node tree contains any loading placeholders
 */
function hasLoadingChildren(node: any): boolean {
  // Check if this node itself is loading
  if (isLazyLoading(node)) {
    return true;
  }

  // Check child nodes recursively
  if (node?.hasChildNodes?.()) {
    for (const child of Array.from(node.childNodes as any[])) {
      if (hasLoadingChildren(child)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Suspense component
 */
export function Suspense(props: SuspenseProps): any {
  // Use children() helper to lazily resolve props
  const c = children(() => props.children);
  const f = children(() => props.fallback);

  // Get platform operations
  const ops = getPlatformOps();

  // Anchor to mark position
  const marker = ops.createMarker('suspense');

  // Track current node and loading state
  let currentNode: any = null;
  const isLoading = signal(false);
  let intervalId: ReturnType<typeof setInterval> | undefined;

  // Function to check and update loading state
  const checkLoading = () => {
    if (!currentNode) return;

    const loading = hasLoadingChildren(currentNode);

    if (loading !== isLoading.value) {
      isLoading.value = loading;
    }
  };

  // ARCHITECTURE: Effects are immediate sync (not deferred)
  // Parent check happens inside effect - if no parent yet, insertBefore is no-op
  const dispose = effect(() => {
    const loading = isLoading.value;

    // Cleanup previous node
    if (currentNode) {
      const parent = ops.getParent(marker);
      if (parent) {
        ops.removeChild(parent, currentNode);
      }
      disposeNode(currentNode);
      currentNode = null;
    }

    // Render appropriate content
    if (loading) {
      // Show fallback
      currentNode = untrack(() => {
        const fb = f();
        return fb;
      });
    } else {
      // Show children
      currentNode = untrack(() => {
        const child = c();
        return child;
      });
    }

    // Insert into tree
    if (currentNode) {
      const parent = ops.getParent(marker);
      if (parent) {
        ops.insertBefore(parent, currentNode, marker);
      }
    }

    return undefined;
  });

  // Initial render with children
  isLoading.value = false;

  // Poll for loading state changes
  // (Lazy components update their loading state asynchronously)
  intervalId = setInterval(checkLoading, 16); // ~60fps

  // Register cleanup via owner system
  onCleanup(() => {
    if (intervalId) {
      clearInterval(intervalId);
    }
    dispose();
    if (currentNode) {
      const parent = ops.getParent(marker);
      if (parent) {
        ops.removeChild(parent, currentNode);
      }
      disposeNode(currentNode);
    }
  });

  return marker;
}
