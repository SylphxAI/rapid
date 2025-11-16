# 007. Reject Lazy Array Allocation

**Status:** ❌ Rejected
**Date:** 2025-01-21
**Version:** v3.26.0 (reverted from v3.27.0 experiment)

## Context

After v3.26.0, explored lazy array allocation to reduce memory usage. Signal and Computation objects immediately allocate 2-4 empty arrays (_observers, _observerSlots, _sources, _sourceSlots), even if never used.

## Proposed Solution

Defer array allocation until first subscriber:
- Change arrays from `T[]` to `T[] | null`
- Allocate on first addObserver call
- Add null checks in all accessors

## Implementation Results

**Code Changes:**
- Modified interfaces to nullable arrays
- Added null checks in: read(), set(), removeObserver(), clearObservers(), _notifyObservers(), _updateIfNecessary()
- Lazy allocation in inline addObserver logic

**Test Results:**
- ✅ All 48 tests passed
- ✅ Correctness maintained

**Performance Results:**
- Create zen signal: 43.9M ops/sec (vs 44.8M, **-2.0%**)
- **Read zen value: 35.1M ops/sec (vs 38.7M, -9.3%)** ⚠️ Critical regression
- Write zen value: 39.7M ops/sec (vs 39.0M, **+1.8%**)
- Write same (no-op): 43.6M ops/sec (vs 45.0M, **-3.1%**)

**Bundle Size:**
- ESM: 4.45 KB (vs 4.03 KB, **+420 bytes**, +10%)
- Brotli: 1.36 kB (vs 1.31 kB, **+50 bytes**, +3.8%)

## Decision

**Reject** lazy array allocation.

## Rationale

1. **Unacceptable read performance regression: -9.3%**
   - Read is the most frequent operation
   - Hot path performance critical
   - Null checks add overhead every single access

2. **Bundle size increased more than expected**
   - +420 bytes minified (+10%)
   - Repeated null checks don't compress well

3. **Unmeasured memory benefits**
   - Potential 25-90% memory savings (theoretical)
   - But not validated in real applications
   - Uncertain if worth the performance cost

4. **Complexity increase**
   - More conditional logic
   - Harder to maintain
   - Risk of null-related bugs

## Consequences

**Positive:**
- Maintain excellent read performance
- Keep small bundle size (1.31 kB)
- Keep code simple and maintainable

**Negative:**
- Miss potential memory savings
- Allocate arrays for signals without subscribers

## Lessons Learned

### ✅ What We Learned

1. **Null checks are not free**
   - Even simple null checks have measurable cost in hot paths
   - Branch prediction matters
   - V8 optimizations can't always eliminate checks

2. **Measure first, optimize second**
   - Memory savings were theoretical, not measured
   - Should profile real applications before optimizing

3. **Hot path performance > memory savings**
   - Read operations are critical
   - -9% regression user-visible
   - Memory optimizations must not hurt hot paths

### 🎯 Better Alternatives

**If memory is genuinely critical:**

1. **Pre-allocation with capacity hints**
   ```typescript
   _observers = new Array(4)  // Pre-allocate common size
   ```
   - Trade: Some memory waste vs no null checks
   - Better: Amortize allocation cost

2. **Object pooling**
   - Reuse disposed Computation objects
   - Trade: Complexity vs reduced allocations
   - Need: Careful reset() logic

3. **Selective lazy allocation**
   - Only lazy allocate _observers (less frequent)
   - Keep _sources immediate (hot path)
   - Hybrid approach may balance trade-offs

4. **Compilation-time optimization**
   - Babel/SWC plugin for static analysis
   - Out of core library scope

### ❌ Avoid

- Adding conditional checks in hot paths without measurement
- Assuming null check cost is negligible
- Memory optimizations without real-world profiling
- Trading >5% performance for unmeasured memory savings

## References

<!-- VERIFY: /tmp/zen-v3.27.0-results.md -->
- Performance data: `/tmp/zen-v3.27.0-results.md`
- Implementation plan: `/tmp/zen-v3.27.0-lazy-allocation-plan.md`
- Analysis: `/tmp/zen-optimization-analysis.md`

## Recommendation

**Keep v3.26.0 as production version.**

Future memory optimizations should:
1. Profile real applications first
2. Measure actual memory usage patterns
3. Avoid hot path conditional checks
4. Validate benefits > costs before implementation
