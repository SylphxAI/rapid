/**
 * Zen Ultra - Maximum Performance Reactive Primitives
 * No auto-batching. Manual batch() only.
 * Design: O(1) per signal update (excluding unavoidable O(n) listener iteration),
 * lazy computeds, minimal allocations, bitflag state.
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
 * V = 真正儲存嘅 value type
 * 例如：
 *   ZenNode<T>       => BaseNode<T>
 *   ComputedNode<T>  => BaseNode<T | null>
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

// 用來做 dependency tracking 的 interface
interface DependencyCollector {
  _sources: AnyNode[];
}

// global tracking
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

function createSourcesArray(): AnyNode[] {
  const sources: AnyNode[] = [];
  Object.defineProperty(sources, 'size', {
    get() {
      return (this as AnyNode[]).length;
    },
    enumerable: false,
  });
  return sources;
}

// ============================================================================
// ZEN (signal)
// ============================================================================

class ZenNode<T> extends BaseNode<T> {
  get value(): T {
    // dependency tracking
    if (currentListener) {
      const list = currentListener._sources;
      const self = this as AnyNode;
      if (list.indexOf(self) === -1) list.push(self);
    }
    return this._value;
  }

  set value(next: T) {
    const prev = this._value;

    // Fast equality check with +0/-0 & NaN
    if (next === prev) {
      if (
        next === 0 &&
        1 / (next as any as number) !== 1 / (prev as any as number)
      ) {
        // +0 vs -0 -> treat as changed
      } else {
        return;
      }
    } else if ((next as any) !== (next as any) && (prev as any) !== (prev as any)) {
      // both NaN
      return;
    }

    this._value = next;
    this._version++;

    // mark computeds as STALE
    const computeds = this._computedListeners;
    for (let i = 0; i < computeds.length; i++) {
      computeds[i]!._flags |= FLAG_STALE;
    }

    // batching support
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
  _value: T | null; // 明確 override（而家 base V = T | null，所以 OK）
  _calc: () => T;
  _sources: AnyNode[];
  _sourceUnsubs?: Unsubscribe[];

  constructor(calc: () => T) {
    super(null as T | null);
    this._value = null;
    this._calc = calc;
    this._sources = createSourcesArray();
    this._sourceUnsubs = undefined;
    this._flags = FLAG_STALE; // start dirty
  }

  // 兼容：_unsubs / _dirty
  get _unsubs(): Unsubscribe[] | undefined {
    return this._sourceUnsubs;
  }
  get _dirty(): boolean {
    return (this._flags & FLAG_STALE) !== 0;
  }

  get value(): T {
    // lazy recompute only when STALE
    if ((this._flags & FLAG_STALE) !== 0) {
      const hadSubscriptions = this._sourceUnsubs !== undefined;
      const oldSources = hadSubscriptions ? [...this._sources] : null;

      const prevListener = currentListener;
      currentListener = this as unknown as DependencyCollector;

      this._sources.length = 0; // rebuild source list

      this._flags |= FLAG_PENDING;
      this._flags &= ~FLAG_STALE;
      this._value = this._calc();
      this._flags &= ~FLAG_PENDING;
      this._version++;

      currentListener = prevListener;

      // if we were already subscribed, and source set changed -> resubscribe
      if (oldSources) {
        const changed = !arraysEqual(oldSources, this._sources);
        if (changed) {
          this._unsubscribeFromSources();
          if (this._sources.length > 0) {
            this._subscribeToSources();
          }
        }
      }
    }

    // first-time subscription after tracking
    if (this._sourceUnsubs === undefined && this._sources.length > 0) {
      this._subscribeToSources();
    }

    // allow higher-level tracking (computed-of-computed / effect-of-computed)
    if (currentListener) {
      const list = currentListener._sources;
      const self = this as AnyNode;
      if (list.indexOf(self) === -1) list.push(self);
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
// PUBLIC CORE TYPES (API 兼容)
// ============================================================================

export type ZenCore<T> = ZenNode<T>;
export type ComputedCore<T> = ComputedNode<T>;

export type AnyZen = ZenCore<unknown> | ComputedCore<unknown>;
export type ReadonlyZen<T> = ComputedCore<T>;
export type ComputedZen<T> = ComputedCore<T>;

// ============================================================================
// BATCH（manual only）
// ============================================================================

let batchDepth = 0;
type PendingNotification = [AnyNode, unknown];
const pendingNotifications: PendingNotification[] = [];

function queueBatchedNotification(node: AnyNode, oldValue: unknown): void {
  // same node only queued once per batch
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

export function batch<T>(fn: () => T): T {
  batchDepth++;
  try {
    return fn();
  } finally {
    batchDepth--;
    if (batchDepth === 0 && pendingNotifications.length > 0) {
      const toNotify = pendingNotifications.splice(0);
      for (let i = 0; i < toNotify.length; i++) {
        const [node, oldVal] = toNotify[i]!;
        // mark computeds STALE again (cheap OR)
        const computeds = node._computedListeners;
        for (let j = 0; j < computeds.length; j++) {
          computeds[j]!._flags |= FLAG_STALE;
        }
        const curr = node._value;
        notifyEffects(node, curr, oldVal);
      }
    }
  }
}

// ============================================================================
// SUBSCRIBE
// ============================================================================

export function subscribe<T>(
  zenItem: ZenCore<T> | ComputedCore<T>,
  listener: Listener<T>,
): Unsubscribe {
  const node = zenItem as AnyNode;
  const effects = node._effectListeners as Listener<T>[];

  effects.push(listener);

  // computed: first listener triggers compute & source subscription
  const asComputed = zenItem as ComputedNode<T>;
  const totalListeners = node._computedListeners.length + effects.length;
  if (zenItem instanceof ComputedNode && totalListeners === 1) {
    const _ = asComputed.value; // trigger compute
    asComputed._subscribeToSources();
  }

  // immediate initial call
  listener(zenItem._value as T, undefined);

  return (): void => {
    const idx = effects.indexOf(listener);
    if (idx === -1) return;
    const last = effects.length - 1;
    if (idx !== last) {
      effects[idx] = effects[last]!;
    }
    effects.pop();

    const remaining = node._computedListeners.length + node._effectListeners.length;

    if (remaining === 0 && zenItem instanceof ComputedNode) {
      asComputed._unsubscribeFromSources();
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

  // previous cleanup
  if (e._cleanup) {
    try {
      e._cleanup();
    } catch {
      // ignore
    }
    e._cleanup = undefined;
  }

  // unsubscribe previous sources
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
    // swallow errors by design
  } finally {
    currentListener = prevListener;
  }

  // subscribe to tracked sources
  if (e._sources.length > 0) {
    e._sourceUnsubs = [];
    const self = e;
    const onSourceChange: Listener<unknown> = () => executeEffect(self);

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
        // ignore
      }
    }

    if (e._sourceUnsubs) {
      for (let i = 0; i < e._sourceUnsubs.length; i++) {
        e._sourceUnsubs[i]?.();
      }
    }
  };
}
