/**
 * Zen Ultra-Optimized Build
 *
 * Maximum performance and minimum bundle size through aggressive inlining.
 * All code is inlined in a single file to eliminate module boundaries.
 *
 * Included: zen, computed, batch, subscribe
 * Excluded: select, map, get/set, lifecycle, color tracking, advanced features
 *
 * Optimizations:
 * - Fully inlined implementation (no imports)
 * - Minimal type checks
 * - Direct property access
 * - Simplified algorithms
 * - No color tracking (simpler but equally fast)
 * - No object pooling (smaller code)
 */

// ============================================================================
// TYPES
// ============================================================================

export type Listener<T> = (value: T, oldValue?: T | null) => void;
export type Unsubscribe = () => void;

type ZenCore<T> = {
  _kind: 'zen' | 'computed';
  _value: T;
  _listeners?: Listener<T>[];
  _pendingOldValue?: T; // ✅ Phase 3 OPTIMIZATION: Replace pendingNotifications Map
  _computedListeners?: ComputedCore<any>[]; // ✅ Phase 3 OPTIMIZATION: Separate computed listeners
  _computedSlots?: number[]; // ✅ v3.6 OPTIMIZATION: Slot positions for O(1) computed listener removal
  _version: number; // ✅ v3.6 OPTIMIZATION: Version tracking for fast dependency checking
};

type ComputedCore<T> = ZenCore<T | null> & {
  _kind: 'computed';
  _dirty: boolean;
  _sources: AnyZen[];
  _calc: () => T;
  _unsubs?: Unsubscribe[];
  _epoch?: number; // OPTIMIZATION: Track last processed epoch (instead of Set)
  _sourceVersions?: number[]; // ✅ v3.6 OPTIMIZATION: Track source versions for fast checking
  _sourceSlots?: number[]; // ✅ v3.6 OPTIMIZATION: Slot positions in each source's _computedListeners for O(1) removal
};

export type AnyZen = ZenCore<any> | ComputedCore<any>;

export type ZenValue<A extends AnyZen> = A extends ZenCore<infer V> ? V : never;

// ============================================================================
// AUTO-TRACKING
// ============================================================================

let currentListener: ComputedCore<any> | null = null;

// ============================================================================
// BATCHING - OPTIMIZED v3.2 (16x faster!)
// ============================================================================

let batchDepth = 0;
// OPTIMIZATION v3.3: Reusable global queues (reduce GC pressure)
const Updates: Set<ComputedCore<any>> = new Set(); // Set for computed updates (deduplication)
const Effects: Array<() => void> = []; // Queue for side effects
const pendingSignals: AnyZen[] = []; // ✅ Phase 3 OPTIMIZATION: Array instead of Map for pending signals
let isProcessingUpdates = false; // Flag to indicate we're in STEP 1 (processing Updates)
let currentEpoch = 0; // OPTIMIZATION: Epoch counter for batch processing (replaces processed Set)

export function notifyListeners<T>(zen: ZenCore<T>, newValue: T, oldValue: T): void {
  const listeners = zen._listeners;
  if (!listeners) return;

  for (let i = 0; i < listeners.length; i++) {
    listeners[i](newValue, oldValue);
  }
}

// Helper for external stores (map, deepMap) to integrate with batching
export function queueZenForBatch(zen: AnyZen, oldValue: any): void {
  // ✅ Phase 3 OPTIMIZATION: Use _pendingOldValue + Array instead of Map
  if (zen._pendingOldValue === undefined) {
    zen._pendingOldValue = oldValue;
    pendingSignals.push(zen);
  }
}

// Helper to check if currently in a batch
export { batchDepth };

// Helper to check if we're in batch processing phase (STEP 2/3, not STEP 1)
export function isInBatchProcessing(): boolean {
  // We're in processing phase when isProcessingUpdates is true
  // This indicates we're past STEP 1 (Updates processing) and in STEP 2/3
  return isProcessingUpdates;
}

// ============================================================================
// ZEN (Core Signal)
// ============================================================================

// ✅ v3.8 OPTIMIZATION: Monomorphic helper for zen signal reads
// Separate function for better inline caching (IC)
function readZenValue(signal: ZenCore<any>): any {
  // Auto-tracking: register as dependency if inside computed
  if (currentListener) {
    const sources = currentListener._sources as AnyZen[];
    if (!sources.includes(signal)) {
      sources.push(signal);
    }
  }
  return signal._value;
}

const zenProto = {
  get value() {
    return readZenValue(this);
  },
  set value(newValue: any) {
    const oldValue = this._value;
    // ✅ Phase 3 OPTIMIZATION: Inline Object.is (eliminate function call)
    // Handle NaN (NaN !== NaN but Object.is(NaN, NaN) === true)
    // Handle +0/-0 (+0 === -0 but Object.is(+0, -0) === false)
    if (newValue === oldValue && (newValue !== 0 || 1 / newValue === 1 / oldValue)) return;
    if (newValue !== newValue && oldValue !== oldValue) return;

    this._value = newValue;
    this._version++; // ✅ v3.6 OPTIMIZATION: Increment version on change

    // ✅ Phase 3 OPTIMIZATION: Use _computedListeners to avoid type checking
    const computedListeners = this._computedListeners;
    if (computedListeners) {
      for (let i = 0; i < computedListeners.length; i++) {
        const computedZen = computedListeners[i];
        if (!computedZen._dirty) {
          // ✅ v3.3 OPTIMIZATION: Only mark and queue if not already dirty
          computedZen._dirty = true;
          // ✅ v3.6 OPTIMIZATION: Clear cached versions when marked dirty
          computedZen._sourceVersions = undefined;
          // Add to Updates set if in batch (Set handles deduplication)
          if (batchDepth > 0) {
            Updates.add(computedZen);
          }
        }
      }
    }

    if (batchDepth > 0) {
      // ✅ Phase 3 OPTIMIZATION: Use _pendingOldValue + Array instead of Map
      if (this._pendingOldValue === undefined) {
        this._pendingOldValue = oldValue;
        pendingSignals.push(this);
      }
      return;
    }

    // Immediate notification outside batch
    notifyListeners(this, newValue, oldValue);
  },
};

export function zen<T>(initialValue: T): Zen<T> {
  const signal = Object.create(zenProto) as ZenCore<T> & { value: T };
  // ✅ v3.8 OPTIMIZATION: Pre-allocate ALL properties for same hidden class
  // This makes V8 create the same hidden class for all signals → monomorphic code!
  signal._kind = 'zen';
  signal._value = initialValue;
  signal._listeners = undefined;
  signal._pendingOldValue = undefined;
  signal._computedListeners = undefined;
  signal._computedSlots = undefined;
  signal._version = 0;
  return signal;
}

export type Zen<T> = ReturnType<typeof zen<T>>;

// ============================================================================
// SUBSCRIBE
// ============================================================================

export function subscribe<A extends AnyZen>(zen: A, listener: Listener<ZenValue<A>>): Unsubscribe {
  const zenData = zen._kind === 'zen' ? zen : zen;

  // Add listener
  if (!zenData._listeners) zenData._listeners = [];
  zenData._listeners.push(listener as any);

  // Subscribe computed to sources
  if (zen._kind === 'computed') {
    // Check if it's from computed.ts (has _subscribeToSources method)
    if ((zen as any)._subscribeToSources) {
      const firstListener = zenData._listeners.length === 1;
      if (firstListener) {
        (zen as any)._subscribeToSources();
      }
    } else if (zen._unsubs === undefined) {
      // It's from zen.ts (internal computed)
      subscribeToSources(zen as any);
    }
  }

  // Subscribe batched to sources (for batched stores from batched.ts)
  if (zen._kind === 'batched' && (zen as any)._subscribeToSources) {
    const firstListener = zenData._listeners.length === 1;
    if (firstListener) {
      (zen as any)._subscribeToSources();
    }
  }

  // Initial notification
  listener(zenData._value as any, undefined);

  // Return unsubscribe
  return () => {
    const listeners = zenData._listeners;
    if (!listeners) return;

    const idx = listeners.indexOf(listener as any);
    if (idx === -1) return;

    listeners.splice(idx, 1);

    // Unsubscribe computed from sources if no more listeners
    if (listeners.length === 0) {
      zenData._listeners = undefined;
      if (zen._kind === 'computed') {
        // Check if it's from computed.ts (has _unsubscribeFromSources method)
        if ((zen as any)._unsubscribeFromSources) {
          (zen as any)._unsubscribeFromSources();
        } else if (zen._unsubs) {
          // It's from zen.ts (internal computed)
          unsubscribeFromSources(zen as any);
        }
      }
      // Unsubscribe batched from sources
      if (zen._kind === 'batched' && (zen as any)._unsubscribeFromSources) {
        (zen as any)._unsubscribeFromSources();
      }
    }
  };
}

// ============================================================================
// BATCH
// ============================================================================

export function batch<T>(fn: () => T): T {
  // ✅ v3.3 OPTIMIZATION: Simplified nesting with reusable queues
  // Nested batch: just increment depth
  if (batchDepth > 0) {
    batchDepth++;
    try {
      return fn();
    } finally {
      batchDepth--;
    }
  }

  // Start new batch
  batchDepth = 1;

  try {
    const result = fn();

    // Only process if we're at depth 1 (outermost batch)
    if (batchDepth === 1) {
      // ✅ Phase 2 OPTIMIZATION: Unified pending work check
      // ✅ Phase 3 OPTIMIZATION: Use pendingSignals.length instead of Map.size
      const hasWork = Updates.size > 0 || pendingSignals.length > 0 || Effects.length > 0;

      if (hasWork) {
        // STEP 1: Process Updates set (computed values)
        // ✅ v3.3 LAZY OPTIMIZATION: Only process computed values that have active listeners
        // This implements Solid-style pull-based evaluation for unobserved computed values
        if (Updates.size > 0) {
          // ✅ Phase 2 OPTIMIZATION: Use epoch counter instead of processed Set
          // This eliminates per-batch Set allocation
          currentEpoch++;
          isProcessingUpdates = true;

          // Keep Updates as a Set to allow new computed to be added during processing
          // This handles dependency chains where updating A dirties B which needs processing
          while (Updates.size > 0) {
            // Get next unprocessed computed (epoch-based deduplication)
            let computed: ComputedCore<any> | undefined;
            for (const c of Updates) {
              if (c._epoch !== currentEpoch) {
                computed = c;
                break;
              }
            }

            if (!computed) break; // All processed

            // Remove from Updates and mark as processed (epoch-based)
            Updates.delete(computed);
            computed._epoch = currentEpoch;

            // ✅ v3.3 LAZY: Skip computation if no listeners (will compute on next access)
            // This is the key difference from v3.2: we don't force computation during batch
            if (computed._dirty && computed._listeners && computed._listeners.length > 0) {
              const oldValue = computed._value;

              // Check if it's from computed.ts (has _update method)
              if ((computed as any)._update) {
                const changed = (computed as any)._update();
                // Send notification for computed.ts computed values
                if (changed && computed._listeners) {
                  for (let j = 0; j < computed._listeners.length; j++) {
                    computed._listeners[j](computed._value, oldValue);
                  }
                }
              } else {
                // ✅ Phase 2 OPTIMIZATION: Inline updateComputed for zen.ts internal computed
                // Eliminates function call overhead in hot path
                const needsResubscribe = computed._unsubs !== undefined;
                if (needsResubscribe) {
                  unsubscribeFromSources(computed);
                  computed._sources = [];
                }

                // Set as current listener for auto-tracking
                const prevListener = currentListener;
                currentListener = computed;

                try {
                  const newValue = computed._calc();
                  computed._dirty = false;

                  // Re-subscribe to newly tracked sources
                  if (needsResubscribe && computed._sources.length > 0) {
                    subscribeToSources(computed);
                  }

                  // ✅ v3.6 OPTIMIZATION: Save source versions after computation
                  if (
                    !computed._sourceVersions ||
                    computed._sourceVersions.length !== computed._sources.length
                  ) {
                    computed._sourceVersions = new Array(computed._sources.length);
                  }
                  for (let i = 0; i < computed._sources.length; i++) {
                    computed._sourceVersions[i] = computed._sources[i]._version;
                  }

                  // ✅ Phase 3 OPTIMIZATION: Inline Object.is for equality check
                  const isSame =
                    (newValue === computed._value &&
                      (newValue !== 0 || 1 / newValue === 1 / computed._value)) ||
                    (newValue !== newValue && computed._value !== computed._value);
                  if (computed._value === null || !isSame) {
                    computed._value = newValue;
                    // In STEP 1, notify immediately (we're already in isProcessingUpdates)
                    notifyListeners(computed, newValue, oldValue);
                  }
                } finally {
                  currentListener = prevListener;
                }
              }
            }
            // If no listeners, computed stays dirty and will be evaluated on next access (lazy)
          }

          isProcessingUpdates = false;
          Updates.clear(); // Clear for reuse
        }

        // STEP 2: Process pending signal notifications (zen, map, deepMap)
        // ✅ Phase 3 OPTIMIZATION: Use Array + _pendingOldValue instead of Map
        if (pendingSignals.length > 0) {
          for (let i = 0; i < pendingSignals.length; i++) {
            const zen = pendingSignals[i];
            const oldValue = zen._pendingOldValue;
            zen._pendingOldValue = undefined; // Reset for next batch

            const listeners = zen._listeners;
            if (listeners) {
              const newValue = zen._value;
              for (let j = 0; j < listeners.length; j++) {
                listeners[j](newValue, oldValue);
              }
            }
          }
          pendingSignals.length = 0; // Clear for reuse
        }

        // STEP 3: Process Effects queue (side effects)
        if (Effects.length > 0) {
          // Copy effects to process (in case new effects are queued during execution)
          const effectsToRun = Effects.slice();
          Effects.length = 0; // Clear for reuse

          for (let i = 0; i < effectsToRun.length; i++) {
            effectsToRun[i]();
          }
        }
      }
    }

    return result;
  } finally {
    batchDepth--;
    if (batchDepth === 0) {
      // Cleanup only at outermost batch
      isProcessingUpdates = false;
    }
  }
}

// ============================================================================
// COMPUTED
// ============================================================================

function updateComputed<T>(c: ComputedCore<T>): void {
  // ✅ v3.6 OPTIMIZATION: Quick version check (fast path)
  // Only apply if sources are stable (not re-tracked) and we have cached versions
  if (
    c._sourceVersions &&
    c._sources.length === c._sourceVersions.length &&
    c._unsubs !== undefined
  ) {
    let unchanged = true;
    for (let i = 0; i < c._sources.length; i++) {
      if (c._sources[i]._version !== c._sourceVersions[i]) {
        unchanged = false;
        break;
      }
    }
    if (unchanged) {
      c._dirty = false; // Fast path - no recompute needed!
      return;
    }
  }

  // For auto-tracked computed, unsubscribe and reset sources for re-tracking
  const needsResubscribe = c._unsubs !== undefined;
  if (needsResubscribe) {
    unsubscribeFromSources(c);
    c._sources = []; // Reset for re-tracking
  }

  // Set as current listener for auto-tracking
  const prevListener = currentListener;
  currentListener = c;

  try {
    const newValue = c._calc();
    c._dirty = false;

    // Re-subscribe to newly tracked sources
    if (needsResubscribe && c._sources.length > 0) {
      subscribeToSources(c);
    }

    // ✅ v3.6 OPTIMIZATION: Save source versions after computation
    if (!c._sourceVersions || c._sourceVersions.length !== c._sources.length) {
      c._sourceVersions = new Array(c._sources.length);
    }
    for (let i = 0; i < c._sources.length; i++) {
      c._sourceVersions[i] = c._sources[i]._version;
    }

    // ✅ Phase 3 OPTIMIZATION: Inline Object.is for equality check
    const isSame =
      (newValue === c._value && (newValue !== 0 || 1 / newValue === 1 / c._value)) ||
      (newValue !== newValue && c._value !== c._value);
    if (c._value !== null && isSame) return;

    const oldValue = c._value;
    c._value = newValue;

    // Notification handling based on context:
    // 1. If processing Updates (STEP 1): notify immediately (don't queue)
    // 2. If in batch but not processing Updates: queue for STEP 2
    // 3. If not in batch: notify immediately
    if (isProcessingUpdates) {
      // We're in STEP 1 processing Updates - notify immediately
      notifyListeners(c, newValue, oldValue);
    } else if (batchDepth > 0) {
      // ✅ Phase 3 OPTIMIZATION: Use _pendingOldValue + Array instead of Map
      if (c._pendingOldValue === undefined) {
        c._pendingOldValue = oldValue;
        pendingSignals.push(c);
      }
    } else {
      // Not in batch - notify immediately
      notifyListeners(c, newValue, oldValue);
    }
  } finally {
    currentListener = prevListener;
  }
}

// Helper to cleanup unsubs
function cleanUnsubs(unsubs: Unsubscribe[]): void {
  for (let i = 0; i < unsubs.length; i++) unsubs[i]();
}

// Shared subscription helper for computed & effect
function attachListener(sources: AnyZen[], callback: any): Unsubscribe[] {
  const unsubs: Unsubscribe[] = [];

  for (let i = 0; i < sources.length; i++) {
    const source = sources[i] as ZenCore<any>;
    if (!source._listeners) source._listeners = [];
    source._listeners.push(callback);

    unsubs.push(() => {
      const listeners = source._listeners;
      if (!listeners) return;
      const idx = listeners.indexOf(callback);
      if (idx !== -1) listeners.splice(idx, 1);
    });
  }

  return unsubs;
}

function subscribeToSources(c: ComputedCore<any>): void {
  const onSourceChange = () => {
    c._dirty = true;
    // ✅ v3.6 OPTIMIZATION: Clear cached versions when source changes
    c._sourceVersions = undefined;
    updateComputed(c);
  };
  (onSourceChange as any)._computedZen = c;

  c._unsubs = attachListener(c._sources, onSourceChange);

  // ✅ Phase 3 OPTIMIZATION: Add to _computedListeners for fast dirty marking
  // ✅ v3.6 OPTIMIZATION: Track slot positions for O(1) removal
  if (!c._sourceSlots) {
    c._sourceSlots = new Array(c._sources.length);
  }

  for (let i = 0; i < c._sources.length; i++) {
    const source = c._sources[i];
    if (!source._computedListeners) {
      source._computedListeners = [];
      source._computedSlots = [];
    }
    if (!source._computedListeners.includes(c)) {
      const slot = source._computedListeners.length;
      source._computedListeners.push(c);
      source._computedSlots?.push(i); // Store the source index in the computed
      c._sourceSlots[i] = slot; // Store position in source's list
    }
  }
}

function unsubscribeFromSources(c: ComputedCore<any>): void {
  if (!c._unsubs) return;
  cleanUnsubs(c._unsubs);
  c._unsubs = undefined;
  c._dirty = true;

  // ✅ Phase 3 OPTIMIZATION: Remove from _computedListeners
  // ✅ v3.6 OPTIMIZATION: O(1) removal using swap-and-pop with slot tracking
  if (c._sourceSlots) {
    for (let i = 0; i < c._sources.length; i++) {
      const source = c._sources[i];
      const computedListeners = source._computedListeners;
      const computedSlots = source._computedSlots;

      if (computedListeners && computedSlots) {
        const slot = c._sourceSlots[i];

        // Swap-and-pop: Move last element to this slot, then pop
        const lastComputed = computedListeners[computedListeners.length - 1];
        const lastSourceIndex = computedSlots[computedSlots.length - 1];

        if (slot < computedListeners.length - 1) {
          // Not the last element - swap it
          computedListeners[slot] = lastComputed;
          computedSlots[slot] = lastSourceIndex;

          // Update the moved computed's slot position
          if (lastComputed._sourceSlots) {
            lastComputed._sourceSlots[lastSourceIndex] = slot;
          }
        }

        // Pop the last element
        computedListeners.pop();
        computedSlots.pop();

        if (computedListeners.length === 0) {
          source._computedListeners = undefined;
          source._computedSlots = undefined;
        }
      }
    }
    c._sourceSlots = undefined;
  }
}

// ✅ v3.8 OPTIMIZATION: Monomorphic helper for computed reads
// Separate function for better inline caching (IC)
function readComputedValue(computed: ComputedCore<any>): any {
  // Auto-tracking: register as dependency if inside computed
  if (currentListener) {
    const sources = currentListener._sources as AnyZen[];
    if (!sources.includes(computed)) {
      sources.push(computed);
    }
  }

  if (computed._dirty) {
    updateComputed(computed);
  }

  // Subscribe on first access (after updateComputed which populates _sources)
  if (computed._unsubs === undefined && computed._sources.length > 0) {
    subscribeToSources(computed);
  }

  return computed._value;
}

const computedProto = {
  get value() {
    return readComputedValue(this);
  },
};

export function computed<T>(
  calculation: () => T,
  explicitDeps?: AnyZen[],
): ComputedCore<T> & { value: T } {
  const c = Object.create(computedProto) as ComputedCore<T> & { value: T };
  // ✅ v3.8 OPTIMIZATION: Pre-allocate ALL properties for same hidden class
  c._kind = 'computed';
  c._value = null;
  c._dirty = true;
  c._sources = explicitDeps || [];
  c._calc = calculation;
  c._listeners = undefined;
  c._pendingOldValue = undefined;
  c._computedListeners = undefined;
  c._computedSlots = undefined;
  c._version = 0;
  c._unsubs = undefined;
  c._epoch = undefined;
  c._sourceVersions = undefined;
  c._sourceSlots = undefined;

  return c;
}

export type ReadonlyZen<T> = ComputedCore<T>;
export type ComputedZen<T> = ComputedCore<T>;

// ============================================================================
// EFFECT (Side Effects with Auto-tracking)
// ============================================================================

type EffectCore = {
  _sources: AnyZen[];
  _unsubs?: Unsubscribe[];
  _cleanup?: () => void;
  _callback: () => undefined | (() => void);
  _cancelled: boolean;
  _autoTrack: boolean;
  _queued: boolean;
  _execute: () => void;
};

function executeEffect(e: EffectCore): void {
  if (e._cancelled) return;

  e._queued = false;

  // Run previous cleanup
  if (e._cleanup) {
    try {
      e._cleanup();
    } catch (_) {}
    e._cleanup = undefined;
  }

  // Unsubscribe and reset sources for re-tracking (only for auto-tracked effects)
  if (e._autoTrack && e._unsubs !== undefined) {
    cleanUnsubs(e._unsubs);
    e._unsubs = undefined;
    e._sources = [];
  }

  // Set as current listener for auto-tracking (only if auto-track enabled)
  const prevListener = currentListener;
  if (e._autoTrack) {
    currentListener = e as any;
  }

  try {
    const cleanup = e._callback();
    if (cleanup) e._cleanup = cleanup;
  } catch (_err) {
  } finally {
    currentListener = prevListener;
  }

  // Subscribe to tracked sources (only if not already subscribed)
  if (!e._unsubs && e._sources.length > 0) {
    e._unsubs = attachListener(e._sources, () => runEffect(e));
  }
}

function runEffect(e: EffectCore): void {
  if (e._cancelled) return;

  // If already queued, skip
  if (e._queued) return;

  // OPTIMIZATION v3.2: Queue in Effects array if in batch
  if (batchDepth > 0 && Effects) {
    e._queued = true;
    Effects.push(e._execute);
    return;
  }

  // Execute immediately
  executeEffect(e);
}

export function effect(
  callback: () => undefined | (() => void),
  explicitDeps?: AnyZen[],
): Unsubscribe {
  const e: EffectCore = {
    _sources: explicitDeps || [],
    _callback: callback,
    _cancelled: false,
    _autoTrack: !explicitDeps, // Only auto-track if no explicit deps provided
    _queued: false,
    _execute: null as any, // Will be set below
  };

  // Create stable reference for queuing
  e._execute = () => executeEffect(e);

  // Run effect immediately (synchronously for initial run)
  // Set as current listener for auto-tracking (only if auto-track enabled)
  const prevListener = currentListener;
  if (e._autoTrack) {
    currentListener = e as any;
  }

  try {
    const cleanup = e._callback();
    if (cleanup) e._cleanup = cleanup;
  } catch (_err) {
  } finally {
    currentListener = prevListener;
  }

  // Subscribe to tracked sources after initial run
  if (e._sources.length > 0) {
    e._unsubs = attachListener(e._sources, () => runEffect(e));
  }

  // Return unsubscribe function
  return () => {
    if (e._cancelled) return;
    e._cancelled = true;

    // Run final cleanup
    if (e._cleanup) {
      try {
        e._cleanup();
      } catch (_) {}
    }

    // Unsubscribe from sources
    if (e._unsubs) cleanUnsubs(e._unsubs);
  };
}
