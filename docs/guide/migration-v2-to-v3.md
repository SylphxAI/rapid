# Migration from v2 to v3

Zen v3 introduces **auto-tracking reactivity** with massive improvements:

- 🎉 **80% smaller bundle** - 1.14 KB vs 5.76 KB gzipped
- ⚡ **8x faster** in real-world scenarios
- 🪄 **Auto-tracking** - Dependencies tracked automatically
- 🧹 **Cleaner API** - Less boilerplate, more magic

## Breaking Changes

### 1. Computed API: Auto-tracking by Default

The biggest change is that `computed()` now auto-tracks dependencies instead of requiring a dependency array.

**v2:**
```typescript
const firstName = zen('John');
const lastName = zen('Doe');

// Must specify dependencies explicitly
const fullName = computed([firstName, lastName], (first, last) => {
  return `${first} ${last}`;
});
```

**v3:**
```typescript
const firstName = zen('John');
const lastName = zen('Doe');

// Dependencies tracked automatically!
const fullName = computed(() => {
  return `${firstName.value} ${lastName.value}`;
});
```

The function now receives **no parameters** - instead, you directly access `.value` on your signals, and Zen automatically tracks which ones you use.

### 2. Optional: Explicit Dependencies Mode

For performance-critical code, you can still specify dependencies explicitly:

```typescript
const sum = computed(() => a.value + b.value, [a, b]);
//                                            ^^^^^^ optional
```

This is slightly faster but more verbose. **Auto-tracking is recommended for 90% of cases.**

## Migration Steps

### Step 1: Update Computed Calls

The most common migration is updating `computed()` calls.

**Before (v2):**
```typescript
const a = zen(1);
const b = zen(2);

const sum = computed([a, b], (av, bv) => av + bv);
```

**After (v3):**
```typescript
const a = zen(1);
const b = zen(2);

const sum = computed(() => a.value + b.value);
```

### Step 2: Update Complex Computed

For computed values with multiple dependencies:

**Before (v2):**
```typescript
const price = zen(100);
const quantity = zen(2);
const taxRate = zen(0.1);

const subtotal = computed([price, quantity], (p, q) => p * q);
const tax = computed([subtotal, taxRate], (sub, rate) => sub * rate);
const total = computed([subtotal, tax], (sub, t) => sub + t);
```

**After (v3):**
```typescript
const price = zen(100);
const quantity = zen(2);
const taxRate = zen(0.1);

const subtotal = computed(() => price.value * quantity.value);
const tax = computed(() => subtotal.value * taxRate.value);
const total = computed(() => subtotal.value + tax.value);
```

Much cleaner! No need to track dependencies manually.

## New Features

### Auto-tracking with Conditional Logic

v3's auto-tracking really shines with conditional dependencies:

```typescript
const mode = zen<'light' | 'dark'>('light');
const lightBg = zen('#ffffff');
const darkBg = zen('#000000');

// Only subscribes to the active branch!
const background = computed(() =>
  mode.value === 'light' ? lightBg.value : darkBg.value
);

// Changing darkBg doesn't trigger updates when mode is 'light'
darkBg.value = '#111111'; // No update!

// Switch mode - now subscribes to darkBg
mode.value = 'dark';
```

This is **2.12x faster** than manually listing all possible dependencies!

### computedAsync: Built-in Async Support

New `computedAsync()` for handling async operations:

```typescript
const userId = zen(1);

const user = computedAsync(async () => {
  // Dependencies tracked BEFORE first await
  const id = userId.value;

  const res = await fetch(`/api/users/${id}`);
  return res.json();
});

// Access state
console.log(user.value.loading);  // true/false
console.log(user.value.data);     // undefined | User
console.log(user.value.error);    // undefined | Error

// Auto-reloads when userId changes
userId.value = 2;
```

**Features:**
- ✨ Auto-tracks dependencies before first `await`
- ⏳ Built-in loading/error states
- 🔄 Automatic request cancellation
- 📦 Preserves old data during reload

## Complete Example

### Todo App Migration

**Before (v2):**
```typescript
import { zen, computed, subscribe } from '@sylphx/zen';

const todos = zen<Todo[]>([]);
const filter = zen<'all' | 'active' | 'completed'>('all');

const filteredTodos = computed([todos, filter], (list, f) => {
  if (f === 'active') return list.filter(t => !t.completed);
  if (f === 'completed') return list.filter(t => t.completed);
  return list;
});

const activeCount = computed([todos], (list) =>
  list.filter(t => !t.completed).length
);

subscribe(filteredTodos, (todos) => {
  renderTodos(todos);
});
```

**After (v3):**
```typescript
import { zen, computed, subscribe } from '@sylphx/zen';

const todos = zen<Todo[]>([]);
const filter = zen<'all' | 'active' | 'completed'>('all');

// Auto-tracks both todos and filter
const filteredTodos = computed(() => {
  const list = todos.value;
  const f = filter.value;

  if (f === 'active') return list.filter(t => !t.completed);
  if (f === 'completed') return list.filter(t => t.completed);
  return list;
});

// Only tracks todos (filter not accessed)
const activeCount = computed(() =>
  todos.value.filter(t => !t.completed).length
);

subscribe(filteredTodos, (todos) => {
  renderTodos(todos);
});
```

## Performance Benefits

After migrating to v3:

- **8x faster** in real-world counter apps
- **2.12x faster** for conditional dependencies
- **1.33x faster** for simple computed values
- **80% smaller** bundle size

## Common Patterns

### Pattern 1: Form Validation

**v3 approach:**
```typescript
const email = zen('');
const password = zen('');
const confirmPassword = zen('');

const emailValid = computed(() =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)
);

const passwordValid = computed(() =>
  password.value.length >= 8
);

const passwordsMatch = computed(() =>
  password.value === confirmPassword.value
);

const formValid = computed(() =>
  emailValid.value &&
  passwordValid.value &&
  passwordsMatch.value
);
```

### Pattern 2: Async Data Fetching

```typescript
const query = zen('');
const debouncedQuery = zen('');

// Debounce
let timeout: any;
subscribe(query, (q) => {
  clearTimeout(timeout);
  timeout = setTimeout(() => {
    debouncedQuery.value = q;
  }, 300);
});

// Auto-fetch when query changes
const results = computedAsync(async () => {
  const q = debouncedQuery.value;
  if (!q) return [];

  const res = await fetch(`/api/search?q=${q}`);
  return res.json();
});

// Render
subscribe(results, ({ loading, data, error }) => {
  if (loading) showSpinner();
  if (error) showError(error);
  if (data) renderResults(data);
});
```

## Troubleshooting

### Issue: "Dependencies not tracked"

**Problem:**
```typescript
const sum = computed(() => {
  const a = mySignal.value;
  // ... lots of code
  return someFunction(a);  // a used here but tracking might be lost
});
```

**Solution:** Access `.value` directly in the computed function, not in nested function calls. Dependencies are only tracked during the synchronous execution of the computed function.

### Issue: "Too many re-computations"

**Problem:** Computed recalculates on every change.

**Solution:** Use explicit dependencies for performance-critical code:

```typescript
// If auto-tracking causes performance issues
const sum = computed(() => a.value + b.value, [a, b]);
```

## Summary

**Main Changes:**
- ✅ `computed([deps], fn)` → `computed(() => fn())`
- ✅ Auto-tracking handles dependencies
- ✅ New `computedAsync()` for async operations
- ✅ 80% smaller, 8x faster

**Benefits:**
- Less boilerplate
- Better performance with conditional logic
- Built-in async support
- Cleaner, more intuitive API

## See Also

- [Core Concepts](/guide/core-concepts)
- [Computed Values](/guide/computed)
- [Async Operations](/guide/async)
- [v1 → v2 Migration](/guide/migration-v1-to-v2)
