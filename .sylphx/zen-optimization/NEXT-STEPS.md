# Next Steps for Zen Optimization

**Current Status:** 10.94x slower than SolidJS (down from 15.15x)
**Target:** 5-8x slower (realistic without compiler)
**Gap to close:** ~30-45% improvement needed

## Recommended Next Pass: Bidirectional Pointers

**Confidence:** High ⭐⭐⭐
**Expected Gain:** 10-20%
**Difficulty:** Medium
**Risk:** Medium (significant algorithm change)

### What It Is

Replace O(n) `indexOf` cleanup with O(1) slot-based system (like SolidJS).

**Current approach:**
```typescript
// When computed unsubscribes from source
const idx = source._computedListeners.indexOf(self);  // O(n) search!
if (idx !== -1) {
  source._computedListeners.splice(idx, 1);  // O(n) removal!
}
```

**Proposed approach:**
```typescript
// Parallel arrays for bidirectional pointers
type ComputedCore<T> = {
  _sources: AnyNode[];
  _sourceSlots: number[];  // NEW: Index into each source's observers
};

type ZenCore<T> = {
  _computedListeners: ComputedCore<unknown>[];
  _computedSlots: number[];  // NEW: Index into each computed's sources
};

// When computed subscribes to source
const slot = source._computedListeners.length;
source._computedListeners.push(self);
source._computedSlots.push(self._sources.length);
self._sources.push(source);
self._sourceSlots.push(slot);

// When unsubscribing - O(1)!
const slot = self._sourceSlots[i];
const source = self._sources[i];
const last = source._computedListeners.length - 1;

if (slot !== last) {
  // Swap with last element
  source._computedListeners[slot] = source._computedListeners[last];
  source._computedSlots[slot] = source._computedSlots[last];

  // Update the swapped element's slot pointer
  const swapped = source._computedListeners[slot];
  const swappedSourceIdx = source._computedSlots[slot];
  swapped._sourceSlots[swappedSourceIdx] = slot;
}

source._computedListeners.pop();
source._computedSlots.pop();
```

### Why It Matters

**Workloads that benefit:**
- Frequent subscribe/unsubscribe (effects, conditional computeds)
- Large fanout (many computeds listening to one source)
- Dynamic dependency graphs (re-tracking)

**Benchmarks affected:**
- Fanout: High impact (100 computeds × O(n) = expensive)
- Deep chain: Medium impact (repeated subscribe/unsubscribe)
- Diamond/Triangle: Low impact (static graph)

### Implementation Plan

1. **Add slot arrays** to ZenCore and ComputedCore types
2. **Update _subscribeToSources()** to maintain slot pointers
3. **Update unsubscribe logic** to use O(1) swap-and-pop
4. **Update _unsubscribeFromSources()** to use slots
5. **Add same for effect listeners** (optional, smaller impact)

**Testing:** Existing tests should pass unchanged (behavioral equivalence)

**Bundle impact:** +200-300 bytes (slot arrays + logic)

### Expected Results

**Fanout benchmark:**
- Current: 14,073 ops/sec (19.3x slower)
- Expected: 16,000-18,000 ops/sec (15-17x slower)
- **Gain: +15-25%** on this benchmark

**Overall impact:**
- Diamond/Triangle: +2-5% (minor benefit)
- Fanout: +15-25% (major benefit)
- Deep chain: +5-10% (moderate benefit)

**Weighted average: +8-12% overall**

## Alternative: Study SolidJS Deeply

**Confidence:** Medium ⭐⭐
**Expected Gain:** 20-30% (but harder to estimate)
**Difficulty:** High (research + experimentation)
**Risk:** Low (research only)

### Approach

1. **Read SolidJS source thoroughly**
   - `packages/solid/src/reactive/signal.ts`
   - Understand every optimization trick
   - Document techniques we're missing

2. **Examine compiled output**
   - See what compiler actually does
   - Find patterns we can replicate at runtime

3. **Profile both implementations**
   - V8 profiler (`--prof`)
   - Flame graphs
   - Find actual hot paths

4. **Implement findings**
   - Pick top 3 discoveries
   - Implement + benchmark each

### Potential Discoveries

- Monomorphic shapes we're missing
- Hidden costs in our approach
- Better algorithms for specific cases
- V8-specific optimizations

## Alternative: Timestamp Deduplication

**Confidence:** Medium ⭐⭐
**Expected Gain:** 5-15%
**Difficulty:** Low
**Risk:** Low (additive change)

### What It Is

Prevent same computed from running multiple times in one update cycle.

**Problem:**
```typescript
// Diamond: a → b,c → d
// When a changes, d might be marked STALE twice (via b and c)
// On access, d recalculates only once (good!)
// But marking STALE twice is wasteful
```

**Solution:**
```typescript
type ComputedCore<T> = {
  _updatedAt: number;  // NEW: Last update cycle
};

let updateCycle = 0;  // Global counter

// When marking STALE
function markStale(computed: ComputedCore<unknown>) {
  if (computed._updatedAt === updateCycle) return;  // Skip!
  computed._updatedAt = updateCycle;
  computed._flags |= FLAG_STALE;
}

// Increment cycle on each source change
zenProto.set value() {
  updateCycle++;
  // ... rest of setter
}
```

**Benefit:** Reduces redundant STALE marking in Diamond patterns

**Expected gain:** 5-15% on Diamond/Triangle (many redundant marks)

## Recommendation

**Start with:** Bidirectional Pointers
**Reason:**
- Clear algorithmic improvement
- Well-understood technique (SolidJS uses it)
- Measurable impact
- Not too risky

**Then:** Study SolidJS deeply
**Reason:**
- Might reveal better approaches
- Worth the research investment
- Could inform future passes

**Finally:** Timestamp deduplication
**Reason:**
- Smaller impact
- Easy to add later
- Good polish pass

## Timeline Estimate

**Pass 4 (Bidirectional Pointers):** 2-4 hours
- 1h implementation
- 0.5h testing
- 0.5h benchmarking
- 0.5h documentation

**Pass 5 (SolidJS Study):** 4-8 hours
- 2-4h reading source
- 1-2h profiling
- 1-2h implementing findings

**Pass 6 (Timestamp Dedup):** 1-2 hours
- 0.5h implementation
- 0.5h testing
- 0.5h benchmarking

**Total to target:** 7-14 hours of optimization work

## Success Criteria

**Minimum:** Reach 8x slower (from 11x)
**Target:** Reach 5-7x slower
**Stretch:** Reach 3-5x slower

**Bundle:** Keep under 5KB (currently 4.06KB)
**Tests:** Maintain current pass rate (no new failures)
