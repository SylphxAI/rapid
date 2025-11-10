# Computed API

## computed()

Creates a derived value that automatically updates when dependencies change.

```typescript
function computed<Deps extends AnyZen[], R>(
  dependencies: Deps,
  computeFn: (...values: ZenValues<Deps>) => R
): Computed<R>
```

### Parameters

- `dependencies` - Array of Zen stores to depend on
- `computeFn` - Function that computes the value from dependencies

### Returns

A read-only Zen store with the computed value.

### Example

```typescript
import { zen, computed } from '@sylphx/zen';

const firstName = zen('John');
const lastName = zen('Doe');

const fullName = computed(
  [firstName, lastName],
  (first, last) => `${first} ${last}`
);

console.log(fullName.value); // "John Doe"

firstName.value = 'Jane';
console.log(fullName.value); // "Jane Doe"
```

---

## Characteristics

### Automatic Updates

Computed values recalculate when dependencies change:

```typescript
const count = zen(0);
const doubled = computed([count], (c) => c * 2);

console.log(doubled.value); // 0
count.value = 5;
console.log(doubled.value); // 10
```

### Lazy Evaluation

Only evaluates when accessed:

```typescript
const expensive = computed([input], (val) => {
  console.log('Computing...');
  return expensiveOperation(val);
});

// No log yet
console.log(expensive.value); // Logs "Computing..." then result
console.log(expensive.value); // Cached - no log
```

### Read-only

Cannot be written to directly:

```typescript
const doubled = computed([count], (c) => c * 2);

doubled.value = 10; // ❌ Error - computed values are read-only
```

### Caching

Results are cached until dependencies change:

```typescript
const count = zen(0);
let callCount = 0;

const doubled = computed([count], (c) => {
  callCount++;
  return c * 2;
});

doubled.value; // callCount = 1
doubled.value; // callCount = 1 (cached)

count.value = 5;
doubled.value; // callCount = 2 (recalculated)
```

---

## Multiple Dependencies

Depend on multiple stores:

```typescript
const a = zen(1);
const b = zen(2);
const c = zen(3);

const sum = computed(
  [a, b, c],
  (aVal, bVal, cVal) => aVal + bVal + cVal
);

console.log(sum.value); // 6
```

---

## Chaining

Chain computed values:

```typescript
const base = zen(10);
const doubled = computed([base], (x) => x * 2);
const quadrupled = computed([doubled], (x) => x * 2);

console.log(quadrupled.value); // 40
```

---

## Subscribing

Subscribe to computed values:

```typescript
const doubled = computed([count], (c) => c * 2);

subscribe(doubled, (newValue, oldValue) => {
  console.log(`Doubled: ${oldValue} → ${newValue}`);
});

count.value = 5; // Logs: "Doubled: 0 → 10"
```

---

## Type Definition

```typescript
interface Computed<T> {
  readonly value: T;
}

type ZenValues<T extends AnyZen[]> = {
  [K in keyof T]: T[K] extends Zen<infer U> ? U : never;
};
```

---

## Common Patterns

### Filtering

```typescript
const items = zen([1, 2, 3, 4, 5]);
const evenItems = computed(
  [items],
  (list) => list.filter(x => x % 2 === 0)
);
```

### Mapping

```typescript
const users = zen<User[]>([]);
const userNames = computed(
  [users],
  (list) => list.map(u => u.name)
);
```

### Aggregation

```typescript
const numbers = zen([1, 2, 3, 4, 5]);
const sum = computed(
  [numbers],
  (list) => list.reduce((acc, n) => acc + n, 0)
);
```

### Conditional Logic

```typescript
const age = zen(20);
const category = computed([age], (a) => {
  if (a < 13) return 'child';
  if (a < 20) return 'teen';
  if (a < 65) return 'adult';
  return 'senior';
});
```

---

## Best Practices

### ✅ Minimize dependencies

```typescript
// ✅ Good - only includes what's used
const result = computed([a, b], (aVal, bVal) => aVal + bVal);

// ❌ Bad - c not used
const result = computed([a, b, c], (aVal, bVal, cVal) => aVal + bVal);
```

### ✅ Keep computations pure

```typescript
// ✅ Good - pure function
const doubled = computed([count], (c) => c * 2);

// ❌ Bad - side effects
const doubled = computed([count], (c) => {
  console.log('Computing'); // Side effect
  return c * 2;
});
```

### ✅ Split expensive computations

```typescript
// ✅ Good - split into steps
const processed = computed([data], process);
const filtered = computed([processed], filter);
const sorted = computed([filtered], sort);

// ❌ Bad - all in one
const result = computed([data], (d) => {
  return sort(filter(process(d)));
});
```

---

## See Also

- [Core API](/api/core) - Basic stores
- [Computed Values Guide](/guide/computed) - Detailed guide
- [Performance](/guide/performance) - Optimization tips
