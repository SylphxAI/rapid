# Migration Guides

Choose the migration guide for your current version:

## Migrating to v3 (Latest)

If you're currently using **Zen v2**, upgrade to v3 for massive improvements:

- 🎉 **80% smaller** - 1.14 KB vs 5.76 KB gzipped
- ⚡ **8x faster** in real-world scenarios
- 🪄 **Auto-tracking** - No manual dependency arrays
- ✨ **New features** - Built-in async support

**[→ v2 to v3 Migration Guide](/guide/migration-v2-to-v3)**

### Quick Summary

```typescript
// v2
const sum = computed([a, b], (av, bv) => av + bv);

// v3
const sum = computed(() => a.value + b.value);
```

---

## Migrating from v1

If you're still using **Zen v1** (the original `atom` API):

**[→ v1 to v2 Migration Guide](/guide/migration-v1-to-v2)**

### Quick Summary

```typescript
// v1
const count = atom(0);
const value = get(count);
set(count, 1);

// v2+
const count = zen(0);
const value = count.value;
count.value = 1;
```

---

## Version Compatibility

| Version | Status | Bundle Size | Auto-tracking |
|---------|--------|-------------|---------------|
| **v3** (latest) | ✅ Active | 1.14 KB | ✅ Yes |
| v2 | ⚠️ Maintenance | 5.76 KB | ❌ No |
| v1 | ❌ Deprecated | ~6 KB | ❌ No |

**We strongly recommend upgrading to v3** for the best performance and developer experience.

## Need Help?

- [GitHub Issues](https://github.com/SylphxAI/zen/issues)
- [Getting Started](/guide/getting-started)
- [Core Concepts](/guide/core-concepts)
