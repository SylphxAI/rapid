# SolidJS Source Code Research

**Date:** 2024-11-15
**Source:** https://github.com/solidjs/solid/blob/main/packages/solid/src/reactive/signal.ts

## Key Performance Techniques

### 1. Bidirectional Pointers (O(1) Cleanup)
**What:** Maintains two parallel arrays:
- `sources[]` - dependencies this computation reads from
- `sourceSlots[]` - indices into each source's observers array

When unsubscribing:
```typescript
// O(1) removal using slot indices
const source = sources[i];
const slot = sourceSlots[i];
source.observers[slot] = source.observers[source.observers.length - 1];
source.observers.pop();
```

**Zen current:** Uses `indexOf()` which is O(n)
**Opportunity:** Could implement slot-based system

### 2. Timestamp-Based Deduplication
**What:** Each computation has `updatedAt` timestamp
```typescript
if (node.updatedAt === currentUpdateCycle) return; // Skip
node.updatedAt = currentUpdateCycle;
```

Prevents same computed from running multiple times in one update cycle.

**Zen current:** No deduplication - could run multiple times
**Opportunity:** Add cycle counter + updatedAt tracking

### 3. Separate Update Queues
**What:** Two queues with different scheduling:
- `Updates[]` - Pure computations (run synchronously)
- `Effects[]` - Side effects (can be deferred)

**Zen current:** Everything runs immediately
**Opportunity:** Already have _computedListeners vs _effectListeners split

### 4. Comparator Functions
**What:** Custom equality check to prevent unnecessary propagation
```typescript
if (!node.comparator || !node.comparator(current, value)) {
  // Only propagate if value actually changed
}
```

**Zen current:** Always uses strict equality + NaN check
**Opportunity:** Could add custom comparators

### 5. Global Listener Context
**What:** Single global `Listener` variable tracks current executing computation
**Zen current:** Same! We use `currentListener`
**Status:** ✅ Already implemented

## Pass 3 Optimization Priorities

### High Priority (Expected: +20-30%)
1. **Inline computed listener loop** (like we did for effects)
2. **Slot-based bidirectional pointers** for O(1) cleanup

### Medium Priority (Expected: +10-15%)
3. **Timestamp deduplication** to prevent redundant runs
4. **Remove optional chaining** in hot paths (effects[i]?.() → effects[i]!())

### Low Priority (Expected: +5-10%)
5. **Custom comparators** (user-facing API change)
6. **Update queue batching** (already have batch())

## Implementation Plan for Pass 3

**Focus:** Inline computed loop + remove optional chaining

**Changes:**
1. Inline _computedListeners loop for 1-3 case
2. Replace `effects[i]?.(...)` with `effects[i]!(...)` (non-null assertion)
3. Replace `computeds[i]!._flags |= STALE` pattern

**Expected gain:** 15-25% on Diamond/Triangle (many computed-to-computed)

**Risk:** Low - same pattern as effects inlining
