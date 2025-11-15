# Zen Optimization Session Summary

**Date:** 2024-11-15
**Branch:** optimization/perfect-zen
**Goal:** Close performance gap with SolidJS

## Starting Point (Baseline)

**Performance vs SolidJS:**
- Diamond: 119,151 ops/sec (15.15x slower) ⚠️
- Triangle: 122,325 ops/sec (14.75x slower) ⚠️
- Fanout: 11,605 ops/sec (25.3x slower) 🔴 CRITICAL
- Deep chain: 123,903 ops/sec (12.2x slower)
- Signal creation: 29,628 ops/sec (1.25x slower) ✅ Competitive!

**Bundle:** 3.75 KB

## Optimization Passes

### Pass 1: Strong Typing + Manual Loop ❌ FAILED
**Reverted immediately** - 77% regression on Broad benchmark
**Lesson:** Don't replace V8-optimized builtins like `indexOf`

### Pass 1b: Strong Typing Only ⚠️ MIXED
**Results:**
- Signal creation: +19.7% ✅
- Broad: +4.5% ✅
- Deep chain: -14.2% ❌
**Decision:** Reverted - Hurt more than helped

### Pass 2: Split Listeners (Computed vs Effects) ⭐ MAJOR SUCCESS
**Commit:** afac517
**Change:** Separated `_listeners` into `_computedListeners` and `_effectListeners`

**Key Innovation:**
```typescript
// BEFORE: All listeners were functions
_listeners: TrackedListener<T>[]

// Listener notification (expensive function call)
for (let i = 0; i < listeners.length; i++) {
  listeners[i]!(newValue, oldValue);  // Stack frame + args overhead
}

// AFTER: Split by type
_computedListeners: ComputedCore<unknown>[]  // Direct references!
_effectListeners: Listener<T>[]               // Functions

// Computeds marked STALE (cheap property write)
for (let i = 0; i < computeds.length; i++) {
  computeds[i]!._flags |= FLAG_STALE;  // Just a bitwise OR!
}

// Effects called as functions
for (let i = 0; i < effects.length; i++) {
  effects[i]?.(newValue, oldValue);
}
```

**Why It Worked:**
- Function calls have overhead: stack frame creation, argument passing, return handling
- Direct property access is just a memory write
- Diamond/Triangle patterns have many computed-to-computed propagations
- Eliminated 100s of function calls per update

**Results:**
- Diamond: +40.4% faster (15.15x → 10.94x gap) ✅✅✅
- Triangle: +40.7% faster (14.75x → 10.64x gap) ✅✅✅
- Fanout: +24.5% faster (25.3x → 19.3x gap) ✅
- Signal creation: +17.5% faster (1.25x → 1.06x) ✅
- Deep chain: -8.9% (acceptable trade-off)

**Bundle:** 4.06 KB (+0.31 KB)

### Pass 3: Remove Optional Chaining ❌ FAILED
**Reverted** - Caused regression
**Change:** `effects[i]?.(...)` → `effects[i]!(...)`

**Results:**
- Diamond: -5.6% (172,129 → 162,548 ops/sec) ❌
- Triangle: -3.2% ❌

**Why It Failed:**
- TypeScript type assertions (`!`) have NO runtime effect
- V8 optimizes `?.()` very well (likely inlined + speculated)
- Removing "safe" operators can regress if V8 optimizes them

**Lesson:** TypeScript-only changes don't improve runtime performance

## Current Status (After Pass 2)

**Performance vs SolidJS:**
- Diamond: 172,129 ops/sec (10.94x slower) - **40% improvement!** ⭐
- Triangle: 171,653 ops/sec (10.64x slower) - **41% improvement!** ⭐
- Fanout: 14,073 ops/sec (19.3x slower) - **25% improvement!**
- Deep chain: 132,797 ops/sec (13.5x slower)
- Broad: 105,483 ops/sec (5.7x slower)
- Signal creation: 33,642 ops/sec (1.06x slower) - **Nearly matched!** ✅

**Bundle:** 4.06 KB

## Gap Analysis

**Current Gap:** ~11x slower on Diamond/Triangle (down from 15x!)
**Realistic Target:** 5-8x slower (without compiler)
**Need:** 30-45% more improvement to hit target

**Gap Breakdown:**
1. **Compiler inlining (~8-10x):** SolidJS compiler advantage - CANNOT close
   - SolidJS compiler inlines `signal()` to direct variable access
   - We have runtime overhead that can't be eliminated without compiler
2. **V8 optimization (~2-3x):** CAN improve
   - Better object shapes, less polymorphism
   - Bidirectional pointers for O(1) cleanup
3. **Algorithm (~1.5-2x):** CAN improve
   - Study SolidJS source for techniques
   - Timestamp deduplication

## Key Lessons Learned

1. ✅ **Algorithmic changes > micro-optimizations**
   - Pass 2's listener split: 40% gain
   - Pass 3's syntax tweak: 5% loss

2. ✅ **Eliminating function calls in hot paths is critical**
   - Property writes much faster than function calls
   - Direct memory access vs stack frame creation

3. ❌ **Don't replace V8-optimized builtins**
   - `indexOf`, `?.()`, etc. are highly optimized
   - Manual implementations usually slower

4. ❌ **TypeScript-only changes don't affect runtime**
   - Type assertions (`!`), type annotations have zero runtime cost
   - Only actual code changes matter

5. ✅ **Measure everything - intuition can be wrong**
   - Expected `!` to be faster than `?.` - was slower
   - Expected strong typing to help - hurt some cases

## Next Optimization Opportunities

### High Priority (Expected: +20-30%)
1. **Bidirectional Pointers** (O(1) cleanup)
   - Use slot-based system like SolidJS
   - `sourceSlots[]` + `observerSlots[]` for O(1) removal
   - Currently using `indexOf` (O(n))

2. **Study SolidJS Compiled Output**
   - Understand what compiler actually does
   - Find patterns we can replicate at runtime

### Medium Priority (Expected: +10-15%)
3. **Timestamp Deduplication**
   - Prevent same computed from running multiple times per cycle
   - Add `updatedAt` tracking

4. **Profile with V8 Tools**
   - Use `--prof` to find actual hot paths
   - Optimize based on data, not assumptions

### Low Priority (Expected: +5-10%)
5. **Convert to Classes**
   - Replace `Object.create()` with class constructors
   - Better V8 optimization potential

## Realistic Expectations

**With compiler (like SolidJS):** Could match or beat SolidJS
**Without compiler (our constraint):**
- **Best case:** 3-5x slower than SolidJS
- **Target:** 5-8x slower (achievable with more optimizations)
- **Current:** 11x slower

**Progress so far:** 27% gap closure (15x → 11x)
**Remaining:** Need 30-45% more to hit 5-8x target

## References

- **Baseline results:** baseline-2024-11-15.txt
- **Pass 2 results:** pass2-results.txt
- **Pass 3 failure:** pass3-failed.md
- **SolidJS research:** solidjs-research.md
