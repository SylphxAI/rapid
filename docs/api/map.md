# Map Store API

## map()

Creates a map store for efficient partial object updates.

```typescript
function map<T extends Record<string, any>>(initial: T): MapZen<T>
```

### Example

```typescript
import { map } from '@sylphx/zen';

const user = map({
  name: 'John',
  email: 'john@example.com',
  age: 30
});
```

---

## setKey()

Updates a single property in a map store.

```typescript
function setKey<T, K extends keyof T>(
  store: MapZen<T>,
  key: K,
  value: T[K]
): void
```

### Example

```typescript
import { map, setKey } from '@sylphx/zen';

const user = map({ name: 'John', age: 30 });

setKey(user, 'age', 31); // Update single property
```

---

## listenKeys()

Subscribes to specific keys only.

```typescript
function listenKeys<T, K extends keyof T>(
  store: MapZen<T>,
  keys: K[],
  callback: (value: T) => void
): Unsubscribe
```

### Example

```typescript
import { map, setKey, listenKeys } from '@sylphx/zen';

const user = map({ name: 'John', email: 'john@example.com', age: 30 });

listenKeys(user, ['name', 'email'], (value) => {
  console.log('Name or email changed');
});

setKey(user, 'age', 31); // No notification
setKey(user, 'name', 'Jane'); // Notification!
```

---

## Type Definitions

```typescript
interface MapZen<T> {
  value: T;
}

type Unsubscribe = () => void
```

---

## See Also

- [Map Stores Guide](/guide/maps)
- [Core API](/api/core)
