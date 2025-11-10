# Changelog

## v2.0.0 (Current)

### 🚀 Major Changes

#### Native Property Accessors

The biggest change in v2.0 is the switch from function-based to property-based access:

```typescript
// v1.x
import { atom, get, set } from '@sylphx/zen';
const count = atom(0);
get(count); // read
set(count, 1); // write

// v2.0
import { zen } from '@sylphx/zen';
const count = zen(0);
count.value; // read
count.value = 1; // write
```

**Why?** Native getters/setters provide:
- 73% faster reads
- 56% faster writes
- More intuitive API
- Better code ergonomics

#### API Renames

- `atom()` → `zen()`
- `get()` → `.value` property
- `set()` → `.value = ...`
- `compute()` → `computed()`
- `listen()` → `subscribe()`

#### Improved Computed API

Computed values now receive dependency values as arguments:

```typescript
// v1.x
const sum = compute([a, b], () => get(a) + get(b));

// v2.0
const sum = computed([a, b], (aVal, bVal) => aVal + bVal);
```

#### Enhanced Subscription API

Subscribers now receive both new and old values:

```typescript
// v1.x
listen(count, () => {
  console.log(get(count));
});

// v2.0
subscribe(count, (newValue, oldValue) => {
  console.log(`${oldValue} → ${newValue}`);
});
```

### ⚡ Performance Improvements

- **73% faster reads** - Native property access
- **56% faster writes** - Native property setters
- **Reduced memory footprint** - Eliminated closure overhead
- **Better JIT optimization** - More predictable code patterns

### 📦 Bundle Size

- Core: 5.7KB gzipped (vs 6.0KB in v1)
- React: +0.3KB
- Vue: +0.3KB
- Svelte: +0.3KB

### 🔧 Breaking Changes

See [Migration Guide](/guide/migration) for detailed upgrade instructions.

1. **API changes**: All store operations now use `.value` property
2. **Import renames**: `atom` → `zen`, `compute` → `computed`, etc.
3. **Computed function signature**: Dependencies passed as arguments
4. **Subscribe callback signature**: Receives `(newValue, oldValue)`

### ✨ New Features

- **Better TypeScript inference**: Automatic type inference in most cases
- **Improved error messages**: More helpful error messages
- **Enhanced documentation**: Complete rewrite with better examples

### 🐛 Bug Fixes

- Fixed memory leaks in subscription cleanup
- Fixed race conditions in computed values
- Fixed type inference issues with complex generics

---

## v1.2.1

### 🐛 Bug Fixes

- Fixed subscription cleanup in React StrictMode
- Fixed computed value caching issue
- Fixed TypeScript types for map stores

---

## v1.2.0

### ✨ Features

- Added `batch()` function for grouping updates
- Added `listenKeys()` for selective map store subscriptions
- Improved TypeScript types

### 🐛 Bug Fixes

- Fixed computed values not updating in some edge cases
- Fixed memory leak in long-running applications

---

## v1.1.0

### ✨ Features

- Added map stores with `map()` and `setKey()`
- Added persistent stores with `@sylphx/zen-persistent`
- Added router with `@sylphx/zen-router`

### 🔧 Improvements

- Improved performance of subscription notifications
- Better TypeScript inference for computed values

---

## v1.0.0

Initial release

### ✨ Features

- Core reactive atoms with `atom()`, `get()`, `set()`
- Computed values with `compute()`
- Subscriptions with `listen()`
- React integration with `@sylphx/zen-react`
- Vue integration with `@sylphx/zen-vue`
- Svelte integration with `@sylphx/zen-svelte`
- Solid integration with `@sylphx/zen-solid`
- Preact integration with `@sylphx/zen-preact`

---

## Migration Guides

- [v1 to v2 Migration Guide](/guide/migration)

## Next Steps

- [Getting Started](/guide/getting-started)
- [Core Concepts](/guide/core-concepts)
- [API Reference](/api/core)
