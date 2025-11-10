# Core Concepts

Zen's state management is built around a few simple but powerful concepts. Understanding these will help you build reactive applications efficiently.

## Atoms

Atoms are the fundamental building blocks in Zen. An atom is a piece of reactive state that can be read and written.

```typescript
import { zen } from '@sylphx/zen';

// Create an atom with initial value
const count = zen(0);

// Read the value
console.log(count.value); // 0

// Update the value
count.value = 1;

// Increment
count.value++;
```

### Atom Characteristics

- **Reactive**: Changes to an atom automatically notify subscribers
- **Type-safe**: TypeScript infers the type from the initial value
- **Lightweight**: Uses native getters/setters for minimal overhead
- **Mutable**: Direct `.value` property assignment

### Creating Atoms

```typescript
// Primitives
const count = zen(0);
const name = zen('John');
const isActive = zen(true);

// Objects
const user = zen({
  id: 1,
  name: 'John',
  email: 'john@example.com'
});

// Arrays
const items = zen([1, 2, 3]);

// Complex types
interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

const todos = zen<Todo[]>([]);
```

## Computed Values

Computed values derive state from one or more atoms. They automatically update when their dependencies change.

```typescript
import { zen, computed } from '@sylphx/zen';

const firstName = zen('John');
const lastName = zen('Doe');

// Computed value depends on two atoms
const fullName = computed(
  [firstName, lastName],
  (first, last) => `${first} ${last}`
);

console.log(fullName.value); // "John Doe"

firstName.value = 'Jane';
console.log(fullName.value); // "Jane Doe"
```

### Computed Characteristics

- **Automatic updates**: Recalculates when dependencies change
- **Read-only**: Cannot be written to directly
- **Cached**: Only recalculates when dependencies change
- **Lazy**: Only evaluates when accessed

### Multiple Dependencies

```typescript
const quantity = zen(5);
const price = zen(10);
const taxRate = zen(0.1);

const total = computed(
  [quantity, price, taxRate],
  (qty, p, tax) => qty * p * (1 + tax)
);

console.log(total.value); // 55
```

### Chaining Computed Values

```typescript
const base = zen(10);
const doubled = computed([base], (x) => x * 2);
const quadrupled = computed([doubled], (x) => x * 2);

console.log(quadrupled.value); // 40

base.value = 20;
console.log(quadrupled.value); // 80
```

## Subscriptions

Subscriptions allow you to react to changes in atoms or computed values.

```typescript
import { zen, subscribe } from '@sylphx/zen';

const count = zen(0);

// Subscribe to changes
const unsubscribe = subscribe(count, (newValue, oldValue) => {
  console.log(`Changed from ${oldValue} to ${newValue}`);
});

count.value = 1; // Logs: "Changed from 0 to 1"
count.value = 2; // Logs: "Changed from 1 to 2"

// Clean up
unsubscribe();

count.value = 3; // No log - subscription removed
```

### Subscription Characteristics

- **Immediate**: Callback runs synchronously after each change
- **Cleanup**: Returns unsubscribe function
- **Two arguments**: Receives new value and old value
- **Works with computed**: Can subscribe to computed values too

### Subscribing to Computed Values

```typescript
const count = zen(0);
const doubled = computed([count], (x) => x * 2);

subscribe(doubled, (newValue) => {
  console.log(`Doubled: ${newValue}`);
});

count.value = 5; // Logs: "Doubled: 10"
```

### Multiple Subscriptions

```typescript
const count = zen(0);

const sub1 = subscribe(count, (val) => console.log('Sub 1:', val));
const sub2 = subscribe(count, (val) => console.log('Sub 2:', val));

count.value = 1;
// Logs:
// "Sub 1: 1"
// "Sub 2: 1"

// Clean up individual subscriptions
sub1();
sub2();
```

## Map Stores

For objects that change frequently, map stores provide efficient partial updates.

```typescript
import { map, setKey, listenKeys } from '@sylphx/zen';

const user = map({
  name: 'John',
  age: 30,
  email: 'john@example.com'
});

// Efficient single-key update
setKey(user, 'age', 31);

// Subscribe to specific keys only
const unsubscribe = listenKeys(user, ['name', 'email'], (value) => {
  console.log('Name or email changed:', value);
});

setKey(user, 'age', 32); // No log - not watching 'age'
setKey(user, 'name', 'Jane'); // Logs: "Name or email changed: ..."
```

### Map Store Benefits

- **Granular updates**: Update single properties without replacing entire object
- **Selective subscriptions**: Listen to specific keys only
- **Performance**: Avoids unnecessary rerenders in UI frameworks
- **Type-safe**: Full TypeScript support with key checking

## Batching

Batch multiple updates to trigger subscribers only once.

```typescript
import { zen, batch } from '@sylphx/zen';

const firstName = zen('John');
const lastName = zen('Doe');

subscribe(firstName, () => console.log('First name changed'));
subscribe(lastName, () => console.log('Last name changed'));

// Without batching - triggers twice
firstName.value = 'Jane';
lastName.value = 'Smith';
// Logs:
// "First name changed"
// "Last name changed"

// With batching - deferred until batch completes
batch(() => {
  firstName.value = 'Bob';
  lastName.value = 'Jones';
});
// Logs after batch:
// "First name changed"
// "Last name changed"
```

### When to Use Batching

- Multiple related updates
- Bulk data operations
- Performance-critical paths
- Avoiding intermediate states in UI

## Lifecycle and Cleanup

Always clean up subscriptions to prevent memory leaks.

```typescript
import { zen, subscribe } from '@sylphx/zen';

function setupStore() {
  const count = zen(0);

  const unsubscribe = subscribe(count, (val) => {
    console.log('Count:', val);
  });

  // Return cleanup function
  return () => {
    unsubscribe();
  };
}

// Use the store
const cleanup = setupStore();

// Later, clean up
cleanup();
```

### Framework Integration Lifecycle

Most framework integrations handle cleanup automatically:

```tsx
// React - automatic cleanup
function Counter() {
  const value = useStore(count);
  // Subscription cleaned up when component unmounts
  return <div>{value}</div>;
}
```

## Next Steps

- [Performance](/guide/performance) - Understand Zen's performance characteristics
- [Framework Integration](/guide/react) - Learn how to use Zen with your framework
- [Computed Values](/guide/computed) - Deep dive into computed values
- [Map Stores](/guide/maps) - Master efficient object updates
