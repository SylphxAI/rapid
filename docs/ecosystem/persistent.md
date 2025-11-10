# Zen Persistent

`@sylphx/zen-persistent` provides automatic persistence for Zen stores using localStorage, sessionStorage, or custom storage.

## Installation

::: code-group

```bash [npm]
npm install @sylphx/zen-persistent
```

```bash [pnpm]
pnpm add @sylphx/zen-persistent
```

```bash [yarn]
yarn add @sylphx/zen-persistent
```

```bash [bun]
bun add @sylphx/zen-persistent
```

:::

## Features

- **Automatic sync** - Save and restore automatically
- **Type-safe** - Full TypeScript support
- **Flexible storage** - localStorage, sessionStorage, or custom
- **Lightweight** - Only 2.8KB gzipped

## Basic Usage

```typescript
import { zen } from '@sylphx/zen';
import { persist } from '@sylphx/zen-persistent';

const count = zen(0);

// Persist to localStorage
persist(count, { key: 'count' });

// Value automatically restored on page load
// Changes automatically saved to localStorage
```

## Storage Options

### localStorage (default)

```typescript
persist(store, {
  key: 'my-store',
  storage: localStorage // default
});
```

### sessionStorage

```typescript
persist(store, {
  key: 'my-store',
  storage: sessionStorage
});
```

### Custom Storage

```typescript
const customStorage = {
  getItem: (key: string) => {
    // Your custom load logic
  },
  setItem: (key: string, value: string) => {
    // Your custom save logic
  },
  removeItem: (key: string) => {
    // Your custom remove logic
  }
};

persist(store, {
  key: 'my-store',
  storage: customStorage
});
```

## Serialization

By default, JSON serialization is used. You can provide custom serializers:

```typescript
persist(store, {
  key: 'my-store',
  serialize: (value) => {
    // Custom serialization
    return JSON.stringify(value);
  },
  deserialize: (str) => {
    // Custom deserialization
    return JSON.parse(str);
  }
});
```

## Versioning

Handle schema migrations:

```typescript
persist(store, {
  key: 'my-store',
  version: 2,
  migrate: (oldValue, oldVersion) => {
    if (oldVersion < 2) {
      // Migrate from v1 to v2
      return transformData(oldValue);
    }
    return oldValue;
  }
});
```

## React Example

```tsx
import { zen } from '@sylphx/zen';
import { persist } from '@sylphx/zen-persistent';
import { useStore } from '@sylphx/zen-react';

const preferences = zen({
  theme: 'light',
  fontSize: 14,
  language: 'en'
});

persist(preferences, { key: 'user-preferences' });

function SettingsPanel() {
  const prefs = useStore(preferences);

  return (
    <div>
      <select
        value={prefs.theme}
        onChange={(e) => preferences.value = { ...prefs, theme: e.target.value }}
      >
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
    </div>
  );
}
```

## Bundle Size

- Core: 2.8KB gzipped
- Zero dependencies (except @sylphx/zen)

## Next Steps

- [Router](/ecosystem/router)
- [Craft](/ecosystem/craft)
