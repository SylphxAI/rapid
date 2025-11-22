/**
 * ZenJS ErrorBoundary Component
 *
 * Catch and handle errors in component tree
 *
 * Platform-agnostic implementation using marker pattern.
 *
 * Features:
 * - Catch render errors
 * - Display fallback UI
 * - Error recovery
 */

import { effect, signal, untrack } from '@zen/signal';
import { disposeNode, onCleanup } from '@zen/signal';
import { getPlatformOps } from '../platform-ops.js';
import { children } from '../utils/children.js';

interface ErrorBoundaryProps {
  fallback: (error: Error, reset: () => void) => unknown;
  children: unknown;
}

/**
 * ErrorBoundary component - Catch errors in component tree
 *
 * @example
 * <ErrorBoundary fallback={(error, reset) => (
 *   <div>
 *     <h1>Error: {error.message}</h1>
 *     <button onClick={reset}>Retry</button>
 *   </div>
 * )}>
 *   <App />
 * </ErrorBoundary>
 */
export function ErrorBoundary(props: ErrorBoundaryProps): unknown {
  // Use children() helper to lazily resolve props
  const c = children(() => props.children);

  // Get platform operations
  const ops = getPlatformOps();

  // Anchor to mark position
  const marker = ops.createMarker('error-boundary');

  // Track current node and error state
  let currentNode: Node | null = null;
  const error = signal<Error | null>(null);
  let errorHandler: ((event: ErrorEvent) => void) | undefined;

  const reset = () => {
    error.value = null;
  };

  // ARCHITECTURE: Effects are immediate sync (not deferred)
  // Parent check happens inside effect - if no parent yet, insertBefore is no-op
  const dispose = effect(() => {
    const err = error.value;

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
    try {
      if (err) {
        // Show error fallback
        currentNode = untrack(() => props.fallback(err, reset));
      } else {
        // Show children
        currentNode = untrack(() => c());
      }
    } catch (renderError) {
      // Caught error during render
      error.value = renderError as Error;
      // Retry render with error state
      currentNode = untrack(() => props.fallback(renderError as Error, reset));
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

  // Global error handler (optional - catches async errors)
  if (typeof window !== 'undefined') {
    errorHandler = (event: ErrorEvent) => {
      const parent = ops.getParent(marker);
      if (parent && (parent as any).contains && (parent as any).contains(event.target)) {
        event.preventDefault();
        error.value = event.error;
      }
    };

    window.addEventListener('error', errorHandler);
  }

  // Register cleanup via owner system
  onCleanup(() => {
    if (errorHandler && typeof window !== 'undefined') {
      window.removeEventListener('error', errorHandler);
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
