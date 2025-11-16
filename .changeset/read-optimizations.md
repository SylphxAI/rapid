---
'@sylphx/zen': minor
---

Read path optimizations for extreme performance

OPTIMIZATIONS:
- Fast path for CLEAN state (skip _updateIfNecessary call)
- Inline track logic in Signal.get (avoid function call overhead)
- Extract state once in read() (avoid repeated bitwise ops)
- Optimized state checks with early returns

BENCHMARK TARGETS:
- Single Read: Target >20M ops/sec (from 18.1M) - close gap with Solid 22.4M
- Extreme Read (10000x): Target >80K ops/sec (from 64K) - close gap with Solid 318K
- Moderate Read (100x): Maintain 4.9M ops/sec
- Computed Value Access: Improve from 16.7M ops/sec

These micro-optimizations reduce overhead in the hottest code paths (signal reads and computed value access).
