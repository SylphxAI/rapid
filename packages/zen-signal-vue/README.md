# @sylphx/zen-vue

Vue integration for Zen state manager. Use Zen stores in Vue components with automatic reactivity.

## Installation

```bash
npm install @sylphx/zen-vue
# or
bun add @sylphx/zen-vue
```

## Usage

### Basic Example

```vue
<script setup lang="ts">
import { zen, set } from '@sylphx/zen';
import { useStore } from '@sylphx/zen-vue';

// Create a zen store
const count = zen(0);

// Use it in a Vue component - returns a reactive ref
const countRef = useStore(count);

const increment = () => {
  set(count, countRef.value + 1);
};
</script>

<template>
  <div>
    <p>Count: {{ countRef }}</p>
    <button @click="increment">Increment</button>
  </div>
</template>
```

### With Computed Values

```vue
<script setup lang="ts">
import { zen, computed } from '@sylphx/zen';
import { useStore } from '@sylphx/zen-vue';

const count = zen(0);
const doubled = computed(count, (n) => n * 2);

const countRef = useStore(count);
const doubledRef = useStore(doubled);
</script>

<template>
  <div>
    <p>Count: {{ countRef }}</p>
    <p>Doubled: {{ doubledRef }}</p>
  </div>
</template>
```

### Shared State Across Components

```typescript
// stores/counter.ts
import { zen } from '@sylphx/zen';

export const counter = zen(0);
```

```vue
<!-- ComponentA.vue -->
<script setup lang="ts">
import { useStore } from '@sylphx/zen-vue';
import { counter } from './stores/counter';

const count = useStore(counter);
</script>

<template>
  <p>Count: {{ count }}</p>
</template>
```

```vue
<!-- ComponentB.vue -->
<script setup lang="ts">
import { set } from '@sylphx/zen';
import { useStore } from '@sylphx/zen-vue';
import { counter } from './stores/counter';

const count = useStore(counter);

const increment = () => set(counter, count.value + 1);
</script>

<template>
  <button @click="increment">Increment</button>
</template>
```

## API

### `useStore<Value>(store: Zen<Value>): Ref<Value>`

Subscribes to a Zen store and returns its value as a reactive Vue ref.

**Parameters:**
- `store`: Any Zen store (zen, computed, map, etc.)

**Returns:**
- A reactive Vue `Ref` that automatically updates when the store changes

**Features:**
- Automatically subscribes on component mount
- Automatically unsubscribes on component unmount
- SSR-safe
- TypeScript support

## Why Use Zen with Vue?

- 🎯 **Framework-agnostic stores**: Share state logic across different frameworks
- 🪶 **Tiny bundle size**: Minimal overhead (~200 bytes)
- ⚡ **Performance**: Optimized for reactive updates
- 📦 **Simple API**: Just one hook to learn
- 🔒 **Type-safe**: Full TypeScript support

## License

MIT
