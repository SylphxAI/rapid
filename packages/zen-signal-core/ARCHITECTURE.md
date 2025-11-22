# Zen Signals Architecture

## Overview

Zen Signals is a **pure runtime**, **fine-grained reactivity** system designed for multi-platform support (Web, TUI, Native). It achieves optimal performance through immediate synchronous execution and lazy evaluation patterns.

## Core Principles

### 1. Pure Runtime (No Compilation Required)

Unlike SolidJS which relies on compile-time transformations, Zen Signals works entirely at runtime:

- ✅ **No build step required** - Works with standard JSX runtime
- ✅ **Platform agnostic** - Same code runs on Web, TUI, Native
- ✅ **Simple configuration** - No complex compiler setup
- ✅ **Universal compatibility** - Works with any JSX-compatible tooling

**Why this matters:** Multi-platform support becomes trivial. The same reactivity code runs everywhere without platform-specific compilation.

### 2. Fine-Grained Reactivity

**Key characteristic:** Components render **only once**.

```typescript
function Component() {
  // ← This function runs ONLY ONCE
  const count = signal(0);

  effect(() => {
    // ← Only effects re-run on changes
    console.log(count.value);
  });

  return <div>{count.value}</div>;
  // Component function never re-runs
}
```

This is fundamentally different from React/Vue where components re-render:

| Framework | Component Behavior | Re-execution |
|-----------|-------------------|--------------|
| **Zen (Fine-grained)** | Render once, setup reactive graph | Only effects/computeds |
| React (Coarse-grained) | Re-render on state change | Entire component |
| Vue (Coarse-grained) | Re-render on reactive change | Entire component |

**Benefits:**
- 🚀 Faster - No virtual DOM diffing, no re-renders
- 💡 Predictable - Clear separation between setup and reactivity
- 🎯 Efficient - Only update exactly what changed

### 3. Immediate Synchronous Execution

All reactive updates happen **immediately and synchronously**:

```typescript
const count = signal(0);

effect(() => {
  console.log(count.value); // Runs immediately
});

count.value = 1; // Effect executes NOW (synchronous)
console.log('after'); // This runs after effect
```

**No microtasks, no scheduling, no delays.** This ensures:
- ⚡ Zero latency
- 🎯 Predictable execution order
- 💪 Easier debugging (synchronous stack traces)

### 4. Lazy Evaluation with Equality Checking

Computeds are **lazy** - they only recompute when accessed:

```typescript
const count = signal(0);
let computations = 0;

const doubled = computed(() => {
  computations++;
  return count.value * 2;
});

console.log(computations); // 0 - not computed yet (lazy)

doubled.value; // NOW it computes
console.log(computations); // 1

doubled.value; // Cached, no recomputation
console.log(computations); // Still 1

count.value = 1; // Source changed
console.log(computations); // Still 1 - not recomputed yet (lazy)

doubled.value; // NOW it recomputes
console.log(computations); // 2
```

**Equality checking** prevents unnecessary notifications:

```typescript
const items = signal([1, 2, 3]);

const count = computed(() => items.value.length);

effect(() => {
  console.log(count.value); // Subscribes to count
});

// Change array but same length
items.value = [4, 5, 6]; // Different reference, same length (3)
// Effect does NOT re-run (count value unchanged: 3 === 3)
```

## Reactivity Model

### Signals (Primitive Reactive Values)

**Behavior:** Immediate sync notifications

```typescript
const count = signal(0);

// Setting value notifies all listeners immediately
count.value = 1; // ← All listeners execute NOW
```

**Implementation:**
- Get: Returns current value, registers as dependency
- Set: Updates value (if changed), notifies listeners immediately
- Equality check: Uses `Object.is` semantics

### Computeds (Derived Reactive Values)

**Behavior:** Lazy evaluation with push notifications

```typescript
const count = signal(0);

const doubled = computed(() => count.value * 2);
```

**Execution model:**

1. **Source changes** → Mark computed dirty, notify dependents
2. **Dependent accesses** → Recompute if dirty
3. **Equality check** → Only propagate if value actually changed
4. **Cache** → Return cached value if not dirty

**Key characteristics:**
- ✅ **Lazy** - Only compute when accessed
- ✅ **Cached** - Store result, only recompute if dirty
- ✅ **Minimal notifications** - Equality check prevents unnecessary updates
- ✅ **Auto-tracking** - Automatically discover dependencies
- ✅ **Dynamic dependencies** - Re-track on each computation

### Effects (Side Effects)

**Behavior:** Immediate sync execution

```typescript
effect(() => {
  console.log(count.value); // Runs immediately
});

count.value = 1; // Effect executes NOW (synchronous)
```

**Execution model:**

1. **Initial run** - Execute immediately when created
2. **Dependency changes** - Execute immediately (sync)
3. **Auto-tracking** - Automatically subscribe to accessed signals/computeds
4. **Cleanup** - Run cleanup before next execution or disposal

**Key characteristics:**
- ⚡ **Immediate** - No microtask queue, no delays
- 🔄 **Auto-tracking** - Discovers dependencies during execution
- 🧹 **Cleanup support** - Return cleanup function
- ❌ **No scheduling** - Executes in subscription order

## Component Patterns

### Pattern: Conditional Rendering (Show)

**Rule:** Only dispose children when condition **actually changes**, not on every dependency change.

```typescript
function Show(props) {
  let currentNode = null;
  let previousCondition = false;

  effect(() => {
    const condition = resolve(props.when);
    const conditionBool = !!condition;

    // ✅ Only dispose if condition changed
    if (currentNode && previousCondition !== conditionBool) {
      dispose(currentNode);
      currentNode = null;
    }

    previousCondition = conditionBool;

    // ✅ Only create if no current node
    if (conditionBool && !currentNode) {
      currentNode = createChildren();
    }
  });
}
```

**Why this matters:**

```typescript
// BAD (old implementation)
effect(() => {
  if (currentNode) dispose(currentNode); // ❌ Always disposes
  if (condition) currentNode = create();
});
// Problem: Disposes and recreates on EVERY dependency change

// GOOD (correct pattern)
effect(() => {
  if (previousCondition !== conditionBool) { // ✅ Only when changed
    dispose(currentNode);
  }
  if (conditionBool && !currentNode) {
    currentNode = create();
  }
});
// Solution: Only dispose when condition actually changes
```

### Pattern: List Rendering (For)

**Rule:** Only recreate items that actually changed, reuse existing items.

```typescript
function For(props) {
  const items = new Map(); // Track items by key

  effect(() => {
    const array = resolve(props.each);

    // Build new items map
    const newItems = new Map();

    for (const item of array) {
      const key = getKey(item);

      // ✅ Reuse existing item if key matches
      if (items.has(key)) {
        newItems.set(key, items.get(key));
      } else {
        // ✅ Only create new item if key is new
        newItems.set(key, createItem(item));
      }
    }

    // ✅ Only dispose items that are gone
    for (const [key, item] of items) {
      if (!newItems.has(key)) {
        dispose(item);
      }
    }

    items.clear();
    for (const [key, item] of newItems) {
      items.set(key, item);
    }
  });
}
```

## Descriptor Pattern (Lazy Children)

**Problem:** Context providers need to setup context **before** children access it.

```typescript
// WITHOUT lazy children (BROKEN)
<ContextProvider value={x}>
  <Child /> {/* ❌ Created immediately, context not setup yet */}
</ContextProvider>

// Order: Child() → ContextProvider() → ERROR (no context)
```

**Solution:** Descriptor pattern makes children lazy

```typescript
// WITH descriptor pattern (WORKS)
<ContextProvider value={x}>
  <Child /> {/* ✅ Wrapped in lazy getter */}
</ContextProvider>

// JSX transform creates:
ContextProvider({
  value: x,
  get children() { return Child() } // ← Lazy getter
})

// Order:
// 1. ContextProvider() runs
// 2. ContextProvider sets up context
// 3. ContextProvider accesses props.children (triggers getter)
// 4. Child() created in context scope ✅
```

**Implementation:**

```typescript
// Helper to unwrap lazy children
function children(accessor) {
  return () => accessor();
}

// Usage in Show component
function Show(props) {
  const c = children(() => props.children); // Wrap in lazy getter

  effect(() => {
    if (condition) {
      const child = c(); // ← Evaluate when needed
      insertIntoDOM(child);
    }
  });
}
```

**Why this is necessary:**
- ✅ Ensures correct context ordering
- ✅ Prevents creating children when condition is false
- ✅ Proper reactive ownership tracking
- ✅ Pure runtime (no compiler required)

## Performance Characteristics

### Comparison with Other Frameworks

| Feature | Zen | SolidJS | Preact Signal | React |
|---------|-----|---------|---------------|-------|
| **Compilation** | ❌ Pure runtime | ✅ Compile-time | ❌ Pure runtime | ❌ Runtime |
| **Components** | Render once | Render once | Re-render | Re-render |
| **Computeds** | Lazy | Lazy | Eager | N/A |
| **Effects** | Immediate sync | Scheduled | Immediate sync | Deferred |
| **Equality Check** | ✅ | ✅ | ✅ | ✅ |
| **Virtual DOM** | ❌ | ❌ | ✅ | ✅ |
| **Multi-platform** | ✅ Easy | 🔶 Complex | 🔶 Web-focused | ✅ Possible |

### Optimization Strategies

1. **Lazy Computeds** - Don't compute unless accessed
2. **Equality Checking** - Don't notify unless value changed
3. **Auto-tracking** - Only subscribe to actually used dependencies
4. **Immediate Execution** - No scheduling overhead
5. **Component Patterns** - Only dispose when logically necessary

### Expected Performance

- **Signal set**: ~1-2 operations (equality check + notify)
- **Computed get (cached)**: ~1 operation (return value)
- **Computed get (dirty)**: ~N operations (recompute + equality check)
- **Effect execution**: Immediate, zero latency
- **Component render**: Once per component lifetime

## Design Decisions

### Why Pure Runtime?

**Goal:** Multi-platform support (TUI + Web + Native)

**Problem with compilation:**
- Different JSX transforms per platform
- Complex build configuration
- Platform-specific optimizations
- Hard to maintain

**Pure runtime benefits:**
- Same code everywhere
- Simple platform abstraction
- Easy to test
- No build complexity

### Why Immediate Sync?

**Goal:** Fastest reactivity, predictable behavior

**Alternatives considered:**

| Approach | Latency | Complexity | Chosen? |
|----------|---------|------------|---------|
| Immediate sync | 0ms | Low | ✅ YES |
| Microtask queue | ~1ms | Medium | ❌ |
| Scheduler | Variable | High | ❌ |

**Decision:** Immediate sync with smart component patterns

- Components follow pattern: only dispose when needed
- Effects execute synchronously
- Zero latency, simple mental model

### Why Lazy Computeds?

**Goal:** Minimal work, maximum efficiency

**Lazy benefits:**
- Don't compute if not used
- Better for runtime (no wasted work)
- Matches SolidJS (proven fast)

**With equality checking:**
- Prevents unnecessary notifications
- Minimal re-execution
- Optimal performance

### Why Descriptor Pattern?

**Goal:** Correct context ordering in pure runtime

**Requirement:** Parents must setup before children access

**Alternatives:**

| Approach | Pure Runtime? | Correct Ordering? | API |
|----------|---------------|-------------------|-----|
| Compiler auto-wrap | ❌ | ✅ | Clean |
| Manual `{() => ...}` | ✅ | ✅ | Ugly |
| **Descriptor pattern** | ✅ | ✅ | **Clean** |

**Decision:** Descriptor pattern via custom JSX transform

- Clean API for users
- Correct ordering guaranteed
- Pure runtime compatible

## Testing Strategy

All core characteristics are locked down with comprehensive tests:

- ✅ Immediate synchronous execution
- ✅ Components render once
- ✅ Lazy computeds with equality checking
- ✅ Minimal re-execution
- ✅ Conditional rendering patterns
- ✅ Context ordering
- ✅ Performance characteristics

See `fine-grained.test.ts` for complete test suite.

## Migration from Other Frameworks

### From SolidJS

**Similarities:**
- Fine-grained reactivity ✅
- Components render once ✅
- Lazy computeds ✅
- Auto-tracking ✅

**Differences:**
- ❌ No compilation required
- ✅ Effects execute immediately (not scheduled)
- ✅ Works on all platforms easily

### From React

**Similarities:**
- JSX syntax ✅
- Component-based ✅

**Differences:**
- ❌ Components don't re-render
- ❌ No hooks (use signals/effects directly)
- ✅ No virtual DOM (direct updates)
- ✅ Much faster

### From Vue

**Similarities:**
- Reactive primitives ✅
- Auto-tracking ✅

**Differences:**
- ❌ No template compilation
- ❌ Components don't re-render
- ✅ Simpler mental model
- ✅ Multi-platform native

## Future Considerations

### Potential Optimizations

1. **Static dependency detection** - Detect when dependencies are stable
2. **Batch API** - Optional batching for specific use cases
3. **Memo primitives** - Additional memoization helpers
4. **Scheduler API** - Optional scheduling for animations/transitions

### Maintained Constraints

These must NEVER change:

- ❌ No required compilation
- ❌ No breaking platform compatibility
- ✅ Components always render once
- ✅ Effects always execute immediately (by default)
- ✅ Pure runtime architecture
