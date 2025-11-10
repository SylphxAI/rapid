---
"@sylphx/zen": major
---

# Zen v2.0.0 - Major Release with Breaking Changes

## 🔥 New zen.value API - 73% Faster Reads, 56% Faster Writes

The biggest change in v2.0.0 is the new property-based API that **replaces** the old `get()`/`set()` functions.

**BREAKING CHANGE**: The `get(zen)` and `set(zen, value)` APIs have been removed.

```typescript
// ❌ v1.x - Old API (REMOVED)
const count = zen(0);
get(count);        // NO LONGER WORKS
set(count, 1);     // NO LONGER WORKS

// ✅ v2.0 - New API (REQUIRED)
const count = zen(0);
count.value;       // 285.65M ops/s - 73% faster! 🚀
count.value = 1;   // 105.17M ops/s - 56% faster! 🚀
count.value++;     // Increment works too!
```

**Migration Steps**:
1. Replace all `get(zenInstance)` with `zenInstance.value`
2. Replace all `set(zenInstance, value)` with `zenInstance.value = value`
3. Test your application thoroughly

## 💥 Removed karma/zenAsync

**BREAKING CHANGE**: The `karma` and `zenAsync` APIs have been completely removed in favor of the new `computedAsync`.

```typescript
// ❌ v1.x - karma (REMOVED)
const fetchUser = karma(async (id) => fetchUserAPI(id));
await runKarma(fetchUser, get(userId)); // Manual!

// ✅ v2.0 - computedAsync (NEW)
const user = computedAsync([userId], async (id) => fetchUserAPI(id));
// Automatic reactivity! No manual runKarma needed
```

## ✨ New Features

### computedAsync - Reactive Async Computed Values

```typescript
const userId = zen(1);
const user = computedAsync([userId], async (id) => {
  return await fetchUser(id);
});

// Subscribe to get updates
subscribe(user, (state) => {
  if (state.loading) console.log('Loading...');
  if (state.data) console.log('User:', state.data);
  if (state.error) console.log('Error:', state.error);
});

// Automatically refetches when dependency changes!
userId.value = 2; // ✅ Triggers automatic refetch
```

**Features**:
- ✅ Automatic dependency tracking
- ✅ Built-in loading/error states
- ✅ Race condition protection
- ✅ Multiple dependencies support
- ✅ Lazy evaluation
- ✅ Nested computed support

## 🚀 Performance Improvements

- **+44% average performance** (with new zen.value API)
- **+73% faster reads** with zen.value (285M vs 165M ops/s)
- **+56% faster writes** with zen.value = x (105M vs 67M ops/s)
- **+61% faster** subscribe/unsubscribe operations
- **+59% faster** computed creation
- **+58% faster** computed updates
- **+49% faster** batch updates
- **+45% faster** map updates
- **+37% faster** map creation
- **+34% faster** computed reads
- **+33% faster** zen creation
- **+19% faster** complex reactive graphs
- **12 out of 13 benchmarks faster** (92% success rate)

## 📦 Bundle Size

- **ESM (gzip)**: 5.76 KB (was 6.01 KB, **-4.2%**)
- **CJS (gzip)**: 5.99 KB (was 6.25 KB, **-4.2%**)

Smaller bundle despite adding new features!

## 🎯 Summary

v2.0.0 is a major version upgrade with breaking changes:

- 💥 **BREAKING**: `get()`/`set()` replaced with `zen.value` API
- 💥 **BREAKING**: `karma`/`zenAsync` removed, use `computedAsync`
- ✨ **NEW**: `zen.value` property API (73% faster reads, 56% faster writes)
- ✨ **NEW**: `computedAsync` for reactive async patterns
- 🚀 **44% average performance improvement**
- 📦 **4.2% smaller bundle size**

**Migration is required** for all projects. See migration guide above.

Full comparison report: VERSION_COMPARISON_REPORT.md
