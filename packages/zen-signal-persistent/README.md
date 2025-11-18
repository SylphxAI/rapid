# @sylphx/zen-persistent

Persistent storage integration for Zen state manager. Automatically syncs state with localStorage or sessionStorage, with cross-tab synchronization support.

## Installation

```bash
npm install @sylphx/zen-persistent
# or
bun add @sylphx/zen-persistent
```

## Usage

### Basic Example

```typescript
import { persistentZen } from '@sylphx/zen-persistent';

// Create a persistent zen that syncs with localStorage
const theme = persistentZen('theme', 'light');

// Changes are automatically saved to localStorage
set(theme, 'dark');

// Value persists across page reloads and browser tabs
```

### Persistent Map

```typescript
import { persistentMap } from '@sylphx/zen-persistent';

const userPreferences = persistentMap('prefs', {
  fontSize: 14,
  language: 'en',
  notifications: true,
});

// Changes sync automatically
setKey(userPreferences, 'fontSize', 16);
```

### Custom Storage

```typescript
import { persistentZen } from '@sylphx/zen-persistent';

// Use sessionStorage instead of localStorage
const sessionData = persistentZen('session', { userId: null }, {
  storage: sessionStorage,
  listen: false, // Disable cross-tab sync
});
```

### Custom Serialization

```typescript
import { persistentZen } from '@sylphx/zen-persistent';

const dateStore = persistentZen('lastVisit', new Date(), {
  serializer: {
    encode: (date) => date.toISOString(),
    decode: (str) => new Date(str),
  },
});
```

## API

### `persistentZen<Value>(key, initialValue, options?)`

Creates a persistent zen that syncs with storage.

**Parameters:**
- `key`: Unique storage key
- `initialValue`: Default value if nothing in storage
- `options`:
  - `storage`: Storage engine (default: `localStorage`)
  - `serializer`: Custom serializer (default: `JSON`)
  - `listen`: Enable cross-tab sync (default: `true`)

### `persistentMap<Value>(key, initialValue, options?)`

Creates a persistent map that syncs with storage.

Same parameters as `persistentZen`.

## Features

- ✅ Automatic persistence to localStorage/sessionStorage
- ✅ Cross-tab synchronization
- ✅ Custom serialization support
- ✅ SSR-safe (gracefully handles non-browser environments)
- ✅ TypeScript support

## License

MIT
