# Craft (Immutable Updates)

`@sylphx/craft` provides immutable update helpers for working with Zen stores.

## Installation

::: code-group

```bash [npm]
npm install @sylphx/craft
```

```bash [pnpm]
pnpm add @sylphx/craft
```

```bash [yarn]
yarn add @sylphx/craft
```

```bash [bun]
bun add @sylphx/craft
```

:::

## Features

- **Immutable updates** - Type-safe immutable operations
- **Immer-like API** - Familiar draft-based updates
- **Lightweight** - Smaller than Immer
- **TypeScript** - Full type inference

## Basic Usage

```typescript
import { zen } from '@sylphx/zen';
import { craft } from '@sylphx/craft';

const user = zen({
  name: 'John',
  age: 30,
  address: {
    city: 'New York',
    zip: '10001'
  }
});

// Update with draft
user.value = craft(user.value, (draft) => {
  draft.age = 31;
  draft.address.city = 'Boston';
});
```

## Array Operations

```typescript
const todos = zen<Todo[]>([]);

// Add item
todos.value = craft(todos.value, (draft) => {
  draft.push({ id: 1, text: 'Buy milk', done: false });
});

// Remove item
todos.value = craft(todos.value, (draft) => {
  const index = draft.findIndex(t => t.id === 1);
  if (index >= 0) draft.splice(index, 1);
});

// Update item
todos.value = craft(todos.value, (draft) => {
  const todo = draft.find(t => t.id === 1);
  if (todo) todo.done = true;
});
```

## Nested Updates

```typescript
const state = zen({
  user: {
    profile: {
      name: 'John',
      email: 'john@example.com'
    },
    settings: {
      theme: 'light',
      notifications: true
    }
  }
});

// Deep nested update
state.value = craft(state.value, (draft) => {
  draft.user.profile.name = 'Jane';
  draft.user.settings.theme = 'dark';
});
```

## React Example

```tsx
import { zen } from '@sylphx/zen';
import { craft } from '@sylphx/craft';
import { useStore } from '@sylphx/zen-react';

const todos = zen<Todo[]>([]);

function TodoList() {
  const list = useStore(todos);

  const toggleTodo = (id: number) => {
    todos.value = craft(todos.value, (draft) => {
      const todo = draft.find(t => t.id === id);
      if (todo) todo.completed = !todo.completed;
    });
  };

  return (
    <ul>
      {list.map(todo => (
        <li key={todo.id}>
          <input
            type="checkbox"
            checked={todo.completed}
            onChange={() => toggleTodo(todo.id)}
          />
          {todo.text}
        </li>
      ))}
    </ul>
  );
}
```

## vs Manual Spreading

### Without Craft

```typescript
// Verbose and error-prone
state.value = {
  ...state.value,
  user: {
    ...state.value.user,
    profile: {
      ...state.value.user.profile,
      name: 'Jane'
    }
  }
};
```

### With Craft

```typescript
// Clean and intuitive
state.value = craft(state.value, (draft) => {
  draft.user.profile.name = 'Jane';
});
```

## Bundle Size

- Core: ~3KB gzipped
- Zero dependencies

## Next Steps

- [Router](/ecosystem/router)
- [Persistence](/ecosystem/persistent)
- [Core Concepts](/guide/core-concepts)
