# Getting Started

## Installation

Install Zen using your preferred package manager:

::: code-group

```bash [npm]
npm install @sylphx/zen
```

```bash [pnpm]
pnpm add @sylphx/zen
```

```bash [yarn]
yarn add @sylphx/zen
```

```bash [bun]
bun add @sylphx/zen
```

:::

## Your First Zen Store

Create a simple counter:

```typescript
import { zen } from '@sylphx/zen';

// Create a zen atom with initial value
const count = zen(0);

// Read the current value
console.log(count.value); // 0

// Update the value
count.value = 1;
console.log(count.value); // 1

// Increment
count.value++;
console.log(count.value); // 2
```

## Computed Values

Create values that automatically update based on other stores:

```typescript
import { zen, computed } from '@sylphx/zen';

const firstName = zen('John');
const lastName = zen('Doe');

const fullName = computed(
  [firstName, lastName],
  (first, last) => `${first} ${last}`
);

console.log(fullName.value); // "John Doe"

// Update first name
firstName.value = 'Jane';
console.log(fullName.value); // "Jane Doe"
```

## Subscribing to Changes

React to changes in your stores:

```typescript
import { zen, subscribe } from '@sylphx/zen';

const count = zen(0);

// Subscribe to changes
const unsubscribe = subscribe(count, (newValue, oldValue) => {
  console.log(`Count changed from ${oldValue} to ${newValue}`);
});

count.value = 1; // Logs: "Count changed from 0 to 1"
count.value = 2; // Logs: "Count changed from 1 to 2"

// Clean up when done
unsubscribe();
```

## Framework Integration

### React

Install the React integration:

```bash
npm install @sylphx/zen-react
```

Use in your components:

```tsx
import { zen } from '@sylphx/zen';
import { useStore } from '@sylphx/zen-react';

// Create store outside component
const count = zen(0);

function Counter() {
  const value = useStore(count);

  return (
    <div>
      <p>Count: {value}</p>
      <button onClick={() => count.value++}>
        Increment
      </button>
    </div>
  );
}
```

### Vue

Install the Vue integration:

```bash
npm install @sylphx/zen-vue
```

Use in your components:

```vue
<script setup>
import { zen } from '@sylphx/zen';
import { useStore } from '@sylphx/zen-vue';

const count = zen(0);
const value = useStore(count);
</script>

<template>
  <div>
    <p>Count: {{ value }}</p>
    <button @click="count.value++">
      Increment
    </button>
  </div>
</template>
```

### Svelte

Install the Svelte integration:

```bash
npm install @sylphx/zen-svelte
```

Use in your components:

```svelte
<script>
import { zen } from '@sylphx/zen';
import { fromZen } from '@sylphx/zen-svelte';

const count = zen(0);
const store = fromZen(count);
</script>

<div>
  <p>Count: {$store}</p>
  <button on:click={() => count.value++}>
    Increment
  </button>
</div>
```

## Object Stores

Create stores with complex objects:

```typescript
import { zen } from '@sylphx/zen';

const user = zen({
  name: 'John',
  age: 30,
  email: 'john@example.com'
});

// Read
console.log(user.value.name); // "John"

// Update (replace entire object)
user.value = {
  name: 'Jane',
  age: 25,
  email: 'jane@example.com'
};

// Partial update (spread)
user.value = {
  ...user.value,
  age: 26
};
```

## Map Stores

For more efficient partial updates, use map stores:

```typescript
import { map, setKey, listenKeys } from '@sylphx/zen';

const user = map({
  name: 'John',
  age: 30,
  email: 'john@example.com'
});

// Update single property (efficient)
setKey(user, 'age', 31);

// Subscribe to specific keys only
const unsubscribe = listenKeys(user, ['name', 'email'], (value) => {
  console.log('Name or email changed:', value);
});
```

## Next Steps

- [Core Concepts](/guide/core-concepts) - Understand Zen's fundamentals
- [Framework Guides](/guide/react) - Deep dive into framework integration
- [API Reference](/api/core) - Complete API documentation
- [Examples](/examples/counter) - Real-world examples
