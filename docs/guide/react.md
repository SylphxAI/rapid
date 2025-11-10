# React Integration

Zen provides first-class React integration through the `@sylphx/zen-react` package.

## Installation

::: code-group

```bash [npm]
npm install @sylphx/zen @sylphx/zen-react
```

```bash [pnpm]
pnpm add @sylphx/zen @sylphx/zen-react
```

```bash [yarn]
yarn add @sylphx/zen @sylphx/zen-react
```

```bash [bun]
bun add @sylphx/zen @sylphx/zen-react
```

:::

## Basic Usage

### useStore Hook

The `useStore` hook subscribes to a Zen store and triggers re-renders when the value changes:

```tsx
import { zen } from '@sylphx/zen';
import { useStore } from '@sylphx/zen-react';

// Create store outside component
const countStore = zen(0);

function Counter() {
  const count = useStore(countStore);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => countStore.value++}>
        Increment
      </button>
    </div>
  );
}
```

### Multiple Stores

```tsx
const firstNameStore = zen('John');
const lastNameStore = zen('Doe');

function UserProfile() {
  const firstName = useStore(firstNameStore);
  const lastName = useStore(lastNameStore);

  return (
    <div>
      <p>Name: {firstName} {lastName}</p>
      <input
        value={firstName}
        onChange={(e) => firstNameStore.value = e.target.value}
      />
      <input
        value={lastName}
        onChange={(e) => lastNameStore.value = e.target.value}
      />
    </div>
  );
}
```

## Computed Values

Use computed stores with the same `useStore` hook:

```tsx
import { zen, computed } from '@sylphx/zen';
import { useStore } from '@sylphx/zen-react';

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
      <p>Price: ${price}</p>
      <p>Quantity: {quantity}</p>
      <p>Total: ${total}</p>
    </div>
  );
}
```

## Map Stores

For efficient object updates, use map stores:

```tsx
import { map, setKey, listenKeys } from '@sylphx/zen';
import { useStore } from '@sylphx/zen-react';

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
        value={user.name}
        onChange={(e) => setKey(userStore, 'name', e.target.value)}
      />
      <input
        value={user.email}
        onChange={(e) => setKey(userStore, 'email', e.target.value)}
      />
      <input
        type="number"
        value={user.age}
        onChange={(e) => setKey(userStore, 'age', Number(e.target.value))}
      />
    </form>
  );
}
```

## Async Operations

### Loading States

```tsx
import { zen } from '@sylphx/zen';
import { useStore } from '@sylphx/zen-react';

const dataStore = zen<string | null>(null);
const loadingStore = zen(false);
const errorStore = zen<Error | null>(null);

async function fetchData() {
  loadingStore.value = true;
  errorStore.value = null;

  try {
    const response = await fetch('/api/data');
    const data = await response.json();
    dataStore.value = data;
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

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!data) return <div>No data</div>;

  return <div>{data}</div>;
}
```

### With useEffect

```tsx
import { useEffect } from 'react';
import { zen } from '@sylphx/zen';
import { useStore } from '@sylphx/zen-react';

const usersStore = zen<User[]>([]);

function UserList() {
  const users = useStore(usersStore);

  useEffect(() => {
    fetch('/api/users')
      .then(res => res.json())
      .then(data => usersStore.value = data);
  }, []);

  return (
    <ul>
      {users.map(user => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}
```

## Performance Optimization

### Selective Subscriptions

Only subscribe to the data you need:

```tsx
// ❌ Bad - rerenders on any user property change
function UserAge() {
  const user = useStore(userStore);
  return <div>{user.age}</div>;
}

// ✅ Good - create computed for specific property
const userAgeStore = computed([userStore], (user) => user.age);

function UserAge() {
  const age = useStore(userAgeStore);
  return <div>{age}</div>;
}
```

### React.memo

Prevent unnecessary re-renders with `React.memo`:

```tsx
import { memo } from 'react';

const ExpensiveComponent = memo(function ExpensiveComponent({ value }: { value: number }) {
  console.log('Rendering expensive component');
  return <div>{value}</div>;
});

function Parent() {
  const count = useStore(countStore);
  return <ExpensiveComponent value={count} />;
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
const formStore = map({
  name: '',
  email: '',
  message: ''
});

function ContactForm() {
  const form = useStore(formStore);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Submitting:', form);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={form.name}
        onChange={(e) => setKey(formStore, 'name', e.target.value)}
        placeholder="Name"
      />
      <input
        value={form.email}
        onChange={(e) => setKey(formStore, 'email', e.target.value)}
        placeholder="Email"
      />
      <textarea
        value={form.message}
        onChange={(e) => setKey(formStore, 'message', e.target.value)}
        placeholder="Message"
      />
      <button type="submit">Submit</button>
    </form>
  );
}
```

### Form Validation

```tsx
import { computed } from '@sylphx/zen';

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
        value={email}
        onChange={(e) => emailStore.value = e.target.value}
        style={{ borderColor: isValid ? 'green' : 'red' }}
      />
      {!isValid && <span>Invalid email</span>}
    </div>
  );
}
```

## Lists and Keys

### Todo List Example

```tsx
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
      {todos.map(todo => (
        <div key={todo.id}>
          <input
            type="checkbox"
            checked={todo.completed}
            onChange={() => toggleTodo(todo.id)}
          />
          <span style={{ textDecoration: todo.completed ? 'line-through' : 'none' }}>
            {todo.text}
          </span>
        </div>
      ))}
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
  const user = useStore(userStore); // Type: User | null

  if (!user) return <div>No user</div>;

  return (
    <div>
      <p>Name: {user.name}</p>
      <p>Email: {user.email}</p>
    </div>
  );
}
```

## Server Components (RSC)

Zen stores must be used in Client Components:

```tsx
'use client';

import { zen } from '@sylphx/zen';
import { useStore } from '@sylphx/zen-react';

const countStore = zen(0);

export function Counter() {
  const count = useStore(countStore);
  return <button onClick={() => countStore.value++}>{count}</button>;
}
```

## Next Steps

- [Vue Integration](/guide/vue) - Learn about Vue support
- [Form Handling Example](/examples/form) - See a complete form example
- [Todo List Example](/examples/todo) - Build a todo app
