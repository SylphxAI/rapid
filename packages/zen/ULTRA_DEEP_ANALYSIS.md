# Ultra-Deep Performance Analysis

## Current Implementation Overhead Sources

### 1. Auto-Batching Overhead (Lines 103-206)

Every single signal change executes:
```typescript
const wasTopLevel = batchDepth === 0;  // 1 comparison
if (wasTopLevel) batchDepth++;         // 1 increment
try {
  // ... queuing logic ...
} finally {
  if (wasTopLevel) {                   // 1 comparison
    // ... deduplication + flush ...
    batchDepth--;                      // 1 decrement
  }
}
```

**Cost per signal change:**
- 2 boolean comparisons
- 2 integer operations
- try/finally block overhead
- Flush logic (even if queue is empty!)

**SolidJS comparison:**
```typescript
function runUpdates(fn, init) {
  if (Updates) return fn();  // ← Fast path! Just 1 check + return
  // ... create batch, flush ...
}
```

SolidJS has a FAST PATH: if already batching, just return fn(). No increment/decrement, no try/finally overhead.

**Zen's issue:** We ALWAYS go through the full try/finally even when batchDepth > 0.

### 2. Deduplication Overhead (Lines 144-152)

```typescript
const seen = new Set<AnyZen>();        // Create Set
const unique: [AnyZen, any][] = [];   // Create array
for (let i = 0; i < toNotify.length; i++) {
  const [zenItem] = toNotify[i]!;      // Destructure
  if (!seen.has(zenItem)) {            // Set lookup
    seen.add(zenItem);                 // Set insert
    unique.push(toNotify[i]!);         // Array push
  }
}
```

**Cost:**
- 1 Set creation (allocation + initialization)
- 1 Array creation
- N Set.has() operations
- N Set.add() operations
- M Array.push() operations (M ≤ N)
- Destructuring overhead

**Better approach:**
- Mark items with a flag when queued (e.g., item._queued = true)
- Check flag before queuing (if (item._queued) return)
- Clear flag after processing
- Zero Set/Array creation!

### 3. Array.from() Overhead (Line 198)

```typescript
const effects = Array.from(pendingEffects);
```

Array.from() iterates the Set and creates a new Array. For large Sets, this is expensive.

**Better:**
- Use array directly for pendingEffects
- Or iterate Set directly without converting

### 4. Duplicate Flush Logic

Lines 140-206 (auto-batch flush) and lines 416-479 (manual batch flush) are ~90% identical.

**Cost:**
- Code size (more code to JIT)
- Maintenance overhead
- Potential optimization differences

**Better:**
- Extract to shared function
- Single flush path = single optimization target

### 5. Complex Computed Listener (Lines 298-354)

The onSourceChange function for computeds:
- Saves old sources (array copy)
- Compares arrays with arraysEqual
- Conditionally resubscribes
- Complex control flow

**Cost per computed update:**
- Array allocation (oldSources copy)
- O(n) array comparison
- Potential subscription churn

**SolidJS approach:**
- Simple state flag update
- No array comparisons
- Subscription management is separate concern

### 6. markDownstreamStale Recursion (Lines 50-74)

```typescript
function markDownstreamStale(computed: ComputedCore<any>): void {
  // ... iterate listeners ...
  if (downstreamComputed) {
    if (downstreamComputed._state === CLEAN) {
      downstreamComputed._state = STALE;
      markDownstreamStale(downstreamComputed);  // ← Recursion!
    }
  }
  // ...
}
```

**Cost:**
- Function call overhead per level
- Stack frame creation
- For deep dependency chains, could overflow

**Better:**
- Iterative with queue instead of recursive

### 7. No Fast Path for Leaf Signals

When a signal has NO computed listeners (just direct subscribe listeners):
```typescript
// Still goes through full batching logic
// Still creates array entries
// Still deduplicates
```

**SolidJS approach:**
- Separate pure computeds from effects
- Effects can be handled differently

### 8. Object.is() Calls

Used extensively for equality checks. While optimized, still has overhead compared to `===`.

For primitives, `===` is faster. Object.is() is needed for NaN and -0/+0, but these are rare.

**Optimization:**
- Fast path with `===` for common case
- Fallback to Object.is() for edge cases

---

## Micro-Optimization Opportunities

### A. Remove Try/Finally Overhead

Current:
```typescript
const wasTopLevel = batchDepth === 0;
if (wasTopLevel) batchDepth++;
try {
  // ...
} finally {
  if (wasTopLevel) {
    flush();
    batchDepth--;
  }
}
```

Optimized:
```typescript
if (batchDepth > 0) {
  // Fast path: just queue
  queue(this, oldValue);
  return;
}

// Slow path: start batch
batchDepth = 1;
queue(this, oldValue);
flush();
batchDepth = 0;
```

**Savings:**
- No try/finally overhead
- No boolean variable allocation
- Clearer control flow

### B. Flag-Based Deduplication

Add to ZenCore and ComputedCore:
```typescript
type ZenCore<T> = {
  // ... existing fields ...
  _queued?: boolean;  // Transient flag
};
```

Usage:
```typescript
function queue(item: AnyZen, oldValue: any): void {
  if (item._queued) return;  // Already queued
  item._queued = true;
  pendingNotifications.push([item, oldValue]);
}

function flush(): void {
  for (let i = 0; i < pendingNotifications.length; i++) {
    const [item, oldValue] = pendingNotifications[i];
    item._queued = false;  // Clear flag
    // ... notify ...
  }
  pendingNotifications.length = 0;
}
```

**Savings:**
- No Set creation
- No Set operations
- Just a boolean flag check/set
- Probably 10-20x faster

### C. Inline Hot Paths

Current:
```typescript
notifyListeners(item, newValue, oldValue);

export const notifyListeners = (zenItem: any, newValue: any, oldValue: any): void => {
  const listeners = zenItem._listeners;
  if (!listeners) return;
  for (let i = 0; i < listeners.length; i++) {
    listeners[i](newValue, oldValue);
  }
};
```

Optimized (inline):
```typescript
const listeners = item._listeners;
if (listeners) {
  for (let i = 0; i < listeners.length; i++) {
    listeners[i](newValue, oldValue);
  }
}
```

**Savings:**
- No function call overhead
- No parameter passing
- Better inlining by JIT

### D. Monomorphic Array Shapes

Ensure all arrays have consistent shapes for V8 optimization:
```typescript
// Current: sometimes array, sometimes undefined
_listeners?: Listener<T>[];

// Better: always array (possibly empty)
_listeners: Listener<T>[];  // Initialize to []
```

**Savings:**
- V8 can optimize better (monomorphic)
- No undefined checks
- Predictable code paths

### E. Unroll Small Loops

For common case of 1-2 listeners:
```typescript
const listeners = item._listeners;
if (!listeners) return;

if (listeners.length === 1) {
  listeners[0](newValue, oldValue);
} else if (listeners.length === 2) {
  listeners[0](newValue, oldValue);
  listeners[1](newValue, oldValue);
} else {
  for (let i = 0; i < listeners.length; i++) {
    listeners[i](newValue, oldValue);
  }
}
```

**Savings:**
- No loop overhead for common cases
- Better CPU branch prediction

### F. Fast Equality Check

```typescript
// Current
if (Object.is(newValue, oldValue)) return;

// Optimized
if (newValue === oldValue || (newValue !== newValue && oldValue !== oldValue)) return;
// newValue === oldValue handles all cases except NaN
// newValue !== newValue checks if newValue is NaN
// oldValue !== oldValue checks if oldValue is NaN
// Both NaN → equal → return
```

**Savings:**
- Fast path with `===` (most cases)
- Only check NaN for edge cases
- Avoids Object.is() overhead

### G. Iterative markDownstreamStale

```typescript
function markDownstreamStale(computed: ComputedCore<any>): void {
  const queue = [computed];

  for (let i = 0; i < queue.length; i++) {
    const current = queue[i];
    const listeners = current._listeners;
    if (!listeners) continue;

    for (let j = 0; j < listeners.length; j++) {
      const downstreamComputed = (listeners[j] as any)._computedZen;
      if (downstreamComputed && downstreamComputed._state === CLEAN) {
        downstreamComputed._state = STALE;
        queue.push(downstreamComputed);
      }
    }
  }

  queue.length = 0;  // Clear for reuse
}
```

**Savings:**
- No recursion overhead
- No stack growth
- Can reuse queue array

---

## Expected Impact

Based on SolidJS being 991x faster, and assuming framework overhead is ~90% of total time in microbenchmarks:

| Optimization | Expected Speedup |
|-------------|------------------|
| Remove try/finally | 1.05-1.1x |
| Flag-based dedup | 1.2-1.5x |
| Inline hot paths | 1.1-1.2x |
| Monomorphic shapes | 1.05-1.15x |
| Fast equality | 1.02-1.05x |
| Iterative propagation | 1.05-1.1x |
| **Combined** | **1.5-2.5x** |

This would reduce the gap from 991x to ~400-660x.

Still not matching SolidJS, but significant improvement.

---

## What's Missing?

To match SolidJS performance, we'd need:

1. **Owner-based hierarchy** (runTop algorithm)
   - Traverse up owner chain
   - Execute from root to leaf
   - Prevents redundant recalculations through structure, not dedup

2. **Separate pure/effect queues**
   - Like SolidJS's Updates and Effects arrays
   - Process in correct order

3. **Lazy evaluation everywhere**
   - Computeds only recalc when pulled
   - Not when source changes (just mark STALE)

4. **Zero-cost batching for nested updates**
   - True fast path: if (batchDepth > 0) just queue and return
   - No try/finally, no wasTopLevel checks

5. **Compiled/inlined reactivity**
   - SolidJS compiler inlines reactive primitives
   - We're runtime library, can't compete without compiler

**Bottom line:** We can get 2-3x faster with micro-optimizations, but to match SolidJS we need architectural changes (owner hierarchy) or a compiler.
