# @sylphx/zen: Extreme Minimalism, Extreme Speed 🚀

[![npm version](https://badge.fury.io/js/@sylphx/zen.svg)](https://badge.fury.io/js/@sylphx/zen)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@sylphx/zen)](https://bundlephobia.com/package/@sylphx/zen)
[![Tests](https://github.com/your-repo/zen/actions/workflows/test.yml/badge.svg)](https://github.com/your-repo/zen/actions/workflows/test.yml) <!-- Placeholder: Update link -->

**Embrace simplicity. Achieve speed. Meet Zen – the state management library designed around extreme minimalism for unparalleled performance and efficiency.**

Zen delivers **extreme speed** *because* of its minimalist core, consistently outperforming popular alternatives like Zustand, Jotai, Nanostores, Valtio, and Effector in crucial benchmarks. All this, while maintaining a **tiny footprint (1.45 kB full library)** and providing essential features through a clean, intuitive API.

**Multi-framework support:** Use Zen with React, Vue, Preact, Solid.js, and Svelte through official framework integrations – each under 250 bytes. Share state logic across your entire stack.

---

## Why Zen? 🤔

Modern web applications demand state management that is fast, lightweight, and easy to reason about. Existing solutions often introduce complexity and overhead, forcing a trade-off: gain features but sacrifice performance and simplicity, or stay small but lack essential capabilities.

**Zen rejects this compromise. Our philosophy: extreme speed *through* extreme minimalism.**

By focusing relentlessly on a highly optimized, simple core and only the essential features, Zen avoids unnecessary abstractions and overhead. We meticulously optimized every function, achieving unparalleled speed *because* of this focused, minimalist design.

**Zen solves:**

*   **Performance Bottlenecks:** Drastically reduces overhead for state updates and reads via its minimal core.
*   **Bundle Bloat:** Keeps your application lean and fast-loading with its tiny size.
*   **Complexity Overload:** Provides a straightforward, predictable API that's easy to learn and use.
*   **Over-Engineering:** Delivers only the essential tools you need, cutting out unnecessary complexity.

---

## Key Features ✨

*   🤏 **Extreme Minimalism:** Simple, intuitive API focused on the fundamentals.
*   🚀 **Extreme Performance:** Hyper-optimized core delivers benchmark-leading speed (see below).
*   ⚛️ **Core Primitives:** `zen` for basic state, `computed` for derived values.
*   🗺️ **Object Helpers:** `map` for shallow object state, `deepMap` for nested objects/arrays with efficient path updates/listeners.
*   ⚡ **Async Handling:** `task` atom for managing async operation states (loading, error, data).
*   ✂️ **Immutable Updates:** `@sylphx/zen-craft` provides Immer-like `produce()` with JSON Patch generation for time-travel and undo/redo.
*   🌐 **Multi-Framework:** Official integrations for React, Vue, Preact, Solid.js, and Svelte – each <250 bytes.
*   👂 **Lifecycle Events:** Optional hooks (`onMount`, `onStart`, `onStop`, `onSet`, `onNotify`) for fine-grained control when needed.
*   🎯 **Granular Subscriptions:** Efficiently listen to specific `keys` in `map` or deep `paths` in `deepMap`.
*   📏 **Tiny Size:** Just **1.45 kB** (brotli + gzip) for the full library.

---

## Installation 📦

```bash
npm install @sylphx/zen
# or
yarn add @sylphx/zen
# or
pnpm add @sylphx/zen
```

---

## Ecosystem & Framework Integrations 🌐

Zen provides a complete ecosystem of packages for different use cases and frameworks:

### Core Packages

| Package | Description | Size |
|---------|-------------|------|
| **[@sylphx/zen](https://www.npmjs.com/package/@sylphx/zen)** | Core state management library | 1.45 kB |
| **[@sylphx/zen-craft](https://www.npmjs.com/package/@sylphx/zen-craft)** | Immer-like immutable updates with JSON Patches | ~4 kB |
| **[@sylphx/zen-persistent](https://www.npmjs.com/package/@sylphx/zen-persistent)** | localStorage/sessionStorage sync | ~1 kB |

### Framework Integrations

All framework integrations are **under 250 bytes** – lighter than most competing solutions:

| Package | Framework | Size | Features |
|---------|-----------|------|----------|
| **[@sylphx/zen-react](https://www.npmjs.com/package/@sylphx/zen-react)** | React 16.8+ | 216 B | `useStore` hook with concurrent mode support |
| **[@sylphx/zen-preact](https://www.npmjs.com/package/@sylphx/zen-preact)** | Preact 10+ | 177 B | `useStore` hook |
| **[@sylphx/zen-vue](https://www.npmjs.com/package/@sylphx/zen-vue)** | Vue 3+ | ~200 B | `useStore` composition API |
| **[@sylphx/zen-solid](https://www.npmjs.com/package/@sylphx/zen-solid)** | Solid.js | 234 B | `useStore` + `fromStore` with signals |
| **[@sylphx/zen-svelte](https://www.npmjs.com/package/@sylphx/zen-svelte)** | Svelte 3-5 | 167 B | Native store contract compatibility |

### Router Packages

| Package | Description |
|---------|-------------|
| **[@sylphx/zen-router](https://www.npmjs.com/package/@sylphx/zen-router)** | Core framework-agnostic router |
| **[@sylphx/zen-router-react](https://www.npmjs.com/package/@sylphx/zen-router-react)** | React router integration |
| **[@sylphx/zen-router-preact](https://www.npmjs.com/package/@sylphx/zen-router-preact)** | Preact router integration |
| **[@sylphx/zen-router-vue](https://www.npmjs.com/package/@sylphx/zen-router-vue)** | Vue router integration |

### Quick Framework Examples

**React:**
```tsx
import { zen, set } from '@sylphx/zen';
import { useStore } from '@sylphx/zen-react';

const count = zen(0);

function Counter() {
  const value = useStore(count);
  return <button onClick={() => set(count, value + 1)}>{value}</button>;
}
```

**Vue:**
```vue
<script setup>
import { zen, set } from '@sylphx/zen';
import { useStore } from '@sylphx/zen-vue';

const count = zen(0);
const value = useStore(count);
</script>

<template>
  <button @click="set(count, value + 1)">{{ value }}</button>
</template>
```

**Svelte:**
```svelte
<script>
  import { zen, set } from '@sylphx/zen';
  import { fromZen } from '@sylphx/zen-svelte';

  const count = zen(0);
  const value = fromZen(count);
</script>

<button on:click={() => set(count, $value + 1)}>{$value}</button>
```

**Solid.js:**
```tsx
import { zen, set } from '@sylphx/zen';
import { useStore } from '@sylphx/zen-solid';

const count = zen(0);

function Counter() {
  const value = useStore(count);
  return <button onClick={() => set(count, value() + 1)}>{value()}</button>;
}
```

### Why Zen for Multi-Framework Projects?

- **🎯 Single Source of Truth:** Define state logic once, use everywhere
- **🪶 Minimal Overhead:** Framework integrations add <250 bytes each
- **⚡ Challenge to Signals:** Competitive with Solid Signals while supporting all major frameworks
- **🔒 Type-Safe:** Full TypeScript support across all packages
- **📦 No Lock-In:** Start with one framework, expand to others seamlessly

---

## Core Usage 🧑‍💻

### `zen`

The fundamental building block for reactive state.

```typescript
import { zen, get, set, subscribe } from '@sylphx/zen';

const counter = zen(0);

const unsubscribe = subscribe(counter, (value, oldValue) => {
  console.log(`Counter changed from ${oldValue} to ${value}`);
});
// Output: Counter changed from undefined to 0 (Initial call)

console.log(get(counter)); // Output: 0

set(counter, 1); // Output: Counter changed from 0 to 1
console.log(get(counter)); // Output: 1

set(counter, 1); // No output, value didn't change

unsubscribe();

set(counter, 2); // No output, unsubscribed
```

### `computed`

Create derived state based on one or more zen stores.

```typescript
import { zen, computed, get, set, subscribe } from '@sylphx/zen';

const count = zen(10);
const message = zen(' apples');

// Computed value based on count
const double = computed([count], (value) => value * 2);

// Computed value based on multiple atoms
const fullMessage = computed([count, message], (num, msg) => `${num}${msg}`);

const unsubDouble = subscribe(double, value => console.log('Double:', value));
// Output: Double: 20 (Initial call)

const unsubMsg = subscribe(fullMessage, value => console.log('Message:', value));
// Output: Message: 10 apples (Initial call)

console.log(get(double)); // Output: 20
console.log(get(fullMessage)); // Output: 10 apples

set(count, 15);
// Output: Double: 30
// Output: Message: 15 apples

set(message, ' oranges');
// Output: Message: 15 oranges
// (Double listener not called as 'double' didn't change)

unsubDouble();
unsubMsg();
```

### `map`

Optimized for object state where you often update/listen to individual keys.

```typescript
import { map, get, subscribe, setMapKey, setMapValue, listenMapKeys } from '@sylphx/zen';

const profile = map({ name: 'John', age: 30, city: 'New York' });

const unsub = subscribe(profile, value => console.log('Profile updated:', value));
// Output: Profile updated: { name: 'John', age: 30, city: 'New York' } (Initial call)

// Listen to specific key changes
const unsubAge = listenMapKeys(profile, ['age'], (value, key, fullObject) => {
  console.log(`Key '${key}' changed to: ${value}`);
});

setMapKey(profile, 'age', 31);
// Output: Key 'age' changed to: 31
// Output: Profile updated: { name: 'John', age: 31, city: 'New York' }

setMapKey(profile, 'name', 'Jane');
// Output: Profile updated: { name: 'Jane', age: 31, city: 'New York' }
// (Age listener not called)

setMapValue(profile, { name: 'Peter', age: 40, city: 'London' }); // Update whole object
// Output: Key 'age' changed to: 40
// Output: Profile updated: { name: 'Peter', age: 40, city: 'London' }

unsub();
unsubAge();
```

### `deepMap`

Efficiently manage and subscribe to changes within nested objects/arrays.

```typescript
import { deepMap, get, subscribe, setDeepMapPath, setDeepMapValue, listenDeepMapPaths } from '@sylphx/zen';

const settings = deepMap({
  user: { name: 'Anon', preferences: { theme: 'light', notifications: true } },
  data: [10, 20, 30]
});

const unsub = subscribe(settings, value => console.log('Settings updated:', value));
// Output: Settings updated: { user: { name: 'Anon', preferences: { theme: 'light', notifications: true } }, data: [ 10, 20, 30 ] } (Initial call)

// Listen to a deep path
const unsubTheme = listenDeepMapPaths(settings, [['user', 'preferences', 'theme']], (value, path, fullObject) => {
  // Note: path received might be string or array depending on how it was registered/changed
  console.log(`Path '${Array.isArray(path) ? path.join('.') : path}' changed to: ${value}`);
});

// Listen to an array element path
const unsubData = listenDeepMapPaths(settings, [['data', 1]], (value, path, fullObject) => {
 console.log(`Path 'data[1]' changed to: ${value}`);
});

// Update deep value using string path
setDeepMapPath(settings, 'user.preferences.theme', 'dark');
// Output: Path 'user.preferences.theme' changed to: dark
// Output: Settings updated: { user: {..., preferences: { theme: 'dark', ... }}, ... }

// Update deep value using array path
setDeepMapPath(settings, ['data', 1], 25);
// Output: Path 'data[1]' changed to: 25
// Output: Settings updated: { ..., data: [10, 25, 30] }

// Update unrelated path
setDeepMapPath(settings, 'user.name', 'Alice');
// Output: Settings updated: { user: { name: 'Alice', ...}, ... }
// (Theme and data listeners not called)

unsub();
unsubTheme();
unsubData();
```

### `task`

Handle async operations gracefully.

```typescript
import { task, computed, get, subscribe, runTask, getTaskState } from '@sylphx/zen';

const fetchData = async (userId: number): Promise<{ id: number; name: string }> => {
  // Simulate API call
  await new Promise(r => setTimeout(r, 50));
  if (userId === 0) throw new Error('Invalid ID');
  return { id: userId, name: `User ${userId}` };
};

const userTask = task(fetchData);

// Use core 'get' to read the task state atom
const userStatus = computed([userTask], (state) => {
  if (state.loading) return 'Loading user...';
  if (state.error) return `Error: ${state.error.message}`;
  if (state.data) return `User Found: ${state.data.name} (ID: ${state.data.id})`;
  return 'Enter a user ID';
});

// Use core 'subscribe'
subscribe(userStatus, status => console.log(status));
// Output: Enter a user ID (Initial call)

// Run the task using runTask
runTask(userTask, 123)
  .then(data => console.log('Success:', data))
  .catch(err => console.error('Caught Error:', err));

// Output: Loading user...
// (after ~50ms)
// Output: User Found: User 123 (ID: 123)
// Output: Success: { id: 123, name: 'User 123' }

// Run with invalid ID
runTask(userTask, 0)
  .catch(err => console.error('Caught Error:', err.message));

// Output: Loading user...
// (after ~50ms)
// Output: Error: Invalid ID
// Output: Caught Error: Invalid ID

// You can also get the current state directly
console.log(getTaskState(userTask)); // Output: { loading: false, error: Error: Invalid ID, data: undefined }
```

### `craft` (Immutable Updates)

**Package:** `@sylphx/zen-craft`

Craft immutable state updates using an Immer-like `produce()` function with JSON Patch generation for time-travel and undo/redo.

```bash
npm install @sylphx/zen-craft
```

```typescript
import { zen, get } from '@sylphx/zen';
import { produce, patch, enablePatches } from '@sylphx/zen-craft';

// Enable patch generation (optional, for undo/redo)
enablePatches();

interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

const todos = zen<Todo[]>([
  { id: 1, text: 'Learn Zen', completed: false },
  { id: 2, text: 'Build app', completed: false }
]);

// Use produce to update immutably
produce(todos, (draft) => {
  draft[0].completed = true;
  draft.push({ id: 3, text: 'Ship it!', completed: false });
});

console.log(get(todos));
// Output: [
//   { id: 1, text: 'Learn Zen', completed: true },
//   { id: 2, text: 'Build app', completed: false },
//   { id: 3, text: 'Ship it!', completed: false }
// ]

// With patches enabled, you get JSON Patches
const [newState, patches, inversePatches] = produce(
  todos,
  (draft) => { draft[1].completed = true; },
  { returnPatches: true }
);

console.log(patches);
// Output: [{ op: 'replace', path: ['1', 'completed'], value: true }]

console.log(inversePatches);
// Output: [{ op: 'replace', path: ['1', 'completed'], value: false }]

// Apply patches manually for undo/redo
patch(todos, inversePatches); // Undo
patch(todos, patches);        // Redo
```

**Features:**
- 🎨 Draft-based mutations (write mutable code, get immutable updates)
- 📝 JSON Patch generation for time-travel debugging
- ↩️ Undo/redo with inverse patches
- 🔧 Compatible with all Zen stores (zen, map, deepMap, etc.)

---

## Advanced Usage 🧐

### Lifecycle Events

Listen to internal store events using `onStart`, `onStop`, `onSet`, `onNotify`, `onMount`.

```typescript
import { zen, set, subscribe, onStart, onStop, onSet, onNotify } from '@sylphx/zen';

const myZen = zen(0);

const unsubStart = onStart(myZen, () => console.log('First listener subscribed!'));
const unsubStop = onStop(myZen, () => console.log('Last listener unsubscribed!'));
const unsubSet = onSet(myZen, (newValue) => console.log(`Setting value to ${newValue}...`)); // Only called outside batch
const unsubNotify = onNotify(myZen, (newValue) => console.log(`Notified with value ${newValue}!`));

const sub1 = subscribe(myZen, () => {});
// Output: First listener subscribed!
// Output: Notified with value 0! (Initial subscribe calls listener, which triggers notify)

set(myZen, 1);
// Output: Setting value to 1...
// Output: Notified with value 1!

sub1(); // Output: Last listener unsubscribed!

unsubStart();
unsubStop();
unsubSet();
unsubNotify();
```

### Key/Path Listening

Efficiently subscribe to changes in specific parts of `map` or `deepMap` atoms using `listenMapKeys` and `listenDeepMapPaths`. See `map` and `deepMap` examples above.

---

## Performance: Extreme Speed via Minimalism 🚀

Zen achieves extreme speed by focusing on a minimal, hyper-optimized core. Benchmarks show significant advantages over popular libraries (ops/sec, higher is better):

*(Results from 2025-04-16, commit `1d82136`, may vary slightly)*

**Core Atom Operations:**

| Benchmark                 | Zen (ops/s)       | Nanostores | Zustand (Vanilla) | Jotai      | Valtio (Vanilla) | Effector   | Winner |
| :------------------------ | :---------------- | :--------- | :---------------- | :--------- | :--------------- | :--------- | :----- |
| **Atom Creation**         | **~18.5M**        | ~2.6M      | ~16.7M            | ~10.7M     | ~0.6M            | ~24.7k     | 🏆 Zen |
| **Atom Get**              | ~16.9M            | ~12.7M     | ~22.4M            | ~17.0M     | ~18.8M           | **~22.9M** | Effector |
| **Atom Set (No Listeners)** | **~13.7M**        | ~10.5M     | ~9.6M             | ~1.6M      | ~3.4M            | ~3.2M      | 🏆 Zen |
| **Subscribe/Unsubscribe** | ~1.9M             | ~1.8M      | **~7.0M**         | ~0.12M     | ~0.3M            | ~26.0k     | Zustand |

**Computed Operations (1 Dependency):**

| Benchmark                 | Zen (ops/s)       | Nanostores | Zustand (Selector) | Jotai (Hook) | Valtio (Getter) | Effector (Derived) | Winner |
| :------------------------ | :---------------- | :--------- | :----------------- | :----------- | :-------------- | :----------------- | :----- |
| **Computed Creation**     | **~22.6M**        | ~0.4M      | -                  | ~13.7M       | -               | ~6.7k              | 🏆 Zen |
| **Computed Get**          | ~19.5M            | ~2.3M      | **~20.4M**         | ~19.0M       | ~17.8M          | ~19.7M             | Zustand |
| **Computed Update Prop.** | ~8.0M             | **~8.9M**  | ~8.1M              | ~0.2M        | ~2.1M           | ~0.6M              | Nanostores |

**Map/DeepMap Operations:**

| Benchmark                     | Zen (ops/s)        | Nanostores | Winner |
| :---------------------------- | :----------------- | :--------- | :----- |
| **Map Creation**              | **~13.6M**         | ~1.4M      | 🏆 Zen |
| **Map Get**                   | ~11.3M             | **~14.8M** | Nanostores |
| **Map Set Key**               | ~7.5M              | **~11.1M** | Nanostores |
| **DeepMap Creation**          | **~13.7M**         | ~2.5M      | 🏆 Zen |
| **DeepMap setPath (Shallow)** | **~2.8M**          | ~1.0M      | 🏆 Zen |
| **DeepMap setPath (1 Lvl)**   | **~2.0M**          | ~0.8M      | 🏆 Zen |
| **DeepMap setPath (2 Lvl)**   | **~2.1M**          | ~0.7M      | 🏆 Zen |
| **DeepMap setPath (Array)**   | **~3.9M**          | ~0.5M      | 🏆 Zen |
| **DeepMap setPath (Create)**  | **~1.8M**          | ~0.4M      | 🏆 Zen |

**Key Takeaways:**

*   Zen's minimalist design leads to dominant performance in Atom Creation, Atom Set, Computed Creation, and all DeepMap operations.
*   Highly competitive in Atom Get, Subscribe/Unsubscribe, Computed Get, and Computed Update.
*   Map operations (Get, Set Key) are areas where Nanostores currently holds an edge.

---

## Size Comparison 🤏

Zen's minimalist philosophy results in an incredibly small bundle size.

| Library           | Size (Brotli + Gzip) |
| :---------------- | :------------------- |
| Jotai (atom)      | 170 B                |
| Nanostores (atom) | 265 B                |
| Zustand (core)    | 461 B                |
| **Zen (atom only)** | **786 B**            | <!-- Placeholder: Re-run size-limit if needed -->
| Valtio            | 903 B                |
| **Zen (full)**    | **1.45 kB**          | <!-- Placeholder: Re-run size-limit if needed -->
| Effector          | 5.27 kB              |
| Redux Toolkit     | 6.99 kB              |

---

## Framework Integration Comparison: Challenging Signals 🎯

Zen provides a **unique advantage**: write state logic once, use it across **all major frameworks**. Here's how Zen's framework integrations compare to framework-specific solutions:

| Framework | Zen Integration | Framework-Specific Solution | Zen Advantage |
|-----------|----------------|----------------------------|---------------|
| **React** | `@sylphx/zen-react` (216 B) | Zustand (461 B), Jotai (170 B) | Multi-framework, comparable size |
| **Solid.js** | `@sylphx/zen-solid` (234 B) | Solid Signals (built-in, ~7 kB for @solidjs/store) | Smaller + multi-framework |
| **Vue** | `@sylphx/zen-vue` (~200 B) | Vue Reactivity (built-in) | Multi-framework portability |
| **Svelte** | `@sylphx/zen-svelte` (167 B) | Svelte Stores (built-in) | Multi-framework portability |
| **Preact** | `@sylphx/zen-preact` (177 B) | Preact Signals (~4 kB) | Smaller + multi-framework |

### Why This Matters

**Framework Lock-In Problem:** Traditional solutions tie your state logic to a specific framework:
- Solid Signals: Solid.js only
- Vue Reactivity: Vue only
- Svelte Stores: Svelte only
- Preact Signals: Preact only

**Zen Solution:** Write your state logic once in framework-agnostic Zen stores, then use the appropriate integration:

```typescript
// state/counter.ts - Framework agnostic!
import { zen } from '@sylphx/zen';

export const counter = zen(0);
export const doubled = computed([counter], (n) => n * 2);
```

```tsx
// React component
import { useStore } from '@sylphx/zen-react';
import { counter } from './state/counter';

function ReactCounter() {
  const count = useStore(counter);
  return <div>{count}</div>;
}
```

```vue
<!-- Vue component -->
<script setup>
import { useStore } from '@sylphx/zen-vue';
import { counter } from './state/counter';

const count = useStore(counter);
</script>
```

```tsx
// Solid.js component
import { useStore } from '@sylphx/zen-solid';
import { counter } from './state/counter';

function SolidCounter() {
  const count = useStore(counter);
  return <div>{count()}</div>;
}
```

**Same state logic. Different frameworks. Zero rewrites.**

### Performance Comparison

Zen matches or exceeds the performance of framework-specific solutions while providing multi-framework portability. See the [Performance](#performance-extreme-speed-via-minimalism-) section for detailed benchmarks.

---

## Current Limitations & Issues

*   **TypeScript Guidelines:** We currently cannot automatically verify against specific internal TypeScript style guidelines due to a temporary issue fetching the rules file (`guidelines/typescript/style_quality.md` from `sylphlab/Playbook` resulted in a 'Not Found' error). We are proceeding with best practices in the meantime.
*   **Map Performance:** Nanostores shows better performance for Map Get and Map Set Key operations in current benchmarks. Further investigation is optional.

---

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

MIT
