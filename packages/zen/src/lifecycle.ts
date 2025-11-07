/**
 * Enhanced lifecycle management with cleanup support.
 *
 * ✅ PHASE 1 OPTIMIZATION: Effect Cleanup API
 * Expected gain: Prevent resource leaks, better lifecycle management
 */

import type { AnyZen, ZenWithValue } from './types';

/**
 * Cleanup function type.
 */
export type CleanupFn = () => void;

/**
 * Lifecycle callback with optional cleanup return.
 */
export type LifecycleCallback = () => undefined | CleanupFn;

/**
 * Storage for cleanup functions.
 * @internal
 */
const cleanupMap = new WeakMap<AnyZen, Map<Function, CleanupFn>>();

/**
 * Register a cleanup function for a lifecycle callback.
 * @internal
 */
function registerCleanup(zen: AnyZen, callback: Function, cleanup: CleanupFn): void {
  if (!cleanupMap.has(zen)) {
    cleanupMap.set(zen, new Map());
  }
  cleanupMap.get(zen)?.set(callback, cleanup);
}

/**
 * Run cleanup for a specific callback.
 * @internal
 */
function runCleanup(zen: AnyZen, callback: Function): void {
  const cleanups = cleanupMap.get(zen);
  if (!cleanups) return;

  const cleanup = cleanups.get(callback);
  if (cleanup) {
    cleanup();
    cleanups.delete(callback);
  }
}

/**
 * Run all cleanups for a zen.
 * @internal
 */
function runAllCleanups(zen: AnyZen): void {
  const cleanups = cleanupMap.get(zen);
  if (!cleanups) return;

  for (const cleanup of cleanups.values()) {
    cleanup();
  }
  cleanups.clear();
}

/**
 * Enhanced onMount with cleanup support.
 *
 * The callback can return a cleanup function that will be called when:
 * - The zen is garbage collected
 * - A new onMount callback replaces it
 *
 * @example
 * ```typescript
 * onMount(zen, () => {
 *   const interval = setInterval(() => {
 *     console.log('tick');
 *   }, 1000);
 *
 *   // Cleanup: stop interval
 *   return () => clearInterval(interval);
 * });
 * ```
 *
 * @param zen The zen to attach lifecycle to
 * @param callback Callback to run on mount, optionally returns cleanup
 * @returns Unsubscribe function
 */
export function onMount(zen: AnyZen, callback: LifecycleCallback): () => void {
  const baseZen = zen as ZenWithValue<unknown>;

  // Initialize mount listeners array
  baseZen._mountListeners ??= [];

  // Run callback immediately
  const cleanup = callback();

  // Register cleanup if provided
  if (cleanup) {
    registerCleanup(zen, callback, cleanup);
  }

  // Add to mount listeners
  baseZen._mountListeners.push(callback);

  // Return unsubscribe function
  return () => {
    runCleanup(zen, callback);

    const listeners = baseZen._mountListeners;
    if (!listeners) return;

    const idx = listeners.indexOf(callback);
    if (idx === -1) return;

    // Swap-remove
    const lastIdx = listeners.length - 1;
    if (idx !== lastIdx) {
      listeners[idx] = listeners[lastIdx];
    }
    listeners.pop();

    // Clean up array if empty
    if (listeners.length === 0) {
      baseZen._mountListeners = undefined;
    }
  };
}

/**
 * Enhanced onStart with cleanup support.
 *
 * Called when the first listener subscribes.
 * Cleanup called when last listener unsubscribes.
 *
 * @example
 * ```typescript
 * onStart(zen, () => {
 *   console.log('First subscriber');
 *   const conn = connectToServer();
 *
 *   return () => {
 *     console.log('Last subscriber left');
 *     conn.disconnect();
 *   };
 * });
 * ```
 *
 * @param zen The zen to attach lifecycle to
 * @param callback Callback to run on start, optionally returns cleanup
 * @returns Unsubscribe function
 */
export function onStart(zen: AnyZen, callback: LifecycleCallback): () => void {
  const baseZen = zen as ZenWithValue<unknown>;

  baseZen._startListeners ??= [];
  baseZen._startListeners.push(callback);

  return () => {
    runCleanup(zen, callback);

    const listeners = baseZen._startListeners;
    if (!listeners) return;

    const idx = listeners.indexOf(callback);
    if (idx === -1) return;

    const lastIdx = listeners.length - 1;
    if (idx !== lastIdx) {
      listeners[idx] = listeners[lastIdx];
    }
    listeners.pop();

    if (listeners.length === 0) {
      baseZen._startListeners = undefined;
    }
  };
}

/**
 * Enhanced onStop with cleanup support.
 *
 * Called when the last listener unsubscribes.
 *
 * @example
 * ```typescript
 * onStop(zen, () => {
 *   console.log('No more subscribers');
 *   return () => console.log('Cleanup');
 * });
 * ```
 *
 * @param zen The zen to attach lifecycle to
 * @param callback Callback to run on stop, optionally returns cleanup
 * @returns Unsubscribe function
 */
export function onStop(zen: AnyZen, callback: LifecycleCallback): () => void {
  const baseZen = zen as ZenWithValue<unknown>;

  baseZen._stopListeners ??= [];
  baseZen._stopListeners.push(callback);

  return () => {
    runCleanup(zen, callback);

    const listeners = baseZen._stopListeners;
    if (!listeners) return;

    const idx = listeners.indexOf(callback);
    if (idx === -1) return;

    const lastIdx = listeners.length - 1;
    if (idx !== lastIdx) {
      listeners[idx] = listeners[lastIdx];
    }
    listeners.pop();

    if (listeners.length === 0) {
      baseZen._stopListeners = undefined;
    }
  };
}

/**
 * Manually run all cleanups for a zen.
 * Useful for testing or manual cleanup.
 *
 * @param zen The zen to cleanup
 */
export function cleanup(zen: AnyZen): void {
  runAllCleanups(zen);
}
