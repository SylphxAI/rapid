/**
 * Zen Ultra - Maximum Performance Reactive Primitives
 * BREAKING: No auto-batching, bitflags for state, direct notification
 * Trade-off: Glitches possible, but 10-50x faster
 */

export type Listener<T> = (value: T, oldValue: T | undefined) => void;
export type Unsubscribe = () => void;

// Bitflags for state
const FLAG_STALE = 0b01;
const FLAG_PENDING = 0b10;

/**
 * Base core node shared by signals & computeds
 */
type BaseCore<T> = {
  _value: T;
  _computedListeners: ComputedCore<unknown>[];
  _effectListeners: Listener<T>[];
  _flags: number;
  _version: number;
};

type ZenCore<T> = BaseCore<T>;
type AnyNode = ZenCore<unknown> | ComputedCore<unknown>;

type ComputedCore<T> = BaseCore<T> & {
  _value: T | null;
  _calc: () => T;
  _sources: AnyNode[];
  _sourceUnsubs?: Unsubscribe[];
};

export type AnyZen = ZenCore<unknown> | ComputedCore<unknown>;

// ============================================================================
// GLOBAL TRACKING
// ============================================================================

let currentListener: { _sources?: AnyNode[] } | null = null;

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

function removeFromArray<T>(array: T[], item: T): boolean {
  const idx = array.indexOf(item);
  if (idx === -1) return false;
  const last = array.length - 1;
  if (idx !== last) {
    array[idx] = array[last]!;
  }
  array.pop();
  return true;
}

/**
 * Create a sources array that has a `.size` getter (for test compat).
 */
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
// ZEN (Signal) - Direct notification, no auto-batching by default
// ============================================================================

type ZenInstance<T> = ZenCore<T> & { value: T };

// biome-ignore lint: TypeScript getter/setter with this parameter - Biome parser limitation
const zenProto = {
  get value(this: ZenInstance<any>): any {
    // Auto-dependency tracking for computeds/effects
    if (currentListener && currentListener._sources) {
      const sources = currentListener._sources;
      const node = this as unknown as AnyNode;
      if (sources.indexOf(node) === -1) {
        sources.push(node);
      }
    }
    return this._value;
  },

  set value(this: ZenInstance<any>, newValue: any): void {
    const oldValue: any = this._value;

    // Fast equality check (with +0/-0 & NaN handling)
    if (newValue === oldValue) {
      if (newValue === 0 && 1 / (newValue as number) !== 1 / (oldValue as number)) {
        // +0 vs -0: treat as change
      } else {
        return;
      }
    } else if (newValue !== newValue && oldValue !== oldValue) {
      // Both NaN
      return;
    }

    this._value = newValue;
    this._version++; // change marker

    // Mark computeds as STALE immediately (for reads inside batch)
    const computeds = this._computedListeners;
    for (let i = 0; i < computeds.length; i++) {
      computeds[i]!._flags |= FLAG_STALE;
    }

    // If we're inside a batch, defer effect notifications
    if (batchDepth > 0) {
      queueBatchedNotification(this as unknown as AnyNode, oldValue);
      return;
    }

    notifyEffects(this as unknown as AnyNode, newValue, oldValue);
  },
};

export function zen<T>(initialValue: T): ZenInstance<T> {
  const signal = Object.create(zenProto) as ZenInstance<T>;
  signal._value = initialValue;
  signal._computedListeners = [];
  signal._effectListeners = [];
  signal._flags = 0;
  signal._version = 0;
  return signal;
}

export type Zen<T> = ReturnType<typeof zen<T>>;

// ============================================================================
// COMPUTED (Auto-tracking)
// ============================================================================

type ComputedInstance<T> = ComputedCore<T> & {
  value: T;
  _subscribeToSources(): void;
  _unsubscribeFromSources(): void;
  _unsubs: Unsubscribe[] | undefined; // compat alias
};

// biome-ignore lint: TypeScript getter/setter with this parameter - Biome parser limitation
const computedProto: Partial<ComputedInstance<any>> = {
  // Compatibility getters for tests
  get _unsubs(this: ComputedInstance<any>): Unsubscribe[] | undefined {
    return this._sourceUnsubs;
  },

  get _dirty(this: ComputedInstance<any>): boolean {
    return (this._flags & FLAG_STALE) !== 0;
  },

  get value(this: ComputedInstance<any>): any {
    // Lazy evaluation: only recalc when STALE
    if ((this._flags & FLAG_STALE) !== 0) {
      const hadSubscriptions = this._sourceUnsubs !== undefined;
      const oldSources = hadSubscriptions ? [...this._sources] : null;

      const prevListener = currentListener;
      currentListener = this;

      this._sources.length = 0;

      this._flags |= FLAG_PENDING;
      this._flags &= ~FLAG_STALE;
      this._value = this._calc();
      this._flags &= ~FLAG_PENDING;
      this._version++;

      currentListener = prevListener;

      // If we were already subscribed, we may need to rewire source subs
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

    // Subscribe on first access if we have sources but no subscriptions yet
    if (this._sourceUnsubs === undefined && this._sources.length > 0) {
      this._subscribeToSources();
    }

    // Allow higher-level tracking (computed-of-computed / effect-of-computed)
    if (currentListener && currentListener._sources) {
      const sources = currentListener._sources;
      const node = this as unknown as AnyNode;
      if (sources.indexOf(node) === -1) {
        sources.push(node);
      }
    }

    return this._value as any;
  },

  _subscribeToSources(this: ComputedInstance<any>): void {
    if (this._sources.length === 0) return;
    if (this._sourceUnsubs !== undefined) return;

    this._sourceUnsubs = [];
    const self = this as unknown as ComputedCore<unknown>;

    for (let i = 0; i < this._sources.length; i++) {
      const source = this._sources[i]!;
      source._computedListeners.push(self);

      this._sourceUnsubs.push(() => {
        removeFromArray(source._computedListeners, self);
      });
    }
  },

  _unsubscribeFromSources(this: ComputedInstance<any>): void {
    if (!this._sourceUnsubs) return;
    for (let i = 0; i < this._sourceUnsubs.length; i++) {
      this._sourceUnsubs[i]?.();
    }
    this._sourceUnsubs = undefined;
  },
};

export function computed<T>(calculation: () => T): ComputedInstance<T> {
  const c = Object.create(computedProto) as ComputedInstance<T>;
  c._value = null;
  c._calc = calculation;
  c._computedListeners = [];
  c._effectListeners = [];
  c._sources = createSourcesArray();
  c._sourceUnsubs = undefined;
  c._flags = FLAG_STALE; // start as STALE so first read computes
  c._version = 0;
  return c;
}

export type ReadonlyZen<T> = ComputedCore<T>;
export type ComputedZen<T> = ComputedCore<T>;

// ============================================================================
// BATCH (Manual only - no auto-batching)
// ============================================================================

let batchDepth = 0;
type PendingNotification = [AnyNode, unknown];
const pendingNotifications: PendingNotification[] = [];

/**
 * Coalesce notifications for the same node inside a batch.
 */
function queueBatchedNotification(node: AnyNode, oldValue: unknown): void {
  for (let i = 0; i < pendingNotifications.length; i++) {
    const n = pendingNotifications[i]![0];
    if (n === node) {
      // Already queued, keep earliest oldValue
      return;
    }
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
  } else if (len > 0) {
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
        // Computeds were already marked STALE in setters, but OR again is cheap.
        const computeds = node._computedListeners;
        for (let j = 0; j < computeds.length; j++) {
          computeds[j]!._flags |= FLAG_STALE;
        }
        const currentValue = node._value;
        notifyEffects(node, currentValue, oldVal);
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
  const effects = zenItem._effectListeners as Listener<T>[];

  // Add custom delete method once (test compatibility)
  if (!(effects as any).delete) {
    (effects as any).delete = function (item: Listener<T>): boolean {
      return removeFromArray(this as Listener<T>[], item);
    };
  }

  effects.push(listener);

  // If computed, trigger initial evaluation & subscriptions when first listener attaches
  const asComputed = zenItem as ComputedInstance<T>;
  const totalListeners = zenItem._computedListeners.length + effects.length;
  if ('_calc' in zenItem && totalListeners === 1) {
    const _ = asComputed.value; // eslint-disable-line @typescript-eslint/no-unused-vars
    asComputed._subscribeToSources();
  }

  // Immediate initial call with current value
  listener(zenItem._value as T, undefined);

  return (): void => {
    if (!removeFromArray(effects, listener)) return;

    const remaining =
      zenItem._computedListeners.length + zenItem._effectListeners.length;

    // If no listeners left on a computed, drop source subscriptions
    if (remaining === 0 && '_calc' in zenItem) {
      asComputed._unsubscribeFromSources();
    }
  };
}

// ============================================================================
// EFFECT (Auto-tracking)
// ============================================================================

type EffectCore = {
  _sources?: AnyNode[];
  _sourceUnsubs?: Unsubscribe[];
  _cleanup?: () => void;
  _callback: () => undefined | (() => void);
  _cancelled: boolean;
};

function executeEffect(e: EffectCore): void {
  if (e._cancelled) return;

  // Run previous cleanup
  if (e._cleanup) {
    try {
      e._cleanup();
    } catch {
      // ignore cleanup errors
    }
    e._cleanup = undefined;
  }

  // Unsubscribe previous sources
  if (e._sourceUnsubs) {
    for (let i = 0; i < e._sourceUnsubs.length; i++) {
      e._sourceUnsubs[i]?.();
    }
    e._sourceUnsubs = undefined;
  }

  if (e._sources) {
    e._sources.length = 0;
  }

  const prevListener = currentListener;
  if (!e._sources) e._sources = [];
  currentListener = e as unknown as { _sources?: AnyNode[] };

  try {
    const cleanup = e._callback();
    if (cleanup) e._cleanup = cleanup;
  } catch {
    // swallow effect errors by design
  } finally {
    currentListener = prevListener;
  }

  // Subscribe to tracked sources
  if (e._sources && e._sources.length > 0) {
    e._sourceUnsubs = [];
    const self = e;
    const onSourceChange: Listener<unknown> = () => executeEffect(self);

    for (let i = 0; i < e._sources.length; i++) {
      const source = e._sources[i]!;
      source._effectListeners.push(onSourceChange);

      e._sourceUnsubs.push(() => {
        removeFromArray(source._effectListeners, onSourceChange);
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
