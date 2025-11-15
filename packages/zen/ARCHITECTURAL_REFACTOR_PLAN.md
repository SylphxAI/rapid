# Architectural Refactor: Closing the Performance Gap

## Goal
Reduce the 100-1000x performance gap to <10x through architectural changes inspired by SolidJS.

## Core Changes Required

### 1. Owner Hierarchy (Priority: HIGH)

**Current:**
- Flat subscription model
- No parent-child relationships
- Ordering via STALE propagation

**Target (SolidJS-style):**
```typescript
type Node = {
  _owner: Node | null;     // Parent in dependency graph
  _owned: Node[] | null;   // Children in dependency graph
  _level: number;          // Depth in graph (for optimization)
};
```

**Benefits:**
- Structural ordering (no need to propagate STALE through entire graph)
- runTop algorithm walks up, executes down
- Prevents redundant calculations naturally

**Implementation:**
- Track owner during computation
- Set currentOwner when executing
- Child computeds/effects register with owner

### 2. Lazy Pull (Priority: HIGH)

**Current:**
- Computeds subscribe to sources eagerly
- onSourceChange immediately marks STALE and queues
- Can trigger eager recalculation

**Target:**
- Computeds don't subscribe until they have listeners
- On source change: ONLY mark STALE, don't queue
- Recalculation happens ONLY when value is accessed
- During flush, walk graph and pull values

**Benefits:**
- No wasted work for unobserved computeds
- Natural deduplication through pull-based evaluation
- Matches SolidJS performance model

### 3. Execution Counter (Priority: MEDIUM)

**Current:**
- No way to track if computation is up-to-date across batch boundaries

**Target:**
```typescript
let ExecCount = 0;  // Global counter

type Node = {
  _updatedAt?: number;  // Last execution counter when updated
};

// In flush:
ExecCount++;
if (!node._updatedAt || node._updatedAt < ExecCount) {
  // Needs update
}
```

**Benefits:**
- Prevents duplicate execution within same batch
- Works across nested batches
- Very cheap check (integer comparison)

### 4. Unified Queue System (Priority: MEDIUM)

**Current:**
- pendingNotifications array of tuples
- pendingEffects Set
- Separate handling

**Target:**
```typescript
const Updates: ComputedCore<any>[] = [];  // Pure computeds
const Effects: EffectCore[] = [];         // Side effects

// Process in order: Updates first, then Effects
```

**Benefits:**
- Clearer separation of concerns
- Effects run after all computeds updated
- Easier to reason about execution order

### 5. runTop Algorithm (Priority: HIGH)

**Current:**
- Process queue linearly
- No ancestor checking

**Target (SolidJS-style):**
```typescript
function runTop(node: Node): void {
  if (node._state === CLEAN) return;
  if (node._state === PENDING) return;

  const ancestors: Node[] = [node];
  let current = node._owner;

  // Collect dirty ancestors
  while (current && (!current._updatedAt || current._updatedAt < ExecCount)) {
    if (current._state !== CLEAN) {
      ancestors.push(current);
    }
    current = current._owner;
  }

  // Execute from root to leaf
  for (let i = ancestors.length - 1; i >= 0; i--) {
    updateNode(ancestors[i]);
  }
}
```

**Benefits:**
- Ensures parents update before children
- Natural topological ordering
- No need for explicit sorting

---

## Implementation Strategy

### Phase 1: Owner Tracking (Foundational)
1. Add `_owner`, `_owned` fields to types
2. Track `currentOwner` during execution
3. Auto-register child with owner
4. Test: Verify hierarchy built correctly

### Phase 2: Execution Counter
1. Add `ExecCount` global
2. Add `_updatedAt` to types
3. Check before updating
4. Test: Verify deduplication works

### Phase 3: Lazy Pull for Computeds
1. Remove eager subscription on creation
2. Subscribe only when first listener added
3. On source change: mark STALE only
4. Value getter: check STALE, recalc if needed
5. Test: Verify computed values correct

### Phase 4: runTop Algorithm
1. Implement ancestor collection
2. Implement root-to-leaf execution
3. Use in flush instead of linear processing
4. Test: Diamond pattern, deep chains

### Phase 5: Unified Queues
1. Separate Updates and Effects
2. Process Updates first
3. Then process Effects
4. Test: Execution order correct

### Phase 6: Remove Redundant Code
1. Remove markDownstreamStale (not needed with runTop)
2. Simplify flush logic
3. Remove unused state tracking
4. Test: All tests still pass

---

## Expected Performance Impact

| Optimization | Current Gap | Expected After |
|-------------|-------------|----------------|
| Owner hierarchy + runTop | 1000x | ~300x |
| Lazy pull | ~300x | ~100x |
| Exec counter dedup | ~100x | ~50x |
| Unified queues | ~50x | ~20x |
| Total | **1000x** | **~20x** |

**Remaining 20x gap:**
- SolidJS compiler inlining (~10x)
- V8 optimization differences (~2x)
- Other micro-differences (~1x)

**Result: 98% of gap closed (1000x → 20x)**

---

## Risk Assessment

### High Risk
- Owner tracking might conflict with existing subscriptions
- Lazy pull might break tests expecting eager updates
- runTop complexity could introduce bugs

### Mitigation
- Incremental implementation with tests at each phase
- Keep old code in git history for rollback
- Add new tests for owner hierarchy
- Verify all existing tests pass

### Rollback Plan
- Each phase is independent
- Can roll back to previous phase if issues
- Git branches for each phase

---

## Success Criteria

- [ ] All existing tests pass
- [ ] Diamond pattern: <50x slower than SolidJS
- [ ] Triangle pattern: <50x slower than SolidJS
- [ ] Fanout pattern: <30x slower than SolidJS
- [ ] No redundant calculations (verified)
- [ ] Owner hierarchy built correctly
- [ ] Execution order correct
- [ ] Memory usage not significantly increased

---

## Timeline Estimate

- Phase 1 (Owner tracking): 2-3 hours
- Phase 2 (Exec counter): 1 hour
- Phase 3 (Lazy pull): 2-3 hours
- Phase 4 (runTop): 2-3 hours
- Phase 5 (Unified queues): 1-2 hours
- Phase 6 (Cleanup): 1 hour

**Total: 9-15 hours of implementation**

Let's begin!
