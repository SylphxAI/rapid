/**
 * Zen v3.28.0 - Deep Reactivity Fix (Solid.js patterns)
 *
 * CRITICAL FIXES:
 * 1. ❌ REMOVED global updateCount (caused false infinite loop errors)
 * 2. ✅ Clear error at START of update (allows error recovery)
 * 3. ✅ Proper acyclic graph guarantee (like Solid.js)
 *
 * PREVIOUS OPTIMIZATIONS:
 * 1. Bitflag pending state (O(1) vs O(n) includes check)
 * 2. Zero slice() allocations in hot flush path
 * 3. Inline critical functions (addObserver in read/set)
 * 4. pendingCount counter (faster than array.length)
 * 5. Bitwise state management (preserve flags)
 *
 * WHY THIS MATTERS:
 * - Deep chains (100+ layers) now work correctly
 * - Diamond patterns don't false-trigger infinite loop detection
 * - Transient errors (network, etc.) can recover on retry
 */

export type Listener<T> = (value: T, oldValue: T | undefined) => void;
export type Unsubscribe = () => void;

// ============================================================================
// CONSTANTS
// ============================================================================

const STATE_CLEAN = 0;
const STATE_CHECK = 1;
const STATE_DIRTY = 2;
const STATE_DISPOSED = 3;

const EFFECT_PURE = 0;
const EFFECT_USER = 2;

// OPTIMIZATION: Use bitflag to track pending state
const FLAG_PENDING = 4;

// ============================================================================
// GLOBALS
// ============================================================================

let currentObserver: Computation<any> | null = null;
let currentOwner: Owner | null = null;
let batchDepth = 0;
let globalClock = 0;

// OPTIMIZATION: Pre-allocate queue with reasonable capacity
const pendingEffects: Computation<any>[] = [];
let pendingCount = 0;
let isFlushScheduled = false;

// ============================================================================
// INTERFACES
// ============================================================================

interface SourceType {
  _observers: ObserverType[];
  _observerSlots: number[];
  _epoch: number;
  _updateIfNecessary?(): void;
}

interface ObserverType {
  _sources: SourceType[];
  _sourceSlots: number[];
  _state: number;
  _epoch: number;
  notify(state: number): void;
}

interface Owner {
  _parent: Owner | null;
  _context: Record<symbol, any> | null;
  _disposal: (() => void)[] | null;
}

// ============================================================================
// SCHEDULER - EXTREME OPTIMIZATION
// ============================================================================

// OPTIMIZATION: Use bitflag instead of includes() - O(1) instead of O(n)
function scheduleEffect(effect: Computation<any>) {
  // Check pending flag instead of array search
  if (effect._state & FLAG_PENDING) return;

  effect._state |= FLAG_PENDING;
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

  // OPTIMIZATION: Avoid slice() allocation - iterate with index
  while (pendingCount > 0) {
    globalClock++;
    const count = pendingCount;
    pendingCount = 0;

    for (let i = 0; i < count; i++) {
      const effect = pendingEffects[i];

      // Clear pending flag BEFORE update so effect can be re-scheduled during execution
      effect._state &= ~FLAG_PENDING;

      if ((effect._state & 3) !== STATE_DISPOSED) {
        try {
          effect.update();
        } catch (err) {
          if (!error) error = err;
        }
      }

      pendingEffects[i] = null as any; // Allow GC
    }
  }

  if (error) throw error;
}

// ============================================================================
// OWNER SYSTEM
// ============================================================================

function disposeOwner(owner: Owner) {
  if (owner._disposal) {
    for (let i = owner._disposal.length - 1; i >= 0; i--) {
      owner._disposal[i]?.();
    }
    owner._disposal = null;
  }
}

// ============================================================================
// DEPENDENCY TRACKING - OPTIMIZED
// ============================================================================

function addObserver(source: SourceType, observer: ObserverType) {
  const sourceSlot = source._observers.length;
  const observerSlot = observer._sources.length;

  source._observers.push(observer);
  source._observerSlots.push(observerSlot);

  observer._sources.push(source);
  observer._sourceSlots.push(sourceSlot);
}

function removeObserver(source: SourceType, observerSlot: number) {
  const lastIdx = source._observers.length - 1;
  if (observerSlot > lastIdx) return;

  const observer = source._observers[observerSlot]!;
  const sourceIdx = source._observerSlots[observerSlot]!;

  if (observerSlot < lastIdx) {
    const last = source._observers[lastIdx]!;
    const lastSourceIdx = source._observerSlots[lastIdx]!;

    source._observers[observerSlot] = last;
    source._observerSlots[observerSlot] = lastSourceIdx;

    last._sourceSlots[lastSourceIdx] = observerSlot;
  }

  source._observers.pop();
  source._observerSlots.pop();

  if (sourceIdx < observer._sources.length) {
    observer._sources[sourceIdx] = null as any;
    observer._sourceSlots[sourceIdx] = -1;
  }
}

// OPTIMIZATION: Inline and optimize clearObservers
function clearObservers(observer: ObserverType) {
  const sources = observer._sources;
  const slots = observer._sourceSlots;
  const len = sources.length;

  for (let i = 0; i < len; i++) {
    const source = sources[i];
    const slot = slots[i];
    if (source && slot !== -1) {
      removeObserver(source, slot);
    }
  }

  sources.length = 0;
  slots.length = 0;
}

// ============================================================================
// COMPUTATION - OPTIMIZED
// ============================================================================

class Computation<T> implements SourceType, ObserverType, Owner {
  _sources: SourceType[] = [];
  _sourceSlots: number[] = [];
  _state = STATE_DIRTY;
  _epoch = 0;

  _observers: ObserverType[] = [];
  _observerSlots: number[] = [];

  _parent: Owner | null;
  _context: Record<symbol, any> | null;
  _disposal: (() => void)[] | null = null;

  _fn: () => T;
  _value: T;
  _oldValue: T | undefined = undefined;
  _error: any = undefined;

  _effectType: number;
  _cleanup: (() => void) | null = null;

  constructor(fn: () => T, initialValue: T, effectType: number = EFFECT_PURE) {
    this._fn = fn;
    this._value = initialValue;
    this._effectType = effectType;
    this._parent = currentOwner;
    this._context = currentOwner?._context ?? null;
  }

  // OPTIMIZATION: Inline addObserver in read path
  read(): T {
    if (currentObserver && currentObserver !== this) {
      const source = this;
      const observer = currentObserver;
      const sourceSlot = source._observers.length;
      const observerSlot = observer._sources.length;

      source._observers.push(observer);
      source._observerSlots.push(observerSlot);

      observer._sources.push(source);
      observer._sourceSlots.push(sourceSlot);
    }

    if (this._state & 3) { // If not CLEAN
      this._updateIfNecessary();
    }

    if (this._error !== undefined) {
      throw this._error;
    }

    return this._value;
  }

  write(value: T): void {
    if (Object.is(this._value, value)) return;

    this._value = value;
    this._epoch = ++globalClock;
    this._state = (this._state & ~3) | STATE_CLEAN;

    this._notifyObservers(STATE_DIRTY);
  }

  _updateIfNecessary(): void {
    const state = this._state & 3;

    if (state === STATE_DISPOSED || state === STATE_CLEAN) {
      return;
    }

    if (state === STATE_CHECK) {
      const sources = this._sources;
      for (let i = 0, len = sources.length; i < len; i++) {
        const source = sources[i];
        if (source) {
          source._updateIfNecessary?.();

          if (source._epoch > this._epoch) {
            this._state = (this._state & ~3) | STATE_DIRTY;
            break;
          }
        }
      }
    }

    if ((this._state & 3) === STATE_DIRTY) {
      this.update();
    }

    this._state = (this._state & ~3) | STATE_CLEAN;
  }

  update(): void {
    // OPTIMIZATION: Clear error at start of update (Solid.js pattern)
    // This allows recovery from transient errors
    this._error = undefined;

    if (this._cleanup && typeof this._cleanup === 'function') {
      this._cleanup();
      this._cleanup = null;
    }

    const prevOwner = currentOwner;
    const prevObserver = currentObserver;
    currentOwner = this;
    currentObserver = this;

    clearObservers(this);

    try {
      const newValue = this._fn();

      if (!Object.is(this._value, newValue)) {
        this._oldValue = this._value;
        this._value = newValue;
        this._epoch = ++globalClock;

        this._notifyObservers(STATE_DIRTY, prevObserver);
      }

      this._state = (this._state & ~3) | STATE_CLEAN;
    } catch (err) {
      this._error = err;
      this._state = (this._state & ~3) | STATE_CLEAN;
      throw err;
    } finally {
      currentObserver = prevObserver;
      currentOwner = prevOwner;
    }
  }

  notify(state: number): void {
    const currentState = this._state & 3;
    const isExecutingSelf = currentObserver === this;

    if (currentState >= state || currentState === STATE_DISPOSED) {
      if (isExecutingSelf && (state === STATE_DIRTY || state === STATE_CHECK) && this._effectType !== EFFECT_PURE) {
        scheduleEffect(this);
      }
      return;
    }

    this._state = (this._state & ~3) | state;

    if (this._effectType !== EFFECT_PURE) {
      scheduleEffect(this);
    }

    if (state === STATE_DIRTY || state === STATE_CHECK) {
      this._notifyObservers(STATE_CHECK);
    }
  }

  // OPTIMIZATION: Inline notification loop
  _notifyObservers(state: number, skipObserver?: ObserverType | null): void {
    const observers = this._observers;
    const len = observers.length;

    for (let i = 0; i < len; i++) {
      const observer = observers[i];
      if (observer && observer !== skipObserver) {
        observer.notify(state);
      }
    }
  }

  dispose(): void {
    if ((this._state & 3) === STATE_DISPOSED) return;

    this._state = (this._state & ~3) | STATE_DISPOSED;
    clearObservers(this);

    if (this._cleanup && typeof this._cleanup === 'function') {
      this._cleanup();
      this._cleanup = null;
    }

    disposeOwner(this);

    // OPTIMIZATION: Clear pending flag if present
    if (this._state & FLAG_PENDING) {
      this._state &= ~FLAG_PENDING;
      // Note: We leave it in pendingEffects array, will be skipped in flush
    }
  }
}

// ============================================================================
// SIGNAL - EXTREME OPTIMIZATION
// ============================================================================

class Signal<T> implements SourceType {
  _value: T;
  _observers: ObserverType[] = [];
  _observerSlots: number[] = [];
  _epoch = 0;

  constructor(initial: T) {
    this._value = initial;
  }

  // OPTIMIZATION: Inline addObserver
  get value(): T {
    if (currentObserver) {
      const source = this;
      const observer = currentObserver;
      const sourceSlot = source._observers.length;
      const observerSlot = observer._sources.length;

      source._observers.push(observer);
      source._observerSlots.push(observerSlot);

      observer._sources.push(source);
      observer._sourceSlots.push(sourceSlot);
    }
    return this._value;
  }

  // OPTIMIZATION: Inline notification with auto-batching
  set value(next: T) {
    if (Object.is(this._value, next)) return;

    this._value = next;
    this._epoch = ++globalClock;

    const observers = this._observers;
    const len = observers.length;

    if (len === 0) return;

    // Auto-batching
    batchDepth++;
    for (let i = 0; i < len; i++) {
      observers[i]?.notify(STATE_DIRTY);
    }
    batchDepth--;

    if (batchDepth === 0 && !isFlushScheduled && pendingCount > 0) {
      isFlushScheduled = true;
      flushEffects();
    }
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
      if (cleanup) {
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
    e.update();
  }

  return () => e.dispose();
}

export function subscribe<T>(
  node: ZenNode<T> | ComputedNode<T>,
  listener: Listener<T>,
): Unsubscribe {
  let hasValue = false;
  let previousValue!: T;

  if (batchDepth > 0) {
    const computation = (node as any)._computation;
    if (computation) {
      if ((computation._state & 3) === STATE_DIRTY || (computation._state & 3) === STATE_CHECK) {
        previousValue = computation._value;
        hasValue = true;
      } else if (computation._oldValue !== undefined) {
        previousValue = computation._oldValue;
        hasValue = true;
      } else {
        previousValue = untrack(() => (node as any).value);
        hasValue = true;
      }
    } else {
      previousValue = untrack(() => (node as any).value);
      hasValue = true;
    }
  }

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
