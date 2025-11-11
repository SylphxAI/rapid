# Svelte Integration

Zen provides Svelte integration through the `@sylphx/zen-svelte` package, converting Zen stores into Svelte stores.

## Installation

::: code-group

```bash [npm]
npm install @sylphx/zen @sylphx/zen-svelte
```

```bash [pnpm]
pnpm add @sylphx/zen @sylphx/zen-svelte
```

```bash [yarn]
yarn add @sylphx/zen @sylphx/zen-svelte
```

```bash [bun]
bun add @sylphx/zen @sylphx/zen-svelte
```

:::

## Basic Usage

### fromZen Function

The `fromZen` function converts a Zen store into a Svelte store:

```svelte
<script lang="ts">
import { zen } from '@sylphx/zen';
import { fromZen } from '@sylphx/zen-svelte';

// Create Zen store
const countStore = zen(0);

// Convert to Svelte store
const count = fromZen(countStore);

function increment() {
  countStore.value++;
}
</script>

<div>
  <p>Count: {$count}</p>
  <button on:click={increment}>Increment</button>
</div>
```

### Direct Store Access

You can also access the Zen store directly:

```svelte
<script lang="ts">
import { zen } from '@sylphx/zen';

const count = zen(0);
</script>

<div>
  <p>Count: {count.value}</p>
  <button on:click={() => count.value++}>
    Increment
  </button>
</div>
```

## Multiple Stores

```svelte
<script lang="ts">
import { zen } from '@sylphx/zen';
import { fromZen } from '@sylphx/zen-svelte';

const firstNameStore = zen('John');
const lastNameStore = zen('Doe');

const firstName = fromZen(firstNameStore);
const lastName = fromZen(lastNameStore);
</script>

<div>
  <p>Name: {$firstName} {$lastName}</p>
  <input bind:value={firstNameStore.value} />
  <input bind:value={lastNameStore.value} />
</div>
```

## Computed Values

Use computed stores with `fromZen`. Zen v3 features **auto-tracking**:

```svelte
<script lang="ts">
import { zen, computed } from '@sylphx/zen';
import { fromZen } from '@sylphx/zen-svelte';

const priceStore = zen(10);
const quantityStore = zen(5);

// Auto-tracks priceStore and quantityStore - no dependency array!
const totalStore = computed(() =>
  priceStore.value * quantityStore.value
);

const price = fromZen(priceStore);
const quantity = fromZen(quantityStore);
const total = fromZen(totalStore);
</script>

<div>
  <p>Price: ${$price}</p>
  <p>Quantity: {$quantity}</p>
  <p>Total: ${$total}</p>
</div>
```

## Map Stores

For efficient object updates, use map stores:

```svelte
<script lang="ts">
import { map, setKey } from '@sylphx/zen';
import { fromZen } from '@sylphx/zen-svelte';

const userStore = map({
  name: 'John',
  email: 'john@example.com',
  age: 30
});

const user = fromZen(userStore);
</script>

<form>
  <input
    value={$user.name}
    on:input={(e) => setKey(userStore, 'name', e.currentTarget.value)}
  />
  <input
    value={$user.email}
    on:input={(e) => setKey(userStore, 'email', e.currentTarget.value)}
  />
  <input
    type="number"
    value={$user.age}
    on:input={(e) => setKey(userStore, 'age', Number(e.currentTarget.value))}
  />
</form>
```

## Bind Directive

Use Svelte's bind directive with Zen stores:

```svelte
<script lang="ts">
import { zen } from '@sylphx/zen';

const name = zen('');
const email = zen('');
const age = zen(0);
</script>

<form>
  <input bind:value={name.value} placeholder="Name" />
  <input bind:value={email.value} placeholder="Email" />
  <input type="number" bind:value={age.value} placeholder="Age" />
</form>

<p>Name: {name.value}</p>
<p>Email: {email.value}</p>
<p>Age: {age.value}</p>
```

## Async Operations

### Loading States

```svelte
<script lang="ts">
import { onMount } from 'svelte';
import { zen } from '@sylphx/zen';
import { fromZen } from '@sylphx/zen-svelte';

const dataStore = zen<string | null>(null);
const loadingStore = zen(false);
const errorStore = zen<Error | null>(null);

const data = fromZen(dataStore);
const loading = fromZen(loadingStore);
const error = fromZen(errorStore);

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

<button on:click={fetchData}>Load Data</button>

{#if $loading}
  <div>Loading...</div>
{:else if $error}
  <div>Error: {$error.message}</div>
{:else if $data}
  <div>{$data}</div>
{/if}
```

### With onMount

```svelte
<script lang="ts">
import { onMount } from 'svelte';
import { zen } from '@sylphx/zen';
import { fromZen } from '@sylphx/zen-svelte';

interface User {
  id: number;
  name: string;
}

const usersStore = zen<User[]>([]);
const users = fromZen(usersStore);

onMount(async () => {
  const response = await fetch('/api/users');
  const data = await response.json();
  usersStore.value = data;
});
</script>

<ul>
  {#each $users as user (user.id)}
    <li>{user.name}</li>
  {/each}
</ul>
```

## Performance Optimization

### Selective Subscriptions

Only subscribe to the data you need:

```svelte
<script lang="ts">
import { computed } from '@sylphx/zen';
import { fromZen } from '@sylphx/zen-svelte';

// ✅ Good - create computed for specific property
const userAgeStore = computed(() => userStore.value.age);
const age = fromZen(userAgeStore);
</script>

<div>{$age}</div>
```

### Batching Updates

Use Zen's batching for multiple related updates:

```svelte
<script lang="ts">
import { batch } from '@sylphx/zen';

function handleBulkUpdate() {
  batch(() => {
    firstNameStore.value = 'Jane';
    lastNameStore.value = 'Smith';
    ageStore.value = 25;
  });
}
</script>

<button on:click={handleBulkUpdate}>Update All</button>
```

## Form Handling

### Two-way Binding

```svelte
<script lang="ts">
import { map } from '@sylphx/zen';
import { fromZen } from '@sylphx/zen-svelte';

const formStore = map({
  name: '',
  email: '',
  message: ''
});

const form = fromZen(formStore);

function handleSubmit() {
  console.log('Submitting:', $form);
}
</script>

<form on:submit|preventDefault={handleSubmit}>
  <input bind:value={formStore.value.name} placeholder="Name" />
  <input bind:value={formStore.value.email} placeholder="Email" />
  <textarea bind:value={formStore.value.message} placeholder="Message" />
  <button type="submit">Submit</button>
</form>
```

### Form Validation

```svelte
<script lang="ts">
import { zen, computed } from '@sylphx/zen';
import { fromZen } from '@sylphx/zen-svelte';

const emailStore = zen('');

const emailValidStore = computed(
  [emailStore],
  (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
);

const email = fromZen(emailStore);
const isValid = fromZen(emailValidStore);
</script>

<div>
  <input
    bind:value={emailStore.value}
    style="border-color: {$isValid ? 'green' : 'red'}"
  />
  {#if !$isValid}
    <span>Invalid email</span>
  {/if}
</div>
```

## Lists and Keys

### Todo List Example

```svelte
<script lang="ts">
import { zen } from '@sylphx/zen';
import { fromZen } from '@sylphx/zen-svelte';

interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

const todosStore = zen<Todo[]>([]);
const todos = fromZen(todosStore);

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

<div>
  {#each $todos as todo (todo.id)}
    <div>
      <input
        type="checkbox"
        checked={todo.completed}
        on:change={() => toggleTodo(todo.id)}
      />
      <span style="text-decoration: {todo.completed ? 'line-through' : 'none'}">
        {todo.text}
      </span>
    </div>
  {/each}
</div>
```

## Reactive Statements

Combine Zen with Svelte's reactive statements:

```svelte
<script lang="ts">
import { zen } from '@sylphx/zen';
import { fromZen } from '@sylphx/zen-svelte';

const countStore = zen(0);
const count = fromZen(countStore);

$: doubled = $count * 2;
$: message = $count > 5 ? 'High' : 'Low';
</script>

<div>
  <p>Count: {$count}</p>
  <p>Doubled: {doubled}</p>
  <p>Status: {message}</p>
  <button on:click={() => countStore.value++}>Increment</button>
</div>
```

## TypeScript Support

Full type inference out of the box:

```svelte
<script lang="ts">
import { zen } from '@sylphx/zen';
import { fromZen } from '@sylphx/zen-svelte';

interface User {
  id: number;
  name: string;
  email: string;
}

const userStore = zen<User | null>(null);
const user = fromZen(userStore); // Type: Readable<User | null>
</script>

{#if $user}
  <div>
    <p>Name: {$user.name}</p>
    <p>Email: {$user.email}</p>
  </div>
{:else}
  <div>No user</div>
{/if}
```

## Custom Store Contract

Zen stores follow Svelte's store contract, so they work with Svelte's auto-subscription:

```svelte
<script lang="ts">
import { zen } from '@sylphx/zen';

// You can use $ syntax directly with converted stores
const count = zen(0);

// Convert to Svelte store for $ syntax
import { fromZen } from '@sylphx/zen-svelte';
const countSvelte = fromZen(count);
</script>

<div>
  <!-- Using converted store with $ syntax -->
  <p>Count: {$countSvelte}</p>

  <!-- Or access directly -->
  <p>Count: {count.value}</p>

  <button on:click={() => count.value++}>Increment</button>
</div>
```

## Next Steps

- [Solid Integration](/guide/solid) - Learn about Solid support
- [Form Handling Example](/examples/form) - See a complete form example
- [Todo List Example](/examples/todo) - Build a todo app
