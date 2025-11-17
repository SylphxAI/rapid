---
'@sylphx/zen': patch
---

v3.45.0: Revert v3.44.0 batch removal regression

REVERT - v3.44.0 Batch Removal:
- Restored batchDepth++/-- for 100+ observer scenarios
- Batch removal caused major performance regression across multiple benchmarks
- Auto-batching mechanism is critical for wide fanout performance

PERFORMANCE IMPACT (v3.44.0 regression):
- Overall: 69.4/100 → 58.1/100 (-11.3 points, -16%)
- Wide Fanout (1→100): 336K → 299K ops/sec (-11% regression)
- Massive Fanout (1→1000): 35K → 33K ops/sec (-6% regression)
- Single Write: 17.9M → 16.2M (-9% regression)

ROOT CAUSE:
- batchDepth mechanism controls effect scheduling, not just overhead
- Removing batching for 100+ observers broke auto-batching for wide fanouts
- The batch mechanism serves a purpose beyond perceived overhead

RESTORATION:
- Restore v3.43.0 baseline performance (69.4/100 variance-based score)
- Return to batching strategy for 100+ observers
- Confirms that simpler is not always faster - batching is necessary

LESSONS LEARNED:
- v3.42.0: Chunked batching added too much overhead (nested loops)
- v3.44.0: Removing batching broke auto-batching mechanism
- Batch mechanism at current threshold (100+) is optimal for v3.43.0 baseline
