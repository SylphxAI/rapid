/**
 * Untracked execution utility.
 * Allows code to execute without establishing reactive dependencies.
 *
 * ✅ PHASE 1 OPTIMIZATION: Untracked Execution
 * Expected gain: Developer experience improvement
 */

/**
 * Global tracking context.
 * When null, no dependency tracking occurs.
 * @internal
 */
let trackingEnabled = true;

/**
 * Check if dependency tracking is currently enabled.
 * @internal
 */
export function isTracking(): boolean {
  return trackingEnabled;
}

/**
 * Execute a function without tracking dependencies.
 *
 * Useful for:
 * - Logging/debugging inside computed values
 * - Side effects that shouldn't create dependencies
 * - Accessing reactive values without subscribing
 *
 * @example
 * ```typescript
 * const count = zen(0);
 * const log = computed([count], (n) => {
 *   untracked(() => {
 *     console.log(`Count at ${Date.now()}: ${n}`);
 *   });
 *   return n;
 * });
 * ```
 *
 * @param fn Function to execute without tracking
 * @returns The return value of the function
 */
export function untracked<T>(fn: () => T): T {
  const prevTracking = trackingEnabled;
  trackingEnabled = false;
  try {
    return fn();
  } finally {
    trackingEnabled = prevTracking;
  }
}

/**
 * Execute a function with tracking explicitly enabled.
 * Useful for re-enabling tracking after untracked().
 *
 * @example
 * ```typescript
 * untracked(() => {
 *   // Not tracked
 *   tracked(() => {
 *     // This IS tracked
 *   });
 *   // Back to not tracked
 * });
 * ```
 *
 * @param fn Function to execute with tracking
 * @returns The return value of the function
 */
export function tracked<T>(fn: () => T): T {
  const prevTracking = trackingEnabled;
  trackingEnabled = true;
  try {
    return fn();
  } finally {
    trackingEnabled = prevTracking;
  }
}
