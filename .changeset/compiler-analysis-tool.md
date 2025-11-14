---
"@sylphx/zen-compiler": minor
---

feat: Automatic computed inlining optimization

Introduces automatic AST transformation for computed inlining with proven +68-81% performance improvement:

**Features:**
- ✅ Automatic inlining of single-use computed values
- ✅ Dependency graph analysis
- ✅ Dead code detection
- ✅ Smart preservation of multi-use and exported values

**Performance:**
- Simple chain: +68.7% faster
- Diamond pattern: +79.3% faster
- Deep chain: +81.4% faster

**How it works:**
```typescript
// Your code:
const doubled = computed(() => count.value * 2);
const quad = computed(() => doubled.value * 2);

// Compiler output:
const quad = computed(() => count.value * 2 * 2);
```

**Safety:**
- Preserves exported values (public API)
- Preserves multi-use computed (avoids duplicate work)
- Only inlines simple functions (no side effects)

**Zero production bundle cost** - compiler is dev dependency only (1.93 KB brotli).

See VERSION_NOTES.md for detailed usage examples and benchmark results.
