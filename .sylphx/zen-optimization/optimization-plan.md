# Zen Optimization Plan

## Baseline Results (2024-11-15)
- Average gap: 15x slower than SolidJS
- Critical: Fanout 25.3x slower
- Good: Signal creation only 1.25x slower

## Root Cause Analysis

### Why Fanout is 25.3x slower:
1. Double loop penalty:
   - Loop 1: Mark all computed listeners STALE (lines 101-107)
   - Loop 2: Notify all listeners (lines 110-123)
   - For 100 computeds, this is 200 operations vs SolidJS's lazy approach

2. Type pollution:
   - Heavy use of `any` prevents V8 optimization
   - `(listener as any)._computedZen` forces runtime type checks

3. Object.create overhead:
   - Less optimized than class constructors
   - Hidden class transitions

## Optimization Passes

### Pass 1: Strong Typing + Dead Code Removal
**Target:** Reduce type pollution, enable V8 optimization
- Remove unused array pooling (lines 38-54)
- Replace all `any` with explicit types
- Add type guards for hot paths
- Expected gain: 10-15%

### Pass 2: Convert to Classes
**Target:** Better V8 optimization through monomorphic shapes
- Convert zenProto to class
- Convert computedProto to class
- Consistent object shapes from construction
- Expected gain: 15-20%

### Pass 3: Separate Listener Types
**Target:** Eliminate double loop in fanout scenario
- Split listeners into: computedListeners[] and effectListeners[]
- Mark computed listeners STALE without iteration
- Direct notification only to effect listeners
- Expected gain: 30-40% for fanout

### Pass 4: Optimize indexOf
**Target:** Reduce O(n) lookups
- Use WeakMap for listener tracking
- Or use Set-like structure
- Expected gain: 5-10%

### Pass 5: Inline More Aggressively
**Target:** Reduce function call overhead
- Inline _subscribeToSources
- Inline equality checks
- Expected gain: 10-15%

### Pass 6: Algorithm Optimization
**Target:** Match SolidJS's approach more closely
- Research SolidJS source for edge cases
- Profile-guided optimization
- Expected gain: 20-30%

## Success Metrics
- Fanout: 25.3x → <10x
- Diamond/Triangle: 15x → <8x
- Overall: 15x → <5x

## Tracking
Each pass will:
1. Make changes
2. Build dist
3. Run benchmark
4. Save results to baseline-pass-N.txt
5. Document in progress-log.md
