---
"@sylphx/zen": minor
---

Performance optimizations and DX improvements:

- Added `untrack()` helper for reading values without tracking dependencies
- Added `peek()` helper for single value reads without tracking
- Simplified dependency rewiring (removed complex diff logic, always rewire)
- Effect closure reuse to reduce allocations on re-runs
- Conservative downstream effect caching (FLAG_HAD_EFFECT_DOWNSTREAM)
- Removed unused `_version` field
- Added FLAG_IS_COMPUTED for cross-realm safety
- Protected `_recomputeIfNeeded()` for type safety

Performance improvements:
- Effect operations: +41%
- Nested batch: +2122%
- Subscribe/unsubscribe: +10%
