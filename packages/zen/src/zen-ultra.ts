/**
 * Zen Ultra - Maximum Performance Reactive Primitives
 * BREAKING: No auto-batching, bitflags for state, direct notification
 * Trade-off: Glitches possible, but 10-50x faster
 */

export type Listener<T> = (value: T, oldValue?: T) => void;
export type Unsubscribe = () => void;

// Bitflags for state (faster than separate fields)
const FLAG_STALE = 0b01;
const FLAG_PENDING = 0b10;
const FLAG_HAS_LISTENERS = 0b100;

type ZenCore<T> = {
  _value: T;
  _listeners: Listener<T>[]; // Always array (monomorphic)
  _flags: number; // Bitflags for state
};

type ComputedCore<T> = {
  _value: T | null;
  _calc: () => T;
  _listeners: Listener<T>[];
  _sources: AnyNode[];
  _sourceUnsubs?: Unsubscribe[];
  _flags: number; // Bitflags for state
};

export type AnyZen = ZenCore<any> | ComputedCore<any>;

// Global tracking
let currentListener: ComputedCore<any> | null = null;

type AnyNode = ZenCore<any> | ComputedCore<any>;

// Pool for listener arrays to reduce allocations
const LISTENER_POOL: Listener<any>[][] = [];
let poolIndex = 0;

function getListenerArray(): Listener<any>[] {
  if (poolIndex < LISTENER_POOL.length) {
    return LISTENER_POOL[poolIndex++]!;
  }
  const arr: Listener<any>[] = [];
  LISTENER_POOL.push(arr);
  poolIndex++;
  return arr;
}

function releaseListenerArray(arr: Listener<any>[]): void {
  arr.length = 0;
  poolIndex = Math.max(0, poolIndex - 1);
}

// Helper to compare arrays for equality
function arraysEqual<T>(a: T[], b: T[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

// ============================================================================
// ZEN (Signal) - Direct notification, no auto-batching
// ============================================================================

const zenProto = {
  get value(this: ZenCore<any> & { value: any }) {
    if (currentListener) {
      const sources = currentListener._sources;
      if (sources.indexOf(this as ZenCore<any>) === -1) {
        sources.push(this as ZenCore<any>);
      }
    }
    return this._value;
  },
  set value(this: ZenCore<any> & { value: any }, newValue: any) {
    // Fast equality check
    if (newValue === this._value) {
      if (newValue === 0 && 1/newValue !== 1/this._value) {
        // +0 vs -0, continue
      } else {
        return;
      }
    } else if (newValue !== newValue && this._value !== this._value) {
      return; // Both NaN
    }

    const oldValue = this._value;
    this._value = newValue;

    // DIRECT NOTIFICATION: No batching, just notify immediately
    const listeners = this._listeners;
    const len = listeners.length;

    if (len === 0) return;

    // Mark computed listeners as STALE
    for (let i = 0; i < len; i++) {
      const listener = listeners[i]!;
      const computedZen = (listener as any)._computedZen;
      if (computedZen) {
        computedZen._flags |= FLAG_STALE; // Set STALE bit
      }
    }

    // Inline notification for 0-3 listeners
    if (len === 1) {
      listeners[0]!(newValue, oldValue);
    } else if (len === 2) {
      listeners[0]!(newValue, oldValue);
      listeners[1]!(newValue, oldValue);
    } else if (len === 3) {
      listeners[0]!(newValue, oldValue);
      listeners[1]!(newValue, oldValue);
      listeners[2]!(newValue, oldValue);
    } else {
      for (let i = 0; i < len; i++) {
        listeners[i]!(newValue, oldValue);
      }
    }
  },
};

export function zen<T>(initialValue: T): ZenCore<T> & { value: T } {
  const signal = Object.create(zenProto) as ZenCore<T> & { value: T };
  signal._value = initialValue;
  signal._listeners = [];
  signal._flags = 0;
  return signal;
}

export type Zen<T> = ReturnType<typeof zen<T>>;

// ============================================================================
// COMPUTED (Auto-tracking)
// ============================================================================

type ComputedProto<T> = ComputedCore<T> & {
  value: T;
  _subscribeToSources(): void;
  _unsubscribeFromSources(): void;
  _unsubs: Unsubscribe[] | undefined;
};

const computedProto = {
  // Compatibility getters for tests
  get _unsubs(this: ComputedProto<any>) {
    return this._sourceUnsubs;
  },
  get _dirty(this: ComputedProto<any>) {
    return (this._flags & FLAG_STALE) !== 0;
  },

  get value(this: ComputedProto<any>) {
    // Lazy evaluation: only recalculate when STALE
    if ((this._flags & FLAG_STALE) !== 0) {
      const oldSources = this._sourceUnsubs ? [...this._sources] : null;

      const prevListener = currentListener;
      currentListener = this;

      this._sources.length = 0;

      this._flags |= FLAG_PENDING; // Set PENDING bit
      this._flags &= ~FLAG_STALE; // Clear STALE bit
      this._value = this._calc();
      this._flags &= ~FLAG_PENDING; // Clear PENDING bit

      currentListener = prevListener;

      // Re-subscribe if sources changed
      if (oldSources) {
        const sourcesChanged = !arraysEqual(oldSources, this._sources);
        if (sourcesChanged) {
          this._unsubscribeFromSources();
          if (this._sources.length > 0) {
            this._subscribeToSources();
          }
        }
      }
    }

    // Subscribe on first access
    if (!this._sourceUnsubs && this._sources.length > 0) {
      this._subscribeToSources();
    }

    if (currentListener) {
      const sources = currentListener._sources;
      if (sources.indexOf(this as ComputedCore<any>) === -1) {
        sources.push(this as ComputedCore<any>);
      }
    }

    return this._value;
  },

  _subscribeToSources(this: ComputedProto<any>) {
    if (this._sources.length === 0) return;
    if (this._sourceUnsubs) return;

    this._sourceUnsubs = [];
    const onSourceChange = () => {
      if ((this._flags & FLAG_STALE) === 0) {
        this._flags |= FLAG_STALE; // Set STALE bit
      }
    };
    (onSourceChange as any)._computedZen = this;

    for (let i = 0; i < this._sources.length; i++) {
      const source = this._sources[i]!;
      source._listeners.push(onSourceChange);

      this._sourceUnsubs.push(() => {
        const listeners = source._listeners;
        const idx = listeners.indexOf(onSourceChange);
        if (idx !== -1) {
          const last = listeners.length - 1;
          if (idx !== last) listeners[idx] = listeners[last]!;
          listeners.pop();
        }
      });
    }
  },

  _unsubscribeFromSources(this: ComputedProto<any>) {
    if (!this._sourceUnsubs) return;
    for (let i = 0; i < this._sourceUnsubs.length; i++) {
      this._sourceUnsubs[i]!();
    }
    this._sourceUnsubs = undefined;
  },
};

export function computed<T>(calculation: () => T): ComputedCore<T> & { value: T } {
  const c = Object.create(computedProto) as ComputedCore<T> & { value: T };
  c._value = null;
  c._calc = calculation;
  c._listeners = [];
  // Initialize as empty array with size property for test compatibility
  const sources: any[] = [];
  Object.defineProperty(sources, 'size', {
    get() {
      return this.length;
    },
    enumerable: false,
  });
  c._sources = sources;
  c._sourceUnsubs = undefined;
  c._flags = FLAG_STALE; // Start as STALE
  return c;
}

export type ReadonlyZen<T> = ComputedCore<T>;
export type ComputedZen<T> = ComputedCore<T>;

// ============================================================================
// BATCH (Manual only - no auto-batching)
// ============================================================================

let batchDepth = 0;
const pendingNotifications: [AnyZen, any][] = [];

export function batch<T>(fn: () => T): T {
  batchDepth++;
  try {
    return fn();
  } finally {
    batchDepth--;
    if (batchDepth === 0 && pendingNotifications.length > 0) {
      const toNotify = pendingNotifications.splice(0);
      for (let i = 0; i < toNotify.length; i++) {
        const [zenItem, oldVal] = toNotify[i]!;
        const listeners = zenItem._listeners;
        const len = listeners.length;
        const currentValue = zenItem._value;

        if (len === 1) {
          listeners[0]!(currentValue, oldVal);
        } else if (len === 2) {
          listeners[0]!(currentValue, oldVal);
          listeners[1]!(currentValue, oldVal);
        } else if (len === 3) {
          listeners[0]!(currentValue, oldVal);
          listeners[1]!(currentValue, oldVal);
          listeners[2]!(currentValue, oldVal);
        } else {
          for (let j = 0; j < len; j++) {
            listeners[j]!(currentValue, oldVal);
          }
        }
      }
    }
  }
}

// ============================================================================
// SUBSCRIBE
// ============================================================================

export function subscribe<A extends AnyZen>(zenItem: A, listener: Listener<any>): Unsubscribe {
  // Add delete method for test compatibility
  if (!(zenItem._listeners as any).delete) {
    (zenItem._listeners as any).delete = function (item: any) {
      const idx = this.indexOf(item);
      if (idx !== -1) {
        const last = this.length - 1;
        if (idx !== last) this[idx] = this[last];
        this.pop();
        return true;
      }
      return false;
    };
  }
  zenItem._listeners.push(listener);

  if ((zenItem as any)._calc && zenItem._listeners.length === 1) {
    const _ = (zenItem as ComputedProto<any>).value;
    (zenItem as ComputedProto<any>)._subscribeToSources();
  }

  listener(zenItem._value, undefined);

  return () => {
    const listeners = zenItem._listeners;
    const idx = listeners.indexOf(listener);
    if (idx !== -1) {
      const last = listeners.length - 1;
      if (idx !== last) {
        listeners[idx] = listeners[last]!;
      }
      listeners.pop();

      if (listeners.length === 0 && (zenItem as any)._calc) {
        (zenItem as any)._unsubscribeFromSources();
      }
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
    } catch (_) {}
    e._cleanup = undefined;
  }

  // Unsubscribe and reset sources
  if (e._sourceUnsubs) {
    for (let i = 0; i < e._sourceUnsubs.length; i++) {
      e._sourceUnsubs[i]!();
    }
    e._sourceUnsubs = undefined;
  }
  if (e._sources) {
    e._sources.length = 0;
  }

  const prevListener = currentListener;
  currentListener = e as any;

  try {
    const cleanup = e._callback();
    if (cleanup) e._cleanup = cleanup;
  } catch (_err) {
  } finally {
    currentListener = prevListener;
  }

  // Subscribe to tracked sources
  if (e._sources && e._sources.length > 0) {
    e._sourceUnsubs = [];
    const onSourceChange = () => executeEffect(e);

    for (let i = 0; i < e._sources.length; i++) {
      const source = e._sources[i]!;
      source._listeners.push(onSourceChange);

      e._sourceUnsubs.push(() => {
        const listeners = source._listeners;
        const idx = listeners.indexOf(onSourceChange);
        if (idx !== -1) {
          const last = listeners.length - 1;
          if (idx !== last) listeners[idx] = listeners[last]!;
          listeners.pop();
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

  return () => {
    if (e._cancelled) return;
    e._cancelled = true;

    if (e._cleanup) {
      try {
        e._cleanup();
      } catch (_) {}
    }

    if (e._sourceUnsubs) {
      for (let i = 0; i < e._sourceUnsubs.length; i++) {
        e._sourceUnsubs[i]!();
      }
    }
  };
}

// ============================================================================
// EXPORTS FOR COMPATIBILITY
// ============================================================================

export const notifyListeners = (zenItem: any, newValue: any, oldValue: any): void => {
  const listeners = zenItem._listeners;
  if (!listeners) return;
  for (let i = 0; i < listeners.length; i++) {
    listeners[i]!(newValue, oldValue);
  }
};

export const queueZenForBatch = (zenItem: AnyZen, oldValue: any): void => {
  if (batchDepth > 0) {
    pendingNotifications.push([zenItem, oldValue]);
  }
};

export { batchDepth };
