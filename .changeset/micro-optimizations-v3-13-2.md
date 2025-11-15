---
"@sylphx/zen": minor
---

Performance optimizations: Object.is, epoch-based deduplication, caching, and code unification

**Major Performance Improvements:**
- Batch operations: +50-61% (batch 1 update: 13.5M ops/sec, batch 3 updates: 14.8M ops/sec)
- Notify operations: +68% (notify 3 subscribers: 8.9M ops/sec)
- Computed dependencies: +220% (computed with 3 deps: 739K ops/sec)
- Effect re-execution: +19% (7.6M ops/sec)

**Optimizations:**
1. **Object.is**: Replaced custom NaN/±0 handling with V8-optimized native implementation (-10 lines)
2. **Epoch-based deduplication**: O(n) → O(1) dependency tracking using integer epochs instead of indexOf
3. **hasDownstreamEffectListeners caching**: Added FLAG_HAS_EFFECT_DOWNSTREAM to cache DFS results with lazy invalidation
4. **Unified dirty queue paths**: Extracted propagateToComputeds() helper to reduce duplication (-10 lines)
5. **Removed optional chaining**: Eliminated unnecessary runtime checks in unsubscribe loops

**Code Quality:**
- 20 lines removed total
- Reduced complexity through unification
- Improved maintainability

All 40 tests passing. Core primitives remain stable (±3%).
