# @sylphx/zen-solid

Solid.js integration for Zen state manager. Bridge between Zen stores and Solid.js reactive system.

## Installation

```bash
npm install @sylphx/zen-solid
# or
bun add @sylphx/zen-solid
```

## Usage

### Basic Example

```tsx
import { zen, set } from '@sylphx/zen';
import { useStore } from '@sylphx/zen-solid';

// Create a zen store
const count = zen(0);

function Counter() {
  // Use it in a Solid component - returns a signal accessor
  const value = useStore(count);

  return (
    <div>
      <p>Count: {value()}</p>  {/* Note: call value() to access */}
      <button onClick={() => set(count, value() + 1)}>
        Increment
      </button>
    </div>
  );
}
```

### With Computed Values

```tsx
import { zen, computed } from '@sylphx/zen';
import { useStore } from '@sylphx/zen-solid';

const count = zen(0);
const doubled = computed(count, (n) => n * 2);

function App() {
  const countValue = useStore(count);
  const doubledValue = useStore(doubled);

  return (
    <div>
      <p>Count: {countValue()}</p>
      <p>Doubled: {doubledValue()}</p>
    </div>
  );
}
```

### Using `fromStore` (Alternative)

```tsx
import { zen } from '@sylphx/zen';
import { fromStore } from '@sylphx/zen-solid';

const count = zen(0);

function Counter() {
  // fromStore subscribes immediately without waiting for onMount
  const value = fromStore(count);

  return <div>Count: {value()}</div>;
}
```

### Shared State Across Components

```typescript
// stores/counter.ts
import { zen } from '@sylphx/zen';

export const counter = zen(0);
```

```tsx
// ComponentA.tsx
import { useStore } from '@sylphx/zen-solid';
import { counter } from './stores/counter';

export function ComponentA() {
  const count = useStore(counter);
  return <p>Count: {count()}</p>;
}
```

```tsx
// ComponentB.tsx
import { set } from '@sylphx/zen';
import { useStore } from '@sylphx/zen-solid';
import { counter } from './stores/counter';

export function ComponentB() {
  const count = useStore(counter);

  return (
    <button onClick={() => set(counter, count() + 1)}>
      Increment
    </button>
  );
}
```

## API

### `useStore<Value>(store: Zen<Value>): () => Value`

Subscribes to a Zen store and returns a Solid.js signal accessor.

**Parameters:**
- `store`: Any Zen store (zen, computed, map, deepMap, task, etc.)

**Returns:**
- A signal accessor function that returns the current value

**Features:**
- ✅ Automatically subscribes on component mount
- ✅ Automatically unsubscribes on component unmount
- ✅ Returns a Solid.js signal accessor
- ✅ SSR-safe
- ✅ TypeScript support

### `fromStore<Value>(store: Zen<Value>): () => Value`

Alternative to `useStore` that subscribes immediately without waiting for mount.

**Parameters:**
- `store`: Any Zen store

**Returns:**
- A signal accessor function

**Features:**
- ✅ Subscribes immediately
- ✅ More efficient for derived values
- ✅ Automatic cleanup with `onCleanup`

## Why Use Zen with Solid.js?

- 🎯 **Best of both worlds**: Combine Zen's simplicity with Solid's reactivity
- 🪶 **Tiny**: Minimal bundle size (~300 bytes)
- ⚡ **Ultra-fast**: Both Zen and Solid are performance-focused
- 🔒 **Type-safe**: Full TypeScript support
- 🌐 **Framework-agnostic stores**: Share state logic across React, Vue, Svelte, and Solid
- 📦 **No boilerplate**: No providers, no context, just import and use

## Zen vs Solid Signals

| Feature | Solid Signals | Zen Stores |
|---------|--------------|------------|
| Reactivity | Fine-grained | Subscription-based |
| Framework | Solid-only | Multi-framework |
| Bundle Size | ~7KB | ~4KB |
| API | createSignal | zen() |
| Computed | createMemo | computed() |

**Use both!** Zen for shared/global state, Solid signals for local component state.

## License

MIT
