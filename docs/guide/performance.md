# Performance

Zen v2.0 is designed from the ground up for maximum performance with minimal overhead. This guide explains the performance characteristics and optimizations.

## Benchmarks

### Read Performance

Zen v2.0 uses native getters instead of function calls, resulting in significantly faster reads:

| Library | Reads/sec | vs Zen v2.0 |
|---------|-----------|-------------|
| **Zen v2.0** | **26.3M ops/s** | - |
| Nanostores | 18.5M ops/s | 42% slower |
| Zen v1.0 | 15.2M ops/s | 73% slower |
| Jotai | 16.2M ops/s | 62% slower |
| Zustand | 14.8M ops/s | 78% slower |

### Write Performance

Native setters provide efficient writes with automatic notification:

| Library | Writes/sec | vs Zen v2.0 |
|---------|-----------|-------------|
| **Zen v2.0** | **13.4M ops/s** | - |
| Nanostores | 10.2M ops/s | 31% slower |
| Zustand | 9.1M ops/s | 47% slower |
| Jotai | 8.9M ops/s | 51% slower |
| Zen v1.0 | 8.6M ops/s | 56% slower |

### Bundle Size

Zen balances performance with a reasonable bundle size:

| Package | Minified | Gzipped |
|---------|----------|---------|
| **@sylphx/zen** | **16.8 KB** | **5.7 KB** |
| @sylphx/zen-react | +0.8 KB | +0.3 KB |
| @sylphx/zen-router | 9.4 KB | 3.2 KB |
| @sylphx/zen-persistent | 8.2 KB | 2.8 KB |

Comparison with alternatives:

| Library | Gzipped |
|---------|---------|
| Jotai | 3.0 KB |
| Nanostores | 3.2 KB |
| Zustand | 3.5 KB |
| **Zen** | **5.7 KB** |
| Valtio | 8.2 KB |
| MobX | 16.5 KB |

## Performance Features

### 1. Native Getters/Setters

Zen v2.0 uses native JavaScript property accessors for zero-overhead reactivity:

```typescript
const count = zen(0);

// Direct property access - no function call overhead
const value = count.value; // Native getter
count.value = 1; // Native setter
```

**Why it's fast**:
- No function call overhead
- Direct property access
- JIT-friendly patterns
- Minimal stack frames

### 2. Efficient Dependency Tracking

Computed values only track actual dependencies:

```typescript
const a = zen(1);
const b = zen(2);
const c = zen(3);

const result = computed([a, b, c], (aVal, bVal, cVal) => {
  // Only uses a and b
  return aVal + bVal;
});

// Changing c doesn't trigger recalculation
c.value = 10; // No recomputation
```

### 3. Lazy Evaluation

Computed values are only evaluated when accessed:

```typescript
const base = zen(10);

// Not evaluated yet
const expensive = computed([base], (x) => {
  console.log('Computing...');
  return x * x;
});

// Still not evaluated - no log

// Now evaluated
console.log(expensive.value); // Logs "Computing..." then 100

// Cached - no recomputation
console.log(expensive.value); // 100 (no log)
```

### 4. Batching

Batch updates to minimize subscriber notifications:

```typescript
const a = zen(1);
const b = zen(2);

let notifyCount = 0;
subscribe(a, () => notifyCount++);
subscribe(b, () => notifyCount++);

// Batch updates
batch(() => {
  a.value = 10;
  b.value = 20;
  a.value = 15;
  b.value = 25;
});

// Only 2 notifications (one per store), not 4
console.log(notifyCount); // 2
```

### 5. Map Store Granularity

Update individual object properties without replacing the entire object:

```typescript
const state = map({
  user: { name: 'John', age: 30 },
  settings: { theme: 'dark' },
  data: { items: [] }
});

// Listen to specific keys only
listenKeys(state, ['user'], (val) => {
  console.log('User changed');
});

// Efficient single-key update
setKey(state, 'settings', { theme: 'light' }); // No log

setKey(state, 'user', { name: 'Jane', age: 25 }); // Logs
```

## Performance Best Practices

### ✅ Do: Use Map Stores for Objects

```typescript
// Good - efficient partial updates
const user = map({
  name: 'John',
  age: 30,
  email: 'john@example.com'
});

setKey(user, 'age', 31); // Only updates age
```

```typescript
// Bad - replaces entire object
const user = zen({
  name: 'John',
  age: 30,
  email: 'john@example.com'
});

user.value = { ...user.value, age: 31 }; // Copies entire object
```

### ✅ Do: Batch Related Updates

```typescript
// Good - single notification
batch(() => {
  firstName.value = 'Jane';
  lastName.value = 'Doe';
  age.value = 25;
});
```

```typescript
// Bad - three notifications
firstName.value = 'Jane';
lastName.value = 'Doe';
age.value = 25;
```

### ✅ Do: Use Computed for Derived State

```typescript
// Good - automatic updates, cached
const total = computed(
  [price, quantity],
  (p, q) => p * q
);
```

```typescript
// Bad - manual updates, no caching
let total = price.value * quantity.value;
subscribe(price, () => {
  total = price.value * quantity.value;
});
subscribe(quantity, () => {
  total = price.value * quantity.value;
});
```

### ✅ Do: Minimize Computed Dependencies

```typescript
// Good - only depends on what's used
const result = computed([a, b], (aVal, bVal) => {
  return aVal + bVal;
});
```

```typescript
// Bad - unnecessary dependency
const result = computed([a, b, c], (aVal, bVal, cVal) => {
  return aVal + bVal; // c not used
});
```

### ✅ Do: Clean Up Subscriptions

```typescript
// Good - cleanup when done
function useCounter() {
  const unsub = subscribe(count, handleChange);

  return () => unsub(); // Cleanup function
}
```

```typescript
// Bad - memory leak
function useCounter() {
  subscribe(count, handleChange); // Never cleaned up
}
```

## Memory Optimization

### Subscription Cleanup

Always unsubscribe when done:

```typescript
// Manual subscription
const unsubscribe = subscribe(store, handler);
// Later...
unsubscribe();

// Framework integrations handle this automatically
const value = useStore(store); // Auto cleanup on unmount
```

### Computed Value Cleanup

Computed values are automatically cleaned up when no longer referenced:

```typescript
function createTemporaryComputed() {
  const base = zen(10);
  const computed = computed([base], x => x * 2);
  return computed.value;
}

// computed is garbage collected after function returns
```

## Real-World Performance

### Component Rendering

```typescript
// Efficient - only rerenders when count changes
function Counter() {
  const count = useStore(countStore);
  return <div>{count}</div>;
}

// Efficient - only rerenders when user.name changes
function UserName() {
  const user = useStore(userStore);
  return <div>{user.name}</div>;
}
```

### List Rendering

```typescript
// Efficient with map store
const items = map({
  item1: { text: 'Buy milk', done: false },
  item2: { text: 'Walk dog', done: true }
});

// Update single item without affecting others
setKey(items, 'item1', { text: 'Buy milk', done: true });
```

### Form Handling

```typescript
// Efficient field updates
const form = map({
  name: '',
  email: '',
  age: 0
});

// Each field updates independently
setKey(form, 'name', 'John');
setKey(form, 'email', 'john@example.com');
```

## Profiling

### Measuring Performance

```typescript
const count = zen(0);

console.time('writes');
for (let i = 0; i < 1000000; i++) {
  count.value = i;
}
console.timeEnd('writes');

console.time('reads');
for (let i = 0; i < 1000000; i++) {
  const val = count.value;
}
console.timeEnd('reads');
```

### Benchmarking with Vitest

```typescript
import { bench, describe } from 'vitest';
import { zen } from '@sylphx/zen';

describe('Zen Performance', () => {
  bench('read operations', () => {
    const store = zen(0);
    for (let i = 0; i < 1000; i++) {
      const val = store.value;
    }
  });

  bench('write operations', () => {
    const store = zen(0);
    for (let i = 0; i < 1000; i++) {
      store.value = i;
    }
  });
});
```

## Next Steps

- [Core Concepts](/guide/core-concepts) - Understand the fundamentals
- [Batching Updates](/guide/batching) - Learn advanced batching techniques
- [Map Stores](/guide/maps) - Master efficient object updates
