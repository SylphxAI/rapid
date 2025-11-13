---
"@sylphx/zen": patch
---

## 🚨 CRITICAL FIX: Real Performance Hotfix for v3.1.4

**Actual fix for performance regression that affected v3.1.2 and v3.1.3**

### Root Cause Discovery
- v3.1.3 was identical to v3.1.2 - the hotfix never actually published
- Both versions contained the problematic single-file consolidated implementation
- The "fix" commits were correctly made to main branch but never published to npm
- Third-party benchmarks correctly identified that v3.1.3 performed same as v3.1.2

### What Actually Happened
1. **v3.1.0**: Working optimized multi-file implementation (computed.ts + effect.ts)
2. **v3.1.2**: Consolidated to single-file zen.ts (performance regression)
3. **v3.1.3**: Published identical broken code (hotfix failed to publish)
4. **v3.1.4**: **Real fix** - publishes the correctly reverted multi-file implementation

### Technical Details
- ✅ Restores proper exports: `export { computed } from './computed'` and `export { effect } from './effect'`
- ✅ Uses optimized computed.ts (11KB) and effect.ts (5KB) implementations
- ✅ Maintains 1.68 KB gzipped bundle size
- ✅ All 77 tests passing
- ✅ Verified performance: computed reads 8.5k+ ops/sec

### Impact
- ✅ Restores original high performance characteristics
- ✅ Fixes the performance regression completely
- ✅ Returns Zen to expected competitive performance vs SolidJS/Preact
- ✅ Maintains 100% API compatibility (no breaking changes)

### For Users
**Critical upgrade**: `npm install @sylphx/zen@3.1.4`

All applications using v3.1.2 or v3.1.3 should upgrade immediately to restore the intended performance characteristics.