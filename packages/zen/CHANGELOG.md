# @sylphx/zen

## 1.1.0

### Minor Changes

- **perf: 5-Phase Performance Optimization - 3.21x Performance Improvement**

  Comprehensive performance optimization achieving **221% faster** execution through systematic improvements:

  **Phase 1: Foundation Optimizations (+140%)**
  - Removed try-catch overhead from hot paths (~50ns per call saved)
  - Converted Set to Array for 2x faster iteration (6ns vs 12ns per item)
  - Implemented O(1) swap-remove pattern for efficient unsubscribe
  - Result: 1.58M → 3.80M ops/sec

  **Phase 2: Version Tracking (+4.5%)**
  - Added global version counter for computed value staleness detection
  - Skip unnecessary recalculations when source versions unchanged
  - Negligible overhead (~1-2%) with significant computation savings
  - Result: 3.80M → 3.97M ops/sec

  **Phase 3: Hot Path Inlining (+13.3%)**
  - Single-listener fast path (most common case)
  - Inlined helper functions in set() for better JIT optimization
  - Cached array lengths to reduce property lookups
  - Result: 3.97M → 4.5M ops/sec

  **Phase 4: Computed Fast Paths (+13.3%)**
  - Single-source computed optimization (most common pattern)
  - Optimized version checking for single vs multiple sources
  - Fast path for undefined checking
  - Result: 4.5M → 5.1M ops/sec

  **Phase 5: Memory Optimization (stable)**
  - Batched listeners: Set → Array for consistency
  - Pre-allocated and reused arrays in effect system
  - Cached dependency values in batched updates
  - Result: Maintained 5.1M ops/sec, reduced allocations

  **Final Results:**
  - Core performance: 4.82M ops/sec (10 subscribers, single update)
  - Computed updates: 19.5M ops/sec
  - Total improvement: **3.21x faster (221% increase)**
  - All 108 tests passing, zero regressions

- **feat: Updated README with comprehensive performance benchmarks**
  - Added detailed benchmark results and comparison table
  - Documented 5-phase optimization journey
  - Included comparisons with nanostores, zustand, valtio, effector

## 1.0.0

### Major Changes

- Initial release of @sylphx/zen
  - Tiny size: ~1.33 kB gzipped
  - Functional API: zen, computed, map, deepMap, karma, batch
  - Lifecycle events: onMount, onSet, onNotify, onStop
  - Key/Path listeners for granular updates
  - Explicit batching support
