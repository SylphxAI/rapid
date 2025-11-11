# Zen

<div align="center">

**Tiny, fast, and elegant reactive state management**

[![npm version](https://img.shields.io/npm/v/@sylphx/zen.svg)](https://www.npmjs.com/package/@sylphx/zen)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/@sylphx/zen)](https://bundlephobia.com/package/@sylphx/zen)
[![License](https://img.shields.io/npm/l/@sylphx/zen.svg)](https://github.com/SylphxAI/zen/blob/main/LICENSE)

</div>

## Features

- 🪶 **Tiny** - Core is ~5.7KB gzipped
- ⚡ **Fast** - Zero-overhead reactive updates with native getters/setters
- 🎯 **Simple** - Intuitive `.value` API, no magic
- 🔧 **Type-safe** - Full TypeScript support
- 🌳 **Tree-shakeable** - Import only what you need
- 🎨 **Framework-agnostic** - Works with React, Vue, Svelte, Solid, Preact
- 📦 **Battery-included** - Router, persistence, immutable updates

## Installation

```bash
npm install @sylphx/zen
```

## Quick Start

```typescript
import { zen, computed } from '@sylphx/zen';

// Create reactive state
const count = zen(0);

// Read value
console.log(count.value); // 0

// Update value
count.value = 1;

// Computed values
const double = computed([count], (c) => c * 2);
console.log(double.value); // 2
```

## Core Packages

| Package | Description | Size |
|---------|-------------|------|
| [@sylphx/zen](./packages/zen) | Core reactive state management | 5.7KB |
| [@sylphx/zen-react](./packages/zen-react) | React integration | +0.3KB |
| [@sylphx/zen-preact](./packages/zen-preact) | Preact integration | +0.2KB |
| [@sylphx/zen-solid](./packages/zen-solid) | Solid.js integration | +0.2KB |
| [@sylphx/zen-svelte](./packages/zen-svelte) | Svelte integration | +0.1KB |
| [@sylphx/zen-vue](./packages/zen-vue) | Vue integration | +0.2KB |

## Ecosystem

| Package | Description | Size |
|---------|-------------|------|
| [@sylphx/zen-router](./packages/zen-router) | Lightweight router | 3.2KB |
| [@sylphx/zen-persistent](./packages/zen-persistent) | localStorage/sessionStorage sync | 2.8KB |
| [@sylphx/zen-craft](./packages/zen-craft) | Immutable updates with Craft | 5.8KB |

## Framework Examples

### React

```tsx
import { zen } from '@sylphx/zen';
import { useStore } from '@sylphx/zen-react';

const count = zen(0);

function Counter() {
  const value = useStore(count);
  return (
    <button onClick={() => count.value++}>
      Count: {value}
    </button>
  );
}
```

### Vue

```vue
<script setup>
import { zen } from '@sylphx/zen';
import { useStore } from '@sylphx/zen-vue';

const count = zen(0);
const value = useStore(count);
</script>

<template>
  <button @click="count.value++">
    Count: {{ value }}
  </button>
</template>
```

### Svelte

```svelte
<script>
import { zen } from '@sylphx/zen';
import { fromZen } from '@sylphx/zen-svelte';

const count = zen(0);
const store = fromZen(count);
</script>

<button on:click={() => count.value++}>
  Count: {$store}
</button>
```

## Why Zen?

### Simple API

No need to learn complex APIs. Just use `.value`:

```typescript
const state = zen({ count: 0, name: 'John' });

// Read
console.log(state.value.count);

// Write
state.value = { count: 1, name: 'Jane' };
```

### High Performance

Zen v2.0 uses native getters/setters for zero-overhead reactivity:

- **73% faster** reads compared to v1
- **56% faster** writes compared to v1
- No proxy overhead
- No virtual DOM diffing needed

### Tiny Bundle Size

Every byte counts:

```
@sylphx/zen:           5.7KB  (core)
@sylphx/zen-react:     +0.3KB (React hooks)
@sylphx/zen-router:    3.2KB  (complete router)
@sylphx/zen-persistent: 2.8KB  (localStorage sync)
```

Compare to alternatives:
- Redux + React-Redux: ~20KB
- MobX: ~16KB
- Zustand: ~3.5KB (but less features)
- Jotai: ~3KB (but less features)

## Documentation

- [Core API](./packages/zen/README.md)
- [React Integration](./packages/zen-react/README.md)
- [Router](./packages/zen-router/README.md)
- [Persistence](./packages/zen-persistent/README.md)

## Migration from v1

Zen v2.0 introduces a simpler `.value` API:

```typescript
// v1.x (deprecated)
import { zen, get, set } from '@sylphx/zen';
const count = zen(0);
const value = get(count);
set(count, 1);

// v2.0 (current)
import { zen } from '@sylphx/zen';
const count = zen(0);
const value = count.value;
count.value = 1;
```

## License

MIT © [SylphX](https://github.com/SylphxAI)

## Contributing

Contributions are welcome! Please read our [contributing guidelines](./CONTRIBUTING.md) first.
