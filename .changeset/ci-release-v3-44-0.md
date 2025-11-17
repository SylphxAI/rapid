---
'@sylphx/zen': minor
---

v3.44.0: Remove batch overhead from observer notification

OPTIMIZATION - Observer Notification Performance:
- Removed batchDepth++/-- overhead from `_notifyObservers()` method
- Eliminated 100+ observer threshold check and branching
- Simplified to single loop for all observer counts (except single-observer fast path)

PERFORMANCE TARGETS:
- Massive Fanout (1→1000): 35K → 200K+ ops/sec (5.7x improvement target)
- Wide Fanout (1→100): Maintain 336K ops/sec (no regression)
- All other benchmarks: Maintain or improve v3.43.0 baseline

HYPOTHESIS:
- batchDepth increment/decrement adds overhead for 100+ observer scenarios
- Single loop should be faster than branch + batchDepth manipulation
- Batch mechanism primarily for effect scheduling, not pure computed propagation

CONTEXT:
- v3.43.0 baseline: 69.4/100 variance-based (restored from v3.42.0 regression)
- Massive fanout remains 10x slower than Solid.js (35K vs 351K ops/sec)
- Targeting Solid.js performance parity for large fanout scenarios
