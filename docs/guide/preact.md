# Preact Integration

Zen provides Preact integration through the `@sylphx/zen-preact` package, similar to the React integration but optimized for Preact's smaller footprint.

## Installation

::: code-group

```bash [npm]
npm install @sylphx/zen @sylphx/zen-preact
```

```bash [pnpm]
pnpm add @sylphx/zen @sylphx/zen-preact
```

```bash [yarn]
yarn add @sylphx/zen @sylphx/zen-preact
```

```bash [bun]
bun add @sylphx/zen @sylphx/zen-preact
```

:::

## Basic Usage

### useStore Hook

The `useStore` hook subscribes to a Zen store and triggers re-renders when the value changes:

```tsx
import { zen } from '@sylphx/zen';
import { useStore } from '@sylphx/zen-preact';

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
        onInput={(e) => firstNameStore.value = e.currentTarget.value}
      />
      <input
        value={lastName}
        onInput={(e) => lastNameStore.value = e.currentTarget.value}
      />
    </div>
  );
}
```

## Computed Values

Use computed stores with the same `useStore` hook:

```tsx
import { zen, computed } from '@sylphx/zen';
import { useStore } from '@sylphx/zen-preact';

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
import { map, setKey } from '@sylphx/zen';
import { useStore } from '@sylphx/zen-preact';

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
        onInput={(e) => setKey(userStore, 'name', e.currentTarget.value)}
      />
      <input
        value={user.email}
        onInput={(e) => setKey(userStore, 'email', e.currentTarget.value)}
      />
      <input
        type="number"
        value={user.age}
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
import { useStore } from '@sylphx/zen-preact';

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
import { useEffect } from 'preact/hooks';
import { zen } from '@sylphx/zen';
import { useStore } from '@sylphx/zen-preact';

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

### memo

Prevent unnecessary re-renders with `memo`:

```tsx
import { memo } from 'preact/compat';

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

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    console.log('Submitting:', form);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={form.name}
        onInput={(e) => setKey(formStore, 'name', e.currentTarget.value)}
        placeholder="Name"
      />
      <input
        value={form.email}
        onInput={(e) => setKey(formStore, 'email', e.currentTarget.value)}
        placeholder="Email"
      />
      <textarea
        value={form.message}
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
        onInput={(e) => emailStore.value = e.currentTarget.value}
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

## Signals Integration

Preact has built-in signals support. You can use Zen alongside Preact Signals:

```tsx
import { signal } from '@preact/signals';
import { zen } from '@sylphx/zen';
import { useStore } from '@sylphx/zen-preact';

// Preact Signal
const preactCount = signal(0);

// Zen Store
const zenCount = zen(0);

function Counter() {
  const zenValue = useStore(zenCount);

  return (
    <div>
      <p>Preact Signal: {preactCount.value}</p>
      <p>Zen Store: {zenValue}</p>
      <button onClick={() => preactCount.value++}>
        Increment Preact
      </button>
      <button onClick={() => zenCount.value++}>
        Increment Zen
      </button>
    </div>
  );
}
```

## Custom Hooks

Create reusable hooks with Zen stores:

```tsx
// useCounter.ts
import { zen } from '@sylphx/zen';
import { useStore } from '@sylphx/zen-preact';

const countStore = zen(0);

export function useCounter() {
  const count = useStore(countStore);

  const increment = () => {
    countStore.value++;
  };

  const decrement = () => {
    countStore.value--;
  };

  const reset = () => {
    countStore.value = 0;
  };

  return {
    count,
    increment,
    decrement,
    reset
  };
}
```

```tsx
// Counter.tsx
import { useCounter } from './useCounter';

function Counter() {
  const { count, increment, decrement, reset } = useCounter();

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={increment}>+</button>
      <button onClick={decrement}>-</button>
      <button onClick={reset}>Reset</button>
    </div>
  );
}
```

## Preact vs React

The API is nearly identical, but there are some differences:

### Event Handlers

```tsx
// Preact uses lowercase event names
<input onInput={(e) => console.log(e)} />

// React uses camelCase
<input onInput={(e) => console.log(e)} />
```

### Compatibility

For React compatibility, use `preact/compat`:

```tsx
import { memo } from 'preact/compat';
import { useEffect } from 'preact/hooks';
```

## Next Steps

- [Computed Values](/guide/computed) - Deep dive into computed values
- [Form Handling Example](/examples/form) - See a complete form example
- [Todo List Example](/examples/todo) - Build a todo app
