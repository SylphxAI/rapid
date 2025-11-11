# Migration from v1 to v2

Zen v2.0 introduces the `.value` property API for improved performance and ergonomics. This guide will help you migrate from v1.x to v2.0.

## Breaking Changes

### 1. Property Access Instead of Functions

The biggest change is how you read and write store values.

**v1.x:**
```typescript
import { atom, get, set } from '@sylphx/zen';

const count = atom(0);

// Read
const value = get(count);

// Write
set(count, 1);
```

**v2.0:**
```typescript
import { zen } from '@sylphx/zen';

const count = zen(0);

// Read
const value = count.value;

// Write
count.value = 1;
```

### 2. Renamed Exports

| v1.x | v2.0 |
|------|------|
| `atom()` | `zen()` |
| `get()` | `.value` property |
| `set()` | `.value = ...` |
| `compute()` | `computed()` |
| `listen()` | `subscribe()` |

### 3. Computed API Changes

**v1.x:**
```typescript
import { atom, compute, get } from '@sylphx/zen';

const a = atom(1);
const b = atom(2);

const sum = compute([a, b], () => get(a) + get(b));
const value = get(sum);
```

**v2.0:**
```typescript
import { zen, computed } from '@sylphx/zen';

const a = zen(1);
const b = zen(2);

const sum = computed([a, b], (aVal, bVal) => aVal + bVal);
const value = sum.value;
```

### 4. Subscribe API Changes

**v1.x:**
```typescript
import { atom, listen, get } from '@sylphx/zen';

const count = atom(0);

const unsubscribe = listen(count, () => {
  console.log('Value:', get(count));
});
```

**v2.0:**
```typescript
import { zen, subscribe } from '@sylphx/zen';

const count = zen(0);

const unsubscribe = subscribe(count, (newValue, oldValue) => {
  console.log('Value:', newValue);
});
```

## Step-by-Step Migration

### Step 1: Update Dependencies

```bash
npm install @sylphx/zen@^2.0.0
```

### Step 2: Update Imports

Replace all imports:

```typescript
// Before
import { atom, get, set, compute, listen } from '@sylphx/zen';

// After
import { zen, computed, subscribe } from '@sylphx/zen';
```

### Step 3: Convert atom → zen

```typescript
// Before
const count = atom(0);

// After
const count = zen(0);
```

### Step 4: Convert get() → .value

```typescript
// Before
const value = get(count);

// After
const value = count.value;
```

### Step 5: Convert set() → .value =

```typescript
// Before
set(count, 1);

// After
count.value = 1;
```

### Step 6: Update Computed Values

```typescript
// Before
const doubled = compute([count], () => get(count) * 2);

// After
const doubled = computed([count], (c) => c * 2);
```

### Step 7: Update Subscriptions

```typescript
// Before
listen(count, () => {
  console.log(get(count));
});

// After
subscribe(count, (newValue) => {
  console.log(newValue);
});
```

## Migration Examples

### Counter Example

**v1.x:**
```typescript
import { atom, get, set, listen } from '@sylphx/zen';

const count = atom(0);

const unsubscribe = listen(count, () => {
  console.log('Count:', get(count));
});

set(count, get(count) + 1);
```

**v2.0:**
```typescript
import { zen, subscribe } from '@sylphx/zen';

const count = zen(0);

const unsubscribe = subscribe(count, (value) => {
  console.log('Count:', value);
});

count.value++;
```

### Todo List Example

**v1.x:**
```typescript
import { atom, get, set, compute } from '@sylphx/zen';

const todos = atom<Todo[]>([]);

const activeTodos = compute([todos], () =>
  get(todos).filter(t => !t.completed)
);

function addTodo(text: string) {
  set(todos, [...get(todos), { id: Date.now(), text, completed: false }]);
}

function toggleTodo(id: number) {
  set(todos, get(todos).map(t =>
    t.id === id ? { ...t, completed: !t.completed } : t
  ));
}
```

**v2.0:**
```typescript
import { zen, computed } from '@sylphx/zen';

const todos = zen<Todo[]>([]);

const activeTodos = computed([todos], (list) =>
  list.filter(t => !t.completed)
);

function addTodo(text: string) {
  todos.value = [...todos.value, { id: Date.now(), text, completed: false }];
}

function toggleTodo(id: number) {
  todos.value = todos.value.map(t =>
    t.id === id ? { ...t, completed: !t.completed } : t
  );
}
```

### Form Example

**v1.x:**
```typescript
import { atom, get, set, compute } from '@sylphx/zen';

const email = atom('');
const password = atom('');

const isValid = compute([email, password], () => {
  return get(email).includes('@') && get(password).length >= 8;
});

function submit() {
  if (get(isValid)) {
    api.login(get(email), get(password));
  }
}
```

**v2.0:**
```typescript
import { zen, computed } from '@sylphx/zen';

const email = zen('');
const password = zen('');

const isValid = computed([email, password], (e, p) => {
  return e.includes('@') && p.length >= 8;
});

function submit() {
  if (isValid.value) {
    api.login(email.value, password.value);
  }
}
```

## Automated Migration

### Find and Replace

Use these regex patterns for bulk replacement:

1. **Import statements:**
   - Find: `import { (.*?)atom(.*?) } from '@sylphx/zen'`
   - Replace: `import { $1zen$2 } from '@sylphx/zen'`

2. **get() calls:**
   - Find: `get\(([a-zA-Z_$][a-zA-Z0-9_$]*)\)`
   - Replace: `$1.value`

3. **set() calls:**
   - Find: `set\(([a-zA-Z_$][a-zA-Z0-9_$]*),\s*(.*?)\)`
   - Replace: `$1.value = $2`

4. **compute → computed:**
   - Find: `compute\(`
   - Replace: `computed(`

5. **listen → subscribe:**
   - Find: `listen\(`
   - Replace: `subscribe(`

## Common Issues

### Issue 1: Computed Values Still Using get()

**Problem:**
```typescript
const sum = computed([a, b], () => get(a) + get(b));
```

**Solution:**
```typescript
const sum = computed([a, b], (aVal, bVal) => aVal + bVal);
```

### Issue 2: Subscriptions Not Receiving Values

**Problem:**
```typescript
subscribe(count, () => {
  console.log(get(count)); // get is not defined
});
```

**Solution:**
```typescript
subscribe(count, (newValue) => {
  console.log(newValue);
});
```

### Issue 3: TypeScript Errors

**Problem:**
```typescript
const count = zen(0);
set(count, 1); // TypeScript error - set doesn't exist
```

**Solution:**
```typescript
const count = zen(0);
count.value = 1;
```

## Performance Benefits

After migration, you'll see performance improvements:

- **73% faster reads**: Direct property access instead of function calls
- **56% faster writes**: Native setters instead of function calls
- **Better TypeScript inference**: No need for explicit type parameters in most cases

## Testing Your Migration

1. **Update tests** to use new API
2. **Run all tests** to ensure behavior is preserved
3. **Check bundle size** - should be similar or smaller
4. **Profile performance** - should see improvements in hot paths

## Need Help?

- [GitHub Issues](https://github.com/SylphxAI/zen/issues)
- [API Reference](/api/core)
- [Examples](/examples/counter)

## Next Steps

- [Core Concepts](/guide/core-concepts) - Learn v2.0 fundamentals
- [Performance](/guide/performance) - Understand the improvements
- [API Reference](/api/core) - Complete v2.0 API docs
