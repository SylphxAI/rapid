/**
 * Object pooling for high-performance array reuse.
 * Reduces GC pressure by reusing arrays instead of creating new ones.
 *
 * ✅ PHASE 1 OPTIMIZATION: Object Pooling
 * Expected gain: 5-15% memory reduction, 3-8% speed improvement
 */

/**
 * Generic object pool for reusing objects.
 * @template T The type of objects to pool
 */
class ObjectPool<T> {
  private available: T[] = [];
  private factory: () => T;
  private reset: (obj: T) => void;
  private maxSize: number;

  constructor(factory: () => T, reset: (obj: T) => void, initialSize = 10, maxSize = 100) {
    this.factory = factory;
    this.reset = reset;
    this.maxSize = maxSize;

    // Pre-populate pool
    for (let i = 0; i < initialSize; i++) {
      this.available.push(factory());
    }
  }

  /**
   * Acquire an object from the pool.
   * Creates a new object if pool is empty.
   */
  acquire(): T {
    return this.available.pop() ?? this.factory();
  }

  /**
   * Release an object back to the pool.
   * Resets the object and adds it to available pool.
   */
  release(obj: T): void {
    this.reset(obj);

    // Don't grow pool beyond max size
    if (this.available.length < this.maxSize) {
      this.available.push(obj);
    }
  }

  /**
   * Get current pool statistics.
   * @internal
   */
  stats(): { available: number; maxSize: number } {
    return {
      available: this.available.length,
      maxSize: this.maxSize,
    };
  }
}

// ============================================================================
// ARRAY POOLS
// ============================================================================

/**
 * Pool for source value arrays used in computed values.
 * These are frequently created/destroyed during dependency tracking.
 */
export const sourceValuesPool = new ObjectPool<unknown[]>(
  () => [],
  (arr) => {
    arr.length = 0;
  },
  50, // Initial size: 50 arrays
  200, // Max size: 200 arrays
);

/**
 * Pool for listener arrays.
 * These are created when first listener attaches.
 */
export const listenerArrayPool = new ObjectPool<Function[]>(
  () => [],
  (arr) => {
    arr.length = 0;
  },
  100, // Initial size: 100 arrays
  300, // Max size: 300 arrays
);

/**
 * Pool for temporary arrays used during operations.
 */
export const tempArrayPool = new ObjectPool<unknown[]>(
  () => [],
  (arr) => {
    arr.length = 0;
  },
  30, // Initial size: 30 arrays
  100, // Max size: 100 arrays
);

// ============================================================================
// POOLING UTILITIES
// ============================================================================

/**
 * Execute a function with a temporary array from the pool.
 * Automatically returns the array to the pool after execution.
 *
 * @example
 * const result = withPooledArray(arr => {
 *   arr.push(1, 2, 3);
 *   return arr.reduce((a, b) => a + b, 0);
 * });
 */
export function withPooledArray<T>(fn: (arr: unknown[]) => T): T {
  const arr = tempArrayPool.acquire();
  try {
    return fn(arr);
  } finally {
    tempArrayPool.release(arr);
  }
}

/**
 * Get pool statistics for debugging/monitoring.
 * @internal
 */
export function getPoolStats() {
  return {
    sourceValues: sourceValuesPool.stats(),
    listenerArrays: listenerArrayPool.stats(),
    tempArrays: tempArrayPool.stats(),
  };
}
