# Pass 4: Bidirectional Pointers (Mixed Results)

**Date:** 2024-11-15
**Status:** ⚠️ MIXED - Rejected

## What I Implemented

**Change:** Bidirectional slot pointers for O(1) cleanup (inspired by SolidJS)

**Before (O(n) cleanup):**
```typescript
// When unsubscribing from source
const idx = source._computedListeners.indexOf(self);  // O(n) search
if (idx !== -1) {
  source._computedListeners.splice(idx, 1);  // O(n) removal
}
```

**After (O(1) cleanup):**
```typescript
type ZenCore<T> = {
  _computedListeners: ComputedCore<unknown>[];
  _computedSlots?: number[];  // NEW: Slot indices
};

type ComputedCore<T> = {
  _sources: AnyNode[];
  _sourceSlots?: number[];  // NEW: Indices into each source's listeners
};

// When unsubscribing - O(1)
const slot = this._sourceSlots[i];
const last = computeds.length - 1;

if (slot !== last) {
  // Swap with last
  computeds[slot] = computeds[last];
  slots[slot] = slots[last];

  // Update swapped element's slot pointer
  swapped._sourceSlots[swappedSourceIdx] = slot;
}

computeds.pop();
slots.pop();
```

## Results

**Fanout (100 computeds):**
- Pass 2: 14,073 ops/sec
- Pass 4: 15,046 ops/sec
- **Change: +6.9% improvement** ✅

**Triangle:**
- Pass 2: 171,653 ops/sec
- Pass 4: 172,853 ops/sec
- **Change: +0.7% improvement** ✅

**Diamond:**
- Pass 2: 172,129 ops/sec
- Pass 4: 166,127 ops/sec
- **Change: -3.5% REGRESSION** ❌

**Deep chain:**
- Pass 2: 132,797 ops/sec
- Pass 4: 116,110 ops/sec
- **Change: -12.5% REGRESSION** ❌

**Bundle:**
- Baseline: 4.06 KB
- Pass 4: 4.08 KB (+20 bytes)

## Why Mixed Results?

**Overhead analysis:**
- **Slot array initialization**: Each computed now allocates `_sourceSlots` array
- **Slot maintenance**: Every subscribe/resubscribe updates slot pointers
- **Slot updates**: When swapping, need to update 3 pointers instead of 1

**Benefits only materialize when:**
- Many computeds listening to same source (Fanout scenario)
- Frequent unsubscribe operations
- Large listener arrays where indexOf is expensive

**For common cases (Diamond, Deep chain):**
- Static dependency graphs (no dynamic subscribe/unsubscribe)
- Small listener counts (indexOf is fast for 1-5 elements)
- Slot overhead outweighs O(1) benefit

## Analysis

**Fanout improvement (+6.9%):**
- 100 computeds × O(n) = expensive indexOf calls
- Slot system shines here

**Diamond regression (-3.5%):**
- Small listener counts (2-3 computeds per source)
- indexOf is fast for small n
- Slot overhead hurts

**Deep chain regression (-12.5%):**
- Frequent resubscribe due to dependency changes
- Slot updates add overhead
- Chain pattern means many resubscribe operations

## Conclusion

Bidirectional pointers are a **net negative** for Zen's typical workloads.

**Trade-off:**
- +7% on Fanout (edge case)
- -3.5% on Diamond (common)
- -12.5% on Deep chain (common)

**Weighted average: -3% to -5% overall** ❌

## Lessons Learned

1. ❌ **O(n) → O(1) doesn't always win** - Constant factors matter
2. ❌ **Small n makes O(n) fast** - indexOf is highly optimized for small arrays
3. ✅ **Profile real workloads** - Fanout is rare, Diamond/Chain are common
4. ✅ **Overhead matters** - Extra arrays/pointers add memory + initialization cost
5. ✅ **SolidJS techniques don't always transfer** - Different workload characteristics

## Recommendation

**REJECT** - Revert Pass 4 changes

The slot system adds complexity and memory overhead for minimal or negative benefit on typical workloads. Only helps edge case (Fanout) while hurting common cases.

**Better alternatives:**
1. Accept O(n) indexOf - it's fast enough for small n
2. Focus on reducing unsubscribe frequency (more impactful)
3. Optimize hot paths that run every update (not just on cleanup)
