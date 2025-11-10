# Solid Integration

Zen provides Solid integration through the `@sylphx/zen-solid` package, converting Zen stores into Solid signals.

## Installation

::: code-group

```bash [npm]
npm install @sylphx/zen @sylphx/zen-solid
```

```bash [pnpm]
pnpm add @sylphx/zen @sylphx/zen-solid
```

```bash [yarn]
yarn add @sylphx/zen @sylphx/zen-solid
```

```bash [bun]
bun add @sylphx/zen @sylphx/zen-solid
```

:::

## Basic Usage

### useStore Hook

The `useStore` hook converts a Zen store into a Solid signal:

```tsx
import { zen } from '@sylphx/zen';
import { useStore } from '@sylphx/zen-solid';

// Create Zen store
const countStore = zen(0);

function Counter() {
  const count = useStore(countStore);

  return (
    <div>
      <p>Count: {count()}</p>
      <button onClick={() => countStore.value++}>
        Increment
      </button>
    </div>
  );
}
```

### Multiple Stores

```tsx
import { zen } from '@sylphx/zen';
import { useStore } from '@sylphx/zen-solid';

const firstNameStore = zen('John');
const lastNameStore = zen('Doe');

function UserProfile() {
  const firstName = useStore(firstNameStore);
  const lastName = useStore(lastNameStore);

  return (
    <div>
      <p>Name: {firstName()} {lastName()}</p>
      <input
        value={firstName()}
        onInput={(e) => firstNameStore.value = e.currentTarget.value}
      />
      <input
        value={lastName()}
        onInput={(e) => lastNameStore.value = e.currentTarget.value}
      />
    </div>
  );
}
```

## Computed Values

Use computed stores with `useStore`:

```tsx
import { zen, computed } from '@sylphx/zen';
import { useStore } from '@sylphx/zen-solid';

const priceStore = zen(10);
const quantityStore = zen(5);

const totalStore = computed(
  [priceStore, quantityStore],
  (price, quantity) => price * quantity
);

function Cart() {
  const price = useStore(priceStore);
  const quantity = useStore(quantityStore);
  const total = useStore(totalStore);

  return (
    <div>
      <p>Price: ${price()}</p>
      <p>Quantity: {quantity()}</p>
      <p>Total: ${total()}</p>
    </div>
  );
}
```

## Map Stores

For efficient object updates, use map stores:

```tsx
import { map, setKey } from '@sylphx/zen';
import { useStore } from '@sylphx/zen-solid';

const userStore = map({
  name: 'John',
  email: 'john@example.com',
  age: 30
});

function UserForm() {
  const user = useStore(userStore);

  return (
    <form>
      <input
        value={user().name}
        onInput={(e) => setKey(userStore, 'name', e.currentTarget.value)}
      />
      <input
        value={user().email}
        onInput={(e) => setKey(userStore, 'email', e.currentTarget.value)}
      />
      <input
        type="number"
        value={user().age}
        onInput={(e) => setKey(userStore, 'age', Number(e.currentTarget.value))}
      />
    </form>
  );
}
```

## Async Operations

### Loading States

```tsx
import { zen } from '@sylphx/zen';
import { useStore } from '@sylphx/zen-solid';
import { Show } from 'solid-js';

const dataStore = zen<string | null>(null);
const loadingStore = zen(false);
const errorStore = zen<Error | null>(null);

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

function DataDisplay() {
  const data = useStore(dataStore);
  const loading = useStore(loadingStore);
  const error = useStore(errorStore);

  return (
    <div>
      <button onClick={fetchData}>Load Data</button>
      <Show when={loading()}>
        <div>Loading...</div>
      </Show>
      <Show when={error()}>
        <div>Error: {error()?.message}</div>
      </Show>
      <Show when={data()}>
        <div>{data()}</div>
      </Show>
    </div>
  );
}
```

### With onMount

```tsx
import { onMount } from 'solid-js';
import { zen } from '@sylphx/zen';
import { useStore } from '@sylphx/zen-solid';
import { For } from 'solid-js';

interface User {
  id: number;
  name: string;
}

const usersStore = zen<User[]>([]);

function UserList() {
  const users = useStore(usersStore);

  onMount(async () => {
    const response = await fetch('/api/users');
    const data = await response.json();
    usersStore.value = data;
  });

  return (
    <ul>
      <For each={users()}>
        {(user) => <li>{user.name}</li>}
      </For>
    </ul>
  );
}
```

## Performance Optimization

### Selective Subscriptions

Only subscribe to the data you need:

```tsx
import { computed } from '@sylphx/zen';
import { useStore } from '@sylphx/zen-solid';

// ✅ Good - create computed for specific property
const userAgeStore = computed([userStore], (user) => user.age);

function UserAge() {
  const age = useStore(userAgeStore);
  return <div>{age()}</div>;
}
```

### Batching Updates

Use Zen's batching for multiple related updates:

```tsx
import { batch } from '@sylphx/zen';

function BulkUpdate() {
  const handleBulkUpdate = () => {
    batch(() => {
      firstNameStore.value = 'Jane';
      lastNameStore.value = 'Smith';
      ageStore.value = 25;
    });
  };

  return <button onClick={handleBulkUpdate}>Update All</button>;
}
```

## Form Handling

### Controlled Inputs

```tsx
import { map, setKey } from '@sylphx/zen';
import { useStore } from '@sylphx/zen-solid';

const formStore = map({
  name: '',
  email: '',
  message: ''
});

function ContactForm() {
  const form = useStore(formStore);

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    console.log('Submitting:', form());
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={form().name}
        onInput={(e) => setKey(formStore, 'name', e.currentTarget.value)}
        placeholder="Name"
      />
      <input
        value={form().email}
        onInput={(e) => setKey(formStore, 'email', e.currentTarget.value)}
        placeholder="Email"
      />
      <textarea
        value={form().message}
        onInput={(e) => setKey(formStore, 'message', e.currentTarget.value)}
        placeholder="Message"
      />
      <button type="submit">Submit</button>
    </form>
  );
}
```

### Form Validation

```tsx
import { zen, computed } from '@sylphx/zen';
import { useStore } from '@sylphx/zen-solid';
import { Show } from 'solid-js';

const emailStore = zen('');

const emailValidStore = computed(
  [emailStore],
  (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
);

function EmailInput() {
  const email = useStore(emailStore);
  const isValid = useStore(emailValidStore);

  return (
    <div>
      <input
        value={email()}
        onInput={(e) => emailStore.value = e.currentTarget.value}
        style={{ 'border-color': isValid() ? 'green' : 'red' }}
      />
      <Show when={!isValid()}>
        <span>Invalid email</span>
      </Show>
    </div>
  );
}
```

## Lists and Keys

### Todo List Example

```tsx
import { zen } from '@sylphx/zen';
import { useStore } from '@sylphx/zen-solid';
import { For } from 'solid-js';

interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

const todosStore = zen<Todo[]>([]);

function TodoList() {
  const todos = useStore(todosStore);

  const addTodo = (text: string) => {
    todosStore.value = [
      ...todosStore.value,
      { id: Date.now(), text, completed: false }
    ];
  };

  const toggleTodo = (id: number) => {
    todosStore.value = todosStore.value.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    );
  };

  return (
    <div>
      <For each={todos()}>
        {(todo) => (
          <div>
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => toggleTodo(todo.id)}
            />
            <span style={{ 'text-decoration': todo.completed ? 'line-through' : 'none' }}>
              {todo.text}
            </span>
          </div>
        )}
      </For>
    </div>
  );
}
```

## Solid Primitives

### createMemo with Zen

Combine Zen stores with Solid's `createMemo`:

```tsx
import { createMemo } from 'solid-js';
import { zen } from '@sylphx/zen';
import { useStore } from '@sylphx/zen-solid';

const countStore = zen(0);

function Counter() {
  const count = useStore(countStore);

  const doubled = createMemo(() => count() * 2);
  const message = createMemo(() => count() > 5 ? 'High' : 'Low');

  return (
    <div>
      <p>Count: {count()}</p>
      <p>Doubled: {doubled()}</p>
      <p>Status: {message()}</p>
      <button onClick={() => countStore.value++}>Increment</button>
    </div>
  );
}
```

### createEffect with Zen

React to store changes with `createEffect`:

```tsx
import { createEffect } from 'solid-js';
import { zen } from '@sylphx/zen';
import { useStore } from '@sylphx/zen-solid';

const countStore = zen(0);

function Counter() {
  const count = useStore(countStore);

  createEffect(() => {
    console.log('Count changed to:', count());
  });

  return (
    <div>
      <p>Count: {count()}</p>
      <button onClick={() => countStore.value++}>Increment</button>
    </div>
  );
}
```

## TypeScript Support

Full type inference out of the box:

```tsx
interface User {
  id: number;
  name: string;
  email: string;
}

const userStore = zen<User | null>(null);

function UserDisplay() {
  const user = useStore(userStore); // Type: Accessor<User | null>

  return (
    <Show when={user()} fallback={<div>No user</div>}>
      {(u) => (
        <div>
          <p>Name: {u().name}</p>
          <p>Email: {u().email}</p>
        </div>
      )}
    </Show>
  );
}
```

## Resources

Use Zen stores with Solid's `createResource`:

```tsx
import { createResource } from 'solid-js';
import { zen } from '@sylphx/zen';
import { useStore } from '@sylphx/zen-solid';

const userIdStore = zen(1);

function UserProfile() {
  const userId = useStore(userIdStore);

  const [user] = createResource(userId, async (id) => {
    const response = await fetch(`/api/users/${id}`);
    return response.json();
  });

  return (
    <div>
      <Show when={!user.loading} fallback={<div>Loading...</div>}>
        <p>Name: {user()?.name}</p>
      </Show>
      <button onClick={() => userIdStore.value++}>Next User</button>
    </div>
  );
}
```

## Next Steps

- [Preact Integration](/guide/preact) - Learn about Preact support
- [Form Handling Example](/examples/form) - See a complete form example
- [Todo List Example](/examples/todo) - Build a todo app
