# @sylphx/zen-craft

[![npm version](https://img.shields.io/npm/v/@sylphx/zen-craft)](https://www.npmjs.com/package/@sylphx/zen-craft)

**Immutable state updates for Zen with draft-style mutations** - Built with [Craft](https://github.com/sylphxltd/craft), our ultra-fast structural sharing library.

Write mutable-style code on draft objects, automatically get immutable updates with structural sharing and optional JSON Patch generation.

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

### `craft()` - Update Zen Stores

Update Zen stores with draft-style mutations.

```typescript
import { craft } from '@sylphx/zen-craft';
import { zen, get } from '@sylphx/zen';

const $store = zen({
  user: { name: 'Alice', age: 30 },
  tags: ['a', 'b']
});

// Basic usage - mutate draft, get immutable update
craft($store, (draft) => {
  draft.user.age++;
  draft.tags.push('c');
});

console.log(get($store));
// Output: { user: { name: 'Alice', age: 31 }, tags: ['a', 'b', 'c'] }

// Advanced: Enable patch generation for undo/redo
const [patches, inversePatches] = craft(
  $store,
  (draft) => {
    draft.user.age++;
  },
  { patches: true, inversePatches: true }
);

console.log(patches);
// Output: [{ op: 'replace', path: ['user', 'age'], value: 32 }]
```

### `nothing`

Use the `nothing` symbol to delete properties:

```typescript
import { craft, nothing } from '@sylphx/zen-craft';
import { zen } from '@sylphx/zen';

const $store = zen({ name: 'Alice', age: 30 });

craft($store, (draft) => {
  draft.age = nothing; // Delete age property
});

// Result: { name: 'Alice' }
```

## Features

- 🚀 **Ultra-fast** - Powered by [Craft](https://github.com/sylphxltd/craft) structural sharing engine
- 🎯 **Structural sharing** - Unchanged parts maintain references
- 📝 **JSON Patches (RFC 6902)** - Track changes for undo/redo
- 🗺️ **Map/Set support** - Full support for ES6 collections
- ⚡ **Minimal** - Just Craft + Zen, no bloat
- 🔒 **Type-safe** - Full TypeScript support
- 🎨 **Zen philosophy** - Simple, focused, performant

## Powered by Craft

zen-craft uses **[Craft](https://github.com/sylphxltd/craft)**, our structural sharing library:

- **Ultra-fast** - Optimized for performance
- **2.9 KB gzipped** - Tiny footprint
- **Structural sharing** - Efficient immutable updates
- **Built in-house** - Same performance-first philosophy

[Learn more about Craft →](https://github.com/sylphxltd/craft)

## License

MIT
