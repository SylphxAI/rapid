# Counter Example

A simple counter demonstrating basic Zen usage.

## Vanilla JavaScript

```typescript
import { zen, subscribe } from '@sylphx/zen';

// Create store
const count = zen(0);

// Subscribe to changes
subscribe(count, (value) => {
  document.getElementById('count')!.textContent = value.toString();
});

// Increment
document.getElementById('increment')!.addEventListener('click', () => {
  count.value++;
});

// Decrement
document.getElementById('decrement')!.addEventListener('click', () => {
  count.value--;
});

// Reset
document.getElementById('reset')!.addEventListener('click', () => {
  count.value = 0;
});
```

## React

```tsx
import { zen } from '@sylphx/zen';
import { useStore } from '@sylphx/zen-react';

const countStore = zen(0);

export function Counter() {
  const count = useStore(countStore);

  return (
    <div>
      <h1>Count: {count}</h1>
      <button onClick={() => countStore.value++}>Increment</button>
      <button onClick={() => countStore.value--}>Decrement</button>
      <button onClick={() => countStore.value = 0}>Reset</button>
    </div>
  );
}
```

## Vue

```vue
<script setup lang="ts">
import { zen } from '@sylphx/zen';
import { useStore } from '@sylphx/zen-vue';

const countStore = zen(0);
const count = useStore(countStore);
</script>

<template>
  <div>
    <h1>Count: {{ count }}</h1>
    <button @click="countStore.value++">Increment</button>
    <button @click="countStore.value--">Decrement</button>
    <button @click="countStore.value = 0">Reset</button>
  </div>
</template>
```

## With Computed Value

```typescript
import { zen, computed } from '@sylphx/zen';

const count = zen(0);

const doubled = computed([count], (c) => c * 2);
const isEven = computed([count], (c) => c % 2 === 0);

subscribe(doubled, (value) => {
  console.log('Doubled:', value);
});

subscribe(isEven, (value) => {
  console.log('Is even:', value);
});

count.value++; // Logs: "Doubled: 2", "Is even: false"
```

## Next Steps

- [Todo List Example](/examples/todo)
- [Form Handling Example](/examples/form)
- [Core Concepts](/guide/core-concepts)
