/**
 * Zen - Ultra-Performance Reactivity
 * Auto-tracking signals, computed, and effects
 */

export type Listener<T> = (value: T, oldValue?: T) => void;
export type Unsubscribe = () => void;

type ZenCore<T> = {
  _kind: 'zen';
  _value: T;
  _listeners?: Listener<T>[];
};

type ComputedCore<T> = {
  _kind: 'computed';
  _value: T | null;
  _dirty: boolean;
  _calc: () => T;
  _listeners?: Listener<T>[];
  _sources?: ZenCore<any>[];
  _sourceUnsubs?: Unsubscribe[];
};

export type AnyZen = ZenCore<any> | ComputedCore<any>;

// Global tracking
let currentListener: ComputedCore<any> | null = null;

// Batching
let batchDepth = 0;
const pendingNotifications: [AnyZen, any][] = [];

// ============================================================================
// ZEN (Signal)
// ============================================================================

const zenProto = {
  get value() {
    if (currentListener && !currentListener._sources) {
      currentListener._sources = [];
    }
    if (currentListener) {
      currentListener._sources?.push(this);
    }
    return this._value;
  },
  set value(newValue: any) {
    if (Object.is(newValue, this._value)) return;

    const oldValue = this._value;
    this._value = newValue;

    if (batchDepth > 0) {
      pendingNotifications.push([this, oldValue]);
      return;
    }

    const listeners = this._listeners;
    if (!listeners) return;

    for (let i = 0; i < listeners.length; i++) {
      listeners[i](newValue, oldValue);
    }
  },
};

export function zen<T>(initialValue: T): ZenCore<T> & { value: T } {
  const signal = Object.create(zenProto) as ZenCore<T> & { value: T };
  signal._kind = 'zen';
  signal._value = initialValue;
  signal._listeners = undefined;
  return signal;
}

export type Zen<T> = ReturnType<typeof zen<T>>;

// ============================================================================
// COMPUTED (Auto-tracking)
// ============================================================================

const computedProto = {
  get value() {
    if (this._dirty) {
      const prevListener = currentListener;
      currentListener = this;

      if (this._sources) {
        this._sources.length = 0;
      }

      this._value = this._calc();
      this._dirty = false;

      currentListener = prevListener;

      if (this._listeners && this._listeners.length > 0 && !this._sourceUnsubs) {
        this._subscribeToSources();
      }
    }

    if (currentListener && !currentListener._sources) {
      currentListener._sources = [];
    }
    if (currentListener) {
      currentListener._sources?.push(this);
    }

    return this._value;
  },

  _subscribeToSources() {
    if (!this._sources || this._sourceUnsubs) return;

    this._sourceUnsubs = [];
    const onSourceChange = () => {
      if (this._dirty) return;
      this._dirty = true;

      if (this._listeners && this._listeners.length > 0) {
        const oldValue = this._value;
        this._value = this._calc();
        this._dirty = false;

        const listeners = this._listeners;
        for (let i = 0; i < listeners.length; i++) {
          listeners[i](this._value, oldValue);
        }
      }
    };

    for (let i = 0; i < this._sources.length; i++) {
      const source = this._sources[i];
      if (!source._listeners) source._listeners = [];
      source._listeners.push(onSourceChange);

      this._sourceUnsubs.push(() => {
        const idx = source._listeners?.indexOf(onSourceChange) ?? -1;
        if (idx !== -1 && source._listeners) {
          const last = source._listeners.length - 1;
          if (idx !== last) source._listeners[idx] = source._listeners[last];
          source._listeners.pop();
        }
      });
    }
  },

  _unsubscribeFromSources() {
    if (!this._sourceUnsubs) return;
    for (let i = 0; i < this._sourceUnsubs.length; i++) {
      this._sourceUnsubs[i]();
    }
    this._sourceUnsubs = undefined;
  },
};

export function computed<T>(calculation: () => T): ComputedCore<T> & { value: T } {
  const c = Object.create(computedProto) as ComputedCore<T> & { value: T };
  c._kind = 'computed';
  c._value = null;
  c._dirty = true;
  c._calc = calculation;
  c._listeners = undefined;
  c._sources = undefined;
  c._sourceUnsubs = undefined;
  return c;
}

export type ReadonlyZen<T> = ComputedCore<T>;
export type ComputedZen<T> = ComputedCore<T>;

// ============================================================================
// BATCH
// ============================================================================

export function batch<T>(fn: () => T): T {
  batchDepth++;
  try {
    return fn();
  } finally {
    batchDepth--;
    if (batchDepth === 0 && pendingNotifications.length > 0) {
      const toNotify = pendingNotifications.splice(0);
      for (let i = 0; i < toNotify.length; i++) {
        const [zenItem, oldValue] = toNotify[i];
        const listeners = zenItem._listeners;
        if (listeners) {
          const newValue = zenItem._value;
          for (let j = 0; j < listeners.length; j++) {
            listeners[j](newValue, oldValue);
          }
        }
      }
    }
  }
}

// ============================================================================
// SUBSCRIBE
// ============================================================================

export function subscribe<A extends AnyZen>(
  zenItem: A,
  listener: Listener<any>,
): Unsubscribe {
  if (!zenItem._listeners) {
    zenItem._listeners = [];
  }
  zenItem._listeners.push(listener);

  if (zenItem._kind === 'computed' && zenItem._listeners.length === 1) {
    const _ = zenItem.value;
    (zenItem as any)._subscribeToSources();
  }

  listener(zenItem._value, undefined);

  return () => {
    const listeners = zenItem._listeners;
    if (!listeners) return;

    const idx = listeners.indexOf(listener);
    if (idx !== -1) {
      const last = listeners.length - 1;
      if (idx !== last) {
        listeners[idx] = listeners[last];
      }
      listeners.pop();

      if (listeners.length === 0) {
        zenItem._listeners = undefined;

        if (zenItem._kind === 'computed') {
          (zenItem as any)._unsubscribeFromSources();
        }
      }
    }
  };
}

// ============================================================================
// EFFECT (Auto-tracking)
// ============================================================================

export function effect(callback: () => undefined | (() => void)): Unsubscribe {
  let cleanup: (() => void) | undefined;
  let cancelled = false;

  const run = () => {
    if (cancelled) return;
    if (cleanup) cleanup();
    const result = callback();
    if (result) cleanup = result;
  };

  run();

  return () => {
    cancelled = true;
    if (cleanup) cleanup();
  };
}

// ============================================================================
// EXPORTS FOR COMPATIBILITY
// ============================================================================

export const notifyListeners = (zenItem: any, newValue: any, oldValue: any): void => {
  const listeners = zenItem._listeners;
  if (!listeners) return;
  for (let i = 0; i < listeners.length; i++) {
    listeners[i](newValue, oldValue);
  }
};

export const queueZenForBatch = (zenItem: AnyZen, oldValue: any): void => {
  if (batchDepth > 0) {
    pendingNotifications.push([zenItem, oldValue]);
  }
};

export { batchDepth };
