import type { BatchedZen } from './batched';
import type { ComputedZen } from './computed';
import type { SelectZen } from './types';
import type {
  AnyZen,
  DeepMapZen,
  KarmaState,
  KarmaZen,
  Listener,
  MapZen,
  Unsubscribe,
  ZenValue,
  ZenWithValue,
} from './types';

// Batching Internals
/** Tracks the nesting depth of batch calls. @internal */
export let batchDepth = 0;
/** Stores zens that have changed within the current batch, along with their original value. */
const batchQueue = new Map<ZenOptimized<unknown>, unknown>();

// ✅ BIND OPTIMIZATION: Graph Coloring Algorithm (inherited from Phase 6)

/**
 * Phase 1 (Down): Mark node as RED and dependents as GREEN
 * ✅ OPTIMIZED: Loop unrolling for 1-3 listeners (1.2x faster)
 * @internal
 */
export function markDirty<A extends AnyZen>(zen: A): void {
  const baseZen = zen as ZenWithValue<ZenValue<A>>;
  baseZen._color = 2; // RED - definitely dirty

  const listeners = baseZen._listeners;
  if (!listeners) return;

  const len = listeners.length;

  // ✅ OPTIMIZATION: Unroll first 3 cases to avoid loop overhead
  if (len === 1) {
    const listener = listeners[0] as any;
    const listenerZen = listener._computedZen || listener;
    if (listenerZen._color !== undefined && listenerZen._color === 0) {
      listenerZen._color = 1;
    }
  } else if (len === 2) {
    let listener = listeners[0] as any;
    let listenerZen = listener._computedZen || listener;
    if (listenerZen._color !== undefined && listenerZen._color === 0) {
      listenerZen._color = 1;
    }

    listener = listeners[1] as any;
    listenerZen = listener._computedZen || listener;
    if (listenerZen._color !== undefined && listenerZen._color === 0) {
      listenerZen._color = 1;
    }
  } else if (len === 3) {
    let listener = listeners[0] as any;
    let listenerZen = listener._computedZen || listener;
    if (listenerZen._color !== undefined && listenerZen._color === 0) {
      listenerZen._color = 1;
    }

    listener = listeners[1] as any;
    listenerZen = listener._computedZen || listener;
    if (listenerZen._color !== undefined && listenerZen._color === 0) {
      listenerZen._color = 1;
    }

    listener = listeners[2] as any;
    listenerZen = listener._computedZen || listener;
    if (listenerZen._color !== undefined && listenerZen._color === 0) {
      listenerZen._color = 1;
    }
  } else {
    // 4+ listeners - use loop
    for (let i = 0; i < len; i++) {
      const listener = listeners[i] as any;
      const listenerZen = listener._computedZen || listener;
      if (listenerZen._color !== undefined && listenerZen._color === 0) {
        listenerZen._color = 1;
      }
    }
  }
}

/**
 * Phase 2 (Up): Check if update is actually needed
 * @internal
 */
export function updateIfNecessary<A extends AnyZen>(zen: A): boolean {
  const baseZen = zen as ZenWithValue<ZenValue<A>>;

  // CLEAN - no update needed
  if (baseZen._color === 0) {
    return false;
  }

  // For computed/select nodes, delegate to their _update method
  if ((zen._kind === 'computed' || zen._kind === 'select') && '_update' in zen) {
    return (zen as any)._update();
  }

  // For simple zens, just mark clean
  baseZen._color = 0;
  return false;
}

// Internal notifyListeners function
/**
 * Notifies all listeners of a zen about a value change.
 * @internal - Exported for use by other modules like computed, deepMap.
 */
export function notifyListeners<A extends AnyZen>(
  zen: A,
  value: ZenValue<A>,
  oldValue?: ZenValue<A>,
): void {
  const baseZen = zen as ZenWithValue<ZenValue<A>>;

  // Notify regular value listeners
  const ls = baseZen._listeners;
  if (ls) {
    const len = ls.length;
    if (len === 1) {
      ls[0](value, oldValue);
    } else if (len > 1) {
      for (let i = 0; i < len; i++) {
        ls[i](value, oldValue);
      }
    }
  }

  // Notify onNotify listeners AFTER value listeners
  const notifyLs = baseZen._notifyListeners;
  if (notifyLs) {
    const len = notifyLs.length;
    if (len === 1) {
      notifyLs[0](value);
    } else if (len > 1) {
      for (let i = 0; i < len; i++) {
        notifyLs[i](value);
      }
    }
  }
}

/** Represents a writable zen (optimized with bind). */
export type ZenOptimized<T = unknown> = ZenWithValue<T> & {
  _value: T;
};

// ============================================================================
// ✅ OPTIMIZED API - 使用閉包（最佳性能）
// ============================================================================
// 根據 benchmark 結果：
// - 閉包在批量操作中快 1.21x
// - 閉包在更新 100 個信號時快 1.19x
// - 創建速度與 bind 相近
// - 綜合性能最優
// ============================================================================

/**
 * Creates a new writable zen instance with optimized closure-based API.
 *
 * ✅ OPTIMIZED: Reduced memory allocation - merged wrapper and data object
 * @param initialValue The initial value of the zen instance.
 * @returns An object with get() and set() methods using closures for best performance.
 */
export function zen<T>(initialValue: T): {
  get: () => T;
  set: (value: T, force?: boolean) => void;
  _zenData: ZenOptimized<T>;
} {
  // ✅ OPTIMIZATION: Create data object first
  const zenData: ZenOptimized<T> = {
    _kind: 'zen',
    _value: initialValue,
  };

  // ✅ Closure-based get/set (fastest for batch operations)
  const get = (): T => zenData._value;

  const set = (value: T, force = false): void => {
    const oldValue = zenData._value;
    if (force || !Object.is(value, oldValue)) {
      // Handle onSet listeners
      if (batchDepth <= 0) {
        const setLs = zenData._setListeners;
        if (setLs) {
          const len = setLs.length;
          if (len === 1) {
            setLs[0](value);
          } else if (len > 1) {
            for (let i = 0; i < len; i++) {
              setLs[i](value);
            }
          }
        }
      }

      // Update value
      zenData._value = value;
      // Mark as RED and propagate GREEN to dependents
      markDirty(zenData as AnyZen);

      // Handle batching or immediate notification
      if (batchDepth > 0) {
        queueZenForBatch(zenData, oldValue);
      } else {
        notifyListeners(zenData as AnyZen, value, oldValue);
      }
    }
  };

  // ✅ OPTIMIZATION: Reuse zenData as result object to save one allocation
  // Cast to any to allow property addition
  const result: any = zenData;
  result.get = get;
  result.set = set;
  result._zenData = zenData;

  return result;
}

// ============================================================================
// Backward Compatibility: Functional API
// ============================================================================

/**
 * Gets the current value of a zen. Provides specific return types based on zen kind.
 * @param zen The zen to read from.
 * @returns The current value.
 */
export function get<T>(zen: ZenOptimized<T>): T;
export function get<T>(zen: ComputedZen<T>): T | null;
export function get<T>(zen: SelectZen<T>): T | null;
export function get<T extends object>(zen: MapZen<T>): T;
export function get<T extends object>(zen: DeepMapZen<T>): T;
export function get<T>(zen: KarmaZen<T>): KarmaState<T>;
export function get<A extends AnyZen>(zen: A): ZenValue<A> | null {
  updateIfNecessary(zen);

  switch (zen._kind) {
    case 'zen':
    case 'map':
    case 'deepMap':
    case 'zenAsync':
    case 'karma':
      return zen._value as ZenValue<A>;
    case 'computed': {
      const computed = zen as ComputedZen<ZenValue<A>>;
      return computed._value as ZenValue<A> | null;
    }
    case 'select': {
      const select = zen as SelectZen<ZenValue<A>>;
      return select._value as ZenValue<A> | null;
    }
    case 'batched': {
      const batched = zen as BatchedZen<ZenValue<A>>;
      return batched._value as ZenValue<A> | null;
    }
    default: {
      const _exhaustiveCheck: never = zen as never;
      return null;
    }
  }
}

/**
 * Sets the value of a writable zen. Notifies listeners immediately.
 * @param zen The zen to write to.
 * @param value The new value.
 * @param force If true, notify listeners even if the value is the same.
 */
export function set<T>(zen: ZenOptimized<T>, value: T, force = false): void {
  const oldValue = zen._value;
  if (force || !Object.is(value, oldValue)) {
    if (batchDepth <= 0) {
      const setLs = zen._setListeners;
      if (setLs) {
        const len = setLs.length;
        if (len === 1) {
          setLs[0](value);
        } else if (len > 1) {
          for (let i = 0; i < len; i++) {
            setLs[i](value);
          }
        }
      }
    }

    zen._value = value;
    markDirty(zen as AnyZen);

    if (batchDepth > 0) {
      queueZenForBatch(zen, oldValue);
    } else {
      notifyListeners(zen as AnyZen, value, oldValue);
    }
  }
}

/**
 * Subscribes a listener function to a zen's changes.
 * Calls the listener immediately with the current value.
 * Returns an unsubscribe function.
 * @param zen The zen to subscribe to.
 * @param listener The function to call on value changes.
 * @returns A function to unsubscribe the listener.
 */
/** @internal */
function _handleFirstSubscription<A extends AnyZen>(
  zen: A,
  baseZen: ZenWithValue<ZenValue<A>>,
): void {
  const mountLs = baseZen._mountListeners;
  if (mountLs?.length) {
    baseZen._mountCleanups ??= new Map();
    for (let i = 0; i < mountLs.length; i++) {
      const cleanup = mountLs[i]();
      if (typeof cleanup === 'function') {
        baseZen._mountCleanups.set(mountLs[i], cleanup);
      } else {
        baseZen._mountCleanups.set(mountLs[i], undefined);
      }
    }
  }

  const startLs = baseZen._startListeners;
  if (startLs?.length) {
    const currentValue = get(zen as any);
    for (let i = 0; i < startLs.length; i++) {
      startLs[i](currentValue);
    }
  }

  if (zen._kind === 'computed' || zen._kind === 'select' || zen._kind === 'batched') {
    const dependentZen = zen as
      | ComputedZen<ZenValue<A>>
      | SelectZen<ZenValue<A>>
      | BatchedZen<ZenValue<A>>;
    if (
      typeof dependentZen._subscribeToSources === 'function' ||
      typeof (dependentZen as SelectZen<ZenValue<A>>)._subscribeToSource === 'function'
    ) {
      if ('_subscribeToSources' in dependentZen) {
        dependentZen._subscribeToSources();
      } else if ('_subscribeToSource' in dependentZen) {
        (dependentZen as SelectZen<ZenValue<A>>)._subscribeToSource();
      }
    }
  }
}

/** @internal */
function _handleLastUnsubscribe<A extends AnyZen>(
  zen: A,
  baseZen: ZenWithValue<ZenValue<A>>,
): void {
  baseZen._listeners = undefined;

  const stopLs = baseZen._stopListeners;
  if (stopLs?.length) {
    for (let i = 0; i < stopLs.length; i++) {
      stopLs[i]();
    }
  }

  const cleanups = baseZen._mountCleanups;
  if (cleanups?.size) {
    for (const cleanupFn of cleanups.values()) {
      if (typeof cleanupFn === 'function') {
        cleanupFn();
      }
    }
    baseZen._mountCleanups = undefined;
  }

  if (zen._kind === 'computed' || zen._kind === 'select' || zen._kind === 'batched') {
    const dependentZen = zen as
      | ComputedZen<ZenValue<A>>
      | SelectZen<ZenValue<A>>
      | BatchedZen<ZenValue<A>>;
    if (
      typeof dependentZen._unsubscribeFromSources === 'function' ||
      typeof (dependentZen as SelectZen<ZenValue<A>>)._unsubscribeFromSource === 'function'
    ) {
      if ('_unsubscribeFromSources' in dependentZen) {
        dependentZen._unsubscribeFromSources();
      } else if ('_unsubscribeFromSource' in dependentZen) {
        (dependentZen as SelectZen<ZenValue<A>>)._unsubscribeFromSource();
      }
    }
  }
}

export function subscribe<A extends AnyZen>(zen: A, listener: Listener<ZenValue<A>>): Unsubscribe {
  const baseZen = zen as ZenWithValue<ZenValue<A>>;
  const isFirstListener = !baseZen._listeners || baseZen._listeners.length === 0;

  baseZen._listeners ??= [];
  baseZen._listeners.push(listener);

  if (isFirstListener) {
    _handleFirstSubscription(zen, baseZen);
  }

  const initialValue = get(zen as any);
  (listener as Listener<any>)(initialValue, undefined);

  return function unsubscribe() {
    const baseZen = zen as ZenWithValue<ZenValue<A>>;
    const listeners = baseZen._listeners;

    if (!listeners || listeners.length === 0) return;

    const idx = listeners.indexOf(listener);
    if (idx === -1) return;

    const lastIdx = listeners.length - 1;
    if (idx !== lastIdx) {
      listeners[idx] = listeners[lastIdx];
    }
    listeners.pop();

    if (listeners.length === 0) {
      _handleLastUnsubscribe(zen, baseZen);
    }
  };
}

// --- Batching Functions ---

/**
 * Checks if the code is currently executing within a `batch()` call.
 * @internal
 */
export function isInBatch(): boolean {
  return batchDepth > 0;
}

/**
 * Queues a zen for notification at the end of the batch.
 * @internal
 */
export function queueZenForBatch<T>(zen: ZenOptimized<T>, originalValue: T): void {
  if (!batchQueue.has(zen as ZenOptimized<unknown>)) {
    batchQueue.set(zen as ZenOptimized<unknown>, originalValue);
  }
}

/** @internal */
function _processBatchQueue(
  errorOccurred: boolean,
): { zen: ZenOptimized<unknown>; value: unknown; oldValue: unknown }[] {
  const changesToNotify: { zen: ZenOptimized<unknown>; value: unknown; oldValue: unknown }[] = [];
  if (!errorOccurred && batchQueue.size > 0) {
    try {
      for (const [zen, originalValueBeforeBatch] of batchQueue.entries()) {
        const currentValue = zen._value;
        if (!Object.is(currentValue, originalValueBeforeBatch)) {
          changesToNotify.push({
            zen: zen,
            value: currentValue,
            oldValue: originalValueBeforeBatch,
          });
        }
      }
    } finally {
      batchQueue.clear();
    }
  } else {
    batchQueue.clear();
  }
  return changesToNotify;
}

/** @internal */
function _notifyBatchedChanges(
  changesToNotify: { zen: ZenOptimized<unknown>; value: unknown; oldValue: unknown }[],
): void {
  for (let i = 0; i < changesToNotify.length; i++) {
    notifyListeners(changesToNotify[i].zen, changesToNotify[i].value, changesToNotify[i].oldValue);
  }
}

/**
 * Executes a function, deferring all zen listener notifications until the function completes.
 * Batches can be nested; notifications only run when the outermost batch finishes.
 *
 * ✅ OPTIMIZED: Matches original structure for consistency
 * @param fn The function to execute within the batch.
 * @returns The return value of the executed function.
 */
export function batch<T>(fn: () => T): T {
  batchDepth++;

  let errorOccurred = false;
  let result: T;
  const changesToNotify: { zen: ZenOptimized<unknown>; value: unknown; oldValue: unknown }[] = [];

  try {
    result = fn();
  } catch (e) {
    errorOccurred = true;
    throw e;
  } finally {
    batchDepth--;

    // Only process when exiting outermost batch
    if (batchDepth === 0) {
      const changes = _processBatchQueue(errorOccurred);
      changesToNotify.push(...changes);
    }
  }

  // Notify outside finally block
  if (batchDepth === 0 && !errorOccurred && changesToNotify.length > 0) {
    _notifyBatchedChanges(changesToNotify);
  }

  return result;
}
