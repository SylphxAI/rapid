---
layout: home

hero:
  name: Zen
  text: Tiny, fast, and elegant
  tagline: Reactive state management for modern web apps
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: View on GitHub
      link: https://github.com/sylphxltd/zen
  image:
    src: /logo.svg
    alt: Zen

features:
  - icon: 🪶
    title: Ultra Lightweight
    details: Only 5.7KB gzipped. Every byte counts in modern web development.
  - icon: ⚡
    title: Blazing Fast
    details: Native getters/setters for zero-overhead reactivity. 73% faster reads, 56% faster writes.
  - icon: 🎯
    title: Simple API
    details: Intuitive .value property access. No magic, just simple JavaScript.
  - icon: 🔧
    title: Type Safe
    details: Written in TypeScript with excellent type inference out of the box.
  - icon: 🌳
    title: Tree Shakeable
    details: Import only what you need. Dead code elimination at its best.
  - icon: 🎨
    title: Framework Agnostic
    details: Works with React, Vue, Svelte, Solid, Preact and vanilla JS.
---

## Quick Start

Install Zen in your project:

::: code-group

```bash [npm]
npm install @sylphx/zen
```

```bash [pnpm]
pnpm add @sylphx/zen
```

```bash [yarn]
yarn add @sylphx/zen
```

```bash [bun]
bun add @sylphx/zen
```

:::

## Simple Example

```typescript
import { zen, computed } from '@sylphx/zen';

// Create reactive state
const count = zen(0);

// Create computed value
const double = computed([count], (c) => c * 2);

// Read values
console.log(count.value); // 0
console.log(double.value); // 0

// Update value
count.value++;

console.log(count.value); // 1
console.log(double.value); // 2
```

## Framework Integration

Zen works seamlessly with all major frameworks:

::: code-group

```tsx [React]
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

```vue [Vue]
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

```svelte [Svelte]
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

:::

## Why Zen?

<div class="why-zen">

### **Simple**
No need to learn complex APIs. Just use `.value` to read and write.

### **Fast**
Native getters/setters mean zero overhead. Benchmarks show 73% faster reads than alternatives.

### **Tiny**
At 5.7KB gzipped, Zen is one of the smallest state management libraries available.

### **Complete**
Router, persistence, and immutable updates included. Everything you need, nothing you don't.

</div>

## Benchmarks

| Library | Bundle Size | Read Speed | Write Speed |
|---------|-------------|-----------|------------|
| **Zen v2.0** | **5.7 KB** | **26.3M ops/s** | **13.4M ops/s** |
| Zen v1.0 | 6.0 KB | 15.2M ops/s | 8.6M ops/s |
| Nanostores | 3.2 KB | 18.5M ops/s | 10.2M ops/s |
| Zustand | 3.5 KB | 14.8M ops/s | 9.1M ops/s |
| Jotai | 3.0 KB | 16.2M ops/s | 8.9M ops/s |

<style>
.why-zen {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  margin: 2rem 0;
}

.why-zen > div {
  padding: 1.5rem;
  border-radius: 8px;
  background: var(--vp-c-bg-soft);
}

.why-zen h3 {
  margin-top: 0;
  color: var(--vp-c-brand);
}
</style>
