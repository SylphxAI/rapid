/**
 * Experimental: Auto-tracking computed
 * Automatically tracks dependencies when accessing .value
 */

import { computed as manualComputed } from './computed';
import type { AnyZen, ZenWithValue } from './types';

// Global tracking context
let activeComputed: Set<AnyZen> | null = null;

/**
 * Track a zen access during computed execution
 * @internal
 */
export function trackAccess(zen: AnyZen): void {
  if (activeComputed) {
    activeComputed.add(zen);
  }
}

/**
 * Create a computed value with automatic dependency tracking
 *
 * @example
 * ```typescript
 * const a = zen(0);
 * const b = zen(1);
 *
 * // Automatically tracks both a and b
 * const sum = autoComputed(() => a.value + b.value);
 *
 * console.log(sum.value); // 1
 * a.value = 5;
 * console.log(sum.value); // 6
 * ```
 */
export function autoComputed<T>(fn: () => T) {
  // Track dependencies during initial execution
  const deps = new Set<AnyZen>();
  const prevActive = activeComputed;
  activeComputed = deps;

  try {
    // Execute to collect dependencies
    fn();
  } catch (_err) {
    // Ignore errors during tracking phase
  } finally {
    activeComputed = prevActive;
  }

  const depsArray = Array.from(deps);

  if (depsArray.length === 0) {
  }

  // Create regular computed with collected dependencies
  return manualComputed(depsArray, () => {
    // Re-track dependencies on each execution (for conditional deps)
    const newDeps = new Set<AnyZen>();
    const prevActive = activeComputed;
    activeComputed = newDeps;

    try {
      return fn();
    } finally {
      activeComputed = prevActive;

      // TODO: Handle dynamic dependencies (when deps change)
      // For now, we keep original deps
    }
  });
}

/**
 * Wrap zen value getter to enable tracking
 * This needs to be added to Zen's value getter
 *
 * @internal
 */
export function createTrackingGetter<T>(zen: ZenWithValue<T>): T {
  trackAccess(zen as AnyZen);
  return zen._value;
}
