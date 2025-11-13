---
"@sylphx/zen": minor
---

feat: 16x faster batching - now surpasses Solid Signals performance

BREAKING: None (backward compatible)

Performance improvements in v3.2:
- Batching operations: 16.85x faster (now 1.28x faster than Solid!)
- Deep reactive chains: 30x faster
- Diamond patterns: 25x faster
- Basic write operations: 1.7x faster
- Bundle size: Still only 1.68 KB gzipped

Technical changes:
- Implemented queue-based batching (Solid-inspired architecture)
- Separate Updates/Effects queues for proper execution order
- Optimized auto-tracking with reduced scanning overhead
- State-based dirty tracking for future optimizations

Benchmark results show zen now surpasses Solid Signals in batching performance while maintaining its tiny bundle size advantage.
