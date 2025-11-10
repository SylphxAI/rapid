# What is Zen?

Zen is a minimalist reactive state management library for JavaScript applications. It's designed to be:

- **Tiny** - Core library is only ~5.7KB gzipped
- **Fast** - Uses native getters/setters for zero-overhead reactivity
- **Simple** - Intuitive API with `.value` property access
- **Type-safe** - Full TypeScript support with excellent type inference
- **Framework-agnostic** - Works with React, Vue, Svelte, Solid, Preact, and vanilla JS

## Design Philosophy

Zen follows these core principles:

### 1. Simplicity First

State management shouldn't require learning complex APIs or patterns. Zen uses a simple `.value` property for all operations:

```typescript
const count = zen(0);

// Read
console.log(count.value);

// Write
count.value = 1;
```

### 2. Performance Matters

Zen v2.0 uses native JavaScript getters/setters instead of proxy objects or function calls. This results in:

- **73% faster** reads compared to v1
- **56% faster** writes compared to v1
- Zero closure overhead
- Minimal memory footprint

### 3. Small Bundle Sizes

Every byte counts in modern web development. Zen keeps its footprint minimal:

- Core: 5.7KB gzipped
- React integration: +0.3KB
- Router: 3.2KB
- Persistence: 2.8KB

### 4. Framework Agnostic

Zen works everywhere:

```typescript
// Vanilla JS
const count = zen(0);
count.value++;

// React
const value = useStore(count);

// Vue
const value = useStore(count);

// Svelte
const store = fromZen(count);
```

## Comparison with Alternatives

| Feature | Zen | Nanostores | Zustand | Jotai |
|---------|-----|------------|---------|-------|
| Bundle Size | 5.7KB | 3.2KB | 3.5KB | 3.0KB |
| TypeScript | ✅ | ✅ | ✅ | ✅ |
| Computed Values | ✅ | ✅ | ❌ | ✅ |
| Async Support | ✅ | ❌ | ❌ | ✅ |
| Batching | ✅ | ❌ | ❌ | ✅ |
| Router | ✅ | ❌ | ❌ | ❌ |
| Persistence | ✅ | ❌ | ✅ | ❌ |
| React DevTools | 🔜 | ❌ | ✅ | ✅ |

## When to Use Zen

Zen is a great choice when you need:

- **Lightweight state management** for small to medium apps
- **Framework-agnostic** solution that works everywhere
- **High performance** with minimal overhead
- **Type-safe** state with excellent TypeScript support
- **Built-in router** and persistence without extra libraries

## When NOT to Use Zen

Consider alternatives if you need:

- Built-in Redux DevTools support (coming soon)
- Time-travel debugging
- Large-scale enterprise apps with complex state requirements
- Deep React integration with suspense and transitions

## Next Steps

- [Getting Started](/guide/getting-started) - Install and use Zen
- [Core Concepts](/guide/core-concepts) - Learn fundamental concepts
- [API Reference](/api/core) - Detailed API documentation
