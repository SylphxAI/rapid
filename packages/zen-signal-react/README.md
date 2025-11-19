# @zen/signal-react

React integration for Zen Signals with auto-unwrap and lifecycle management.

## Installation

```bash
npm install @zen/signal-react
```

## Usage

### 1. Configure Plugin

```ts
// vite.config.ts
import { zenSignal } from '@zen/signal-react/vite';

export default {
  plugins: [zenSignal()]
};
```

### 2. Use Signals

```tsx
import { signal } from '@zen/signal-react';

function Counter() {
  const count = signal(0);

  return (
    <div>
      <p>{count}</p>  {/* Auto-unwrap! No .value needed */}
      <button onClick={() => count.value++}>Increment</button>
    </div>
  );
}
```

## Features

- ✅ Auto-unwrap signals in JSX (`{signal}` instead of `{signal.value}`)
- ✅ Automatic lifecycle cleanup
- ✅ Works with all bundlers (Vite, Webpack, Rollup, esbuild)
- ✅ TypeScript support

## API

Re-exports all primitives from `@zen/signal`:

```ts
import { signal, computed, effect, batch } from '@zen/signal-react';
```

## License

MIT
