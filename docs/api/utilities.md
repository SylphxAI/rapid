# Utilities API

## batch()

Groups multiple updates to trigger subscribers only once.

```typescript
function batch(fn: () => void): void
```

### Example

```typescript
import { zen, batch } from '@sylphx/zen';

const a = zen(0);
const b = zen(0);

batch(() => {
  a.value = 1;
  b.value = 2;
});
```

See [Batching Guide](/guide/batching) for more details.

---

## subscribe()

Subscribes to changes in any Zen store.

```typescript
function subscribe<T>(
  store: Zen<T> | Computed<T> | MapZen<T>,
  callback: (newValue: T, oldValue: T) => void
): Unsubscribe
```

### Example

```typescript
import { zen, subscribe } from '@sylphx/zen';

const count = zen(0);

const unsubscribe = subscribe(count, (newValue, oldValue) => {
  console.log(`${oldValue} → ${newValue}`);
});
```

See [Core API](/api/core#subscribe) for more details.

---

## Type Utilities

### ZenValue

Extracts the value type from a Zen store:

```typescript
type ZenValue<T extends AnyZen> = T extends Zen<infer U> ? U : never;
```

### Example

```typescript
const count = zen(0);
type CountValue = ZenValue<typeof count>; // number
```

---

## See Also

- [Core API](/api/core)
- [Computed API](/api/computed)
- [Map Store API](/api/map)
