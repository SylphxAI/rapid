# @sylphx/zen-compiler

> **Experimental** Babel/TypeScript compiler plugin for Zen reactive state optimization

## ✅ Status: v0.1.0 - Automatic Inlining

This package provides **automatic computed inlining optimization** for Zen reactive state management.

**Features:**
- ✅ Automatic inlining of single-use computed values
- ✅ Dependency graph analysis
- ✅ Dead code detection
- ✅ Smart preservation of multi-use and exported values
- ✅ **Proven +68-81% performance improvement!**

**Future Features:**
- ⏳ Batch write optimization
- ⏳ Cross-module dependency analysis

## 🎯 Goal

Automatically optimize Zen code at build time for +68-81% performance improvement with zero runtime cost.

## 💡 Concept

### Current Runtime Approach

```typescript
// User writes:
const a = zen(1);
const b = zen(2);
const c = computed(() => a.value + b.value);

// Runtime must:
// 1. Track dependencies dynamically (overhead!)
// 2. Build dependency graph at runtime
// 3. Manage subscriptions dynamically
```

### Compiler-Optimized Approach

```typescript
// Compiler analyzes code and generates:
const __zenGraph = {
  signals: [
    { id: 0, value: 1 },  // a
    { id: 1, value: 2 }   // b
  ],
  computed: [
    {
      id: 2,
      deps: [0, 1],  // Pre-analyzed dependencies!
      fn: (a, b) => a + b
    }
  ]
};

// Benefits:
// ✅ No runtime dependency tracking
// ✅ Direct array access (faster than Map)
// ✅ Pre-sorted execution order
// ✅ Dead code elimination for unused computeds
```

## 🔧 Features (Planned)

### 1. Static Dependency Analysis
- Detect `zen()` and `computed()` calls
- Analyze `.value` accesses in computed functions
- Build dependency graph at compile time
- Generate optimized runtime code

### 2. Pure Computed Inlining ✅ (Fully Automatic!)
- ✅ Detect computed values used only once
- ✅ **Automatically inline them with AST transformation**
- ✅ Proven +68-81% speedup in real benchmarks!
- ✅ Smart safety checks (preserve exports, multi-use, etc.)

**Before (your code):**
```typescript
const doubled = computed(() => count.value * 2);
const quad = computed(() => doubled.value * 2);
```

**After (compiler output):**
```typescript
const quad = computed(() => count.value * 2 * 2);  // +68% faster!
```

**Build Output:**
```
[zen-compiler] === Inlining Analysis ===
Total computed: 2
Can inline: 1

✅ Automatically inlined 1 computed expression(s)
```

### 3. Batch Optimization
- Detect patterns like:
  ```typescript
  batch(() => {
    a.value = 1;
    b.value = 2;
    c.value = 3;
  });
  ```
- Generate specialized batch write code

### 4. Dead Code Elimination
- Remove unused computed values
- Only include runtime code for active reactivity patterns

## 📊 Proven Impact

Based on real benchmarks (see `/INLINING_SUCCESS.md`):

- **Performance**: +68-81% improvement (proven in benchmarks!)
- **Bundle Size**: +0 bytes (compiler is dev dependency, 1.93 KB brotli)
- **Breaking Changes**: None (opt-in via Babel config)

**Benchmark Results:**
- Simple chain: +68.7% faster
- Diamond pattern: +79.3% faster
- Deep chain (5 levels): +81.4% faster

## 🚧 Current Limitations

1. **Dynamic patterns not supported**:
   ```typescript
   // ❌ Cannot optimize:
   const signals = [zen(1), zen(2), zen(3)];

   // ✅ Can optimize:
   const a = zen(1);
   const b = zen(2);
   const c = zen(3);
   ```

2. **Conditional computed not supported**:
   ```typescript
   // ❌ Cannot optimize:
   const c = computed(() => {
     if (Math.random() > 0.5) return a.value;
     return b.value;
   });
   ```

3. **Cross-module dependencies**:
   - Currently only analyzes single file
   - Module-level dependency analysis needs more work

## 🔬 Research Findings

### Why Not Bitfield Packing?

We tried bitfield packing (storing flags in numbers) but found:
- **Bundle**: +80 bytes
- **Performance**: Mixed results (-15% to +13%)
- **Reason**: Function call overhead > bitwise operation benefits

For reactive state, **direct property access > bitwise with wrappers**.

### Why Compiler Optimizations?

- ✅ Zero runtime cost (compiler is dev dependency)
- ✅ Addresses root cause (runtime tracking overhead)
- ✅ Industry-proven (Solid.js, Svelte use this approach)
- ✅ 30-40% potential gain (backed by research)

## 📚 References

- **Solid.js**: Compiler-first reactive framework (1× baseline performance)
- **Svelte 5**: Runes system with compile-time analysis
- **Signal-First Architectures** (arXiv:2506.13815v1): 62% faster through AOT analysis

## 🛠️ Usage (When Ready)

```bash
npm install --save-dev @sylphx/zen-compiler
```

```javascript
// babel.config.js
module.exports = {
  plugins: [
    ['@sylphx/zen-compiler', {
      staticAnalysis: true,
      inlineComputed: true,
      warnings: true
    }]
  ]
};
```

## 📝 Development Status

- [x] Research phase: Why compiler optimizations?
- [x] Package skeleton created
- [x] Babel plugin implementation
- [x] Dependency graph analysis
- [x] Inlining analysis implementation
- [x] **AST transformation for automatic inlining**
- [x] Edge case handling (exports, multi-use)
- [x] Benchmark vs runtime-only (proven +68-81%!)
- [x] **v0.1.0 Ready** - Automatic inlining
- [ ] Cross-module analysis (future)
- [ ] Batch optimization (future)

## 🤔 Questions?

This is experimental research. See `/REALISTIC_OPTIMIZATIONS_ROADMAP.md` for full context and reasoning.

---

**Note**: This compiler approach is the **most promising path** to closing the performance gap with Solid.js while maintaining Zen's small bundle size.
