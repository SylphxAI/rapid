# Vue Integration

Zen provides seamless Vue 3 integration through the `@sylphx/zen-vue` package.

## Installation

::: code-group

```bash [npm]
npm install @sylphx/zen @sylphx/zen-vue
```

```bash [pnpm]
pnpm add @sylphx/zen @sylphx/zen-vue
```

```bash [yarn]
yarn add @sylphx/zen @sylphx/zen-vue
```

```bash [bun]
bun add @sylphx/zen @sylphx/zen-vue
```

:::

## Basic Usage

### useStore Composable

The `useStore` composable makes Zen stores reactive in Vue components:

```vue
<script setup lang="ts">
import { zen } from '@sylphx/zen';
import { useStore } from '@sylphx/zen-vue';

// Create store outside component
const countStore = zen(0);

const count = useStore(countStore);

function increment() {
  countStore.value++;
}
</script>

<template>
  <div>
    <p>Count: {{ count }}</p>
    <button @click="increment">Increment</button>
  </div>
</template>
```

### Multiple Stores

```vue
<script setup lang="ts">
import { zen } from '@sylphx/zen';
import { useStore } from '@sylphx/zen-vue';

const firstNameStore = zen('John');
const lastNameStore = zen('Doe');

const firstName = useStore(firstNameStore);
const lastName = useStore(lastNameStore);
</script>

<template>
  <div>
    <p>Name: {{ firstName }} {{ lastName }}</p>
    <input v-model="firstNameStore.value" />
    <input v-model="lastNameStore.value" />
  </div>
</template>
```

## Computed Values

Use computed stores with the same `useStore` composable. Zen v3 features **auto-tracking**:

```vue
<script setup lang="ts">
import { zen, computed } from '@sylphx/zen';
import { useStore } from '@sylphx/zen-vue';

const priceStore = zen(10);
const quantityStore = zen(5);

// Auto-tracks priceStore and quantityStore - no dependency array!
const totalStore = computed(() =>
  priceStore.value * quantityStore.value
);

const price = useStore(priceStore);
const quantity = useStore(quantityStore);
const total = useStore(totalStore);
</script>

<template>
  <div>
    <p>Price: ${{ price }}</p>
    <p>Quantity: {{ quantity }}</p>
    <p>Total: ${{ total }}</p>
  </div>
</template>
```

## Map Stores

For efficient object updates, use map stores:

```vue
<script setup lang="ts">
import { map, setKey } from '@sylphx/zen';
import { useStore } from '@sylphx/zen-vue';

const userStore = map({
  name: 'John',
  email: 'john@example.com',
  age: 30
});

const user = useStore(userStore);
</script>

<template>
  <form>
    <input
      :value="user.name"
      @input="setKey(userStore, 'name', ($event.target as HTMLInputElement).value)"
    />
    <input
      :value="user.email"
      @input="setKey(userStore, 'email', ($event.target as HTMLInputElement).value)"
    />
    <input
      type="number"
      :value="user.age"
      @input="setKey(userStore, 'age', Number(($event.target as HTMLInputElement).value))"
    />
  </form>
</template>
```

## V-model Integration

Bind directly to store values:

```vue
<script setup lang="ts">
import { zen } from '@sylphx/zen';
import { useStore } from '@sylphx/zen-vue';

const nameStore = zen('');
const name = useStore(nameStore);
</script>

<template>
  <div>
    <input v-model="nameStore.value" />
    <p>Hello, {{ name }}!</p>
  </div>
</template>
```

## Async Operations

### Loading States

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { zen } from '@sylphx/zen';
import { useStore } from '@sylphx/zen-vue';

const dataStore = zen<string | null>(null);
const loadingStore = zen(false);
const errorStore = zen<Error | null>(null);

const data = useStore(dataStore);
const loading = useStore(loadingStore);
const error = useStore(errorStore);

async function fetchData() {
  loadingStore.value = true;
  errorStore.value = null;

  try {
    const response = await fetch('/api/data');
    const result = await response.json();
    dataStore.value = result;
  } catch (err) {
    errorStore.value = err as Error;
  } finally {
    loadingStore.value = false;
  }
}
</script>

<template>
  <div>
    <button @click="fetchData">Load Data</button>
    <div v-if="loading">Loading...</div>
    <div v-else-if="error">Error: {{ error.message }}</div>
    <div v-else-if="data">{{ data }}</div>
  </div>
</template>
```

### With onMounted

```vue
<script setup lang="ts">
import { onMounted } from 'vue';
import { zen } from '@sylphx/zen';
import { useStore } from '@sylphx/zen-vue';

interface User {
  id: number;
  name: string;
}

const usersStore = zen<User[]>([]);
const users = useStore(usersStore);

onMounted(async () => {
  const response = await fetch('/api/users');
  const data = await response.json();
  usersStore.value = data;
});
</script>

<template>
  <ul>
    <li v-for="user in users" :key="user.id">
      {{ user.name }}
    </li>
  </ul>
</template>
```

## Performance Optimization

### Selective Subscriptions

Only subscribe to the data you need:

```vue
<script setup lang="ts">
import { computed } from '@sylphx/zen';
import { useStore } from '@sylphx/zen-vue';

// ❌ Bad - rerenders on any user property change
const user = useStore(userStore);

// ✅ Good - create computed for specific property
const userAgeStore = computed(() => userStore.value.age);
const age = useStore(userAgeStore);
</script>

<template>
  <div>{{ age }}</div>
</template>
```

### Batching Updates

Use Zen's batching for multiple related updates:

```vue
<script setup lang="ts">
import { batch } from '@sylphx/zen';

function handleBulkUpdate() {
  batch(() => {
    firstNameStore.value = 'Jane';
    lastNameStore.value = 'Smith';
    ageStore.value = 25;
  });
}
</script>

<template>
  <button @click="handleBulkUpdate">Update All</button>
</template>
```

## Form Handling

### Two-way Binding

```vue
<script setup lang="ts">
import { map, setKey } from '@sylphx/zen';
import { useStore } from '@sylphx/zen-vue';

const formStore = map({
  name: '',
  email: '',
  message: ''
});

const form = useStore(formStore);

function handleSubmit() {
  console.log('Submitting:', form);
}
</script>

<template>
  <form @submit.prevent="handleSubmit">
    <input v-model="formStore.value.name" placeholder="Name" />
    <input v-model="formStore.value.email" placeholder="Email" />
    <textarea v-model="formStore.value.message" placeholder="Message" />
    <button type="submit">Submit</button>
  </form>
</template>
```

### Form Validation

```vue
<script setup lang="ts">
import { zen, computed } from '@sylphx/zen';
import { useStore } from '@sylphx/zen-vue';

const emailStore = zen('');

const emailValidStore = computed(
  [emailStore],
  (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
);

const email = useStore(emailStore);
const isValid = useStore(emailValidStore);
</script>

<template>
  <div>
    <input
      v-model="emailStore.value"
      :style="{ borderColor: isValid ? 'green' : 'red' }"
    />
    <span v-if="!isValid">Invalid email</span>
  </div>
</template>
```

## Lists and Keys

### Todo List Example

```vue
<script setup lang="ts">
import { zen } from '@sylphx/zen';
import { useStore } from '@sylphx/zen-vue';

interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

const todosStore = zen<Todo[]>([]);
const todos = useStore(todosStore);

function addTodo(text: string) {
  todosStore.value = [
    ...todosStore.value,
    { id: Date.now(), text, completed: false }
  ];
}

function toggleTodo(id: number) {
  todosStore.value = todosStore.value.map(todo =>
    todo.id === id ? { ...todo, completed: !todo.completed } : todo
  );
}
</script>

<template>
  <div>
    <div v-for="todo in todos" :key="todo.id">
      <input
        type="checkbox"
        :checked="todo.completed"
        @change="toggleTodo(todo.id)"
      />
      <span :style="{ textDecoration: todo.completed ? 'line-through' : 'none' }">
        {{ todo.text }}
      </span>
    </div>
  </div>
</template>
```

## Composition API Patterns

### Composable with Zen

```typescript
// useCounter.ts
import { zen } from '@sylphx/zen';
import { useStore } from '@sylphx/zen-vue';

const countStore = zen(0);

export function useCounter() {
  const count = useStore(countStore);

  function increment() {
    countStore.value++;
  }

  function decrement() {
    countStore.value--;
  }

  function reset() {
    countStore.value = 0;
  }

  return {
    count,
    increment,
    decrement,
    reset
  };
}
```

```vue
<script setup lang="ts">
import { useCounter } from './useCounter';

const { count, increment, decrement, reset } = useCounter();
</script>

<template>
  <div>
    <p>Count: {{ count }}</p>
    <button @click="increment">+</button>
    <button @click="decrement">-</button>
    <button @click="reset">Reset</button>
  </div>
</template>
```

## TypeScript Support

Full type inference out of the box:

```vue
<script setup lang="ts">
interface User {
  id: number;
  name: string;
  email: string;
}

const userStore = zen<User | null>(null);
const user = useStore(userStore); // Type: User | null
</script>

<template>
  <div v-if="user">
    <p>Name: {{ user.name }}</p>
    <p>Email: {{ user.email }}</p>
  </div>
  <div v-else>No user</div>
</template>
```

## Options API

While Composition API is recommended, Zen works with Options API too:

```vue
<script lang="ts">
import { defineComponent } from 'vue';
import { zen } from '@sylphx/zen';
import { useStore } from '@sylphx/zen-vue';

const countStore = zen(0);

export default defineComponent({
  setup() {
    const count = useStore(countStore);
    return { count, countStore };
  },
  methods: {
    increment() {
      this.countStore.value++;
    }
  }
});
</script>

<template>
  <div>
    <p>Count: {{ count }}</p>
    <button @click="increment">Increment</button>
  </div>
</template>
```

## Next Steps

- [Svelte Integration](/guide/svelte) - Learn about Svelte support
- [Form Handling Example](/examples/form) - See a complete form example
- [Todo List Example](/examples/todo) - Build a todo app
