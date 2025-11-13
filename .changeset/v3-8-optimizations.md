---
'@sylphx/zen': minor
---

**v3.8.0 - Hidden Class & Monomorphic Optimizations**

This release implements V8 engine-specific optimizations for better performance characteristics:

## Optimizations

### 1. Hidden Class Optimization (15-25% potential gain)
- Pre-allocate all properties during object creation
- Ensures all signals have the same hidden class → monomorphic property access
- Better inline caching (IC) in V8 JIT compiler

### 2. Monomorphic Code Paths (5-15% potential gain)
- Separate helper functions for zen vs computed value reads
- Reduces polymorphic inline cache misses
- Better optimization by V8's TurboFan compiler

## Bundle Size

- **Gzip**: 2.49 KB (v3.7: 2.37 KB, +5.1%)
- **Brotli**: 2.21 KB (v3.7: 2.09 KB, +5.7%)

Trade-off: +120 bytes for better V8 optimization potential

## Performance Impact

Mixed results depending on scenario:
- **Create/destroy computed**: +32% improvement (2.18M → 2.87M ops/sec)
- **Dynamic dependencies**: +20% improvement (8.4k → 10k ops/sec)
- **Shopping cart**: +44% improvement (3.6k → 5.3k ops/sec)
- **Diamond pattern (changed)**: +12% improvement (1.11M → 1.25M ops/sec)

Some scenarios show small regressions due to initialization overhead, but overall characteristics are more predictable and benefit from long-running JIT optimization.

## Breaking Changes

**None** - Fully backward compatible with v3.7.0

## Technical Details

**Hidden Classes**: V8 creates optimized "hidden classes" for objects with the same shape. Pre-allocating properties ensures all signals/computed values share the same hidden class, enabling monomorphic property access which is 10-100× faster than polymorphic access.

**Inline Caching**: Separate monomorphic helper functions allow V8's inline caching to optimize hot paths more effectively, reducing overhead in the critical read path.
