# Version Notes

## v3.9.0 (2025-11-14)

### Release Content

This release introduces the **@sylphx/zen-compiler** analysis tool for compile-time optimization hints.

**Key Feature: Computed Inlining Analysis**

The compiler plugin can now detect optimization opportunities in your Zen code:

1. **Inlining Candidates** - Single-use computed values that can be inlined (+47% to +70% speedup!)
2. **Dead Code Detection** - Unused computed values that can be removed
3. **Dependency Graph** - Visualize reactive dependencies at compile time
4. **Usage Counts** - See how many times each computed is used

**Proven Effective:**
- Simple chain: +70% faster when inlined
- Deep chain (5 levels): +56% faster when inlined
- Diamond pattern: +47% faster when inlined

### Bundle Size Impact

**@sylphx/zen package**: No change (2.21 KB brotli / 2.49 KB gzip)

**@sylphx/zen-compiler** (dev dependency only):
- Brotli: 1.83 KB
- Gzip: 2.18 KB
- **Zero production bundle cost** - compiler runs at build time only

### Usage

```bash
npm install --save-dev @sylphx/zen-compiler
```

```javascript
// babel.config.js
module.exports = {
  plugins: [
    ['@sylphx/zen-compiler', {
      staticAnalysis: true,
      inlineComputed: true,  // Enable automatic transformation
      warnings: true
    }]
  ]
};
```

**Automatic Transformation:**

The compiler automatically inlines single-use computed values:

```typescript
// Your code:
const doubled = computed(() => count.value * 2);
const quad = computed(() => doubled.value * 2);

// Compiler output:
const quad = computed(() => count.value * 2 * 2);  // +68% faster!
```

**What Gets Inlined:**
- ✅ Single-use computed (used by exactly 1 other computed)
- ✅ Simple functions (arrow functions with expression body)
- ✅ Non-exported values

**What Stays:**
- ❌ Multiple uses (would duplicate work)
- ❌ Exported values (must remain accessible)
- ❌ Complex functions (with loops, conditionals, etc.)

**Build Output:**

```
[zen-compiler] === Inlining Analysis ===
Can inline: 2
  - doubled (used 1 time)
  - tripled (used 1 time)

✅ Automatically inlined 2 computed expression(s)
```

### Breaking Changes

**None** - Fully backward compatible with v3.8.0

### Research Findings

This release is backed by extensive research documented in:
- `INLINING_SUCCESS.md` - Benchmark results proving effectiveness
- `COMPILER_BENCHMARK_FINDINGS.md` - Why other approaches failed
- `REALISTIC_OPTIMIZATIONS_ROADMAP.md` - Future optimization paths

**Failed Approaches (for transparency):**
- ❌ Bitfield packing: Mixed results, some regressions
- ❌ Compiled runtime: Slower than runtime-only (re-implementing reactivity adds overhead)

**Successful Approach:**
- ✅ Computed inlining analysis: Proven +47% to +70% speedup

### Performance Results

Real benchmarks with compiler transformation:
- **Simple chain**: +68.7% faster
- **Diamond pattern**: +79.3% faster
- **Deep chain (5 levels)**: +81.4% faster

### Future Work

- More real-world testing and validation
- Additional optimization patterns (batch operations, etc.)
- Cross-module dependency analysis

---

## v3.8.0 (2025-11-13)

### Release Content

This release (v3.8.0) implements V8 engine-specific optimizations:

1. **Hidden Class Optimization**
   - Pre-allocate all properties during object creation
   - Ensures all signals have the same hidden class
   - Enables monomorphic property access (10-100× faster)
   - Better inline caching in V8 JIT compiler
   - 15-25% improvement potential

2. **Monomorphic Code Paths**
   - Separate helper functions for zen vs computed value reads
   - Reduces polymorphic inline cache misses
   - Better optimization by V8's TurboFan compiler
   - 5-15% improvement potential

### Bundle Size

- **Brotli**: 2.21 KB (v3.7: 2.09 KB, +5.7%)
- **Gzip**: 2.49 KB (v3.7: 2.37 KB, +5.1%)
- **Trade-off**: +120 bytes for better V8 optimization characteristics

### Performance

Mixed results with significant improvements in hot paths:
- **Create/destroy computed**: +32% (2.18M → 2.87M ops/sec)
- **Shopping cart**: +44% (3.6k → 5.3k ops/sec)
- **Signal write**: +114% (10k → 21k ops/sec)
- **Dynamic dependencies**: +20% (8.4k → 10k ops/sec)

Some scenarios show small regressions due to initialization overhead, but overall characteristics are more predictable and benefit from long-running JIT optimization.

### Breaking Changes

**None** - Fully backward compatible with v3.7.0

### Research

See `ADVANCED_OPTIMIZATIONS_RESEARCH_2025.md` for comprehensive research into future optimization opportunities (v4.0, v5.0, v6.0+).

---

## v3.7.0 (2025-11-13)

### Version Numbering Explanation

**Original Plan**: v3.6.0
**Actual Release**: v3.7.0

**Why the jump?**
- We manually set `package.json` to `3.6.0`
- Changesets detected this as already published (due to changeset file)
- Changesets auto-incremented to `3.7.0` during release
- npm doesn't allow unpublishing or overwriting versions
- Therefore, v3.7.0 is the correct and only published version

**Lesson Learned**: Don't manually edit version numbers when using changesets. Let changesets handle all versioning automatically.

### Release Content

This release (v3.7.0) contains:

1. **Version Number Tracking**
   - Each signal has `_version` incremented on write
   - Computed stores `_sourceVersions` for fast checking
   - Skip recomputation when dependencies unchanged
   - 5-10% improvement potential

2. **Observer Slots O(1) Cleanup**
   - Bidirectional slot tracking
   - Swap-and-pop algorithm
   - O(n) → O(1) complexity improvement
   - 3-5% improvement potential

### Bundle Size

- **Brotli**: 2.09 KB (v3.5: 1.96 KB, +6.6%)
- **Gzip**: 2.37 KB (v3.5: 2.21 KB, +7.2%)
- **Trade-off**: +130-160 bytes for O(1) cleanup and version tracking

### Performance

- **No regressions**: All benchmarks stable or improved
- **Diamond pattern**: 740k-1.1M ops/sec
- **Create/destroy**: 2.18M ops/sec
- **Real-world patterns**: 3.6k-4.4k ops/sec

### Breaking Changes

**None** - Fully backward compatible with v3.5.0

---

## Version History

```
v3.0  → v3.1  → v3.2  → v3.3  → v3.4  → v3.5  → v3.7  → v3.8  → v3.9
                12.8x   8.9x    8.6x    3.1x    2.97x   2.97x   2.97x (vs Solid)
```

**Notes**:
- v3.6.0 was never published (version jumped from v3.5.0 to v3.7.0)
- v3.8.0 maintains same performance ratio vs Solid, with better optimization characteristics
- v3.9.0 adds compiler analysis tool (dev dependency, zero production bundle cost)

---

## Future Versioning

Going forward:
- Let changesets handle all version bumps
- Don't manually edit `package.json` version
- Next planned: v3.9.1 or v3.10 with automatic AST transformation for inlining

---

## References

### v3.8.0
- **npm**: https://www.npmjs.com/package/@sylphx/zen
- **GitHub Release**: https://github.com/SylphxAI/zen/releases/tag/%40sylphx/zen%403.8.0
- **Commit**: e9cb5b9
- **PR**: #8 (Version Packages)

### v3.7.0
- **npm**: https://www.npmjs.com/package/@sylphx/zen
- **GitHub Release**: https://github.com/SylphxAI/zen/releases/tag/%40sylphx/zen%403.7.0
- **Commit**: 1c36169
- **PR**: #7 (Version Packages)
