# @sylphx/zen-react

React integration for Zen state manager. Use Zen stores in React components with automatic reactivity.

## Installation

```bash
npm install @sylphx/zen-react
# or
bun add @sylphx/zen-react
```

## Usage

### Basic Example

```tsx
import { zen, set } from '@sylphx/zen';
import { useStore } from '@sylphx/zen-react';

// Create a zen store
const count = zen(0);

function Counter() {
  // Use it in a React component - automatically subscribes
  const value = useStore(count);

  return (
    <div>
      <p>Count: {value}</p>
      <button onClick={() => set(count, value + 1)}>
        Increment
      </button>
    </div>
  );
}
```

### With Computed Values

```tsx
import { zen, computed } from '@sylphx/zen';
import { useStore } from '@sylphx/zen-react';

const count = zen(0);
const doubled = computed(count, (n) => n * 2);

function App() {
  const countValue = useStore(count);
  const doubledValue = useStore(doubled);

  return (
    <div>
      <p>Count: {countValue}</p>
      <p>Doubled: {doubledValue}</p>
    </div>
  );
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
import { useStore } from '@sylphx/zen-react';
import { counter } from './stores/counter';

export function ComponentA() {
  const count = useStore(counter);
  return <p>Count: {count}</p>;
}
```

```tsx
// ComponentB.tsx
import { set } from '@sylphx/zen';
import { useStore } from '@sylphx/zen-react';
import { counter } from './stores/counter';

export function ComponentB() {
  const count = useStore(counter);

  return (
    <button onClick={() => set(counter, count + 1)}>
      Increment
    </button>
  );
}
```

## API

### `useStore<Value>(store: Zen<Value>): Value`

Subscribes to a Zen store and returns its current value.

**Parameters:**
- `store`: Any Zen store (zen, computed, map, deepMap, task, etc.)

**Returns:**
- The current value of the store

**Features:**
- ✅ Automatically subscribes on component mount
- ✅ Automatically unsubscribes on component unmount
- ✅ Uses `useSyncExternalStore` in React 18+ for concurrent mode support
- ✅ Falls back to `useState` + `useEffect` for React 16/17
- ✅ SSR-safe
- ✅ TypeScript support

## Why Use Zen with React?

- 🎯 **Simple**: Just one hook to learn
- 🪶 **Tiny**: Minimal bundle size (~300 bytes)
- ⚡ **Fast**: Optimized for performance
- 🔒 **Type-safe**: Full TypeScript support
- 🌐 **Framework-agnostic stores**: Share state logic across different frameworks
- 📦 **No boilerplate**: No providers, no context, just import and use

## License

MIT
