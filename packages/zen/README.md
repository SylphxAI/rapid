# @sylphx/zen

Core package for the zen state management library. Tiny, fast, and functional reactive state management.

Inspired by Nanostores, aiming for an even smaller footprint and high performance.

## Installation

```bash
npm install @sylphx/zen
# or
yarn add @sylphx/zen
# or
pnpm add @sylphx/zen
# or
bun add @sylphx/zen
```

## Basic Usage

```typescript
import { zen, computed, subscribe, get, set } from '@sylphx/zen';

// Create a writable zen state
const count = zen(0);

// Create a computed state derived from other zen stores
const double = computed([count], (value) => value * 2);

// Subscribe to changes
const unsubscribe = subscribe(double, (value) => {
  console.log('Double count is now:', value);
});

// Read current value
console.log('Initial count:', get(count)); // Logs: Initial count: 0
console.log('Initial double:', get(double)); // Logs: Initial double: 0

// Update the base atom using the functional API
set(count, 1); // Logs: Double count is now: 2
set(count, 5); // Logs: Double count is now: 10

// Unsubscribe when no longer needed
unsubscribe();
```

## More Examples

### `map` Example

```typescript
import { map, setKey, listenKeys, get } from '@sylphx/zen';

const user = map({ name: 'Anon', age: 99 });

const unsubscribeKey = listenKeys(user, ['name'], (value) => {
  // Note: listener receives the full map value
  console.log('User name changed:', value.name);
});

console.log('Initial name:', get(user).name); // Logs: Initial name: Anon

setKey(user, 'name', 'Sylph'); // Logs: User name changed: Sylph
console.log('Updated name:', get(user).name); // Logs: Updated name: Sylph

unsubscribeKey();
```

### `deepMap` Example

```typescript
import { deepMap, setPath, listenPaths, get } from '@sylphx/zen';

const settings = deepMap({ user: { theme: 'dark', notifications: true }, other: [1, 2] });

const unsubPath = listenPaths(settings, [['user', 'theme']], (value) => {
    // Note: listener receives the full deepMap value
    console.log('Theme changed:', value.user.theme);
});

console.log('Initial theme:', get(settings).user.theme); // Logs: Initial theme: dark

// Update a nested property
setPath(settings, ['user', 'theme'], 'light'); // Logs: Theme changed: light
setPath(settings, ['other', 0], 100); // Update array element

console.log('Updated theme:', get(settings).user.theme); // Logs: Updated theme: light
console.log('Updated array:', get(settings).other); // Logs: Updated array: [100, 2]

unsubPath();
```

### `karma` Example

```typescript
import { karma, subscribe } from '@sylphx/zen';

const fetchData = karma(async (id: number) => {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 50));
  if (id < 0) throw new Error('Invalid ID');
  return { data: `User data for ${id}` };
});

const unsubscribeTask = subscribe(fetchData, (state) => {
  if (state.loading) console.log('Task loading...');
  if (state.error) console.error('Task error:', state.error.message);
  if (state.data) console.log('Task success:', state.data);
});

fetchData.run(123); // Logs: Task loading... -> Task success: { data: 'User data for 123' }
// fetchData.run(-1); // Would log: Task loading... -> Task error: Invalid ID

// unsubscribeTask(); // Usually called on component unmount
```

### `batch` Example

```typescript
import { zen, computed, batch, subscribe, set } from '@sylphx/zen';

const firstName = zen('John');
const lastName = zen('Doe');
const fullName = computed([firstName, lastName], (f, l) => `${f} ${l}`);

const unsubscribeBatch = subscribe(fullName, (value) => {
  // This listener will only run ONCE after the batch
  console.log('Full name updated:', value);
});

batch(() => {
  set(firstName, 'Jane');
  set(lastName, 'Smith');
  // fullName listener is not triggered here yet
}); // Logs: Full name updated: Jane Smith

unsubscribeBatch();
```

### Lifecycle Example (`onMount`/`onStop`)

```typescript
import { zen, onMount, onStop, subscribe, get, set } from '@sylphx/zen';

const timerZen = zen(0);

let intervalId: ReturnType<typeof setInterval> | undefined;

onMount(timerZen, () => {
  console.log('Timer zen mounted (first subscriber added)');
  intervalId = setInterval(() => {
    set(timerZen, get(timerZen) + 1); // Use functional set/get
  }, 1000);

  // Return a cleanup function for onStop
  return () => {
    console.log('Timer zen stopped (last subscriber removed)');
    if (intervalId) clearInterval(intervalId);
    intervalId = undefined;
  };
});

console.log('Subscribing...');
const unsubTimer = subscribe(timerZen, (value) => {
  console.log('Timer:', value);
});
// Logs: Subscribing... -> Timer zen mounted... -> Timer: 0 -> Timer: 1 ...

// setTimeout(() => {
//   console.log('Unsubscribing...');
//   unsubTimer(); // Logs: Unsubscribing... -> Timer zen stopped...
// }, 3500);
```

### Untracked Execution Example

```typescript
import { zen, computed, untracked, isTracking } from '@sylphx/zen';

const count = zen(0);
const debugInfo = zen('');

// Computed that logs without creating dependency
const doubled = computed([count], (n) => {
  // Read debugInfo without tracking it as a dependency
  untracked(() => {
    const info = debugInfo._value;
    console.log(`Computing doubled at ${Date.now()}: ${info}`);
  });

  return n * 2;
});

console.log('Tracking enabled?', isTracking()); // true

set(count, 5); // Will trigger recomputation
set(debugInfo, 'debug'); // Won't trigger recomputation (untracked)
```

### Resource Disposal Example

```typescript
import { zen, computed, dispose } from '@sylphx/zen';

const data = zen(0);
const expensive = computed([data], (n) => {
  // Expensive computation
  return n * n;
});

// Use the computed value
subscribe(expensive, (value) => {
  console.log('Result:', value);
});

// When done, release pooled resources
dispose(expensive);
```

## Features

*   **Tiny size:** ~1.33 kB gzipped (full bundle).
*   **Blazing fast:** 3.2x faster than baseline, competitive with top-tier state libraries.
*   Functional API (`atom`, `computed`, `map`, `deepMap`, `karma`, `batch`).
*   Lifecycle events with cleanup support (`onMount`, `onStart`, `onStop`).
*   Key/Path listeners for maps (`listenKeys`, `listenPaths`).
*   Explicit batching for combining updates.
*   **🆕 Phase 1 Optimizations:**
  *   Object pooling for reduced GC pressure
  *   Untracked execution for debugging
  *   Resource disposal API for memory management

## Performance

Zen has been extensively optimized for production use with a 5-phase optimization process achieving **3.2x performance improvement** over the initial implementation.

### Key Benchmarks

**Core Performance (10 subscribers, single update):**
- **4.82M ops/sec** - Production-ready performance for real-world applications

**Computed Update Propagation:**
- **19.5M ops/sec** - Lightning-fast reactive updates
- 1.6x faster than nanostores (12.3M ops/sec)

**Batch Operations:**
- **1.34-1.63x faster** than nanostores sequential operations
- Efficient bulk updates with automatic batching

**Hot Path Performance:**
- Single listener: 1.14M ops/sec
- 10 listeners: 664K ops/sec
- Optimized notification loops with fast paths

### Optimization Journey

The performance improvements came from 5 major optimization phases:

1. **Phase 1 (+140%):** Removed try-catch overhead, Array vs Set optimization, O(1) swap-remove
2. **Phase 2 (+4.5%):** Version tracking for computed values to skip unnecessary recalculations
3. **Phase 3 (+13.3%):** Hot path inlining, single-listener fast paths, reduced function calls
4. **Phase 4 (+13.3%):** Single-source computed fast paths, optimized version checking
5. **Phase 5:** Batched/effect memory optimization, pre-allocated arrays, reduced allocations

**Total improvement:** 3.21x faster (221% performance increase)

### Comparison with Other Libraries

| Library | Computed Update (ops/sec) | Performance |
|---------|---------------------------|-------------|
| **Zen** | **19.5M** | ⚡ Baseline |
| Zustand | 23.2M | +19% |
| Nanostores | 12.3M | -37% |
| Valtio | 5.4M | -72% |
| Effector | 2.3M | -88% |

*Benchmarks run on Apple M-series hardware. Results may vary based on system configuration.*

## API Documentation

Detailed API documentation can be found [here](../../../docs/modules/_sylph_core.html). (Link assumes TypeDoc output in `/docs` at repo root).

## License

MIT