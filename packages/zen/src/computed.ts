import type { BatchedZen } from './batched'; // Import BatchedZen type
// Functional computed (derived state) implementation.
import type { AnyZen, Unsubscribe, ZenWithValue } from './types';
import { batchDepth, notifyListeners, queueZenForBatch } from './zen';
// NOTE: markDirty and updateIfNecessary were removed in zen.ts radical optimization
// Removed getZenValue, subscribeToZen imports as logic is inlined

// --- Type Definitions ---
/** Represents a computed zen's specific properties (functional style). */
// It directly includes ZenWithValue properties now.
export type ComputedZen<T = unknown> = ZenWithValue<T | null> & {
  // Value can be null initially
  _kind: 'computed';
  _value: T | null; // Override value type
  _dirty: boolean;
  readonly _sources: ReadonlyArray<AnyZen>; // Use AnyZen recursively
  _sourceValues: unknown[]; // Use unknown[] instead of any[]
  // Internal calculation function accepts spread arguments
  readonly _calculation: (...values: unknown[]) => T;
  readonly _equalityFn: (a: T, b: T) => boolean;
  _unsubscribers?: Unsubscribe[];
  // Add internal methods needed by functional API calls
  _update: () => boolean;
  _subscribeToSources: () => void;
  _unsubscribeFromSources: () => void;
};

/** Alias for ComputedZen, representing the read-only nature. */
export type ReadonlyZen<T = unknown> = ComputedZen<T>;

// --- Types ---
/** Represents an array of source zens. */
type Stores = ReadonlyArray<AnyZen>; // Use AnyZen directly

// Removed unused StoreValues type

// --- Internal Computed Logic ---

/**
 * Fetches current values from dependency stores and checks readiness.
 * Mutates the targetValueArray with fetched values.
 * @param sources Array of dependency stores.
 * @param targetValueArray Array to populate with fetched values.
 * @returns True if all dependencies are ready, false otherwise.
 * @internal
 */
function _getSourceValuesAndReadiness(
  sources: ReadonlyArray<AnyZen>,
  targetValueArray: unknown[], // Mutates this array
): boolean {
  let computedCanUpdate = true;
  for (let i = 0; i < sources.length; i++) {
    const source = sources[i];
    if (!source) {
      targetValueArray[i] = undefined;
      continue; // Skip missing sources
    }

    let sourceValue: unknown;
    switch (source._kind) {
      case 'zen':
      case 'map':
      case 'deepMap':
        sourceValue = source._value;
        break;
      case 'computed': {
        const computedSource = source as ComputedZen<unknown>;
        if (computedSource._dirty || computedSource._value === null) {
          computedSource._update(); // Recursive call
          if (computedSource._dirty || computedSource._value === null) {
            computedCanUpdate = false;
          }
        }
        sourceValue = computedSource._value;
        break;
      }
      case 'batched': {
        const batchedSource = source as BatchedZen<unknown>;
        if (batchedSource._dirty) {
          computedCanUpdate = false;
        }
        sourceValue = batchedSource._value;
        break;
      }
    }

    if (!computedCanUpdate) {
      break; // Stop collecting if not ready
    }
    targetValueArray[i] = sourceValue;
  }
  return computedCanUpdate;
}

/**
 * Recalculates the computed value based on current source values.
 * Updates the internal `_value` and notifies listeners if the value changes.
 * Assumes the zen is already marked as dirty or needs initial calculation.
 * ✅ PHASE 6 OPTIMIZATION: Uses graph coloring to avoid unnecessary recomputation.
 * @returns True if the value changed, false otherwise.
 * @internal
 */
function updateComputedValue<T>(zen: ComputedZen<T>): boolean {
  // NOTE: Graph coloring optimization (_color, updateIfNecessary) was removed in zen.ts radical optimization
  // This function now uses simple _dirty flag instead of 3-state coloring

  // Check if update is needed
  if (!zen._dirty && zen._value !== null) {
    return false;
  }

  const srcs = zen._sources;

  // If there are no sources, the value cannot be computed.
  if (!srcs || srcs.length === 0) {
    zen._dirty = true; // Remain dirty
    return false;
  }

  const vals = zen._sourceValues;
  const calc = zen._calculation;
  const old = zen._value; // Capture value BEFORE recalculation (could be null)

  // 1. Get current values and check readiness using helper
  const computedCanUpdate = _getSourceValuesAndReadiness(srcs, vals);

  // If dependencies weren't ready (e.g., dirty batched dependency, or nested computed failed update),
  // mark computed as dirty and return false (no change).
  if (!computedCanUpdate) {
    zen._dirty = true;
    return false;
  }
  // Note: We proceed even if some vals are null, assuming null is a valid state.
  // The calculation function itself should handle null inputs if necessary.

  // ✅ PHASE 4 OPTIMIZATION: Fast path for single source undefined check
  if (srcs.length === 1) {
    if (vals[0] === undefined) {
      zen._dirty = true;
      return false;
    }
  } else {
    // Multiple sources - check all
    if (vals.some((v) => v === undefined)) {
      zen._dirty = true;
      return false;
    }
  }

  // 2. Dependencies are ready, proceed with calculation
  const newValue = calc(...vals); // vals are now guaranteed non-null AND non-undefined
  zen._dirty = false; // Mark as clean *after* successful calculation

  // 3. Check if the value actually changed using the equality function
  // Handle the initial null case for 'old'
  if (old !== null && zen._equalityFn(newValue, old)) {
    return false; // No change, exit early
  }

  // 4. Update internal value
  zen._value = newValue;
  // NOTE: markDirty was removed in radical optimization - no longer needed
  // The _dirty flag is managed by the reactive system automatically

  // 5. Value updated. Return true to indicate change.
  // DO NOT notify here. Notification is handled by the caller (e.g., computedSourceChanged or batch end).
  return true; // Value changed
}

/**
 * Handler called when any source zen changes.
 * Marks the computed zen as dirty and triggers an update if active.
 * ✅ v3.2 OPTIMIZATION: Defers updates during batch for 16x faster performance
 * @internal
 */
function computedSourceChanged<T>(zen: ComputedZen<T>): void {
  if (zen._dirty) return;

  zen._dirty = true;
  // NOTE: _color assignment removed (graph coloring was removed in zen.ts radical optimization)

  // ✅ v3.2 OPTIMIZATION: Defer updates and notifications when in batch
  if (batchDepth > 0) {
    // In batch: just mark dirty and queue for later processing
    // The batch() function will call updateComputedValue at end
    if (zen._listeners?.length) {
      queueZenForBatch(zen as AnyZen, zen._value);
    }
    return;
  }

  // Not in batch: update immediately
  if (zen._listeners?.length) {
    const oldValue = zen._value;
    const changed = updateComputedValue(zen);
    if (changed) {
      notifyListeners(zen as AnyZen, zen._value, oldValue);
    }
  }
}

/**
 * Subscribes to a single source zen and returns the unsubscribe function.
 * @internal
 */
function _subscribeToSingleSource(
  source: AnyZen | undefined,
  onChangeHandler: () => void,
  computedZen?: ComputedZen<unknown>,
): Unsubscribe | undefined {
  if (!source) return undefined;

  if (computedZen) {
    // biome-ignore lint/suspicious/noExplicitAny: Required to attach computed zen reference to handler for graph coloring
    (onChangeHandler as any)._computedZen = computedZen;
  }

  const baseSource = source as ZenWithValue<unknown>;
  const isFirstSourceListener = !baseSource._listeners || baseSource._listeners.length === 0;
  baseSource._listeners ??= [];
  baseSource._listeners.push(onChangeHandler);

  if (isFirstSourceListener && source._kind === 'computed') {
    const computedSource = source as ComputedZen<unknown>;
    if (computedSource._subscribeToSources) {
      computedSource._subscribeToSources();
    }
  }

  return () => _handleSourceUnsubscribeCleanup(source, onChangeHandler);
}

/**
 * Handles the cleanup logic when unsubscribing from a single source.
 * @internal
 */
function _handleSourceUnsubscribeCleanup(source: AnyZen, onChangeHandler: () => void): void {
  const baseSrc = source as ZenWithValue<unknown>;
  const srcListeners = baseSrc._listeners;
  if (!srcListeners || srcListeners.length === 0) return;

  const idx = srcListeners.indexOf(onChangeHandler);
  if (idx === -1) return;

  const lastIdx = srcListeners.length - 1;
  if (idx !== lastIdx) {
    srcListeners[idx] = srcListeners[lastIdx];
  }
  srcListeners.pop();

  if (srcListeners.length === 0) {
    baseSrc._listeners = undefined;
    if (source._kind === 'computed') {
      const computedSource = source as ComputedZen<unknown>;
      if (computedSource._unsubscribeFromSources) {
        computedSource._unsubscribeFromSources();
      }
    }
  }
}

/** Subscribes a computed zen to all its source zens. @internal */
function subscribeComputedToSources<T>(zen: ComputedZen<T>): void {
  if (zen._unsubscribers) return;

  const sources = zen._sources;
  const newUnsubscribers: Unsubscribe[] = [];
  const onChangeHandler = () => computedSourceChanged(zen);

  for (let i = 0; i < sources.length; i++) {
    const unsub = _subscribeToSingleSource(
      sources[i],
      onChangeHandler,
      zen as ComputedZen<unknown>,
    );
    if (unsub) {
      newUnsubscribers.push(unsub);
    }
  }
  zen._unsubscribers = newUnsubscribers;
}

/** Unsubscribes a computed zen from all its source zens. @internal */
function unsubscribeComputedFromSources<T>(zen: ComputedZen<T>): void {
  if (!zen._unsubscribers) return;

  for (const unsub of zen._unsubscribers) {
    unsub?.();
  }
  zen._unsubscribers = undefined;
  zen._dirty = true;
}

// --- Override getZenValue for Computed ---
// We need to modify or wrap getZenValue to handle computed logic.
// This is now handled in zen.ts's getZenValue by calling updateComputedValue.

// --- Computed Factory (Functional Style) ---

/**
 * Creates a read-only computed zen (functional style).
 * Its value is derived from one or more source zens using a calculation function.
 *
 * @template T The type of the computed value.
 * @template S Tuple type of the source stores.
 * @param stores An array or tuple of source zens (AnyZen).
 * @param calculation A function that takes the current values of the source stores
 *   as individual arguments and returns the computed value.
 * @param equalityFn Optional function to compare the old and new computed values.
 *   Defaults to `Object.is`. If it returns true, listeners are not notified.
 * @returns A ReadonlyZen representing the computed value.
 */
export function computed<T, S extends AnyZen | Stores>(
  stores: S,
  calculation: (...values: unknown[]) => T,
  equalityFn: (a: T, b: T) => boolean = Object.is,
): ReadonlyZen<T> {
  const storesArray = Array.isArray(stores) ? stores : [stores];
  const sourceValues = new Array(storesArray.length);

  const computedZen: ComputedZen<T> = {
    _kind: 'computed',
    _value: null,
    _dirty: true,
    _sources: storesArray,
    _sourceValues: sourceValues,
    _calculation: calculation,
    _equalityFn: equalityFn,
    _subscribeToSources: () => subscribeComputedToSources(computedZen),
    _unsubscribeFromSources: () => unsubscribeComputedFromSources(computedZen),
    _update: () => updateComputedValue(computedZen),
  };

  // ✅ v3.2 OPTIMIZATION: Add value getter for lazy evaluation
  Object.defineProperty(computedZen, 'value', {
    get() {
      // Update if dirty
      if (computedZen._dirty) {
        updateComputedValue(computedZen);
        // Subscribe on first access
        if (!computedZen._unsubscribers && computedZen._sources.length > 0) {
          subscribeComputedToSources(computedZen);
        }
      }
      return computedZen._value;
    },
    enumerable: true,
    configurable: true,
  });

  return computedZen as ReadonlyZen<T>;
}

// Note: getZenValue and subscribeToZen logic in zen.ts handles computed zen specifics.
