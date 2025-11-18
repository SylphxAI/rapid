# @sylphx/zen-svelte

Svelte integration for Zen state manager. Use Zen stores with Svelte's reactive `$` syntax.

## Installation

```bash
npm install @sylphx/zen-svelte
# or
bun add @sylphx/zen-svelte
```

## Usage

### Basic Example

```svelte
<script>
  import { zen, set } from '@sylphx/zen';
  import { fromZen } from '@sylphx/zen-svelte';

  // Create a zen store
  const count = zen(0);

  // Convert to Svelte-compatible store
  const svelteCount = fromZen(count);

  function increment() {
    set(count, $svelteCount + 1);
  }
</script>

<div>
  <p>Count: {$svelteCount}</p>
  <button on:click={increment}>Increment</button>
</div>
```

### Using `useStore` (Alternative)

```svelte
<script>
  import { zen, set } from '@sylphx/zen';
  import { useStore } from '@sylphx/zen-svelte';

  const count = zen(0);
  const store = useStore(count);  // Same as fromZen, more hook-like name
</script>

<div>
  <p>Count: {$store}</p>
  <button on:click={() => set(count, $store + 1)}>
    Increment
  </button>
</div>
```

### With Computed Values

```svelte
<script>
  import { zen, computed } from '@sylphx/zen';
  import { fromZen } from '@sylphx/zen-svelte';

  const count = zen(0);
  const doubled = computed(count, (n) => n * 2);

  const countStore = fromZen(count);
  const doubledStore = fromZen(doubled);
</script>

<div>
  <p>Count: {$countStore}</p>
  <p>Doubled: {$doubledStore}</p>
</div>
```

### Shared State Across Components

```typescript
// stores/counter.ts
import { zen } from '@sylphx/zen';

export const counter = zen(0);
```

```svelte
<!-- ComponentA.svelte -->
<script>
  import { fromZen } from '@sylphx/zen-svelte';
  import { counter } from './stores/counter';

  const count = fromZen(counter);
</script>

<p>Count: {$count}</p>
```

```svelte
<!-- ComponentB.svelte -->
<script>
  import { set } from '@sylphx/zen';
  import { fromZen } from '@sylphx/zen-svelte';
  import { counter } from './stores/counter';

  const count = fromZen(counter);
</script>

<button on:click={() => set(counter, $count + 1)}>
  Increment
</button>
```

### Direct Usage Without Conversion

Since Zen stores are already compatible with Svelte's store contract, you can use them directly:

```svelte
<script>
  import { zen, set } from '@sylphx/zen';

  const count = zen(0);
  // No need to convert! Just use $ directly
</script>

<div>
  <p>Count: {$count}</p>
  <button on:click={() => set(count, $count + 1)}>
    Increment
  </button>
</div>
```

**Note:** `fromZen` ensures the subscriber is called immediately with the current value, which is part of the Svelte store contract. Direct usage works but might have slight behavioral differences.

## API

### `fromZen<Value>(store: Zen<Value>): Readable<Value>`

Converts a Zen store to a Svelte-compatible readable store.

**Parameters:**
- `store`: Any Zen store (zen, computed, map, deepMap, task, etc.)

**Returns:**
- A Svelte-compatible readable store that can be used with `$` syntax

### `useStore<Value>(store: Zen<Value>): Readable<Value>`

Alias for `fromZen` with a more hook-like name.

**Features:**
- ✅ Full Svelte store contract compatibility
- ✅ Works with `$` reactive syntax
- ✅ Automatic subscription management
- ✅ SSR-safe
- ✅ TypeScript support

## Why Use Zen with Svelte?

- 🎯 **Natural fit**: Svelte stores + Zen stores = perfect match
- 🪶 **Tiny**: Minimal bundle size (~200 bytes)
- ⚡ **Fast**: Both Zen and Svelte are performance-focused
- 🔒 **Type-safe**: Full TypeScript support
- 🌐 **Framework-agnostic stores**: Share state logic across React, Vue, Solid, and Svelte
- 📦 **No boilerplate**: Direct `$` syntax support

## Zen vs Svelte Stores

| Feature | Svelte Stores | Zen Stores |
|---------|--------------|------------|
| Reactivity | Subscription-based | Subscription-based |
| Framework | Svelte-only | Multi-framework |
| Bundle Size | Built-in | ~4KB |
| API | writable() | zen() |
| Computed | derived() | computed() |
| Compatible | ✅ | ✅ |

**They're compatible!** Use Zen for shared/global state across frameworks, Svelte stores for Svelte-specific logic.

## License

MIT
