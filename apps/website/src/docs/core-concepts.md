# Core Concepts

Understand the fundamentals of Rapid's reactive system.

## Signals

Signals are the building blocks of reactivity in Rapid. They hold a value that can change over time.

```typescript
import { signal } from '@rapid/signal';

const count = signal(0);

// Read value
console.log(count.value); // 0

// Update value
count.value = 1;
count.value++; // 2
```

### Why Signals?

- **Fine-grained reactivity**: Only affected parts of your UI update
- **Automatic tracking**: Dependencies are tracked automatically
- **Zero overhead**: Direct DOM updates, no virtual DOM diffing

## Computed Values

Computed values derive from other signals and update automatically:

```typescript
import { signal, computed } from '@rapid/signal';

const firstName = signal('John');
const lastName = signal('Doe');

const fullName = computed(() =>
  `${firstName.value} ${lastName.value}`
);

console.log(fullName.value); // "John Doe"

firstName.value = 'Jane';
console.log(fullName.value); // "Jane Doe"
```

### Computed Caching

Computed values are cached and only re-calculate when dependencies change:

```typescript
const expensive = computed(() => {
  console.log('Computing...');
  return someExpensiveOperation();
});

// First access - computes
console.log(expensive.value); // Logs "Computing..."

// Second access - uses cache
console.log(expensive.value); // No log
```

## Effects

Effects run side effects when signals change:

```typescript
import { signal, effect } from '@rapid/signal';

const count = signal(0);

effect(() => {
  console.log('Count is:', count.value);
});
// Logs: "Count is: 0"

count.value = 1;
// Logs: "Count is: 1"
```

### Cleanup

Effects can return a cleanup function:

```typescript
effect(() => {
  const id = setInterval(() => {
    console.log('Tick');
  }, 1000);

  return () => clearInterval(id);
});
```

## Components

Components render once, signals handle updates:

```typescript
function TodoItem({ todo }) {
  const completed = signal(false);

  return (
    <div class={completed.value ? 'done' : ''}>
      <input
        type="checkbox"
        checked={completed.value}
        onChange={(e) => completed.value = e.target.checked}
      />
      <span>{todo.text}</span>
    </div>
  );
}
```

### No Re-renders

Unlike React, Rapid components **never re-render**. When `completed` changes, only the affected DOM nodes update.
