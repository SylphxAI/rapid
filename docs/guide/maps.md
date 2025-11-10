# Map Stores

Map stores provide efficient partial updates for objects, allowing you to update individual properties without replacing the entire object.

## Why Map Stores?

### Problem with Regular Stores

With regular stores, updating a single property requires replacing the entire object:

```typescript
import { zen } from '@sylphx/zen';

const user = zen({
  name: 'John',
  email: 'john@example.com',
  age: 30,
  address: {
    street: '123 Main St',
    city: 'New York'
  }
});

// ❌ Must replace entire object
user.value = {
  ...user.value,
  age: 31
};
```

### Solution with Map Stores

Map stores allow efficient single-key updates:

```typescript
import { map, setKey } from '@sylphx/zen';

const user = map({
  name: 'John',
  email: 'john@example.com',
  age: 30
});

// ✅ Update only what changed
setKey(user, 'age', 31);
```

## Creating Map Stores

Use the `map` function to create a map store:

```typescript
import { map } from '@sylphx/zen';

const user = map({
  name: 'John',
  email: 'john@example.com',
  age: 30
});
```

## Updating Values

### setKey

Update a single property:

```typescript
import { setKey } from '@sylphx/zen';

setKey(user, 'age', 31);
setKey(user, 'email', 'john.doe@example.com');
```

### Multiple Updates

Update multiple properties:

```typescript
setKey(user, 'name', 'Jane');
setKey(user, 'age', 25);
setKey(user, 'email', 'jane@example.com');
```

### Batching Updates

Use `batch` to group updates:

```typescript
import { batch } from '@sylphx/zen';

batch(() => {
  setKey(user, 'name', 'Jane');
  setKey(user, 'age', 25);
  setKey(user, 'email', 'jane@example.com');
});
```

## Reading Values

Read the entire object:

```typescript
console.log(user.value);
// { name: 'John', email: 'john@example.com', age: 30 }
```

Read specific properties:

```typescript
console.log(user.value.name); // "John"
console.log(user.value.age); // 30
```

## Subscribing to Changes

### Subscribe to All Changes

Subscribe to any property change:

```typescript
import { subscribe } from '@sylphx/zen';

subscribe(user, (newValue, oldValue) => {
  console.log('User changed:', newValue);
});

setKey(user, 'age', 31); // Triggers subscriber
```

### Subscribe to Specific Keys

Use `listenKeys` to subscribe to specific properties only:

```typescript
import { listenKeys } from '@sylphx/zen';

const unsubscribe = listenKeys(user, ['name', 'email'], (value) => {
  console.log('Name or email changed:', value);
});

setKey(user, 'age', 31); // No notification
setKey(user, 'name', 'Jane'); // Notification!
setKey(user, 'email', 'jane@example.com'); // Notification!
```

## Framework Integration

### React

```tsx
import { map, setKey } from '@sylphx/zen';
import { useStore } from '@sylphx/zen-react';

const userStore = map({
  name: 'John',
  email: 'john@example.com',
  age: 30
});

function UserProfile() {
  const user = useStore(userStore);

  return (
    <div>
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
    </div>
  );
}
```

### Vue

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
  <div>
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
  </div>
</template>
```

## Nested Objects

For deeply nested objects, you can use multiple map stores:

```typescript
const address = map({
  street: '123 Main St',
  city: 'New York',
  zipCode: '10001'
});

const user = map({
  name: 'John',
  email: 'john@example.com',
  address: address.value
});

// Update nested property
setKey(address, 'city', 'Boston');

// Update user with new address
setKey(user, 'address', address.value);
```

Or use a flat structure:

```typescript
const user = map({
  name: 'John',
  email: 'john@example.com',
  'address.street': '123 Main St',
  'address.city': 'New York',
  'address.zipCode': '10001'
});

setKey(user, 'address.city', 'Boston');
```

## Type Safety

Map stores are fully type-safe:

```typescript
interface User {
  name: string;
  email: string;
  age: number;
}

const user = map<User>({
  name: 'John',
  email: 'john@example.com',
  age: 30
});

// ✅ Type-safe
setKey(user, 'name', 'Jane');

// ❌ TypeScript error - invalid key
setKey(user, 'invalid', 'value');

// ❌ TypeScript error - wrong type
setKey(user, 'age', 'not a number');
```

## Performance Benefits

### Reduced Re-renders

Map stores minimize component re-renders:

```tsx
const userStore = map({
  name: 'John',
  email: 'john@example.com',
  age: 30
});

// Only rerenders when name or email changes
function UserContact() {
  const user = useStore(userStore);
  return <div>{user.name} - {user.email}</div>;
}

// Doesn't cause UserContact to rerender
setKey(userStore, 'age', 31);
```

### Selective Subscriptions

Listen only to the keys you care about:

```typescript
// Only notifies when name changes
listenKeys(user, ['name'], (value) => {
  console.log('Name changed:', value.name);
});

// No notification
setKey(user, 'age', 31);

// Notification!
setKey(user, 'name', 'Jane');
```

## Common Patterns

### Form State

```typescript
const formStore = map({
  name: '',
  email: '',
  password: '',
  confirmPassword: ''
});

const formErrors = map({
  name: null as string | null,
  email: null as string | null,
  password: null as string | null,
  confirmPassword: null as string | null
});

function validateField(field: keyof typeof formStore.value) {
  const value = formStore.value[field];

  switch (field) {
    case 'email':
      const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value as string);
      setKey(formErrors, 'email', valid ? null : 'Invalid email');
      break;
    case 'password':
      setKey(
        formErrors,
        'password',
        (value as string).length >= 8 ? null : 'Password too short'
      );
      break;
  }
}
```

### Settings/Preferences

```typescript
const settings = map({
  theme: 'light' as 'light' | 'dark',
  fontSize: 14,
  notifications: true,
  language: 'en'
});

// Update single setting
setKey(settings, 'theme', 'dark');

// Save to localStorage
subscribe(settings, (value) => {
  localStorage.setItem('settings', JSON.stringify(value));
});
```

### Entity Management

```typescript
interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

const todosById = map<Record<number, Todo>>({});

function addTodo(todo: Todo) {
  setKey(todosById, todo.id, todo);
}

function updateTodo(id: number, updates: Partial<Todo>) {
  const todo = todosById.value[id];
  if (todo) {
    setKey(todosById, id, { ...todo, ...updates });
  }
}

function deleteTodo(id: number) {
  const { [id]: removed, ...rest } = todosById.value;
  todosById.value = rest;
}
```

## Computed Values with Map Stores

Create computed values from map stores:

```typescript
import { computed } from '@sylphx/zen';

const user = map({
  firstName: 'John',
  lastName: 'Doe'
});

const fullName = computed(
  [user],
  (u) => `${u.firstName} ${u.lastName}`
);

console.log(fullName.value); // "John Doe"

setKey(user, 'firstName', 'Jane');
console.log(fullName.value); // "Jane Doe"
```

## API Reference

### map(initial)

Create a map store:

```typescript
const store = map({ key: 'value' });
```

### setKey(store, key, value)

Update a single key:

```typescript
setKey(store, 'key', 'newValue');
```

### listenKeys(store, keys, callback)

Subscribe to specific keys:

```typescript
const unsubscribe = listenKeys(store, ['key1', 'key2'], (value) => {
  console.log('Keys changed:', value);
});
```

## Map Stores vs Regular Stores

| Feature | Regular Store | Map Store |
|---------|--------------|-----------|
| Update single property | Replace entire object | Update only that property |
| Performance | Good | Better for large objects |
| Type safety | ✅ | ✅ |
| Selective subscriptions | ❌ | ✅ |
| API complexity | Simple | Slightly more complex |

## Best Practices

### ✅ Do: Use for Large Objects

```typescript
// ✅ Good - large object with frequent updates
const userProfile = map({
  id: 1,
  name: 'John',
  email: 'john@example.com',
  bio: 'Long bio text...',
  preferences: {},
  settings: {},
  // ... many more properties
});
```

### ✅ Do: Use for Form State

```typescript
// ✅ Good - forms with many fields
const formData = map({
  field1: '',
  field2: '',
  // ... many fields
});
```

### ❌ Don't: Use for Simple Objects

```typescript
// ❌ Bad - simple object, regular store is fine
const simple = map({
  x: 0,
  y: 0
});

// ✅ Better
const simple = zen({ x: 0, y: 0 });
```

### ✅ Do: Use Selective Subscriptions

```typescript
// ✅ Good - only listen to relevant keys
listenKeys(user, ['name', 'email'], handler);
```

### ✅ Do: Batch Related Updates

```typescript
// ✅ Good - batch multiple updates
batch(() => {
  setKey(user, 'name', 'Jane');
  setKey(user, 'age', 25);
  setKey(user, 'email', 'jane@example.com');
});
```

## Next Steps

- [Batching Updates](/guide/batching) - Learn about batching
- [Form Handling Example](/examples/form) - See map stores in action
- [Core Concepts](/guide/core-concepts) - Understand the fundamentals
