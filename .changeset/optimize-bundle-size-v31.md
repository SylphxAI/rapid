---
"@sylphx/zen": minor
---

Optimize core package size and performance

**Bundle Size Improvements:**
- Reduced from 2.61 KB to 1.68 KB gzipped (-36%)
- Removed unused features (select, batched, batchedUpdate)
- Removed object pooling optimization
- Simplified computed implementation

**Performance Results (vs v3.0.0):**
- Atom operations: Same or faster (1.00-1.11x)
- Batch operations: 33% faster (1.33x)
- Computed creation: 16% slower (acceptable trade-off)
- All other operations: Same performance

**Features:**
- Added effect() API for side effects with auto-tracking
- Cleaner, more maintainable codebase
- Better balance of size, performance, and features

**Trade-offs:**
- Size: +42% vs v3.0.0 (1.18 KB → 1.68 KB) - justified by effect API
- Computed creation: 16% slower - acceptable for cleaner implementation
