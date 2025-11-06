import type { AnyZen, Unsubscribe, ZenValue } from './types';
import { subscribe } from './zen'; // Use core subscribe
// Removed unused get import

/**
 * Subscribes to multiple stores and runs a callback function when any of them change.
 * The callback receives the current values of the stores as arguments.
 * If the callback returns a function, it will be treated as a cleanup function
 * and executed before the next callback run or when the effect is cancelled.
 *
 * @param stores An array of stores to subscribe to.
 * @param callback The function to run on changes. It receives store values as arguments.
 * @returns A function to cancel the effect and unsubscribe from all stores.
 */
export function effect<Stores extends AnyZen[]>(
  stores: [...Stores],
  callback: (...values: { [K in keyof Stores]: ZenValue<Stores[K]> }) => undefined | (() => void),
): Unsubscribe {
  let lastCleanup: undefined | (() => void);
  let isCancelled = false;
  let initialRun = true; // Flag to track the first execution
  let setupComplete = false; // Flag to prevent running callback during setup
  // ✅ PHASE 5 OPTIMIZATION: Pre-allocate array for values to reduce allocations
  const currentValues = new Array(stores.length);

  // Function to run the callback and handle cleanup
  const runCallback = () => {
    // If cancelled, or if called during the setup phase, do nothing
    if (isCancelled || !setupComplete) {
      return;
    }

    // Run previous cleanup *before* getting new values, only if it's not the initial run
    if (!initialRun && typeof lastCleanup === 'function') {
      try {
        lastCleanup();
      } catch (_error) {}
      lastCleanup = undefined; // Reset cleanup after running
    }

    // ✅ PHASE 5 OPTIMIZATION: Reuse pre-allocated array + cache length
    const len = stores.length;

    // Fast path for single store (most common case)
    if (len === 1) {
      const s = stores[0];
      switch (s._kind) {
        case 'computed': {
          const computed = s as import('./computed').ComputedZen<unknown>;
          if (computed._dirty || computed._value === null) {
            computed._update();
          }
          currentValues[0] = computed._value;
          break;
        }
        case 'batched':
          currentValues[0] = s._value;
          break;
        case 'zen':
        case 'map':
        case 'deepMap':
        case 'karma':
          currentValues[0] = s._value;
          break;
        default:
          currentValues[0] = null;
      }
    } else {
      // Multiple stores - populate array
      for (let i = 0; i < len; i++) {
        const s = stores[i];
        switch (s._kind) {
          case 'computed': {
            const computed = s as import('./computed').ComputedZen<unknown>;
            if (computed._dirty || computed._value === null) {
              computed._update();
            }
            currentValues[i] = computed._value;
            break;
          }
          case 'batched':
            currentValues[i] = s._value;
            break;
          case 'zen':
          case 'map':
          case 'deepMap':
          case 'karma':
            currentValues[i] = s._value;
            break;
          default:
            currentValues[i] = null;
        }
      }
    }

    // ✅ PHASE 5: Fast path for single store dependency check
    const dependenciesReady =
      len === 1 ? currentValues[0] !== null : !currentValues.some((v) => v === null);

    if (dependenciesReady) {
      // All values are non-null, proceed.
      try {
        // Run the main callback and store the new cleanup function
        // Cast needed as values were checked for null above.
        // biome-ignore lint/suspicious/noExplicitAny: Spread arguments require any here
        lastCleanup = callback(...(currentValues as any)); // Cast needed for spread arguments
      } catch (_error) {
        lastCleanup = undefined; // Reset cleanup on error
      }
    }
    // If dependencies are not ready, we simply don't run the callback or cleanup yet.
    // The effect will re-run when a dependency changes to a non-null value.

    // Mark initial run as done AFTER the first successful execution
    initialRun = false;
  };

  // Subscribe to all stores. Pass the unmodified runCallback.
  // The initial synchronous call from subscribe will be ignored due to setupComplete flag.
  const unsubscribers = stores.map((store) => subscribe(store as AnyZen, runCallback));

  // Mark setup as complete AFTER all subscriptions are done
  setupComplete = true;

  // Manually trigger the first run AFTER setup is complete
  runCallback();

  // Return the final cleanup function
  return () => {
    if (isCancelled) return;
    isCancelled = true;

    // Run final cleanup
    if (typeof lastCleanup === 'function') {
      try {
        lastCleanup();
      } catch (_error) {}
    }

    // Unsubscribe from all stores
    for (const unsub of unsubscribers) {
      unsub();
    }
  };
}
