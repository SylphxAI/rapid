/**
 * Zen Ultra - High-Performance Reactive Primitives
 *
 * Design goals:
 * - No auto-batching. Only manual batch().
 * - Fully lazy computed evaluation.
 * - O(1) core operations per node (excluding unavoidable O(n listeners / sources)).
 * - Array-based fan-out, bitflags for node state, versioned change detection.
 */

export type Listener<T> = (value: T, oldValue: T | undefined) => void;
export type Unsubscribe = () => void;

// ============================================================================
// FLAGS
// ============================================================================

const FLAG_STALE = 0b01;
const FLAG_PENDING = 0b10;

// ============================================================================
// BASE NODE
// ============================================================================

/**
 * Base node for both signals and computeds.
 *
 * V is the stored value type:
 * - ZenNode<T>        -> BaseNode<T>
 * - ComputedNode<T>   -> BaseNode<T | null>
 */
abstract class BaseNode<V> {
  _value: V;
  _computedListeners: AnyNode[] = [];
  _effectListeners: Listener<any>[] = [];
  _flags = 0;
  _version = 0;

  constructor(initial: V) {
    this._value = initial;
  }
}

type AnyNode = BaseNode<unknown>;

/**
 * Entity that participates in dependency tracking (computed/effect).
 */
interface DependencyCollector {
  _sources: AnyNode[];
}

// Global dependency tracking context
let currentListener: DependencyCollector | null = null;

// ============================================================================
// HELPERS
// ============================================================================

function arraysEqual<T>(a: T[], b: T[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

/**
 * Creates a sources array with a `.size` getter for compatibility.
 */
function createSourcesArray(): AnyNode[] {
  const sources: AnyNode[] = [];
  Object.defineProperty(sources, "size", {
    get() {
      return (this as AnyNode[]).length;
    },
    enumerable: false,
  });
  return sources;
}

/**
 * Value equality helper with:
 * - NaN treated as equal to NaN
 * - +0 and -0 treated as different (so they are considered "changed")
 */
function valuesEqual(a: unknown, b: unknown): boolean {
  if (a === b) {
    // Handle +0 vs -0
    if (a === 0 && b === 0) {
      return 1 / (a as number) === 1 / (b as number);
    }
    return true;
  }
  // Both NaN
  if ((a as any) !== (a as any) && (b as any) !== (b as any)) {
    return true;
  }
  return false;
}

// ============================================================================
// ZEN (Signal)
// ============================================================================

class ZenNode<T> extends BaseNode<T> {
  get value(): T {
    // Dependency tracking
    if (currentListener) {
      const list = currentListener._sources;
      const self = this as AnyNode;
      if (list.indexOf(self) === -1) list.push(self);
    }
    return this._value;
  }

  set value(next: T) {
    const prev = this._value;

    // Fast equality check with +0 / -0 and NaN handling
    if (valuesEqual(next, prev)) {
      return;
    }

    this._value = next;
    this._version++;

    // Mark dependent computeds as STALE
    const computeds = this._computedListeners;
    for (let i = 0; i < computeds.length; i++) {
      computeds[i]!._flags |= FLAG_STALE;
    }

    // Inside a batch: defer notifications
    if (batchDepth > 0) {
      queueBatchedNotification(this as AnyNode, prev);
      return;
    }

    notifyEffects(this as AnyNode, next, prev);
  }
}

export function zen<T>(initial: T): ZenNode<T> {
  return new ZenNode<T>(initial);
}

export type Zen<T> = ReturnType<typeof zen<T>>;

// ============================================================================
// COMPUTED
// ============================================================================

class ComputedNode<T> extends BaseNode<T | null> {
  _value: T | null;
  _calc: () => T;
  _sources: AnyNode[];
  _sourceUnsubs?: Unsubscribe[];

  // Version snapshot for each source at last evaluation
  _sourceVersions: number[] = [];

  constructor(calc: () => T) {
    super(null as T | null);
    this._value = null;
    this._calc = calc;
    this._sources = createSourcesArray();
    this._sourceUnsubs = undefined;
    this._flags = FLAG_STALE; // Start dirty; first read will compute
  }

  // Compatibility accessors
  get _unsubs(): Unsubscribe[] | undefined {
    return this._sourceUnsubs;
  }

  get _dirty(): boolean {
    return (this._flags & FLAG_STALE) !== 0;
  }

  /**
   * Internal recompute function used by .value.
   * Fully lazy, version-aware, and updates dependency subscriptions.
   */
  private _recomputeIfNeeded(): void {
    let isStale = (this._flags & FLAG_STALE) !== 0;

    // Version-based check: if any source version changed, treat as stale
    if (!isStale && this._sources.length > 0 && this._sourceVersions.length === this._sources.length) {
      const srcs = this._sources;
      const vers = this._sourceVersions;
      for (let i = 0; i < srcs.length; i++) {
        if (srcs[i]!._version !== vers[i]!) {
          isStale = true;
          break;
        }
      }
    }

    if (!isStale) {
      return;
    }

    const hadSubscriptions = this._sourceUnsubs !== undefined;
    const oldSources = hadSubscriptions ? [...this._sources] : null;

    const prevListener = currentListener;
    currentListener = this as unknown as DependencyCollector;

    this._sources.length = 0; // Rebuild sources

    this._flags |= FLAG_PENDING;
    this._flags &= ~FLAG_STALE;

    const oldValue = this._value;
    const newValue = this._calc();
    this._value = newValue;
    this._flags &= ~FLAG_PENDING;
    this._version++;

    // Snapshot source versions for future checks
    const len = this._sources.length;
    if (this._sourceVersions.length !== len) {
      this._sourceVersions = new Array(len);
    }
    for (let i = 0; i < len; i++) {
      this._sourceVersions[i] = this._sources[i]!._version;
    }

    currentListener = prevListener;

    // If we were already subscribed and the source set changed, rewire
    if (oldSources) {
      const changed = !arraysEqual(oldSources, this._sources);
      if (changed) {
        this._unsubscribeFromSources();
        if (this._sources.length > 0) {
          this._subscribeToSources();
        }
      }
    }

    // Note: we intentionally do NOT notify listeners here.
    // Computeds are lazy: they recompute when read.
    // Notifications are driven by signals and effects via their own tracking.
  }

  get value(): T {
    // Lazy evaluation with version-based skipping
    this._recomputeIfNeeded();

    // Allow higher-level tracking (computed-of-computed / effect-of-computed)
    if (currentListener) {
      const list = currentListener._sources;
      const self = this as AnyNode;
      if (list.indexOf(self) === -1) list.push(self);
    }

    // First-time subscription to sources after tracking
    if (this._sourceUnsubs === undefined && this._sources.length > 0) {
      this._subscribeToSources();
    }

    return this._value as T;
  }

  _subscribeToSources(): void {
    if (this._sources.length === 0) return;
    if (this._sourceUnsubs !== undefined) return;

    this._sourceUnsubs = [];
    const self = this;

    for (let i = 0; i < this._sources.length; i++) {
      const source = this._sources[i]!;
      source._computedListeners.push(self as unknown as AnyNode);

      const unsub: Unsubscribe = () => {
        const arr = source._computedListeners;
        const idx = arr.indexOf(self as unknown as AnyNode);
        if (idx !== -1) {
          const last = arr.length - 1;
          if (idx !== last) {
            arr[idx] = arr[last]!;
          }
          arr.pop();
        }
      };

      this._sourceUnsubs.push(unsub);
    }
  }

  _unsubscribeFromSources(): void {
    if (!this._sourceUnsubs) return;
    for (let i = 0; i < this._sourceUnsubs.length; i++) {
      this._sourceUnsubs[i]?.();
    }
    this._sourceUnsubs = undefined;
  }
}

export function computed<T>(calculation: () => T): ComputedNode<T> {
  return new ComputedNode<T>(calculation);
}

// ============================================================================
// PUBLIC CORE TYPES (API-Compatible)
// ============================================================================

export type ZenCore<T> = ZenNode<T>;
export type ComputedCore<T> = ComputedNode<T>;

export type AnyZen = ZenCore<unknown> | ComputedCore<unknown>;
export type ReadonlyZen<T> = ComputedCore<T>;
export type ComputedZen<T> = ComputedCore<T>;

// ============================================================================
// BATCH (Manual Only)
// ============================================================================

let batchDepth = 0;

type PendingNotification = [AnyNode, unknown];
const pendingNotifications: PendingNotification[] = [];

/**
 * Queue a node for batched notification.
 * A given node is only queued once per change event; the earliest oldValue wins.
 */
function queueBatchedNotification(node: AnyNode, oldValue: unknown): void {
  for (let i = 0; i < pendingNotifications.length; i++) {
    if (pendingNotifications[i]![0] === node) return;
  }
  pendingNotifications.push([node, oldValue]);
}

function notifyEffects(node: AnyNode, newValue: unknown, oldValue: unknown): void {
  const effects = node._effectListeners;
  const len = effects.length;

  if (len === 1) {
    effects[0]?.(newValue, oldValue);
  } else if (len === 2) {
    effects[0]?.(newValue, oldValue);
    effects[1]?.(newValue, oldValue);
  } else if (len === 3) {
    effects[0]?.(newValue, oldValue);
    effects[1]?.(newValue, oldValue);
    effects[2]?.(newValue, oldValue);
  } else {
    for (let i = 0; i < len; i++) {
      effects[i]?.(newValue, oldValue);
    }
  }
}

function flushPendingNotifications(): void {
  if (pendingNotifications.length === 0) return;

  const toNotify = pendingNotifications.splice(0);
  for (let i = 0; i < toNotify.length; i++) {
    const [node, oldVal] = toNotify[i]!;
    const curr = node._value;
    notifyEffects(node, curr, oldVal);
  }
}

/**
 * Run fn in a manual batch.
 * All signal writes inside update synchronously, but listener notifications
 * are coalesced and flushed at the end of the outermost batch.
 */
export function batch<T>(fn: () => T): T {
  batchDepth++;
  try {
    return fn();
  } finally {
    batchDepth--;
    if (batchDepth === 0) {
      flushPendingNotifications();
    }
  }
}

// ============================================================================
// SUBSCRIBE
// ============================================================================

/**
 * Subscribe to a signal or computed.
 *
 * - Immediately calls listener with the current value (lazy eval via .value).
 * - Returns an unsubscribe function (O(1) swap-pop removal).
 * - For computeds, if no listeners (effects or other computeds) remain,
 *   it unsubscribes from all sources.
 *
 * Note: For computeds, notifications are still driven by their underlying
 * sources and effects; this subscribe is primarily designed for signals.
 */
export function subscribe<T>(
  node: ZenCore<T> | ComputedCore<T>,
  listener: Listener<T>,
): Unsubscribe {
  const n = node as AnyNode;
  const effects = n._effectListeners as Listener<T>[];

  // Add listener (O(1))
  effects.push(listener);

  // Lazy initial evaluation:
  // - zen: direct read
  // - computed: recompute if needed, track sources, subscribe as needed
  listener((node as any).value as T, undefined);

  return (): void => {
    const idx = effects.indexOf(listener);
    if (idx === -1) return;

    const last = effects.length - 1;
    if (idx !== last) {
      effects[idx] = effects[last]!;
    }
    effects.pop();

    const remaining = n._computedListeners.length + n._effectListeners.length;

    // If this is a computed and no listeners remain (no effects, no dependents),
    // we can detach it from all of its sources.
    if (remaining === 0 && node instanceof ComputedNode) {
      (node as ComputedNode<T>)._unsubscribeFromSources();
    }
  };
}

// ============================================================================
// EFFECT
// ============================================================================

type EffectCore = DependencyCollector & {
  _sourceUnsubs?: Unsubscribe[];
  _cleanup?: () => void;
  _callback: () => undefined | (() => void);
  _cancelled: boolean;
};

function executeEffect(e: EffectCore): void {
  if (e._cancelled) return;

  // Run previous cleanup, if any
  if (e._cleanup) {
    try {
      e._cleanup();
    } catch {
      // Ignore cleanup errors by design
    }
    e._cleanup = undefined;
  }

  // Unsubscribe from previous sources
  if (e._sourceUnsubs) {
    for (let i = 0; i < e._sourceUnsubs.length; i++) {
      e._sourceUnsubs[i]?.();
    }
    e._sourceUnsubs = undefined;
  }

  e._sources.length = 0;

  const prevListener = currentListener;
  currentListener = e;

  try {
    const cleanup = e._callback();
    if (cleanup) e._cleanup = cleanup;
  } catch {
    // Effect errors are swallowed by design
  } finally {
    currentListener = prevListener;
  }

  // Subscribe to currently tracked sources
  if (e._sources.length > 0) {
    e._sourceUnsubs = [];
    const self = e;
    const onSourceChange: Listener<unknown> = (value, oldValue) => {
      // Re-run the effect when any source changes
      executeEffect(self);
    };

    for (let i = 0; i < e._sources.length; i++) {
      const src = e._sources[i]!;
      src._effectListeners.push(onSourceChange);
      e._sourceUnsubs.push(() => {
        const arr = src._effectListeners;
        const idx = arr.indexOf(onSourceChange);
        if (idx !== -1) {
          const last = arr.length - 1;
          if (idx !== last) {
            arr[idx] = arr[last]!;
          }
          arr.pop();
        }
      });
    }
  }
}

/**
 * Creates an auto-tracked effect.
 * - Runs immediately once.
 * - Tracks all signals/computeds read during the callback.
 * - Re-runs when any of those sources change.
 * - Supports cleanup via returning a function from the callback.
 */
export function effect(callback: () => undefined | (() => void)): Unsubscribe {
  const e: EffectCore = {
    _sources: [],
    _callback: callback,
    _cancelled: false,
  };

  executeEffect(e);

  return (): void => {
    if (e._cancelled) return;
    e._cancelled = true;

    if (e._cleanup) {
      try {
        e._cleanup();
      } catch {
        // Ignore cleanup errors
      }
    }

    if (e._sourceUnsubs) {
      for (let i = 0; i < e._sourceUnsubs.length; i++) {
        e._sourceUnsubs[i]?.();
      }
    }
  };
}
