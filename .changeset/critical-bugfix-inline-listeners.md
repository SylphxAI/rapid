---
'@sylphx/zen': patch
---

fix(zen): critical bug in inline listener storage causing double-calls

**Critical Bug Fix:**

Fixed severe correctness bug in optimization 2.3 (inline listener storage) where 3+ listeners would be called multiple times per update.

**Root Cause:**
- When transitioning from inline storage (1-2 listeners) to array storage (3+ listeners)
- Inline slots `_effectListener1` and `_effectListener2` were not cleared
- `notifyEffects()` would call inline listeners THEN array listeners
- First 2 listeners called twice per update

**Fix:**
1. Clear inline slots when transitioning to array mode
2. Check array mode first in `notifyEffects()` to prevent fallthrough
3. Simplified `hasDownstreamEffectListeners()` to FLAG-only check (relies on upward propagation)

**Verification:**
- Added test case for 3+ listener scenario
- Verifies array transition and single notification per listener
- All 46 tests passing

**Impact**: This was a critical correctness bug that would cause unpredictable behavior in applications with 3+ subscribers to the same signal.
