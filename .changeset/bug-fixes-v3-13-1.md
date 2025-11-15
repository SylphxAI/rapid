---
"@sylphx/zen": patch
---

fix(zen): critical bug fixes and code improvements

**Critical Fixes:**

**Bug 1.1 - Computed Dependency Rewire:**
- Fixed computed dependency tracking to compare ALL sources, not just first 2
- Example: `[a,b,c] → [a,b,d]` now correctly unsubscribes from `c` and subscribes to `d`

**Bug 1.2 - Error Handling:**
- Added try/finally to `_recomputeIfNeeded()` to ensure FLAG_PENDING is cleared on errors
- Prevents computed nodes from getting "stuck" after exceptions

**Bug 1.3 - Batched Flush:**
- Fixed flush logic to preserve notifications added during flush
- Changed from clearing entire queue to `splice(0, len)` to avoid losing updates

**Bug 1.4 - Computed Subscribe:**
- Fixed `subscribe(computed, listener)` to properly notify when upstream changes
- Added recursive recomputation for multi-level computed chains with subscribers
- Cleared stale pending notifications from initial subscription to avoid wrong oldValue
- Added 3 new tests to verify computed subscribe behavior

**Code Quality:**
- Removed dead code (arraysEqual, createSourcesArray)
- Fixed misleading O(1) unsubscribe documentation (actually O(n))

**Tests:**
- All 40 tests passing (37 existing + 3 new for Bug 1.4)

**Principle:** Correctness > Performance. All fixes prioritize correct behavior.
