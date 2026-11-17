# @sylphx/zen-craft

[![npm version](https://img.shields.io/npm/v/@sylphx/zen-craft)](https://www.npmjs.com/package/@sylphx/zen-craft)

**Craft-powered immutable state updates for Zen** - Built with [Craft](https://github.com/SylphxAI/craft), our high-performance immer replacement.

This package allows you to work with immutable state in Zen atoms using a convenient mutation-style API on draft objects, while automatically producing the next immutable state with structural sharing and optional JSON patch generation.

## Installation

```bash
# Using bun (recommended)
bun add @sylphx/zen-craft @sylphx/zen

# Using npm
npm install @sylphx/zen-craft @sylphx/zen

# Using pnpm
pnpm add @sylphx/zen-craft @sylphx/zen

# Using yarn
yarn add @sylphx/zen-craft @sylphx/zen
```

## Usage

### `craftZen()`

The main API for Zen integration. Updates a Zen atom immutably using a recipe function.

```typescript
import { craftZen } from '@sylphx/zen-craft';
import { zen, get } from '@sylphx/zen';

const myStore = zen({
  user: { name: 'Alice', age: 30 },
  tags: ['a', 'b']
});

// Basic usage - update atom with draft mutations
craftZen(myStore, (draft) => {
  draft.user.age++;
  draft.tags.push('c');
});

console.log(get(myStore));
// Output: { user: { name: 'Alice', age: 31 }, tags: ['a', 'b', 'c'] }

// Advanced: Enable patch generation for undo/redo support
const [patches, inversePatches] = craftZen(
  myStore,
  (draft) => {
    draft.user.age++;
  },
  { patches: true, inversePatches: true }
);

console.log(patches);
// Output: [{ op: 'replace', path: ['user', 'age'], value: 32 }]
```

### `produce()`

Low-level API for non-Zen use cases. Takes a base state and recipe function, returns new state with patches.

```typescript
import { produce } from '@sylphx/zen-craft';

const currentState = {
  user: { name: 'Alice', age: 30 },
  tags: ['a', 'b']
};

const [nextState, patches, inversePatches] = produce(
  currentState,
  (draft) => {
    draft.user.age++;
    draft.tags.push('c');
  },
  { patches: true, inversePatches: true }
);

console.log(nextState);
// Output: { user: { name: 'Alice', age: 31 }, tags: ['a', 'b', 'c'] }
```

### `applyPatches()`

Apply JSON patches to a base state to produce a new state.

```typescript
import { applyPatches } from '@sylphx/zen-craft';

const baseState = { user: { name: 'Alice' } };
const patches = [
  { op: 'replace', path: ['user', 'name'], value: 'Bob' },
  { op: 'add', path: ['user', 'age'], value: 40 },
];

const nextState = applyPatches(baseState, patches);

console.log(nextState);
// Output: { user: { name: 'Bob', age: 40 } }
```

### `nothing`

Use the `nothing` symbol to delete properties:

```typescript
import { craftZen, nothing } from '@sylphx/zen-craft';
import { zen } from '@sylphx/zen';

const store = zen({ name: 'Alice', age: 30 });

craftZen(store, (draft) => {
  draft.age = nothing; // Delete age property
});

// Result: { name: 'Alice' }
```

## Features

- 🚀 **1.4-35x faster than immer** - Powered by [Craft](https://github.com/SylphxAI/craft)
- 🎯 **Structural sharing** - Unchanged parts maintain references
- 📝 **JSON Patches (RFC 6902)** - Track changes for undo/redo
- 🗺️ **Map/Set support** - Full support for ES6 collections
- ⚡ **Zero dependencies** - Except Craft and Zen
- 🔒 **Type-safe** - Full TypeScript support

## Why Craft?

zen-craft is powered by **[Craft](https://github.com/SylphxAI/craft)**, our in-house high-performance immer replacement:

- **1.4-35x faster** than immer across all operations
- **2.9 KB gzipped** - 39% smaller than immer
- **100% API compatible** - Drop-in replacement
- **Built by us** - Same team, same performance obsession

[Learn more about Craft →](https://github.com/SylphxAI/craft)

## License

MIT
