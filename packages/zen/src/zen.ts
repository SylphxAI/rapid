/**
 * Zen v3.47.0 - Simplified Reactive Core
 *
 * Removed unnecessary Solid.js complexity:
 * - 2-state system (CLEAN/DIRTY) instead of 3-state
 * - Direct source tracking instead of incremental
 * - Unified notification path
 * - Removed _oldValue tracking
 * - Cleaner code structure
 */

export type Listener<T> = (value: T, oldValue: T | undefined) => void;
export type Unsubscribe = () => void;

// ============================================================================
// CONSTANTS
// ============================================================================

const STATE_CLEAN = 0;
const STATE_DIRTY = 2;
const STATE_DISPOSED = 3;

const EFFECT_PURE = 0;
const EFFECT_USER = 2;

// ============================================================================
// GLOBALS
// ============================================================================

let currentObserver: Computation<any> | null = null;
let batchDepth = 0;
let clock = 0;

const pendingEffects: Computation<any>[] = [];
let pendingCount = 0;
let isFlushScheduled = false;

// ============================================================================
// INTERFACES
// ============================================================================

interface SourceType {
  _observers: ObserverType[] | null;
  _time: number;
  _update(): void;
}

interface ObserverType {
  _sources: SourceType[] | null;
  _time: number;
  _state: number;
  _notify(): void;
}

// ============================================================================
// SCHEDULER
// ============================================================================

function scheduleEffect(effect: Computation<any>) {
  if (effect._pending) return;

  effect._pending = true;
  pendingEffects[pendingCount++] = effect;

  if (!isFlushScheduled && batchDepth === 0) {
    isFlushScheduled = true;
    flushEffects();
  }
}

function flushEffects() {
  isFlushScheduled = false;

  if (pendingCount === 0) return;

  let error: any;

  while (pendingCount > 0) {
    clock++;
    const count = pendingCount;
    pendingCount = 0;

    for (let i = 0; i < count; i++) {
      const effect = pendingEffects[i];
      effect._pending = false;

      if (effect._state !== STATE_DISPOSED) {
        try {
          effect._run();
        } catch (err) {
          if (!error) error = err;
        }
      }
    }

    for (let i = 0; i < count; i++) {
      pendingEffects[i] = null as any;
    }
  }

  if (error) throw error;
}

// ============================================================================
// DEPENDENCY TRACKING
// ============================================================================

function track(source: SourceType) {
  if (!currentObserver) return;

  const observer = currentObserver;
  if (!observer._newSources) {
    observer._newSources = [source];
  } else if (source !== observer._newSources[observer._newSources.length - 1]) {
    observer._newSources.push(source);
  }
}

function removeObserver(observers: ObserverType[], observer: ObserverType) {
  const idx = observers.indexOf(observer);
  if (idx !== -1) {
    const last = observers.length - 1;
    if (idx < last) {
      observers[idx] = observers[last];
    }
    observers.pop();
  }
}

// ============================================================================
// COMPUTATION
// ============================================================================

class Computation<T> implements SourceType, ObserverType {
  _sources: SourceType[] | null = null;
  _observers: ObserverType[] | null = null;
  _state = STATE_DIRTY;
  _time = -1;

  _fn: () => T;
  _value: T;
  _error: any = undefined;

  _effectType: number;
  _cleanup: (() => void) | null = null;
  _pending = false;

  // Temporary during execution
  _newSources: SourceType[] | null = null;

  constructor(fn: () => T, initialValue: T, effectType: number = EFFECT_PURE) {
    this._fn = fn;
    this._value = initialValue;
    this._effectType = effectType;
  }

  read(): T {
    if (currentObserver) {
      track(this);
    }

    if (this._state === STATE_DIRTY) {
      this._update();
    }

    if (this._error !== undefined) {
      throw this._error;
    }

    return this._value;
  }

  write(value: T): void {
    if (Object.is(this._value, value)) return;

    this._value = value;
    this._time = ++clock;
    this._state = STATE_CLEAN;

    this._notifyObservers();
  }

  _update(): void {
    if (this._state === STATE_CLEAN || this._state === STATE_DISPOSED) return;

    // Validate sources first (lazy check)
    if (this._sources) {
      const myTime = this._time;
      let stillClean = true;

      for (let i = 0; i < this._sources.length; i++) {
        this._sources[i]._update();
        if (this._sources[i]._time > myTime) {
          stillClean = false;
          break;
        }
      }

      if (stillClean) {
        this._state = STATE_CLEAN;
        return;
      }
    }

    this._run();
  }

  _run(): void {
    this._error = undefined;

    if (this._cleanup) {
      this._cleanup();
      this._cleanup = null;
    }

    // Remove from old sources
    if (this._sources) {
      for (const source of this._sources) {
        if (source._observers) {
          removeObserver(source._observers, this);
        }
      }
      this._sources = null;
    }

    const prevObserver = currentObserver;
    currentObserver = this;
    this._newSources = null;

    try {
      const newValue = this._fn();
      const valueChanged = !Object.is(this._value, newValue);

      if (valueChanged) {
        this._value = newValue;
      }

      // Add to new sources
      if (this._newSources) {
        this._sources = this._newSources;
        for (const source of this._sources) {
          if (!source._observers) {
            source._observers = [this];
          } else {
            source._observers.push(this);
          }
        }
      }

      this._time = ++clock;
      this._state = STATE_CLEAN;

      if (valueChanged) {
        this._notifyObservers();
      }
    } catch (err) {
      this._error = err;
      this._state = STATE_CLEAN;
      throw err;
    } finally {
      currentObserver = prevObserver;
      this._newSources = null;
    }
  }

  _notify(): void {
    if (this._state === STATE_DIRTY || this._state === STATE_DISPOSED) {
      return;
    }

    this._state = STATE_DIRTY;

    if (this._effectType !== EFFECT_PURE) {
      scheduleEffect(this);
    }

    this._notifyObservers();
  }

  _notifyObservers(): void {
    const observers = this._observers;
    if (!observers) return;

    for (let i = 0; i < observers.length; i++) {
      observers[i]._notify();
    }
  }

  dispose(): void {
    if (this._state === STATE_DISPOSED) return;

    this._state = STATE_DISPOSED;

    if (this._sources) {
      for (const source of this._sources) {
        if (source._observers) {
          removeObserver(source._observers, this);
        }
      }
      this._sources = null;
    }

    if (this._cleanup) {
      this._cleanup();
      this._cleanup = null;
    }

    if (this._pending) {
      this._pending = false;
    }
  }
}

// ============================================================================
// SIGNAL
// ============================================================================

class Signal<T> implements SourceType {
  _value: T;
  _observers: ObserverType[] | null = null;
  _time = 0;

  constructor(initial: T) {
    this._value = initial;
  }

  get value(): T {
    if (currentObserver) {
      track(this);
    }
    return this._value;
  }

  set value(next: T) {
    if (Object.is(this._value, next)) return;

    this._value = next;
    this._time = ++clock;

    const observers = this._observers;
    if (!observers) return;

    batchDepth++;
    for (let i = 0; i < observers.length; i++) {
      observers[i]._notify();
    }
    batchDepth--;

    if (batchDepth === 0 && pendingCount > 0 && !isFlushScheduled) {
      isFlushScheduled = true;
      flushEffects();
    }
  }

  _update(): void {
    // Signals are always up to date
  }
}

// ============================================================================
// PUBLIC API
// ============================================================================

export interface ZenNode<T> {
  readonly value: T;
  value: T;
}

export interface ComputedNode<T> {
  readonly value: T;
}

export function zen<T>(initial: T): ZenNode<T> {
  return new Signal(initial) as any;
}

export function computed<T>(fn: () => T): ComputedNode<T> {
  const c = new Computation(fn, undefined as any, EFFECT_PURE);

  const node = {
    get value() {
      return c.read();
    },
  } as any;

  node._computation = c;

  return node;
}

export function effect(fn: () => undefined | (() => void)): Unsubscribe {
  const e = new Computation(
    () => {
      const cleanup = fn();
      if (cleanup && typeof cleanup === 'function') {
        e._cleanup = cleanup;
      }
      return undefined;
    },
    undefined,
    EFFECT_USER,
  );

  if (batchDepth > 0) {
    scheduleEffect(e);
  } else {
    e._run();
  }

  return () => e.dispose();
}

export function subscribe<T>(
  node: ZenNode<T> | ComputedNode<T>,
  listener: Listener<T>,
): Unsubscribe {
  let hasValue = false;
  let previousValue!: T;

  return effect(() => {
    const currentValue = (node as any).value;

    if (!hasValue) {
      hasValue = true;
      previousValue = currentValue;
      return;
    }

    listener(currentValue, previousValue);
    previousValue = currentValue;
  });
}

export function batch<T>(fn: () => T): T {
  batchDepth++;
  try {
    return fn();
  } finally {
    batchDepth--;
    if (batchDepth === 0 && !isFlushScheduled && pendingCount > 0) {
      isFlushScheduled = true;
      flushEffects();
    }
  }
}

export function untrack<T>(fn: () => T): T {
  const prev = currentObserver;
  currentObserver = null;
  try {
    return fn();
  } finally {
    currentObserver = prev;
  }
}

export function peek<T>(node: ZenNode<T> | ComputedNode<T>): T {
  return untrack(() => (node as any).value);
}

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type { ZenNode as ZenCore, ComputedNode as ComputedCore };
export type { ZenNode as Zen, ZenNode as ReadonlyZen, ComputedNode as ComputedZen };
export type { Unsubscribe as AnyZen };
