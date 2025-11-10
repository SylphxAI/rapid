# @sylphx/zen

**Tiny, fast, and elegant reactive state management**

Zen is a minimalist state management library inspired by Nanostores, with an even smaller footprint and exceptional performance.

## Features

- 🪶 **Ultra-lightweight** - Only ~5.7KB gzipped
- ⚡ **Blazing fast** - Native getters/setters for zero-overhead reactivity
- 🎯 **Simple API** - Intuitive `.value` property access
- 🔧 **Type-safe** - Full TypeScript support with excellent type inference
- 🌳 **Tree-shakeable** - Import only what you need
- 📦 **Framework-agnostic** - Works everywhere JavaScript runs

## Installation

```bash
npm install @sylphx/zen
```

## Quick Start

```typescript
import { zen, computed, subscribe } from '@sylphx/zen';

// Create reactive state
const count = zen(0);

// Read value
console.log(count.value); // 0

// Update value
count.value++;

// Computed values
const double = computed([count], (c) => c * 2);
console.log(double.value); // 2

// Subscribe to changes
const unsubscribe = subscribe(count, (value) => {
  console.log('Count changed:', value);
});

// Clean up
unsubscribe();
```

## Core API

### `zen(initialValue)`

Create a reactive zen atom:

```typescript
const count = zen(0);
const user = zen({ name: 'John', age: 30 });

// Read
console.log(count.value); // 0

// Write
count.value = 1;
user.value = { name: 'Jane', age: 25 };
```

### `computed(dependencies, fn)`

Create a computed value that automatically updates:

```typescript
const firstName = zen('John');
const lastName = zen('Doe');

const fullName = computed(
  [firstName, lastName],
  (first, last) => `${first} ${last}`
);

console.log(fullName.value); // "John Doe"

firstName.value = 'Jane';
console.log(fullName.value); // "Jane Doe"
```

### `subscribe(store, callback)`

Subscribe to value changes:

```typescript
const count = zen(0);

const unsubscribe = subscribe(count, (newValue, oldValue) => {
  console.log(`Changed from ${oldValue} to ${newValue}`);
});

count.value = 1; // Logs: "Changed from 0 to 1"

// Clean up
unsubscribe();
```

### `batch(fn)`

Batch multiple updates into a single notification:

```typescript
const x = zen(0);
const y = zen(0);

const sum = computed([x, y], (a, b) => a + b);

subscribe(sum, (value) => console.log('Sum:', value));

// Without batch: logs twice
x.value = 1; // Logs: "Sum: 1"
y.value = 2; // Logs: "Sum: 3"

// With batch: logs once
batch(() => {
  x.value = 10;
  y.value = 20;
}); // Logs: "Sum: 30" (only once)
```

## Map Store

For object-like state with granular updates:

```typescript
import { map, setKey, listenKeys } from '@sylphx/zen';

const user = map({ name: 'John', age: 30, city: 'NYC' });

// Read specific property
console.log(user.value.name); // "John"

// Update specific property (only notifies name listeners)
setKey(user, 'name', 'Jane');

// Subscribe to specific keys
const unsubscribe = listenKeys(user, ['name'], (value) => {
  console.log('Name or age changed:', value.name, value.age);
});

// Update multiple properties
user.value = { ...user.value, city: 'SF' };
```

## Advanced Features

### `onMount(store, callback)`

Run side effects when the store gets its first subscriber:

```typescript
import { zen, onMount, subscribe } from '@sylphx/zen';

const data = zen(null);

onMount(data, () => {
  // Fetch data when first subscriber attaches
  fetch('/api/data')
    .then(res => res.json())
    .then(result => data.value = result);

  // Return cleanup function
  return () => {
    console.log('Last subscriber removed');
  };
});

// Subscription triggers onMount
const unsub = subscribe(data, console.log);
```

### `computedAsync(dependencies, asyncFn)`

Async computed values with automatic cancellation:

```typescript
import { zen, computedAsync } from '@sylphx/zen';

const userId = zen(1);

const userData = computedAsync([userId], async (id, { signal }) => {
  const response = await fetch(`/api/users/${id}`, { signal });
  return response.json();
});

// userData.value starts as undefined
console.log(userData.value); // undefined

// After fetch completes
// userData.value = { id: 1, name: 'John' }

// Changing userId cancels previous fetch
userId.value = 2;
```

## Performance

Zen v2.0 uses native getters/setters for exceptional performance:

| Operation | v1.x (get/set) | v2.0 (.value) | Improvement |
|-----------|---------------|---------------|-------------|
| Read | 15.2M ops/s | 26.3M ops/s | **+73%** |
| Write | 8.6M ops/s | 13.4M ops/s | **+56%** |
| Computed | 12.1M ops/s | 20.8M ops/s | **+72%** |

Bundle sizes:
- ESM: 5.76 KB gzipped
- CJS: 5.99 KB gzipped

## Framework Integration

Zen works seamlessly with all major frameworks:

- **React**: `@sylphx/zen-react`
- **Preact**: `@sylphx/zen-preact`
- **Solid**: `@sylphx/zen-solid`
- **Svelte**: `@sylphx/zen-svelte`
- **Vue**: `@sylphx/zen-vue`

### React Example

```tsx
import { zen } from '@sylphx/zen';
import { useStore } from '@sylphx/zen-react';

const count = zen(0);

function Counter() {
  const value = useStore(count);
  return (
    <button onClick={() => count.value++}>
      Count: {value}
    </button>
  );
}
```

## Ecosystem

- **[@sylphx/zen-router](../zen-router)** - Lightweight file-based router
- **[@sylphx/zen-persistent](../zen-persistent)** - localStorage/sessionStorage sync
- **[@sylphx/zen-craft](../zen-craft)** - Immutable updates with Craft

## Migration from v1

Zen v2.0 simplifies the API by replacing `get()`/`set()` with `.value`:

```typescript
// v1.x (deprecated)
import { zen, get, set } from '@sylphx/zen';
const count = zen(0);
const value = get(count);
set(count, 1);

// v2.0 (current)
import { zen } from '@sylphx/zen';
const count = zen(0);
const value = count.value;
count.value = 1;
```

**Breaking changes:**
- `get(store)` → `store.value`
- `set(store, value)` → `store.value = value`
- `karma` / `zenAsync` → `computedAsync`

## TypeScript

Zen is written in TypeScript and provides excellent type inference:

```typescript
const count = zen(0); // Zen<number>
const user = zen({ name: 'John' }); // Zen<{ name: string }>

const double = computed([count], (c) => c * 2); // Computed<number>

const fullName = computed(
  [user],
  (u) => u.name.toUpperCase() // Full type safety
);
```

## License

MIT © [SylphX](https://github.com/sylphxltd)
