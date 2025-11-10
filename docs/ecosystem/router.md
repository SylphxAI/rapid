# Zen Router

`@sylphx/zen-router` provides a lightweight, reactive router built on Zen stores.

## Installation

::: code-group

```bash [npm]
npm install @sylphx/zen-router
```

```bash [pnpm]
pnpm add @sylphx/zen-router
```

```bash [yarn]
yarn add @sylphx/zen-router
```

```bash [bun]
bun add @sylphx/zen-router
```

:::

## Features

- **Reactive routing** - Built on Zen stores
- **Type-safe** - Full TypeScript support
- **Lightweight** - Only 3.2KB gzipped
- **Framework agnostic** - Works with any framework

## Basic Usage

```typescript
import { createRouter } from '@sylphx/zen-router';

const router = createRouter({
  routes: {
    home: '/',
    about: '/about',
    user: '/user/:id',
    post: '/post/:id/:slug?'
  }
});

// Navigate
router.push('user', { id: '123' });

// Get current route
console.log(router.current.value);
// { name: 'user', params: { id: '123' }, path: '/user/123' }
```

## React Integration

```tsx
import { useStore } from '@sylphx/zen-react';

function App() {
  const route = useStore(router.current);

  return (
    <div>
      <nav>
        <a onClick={() => router.push('home')}>Home</a>
        <a onClick={() => router.push('about')}>About</a>
      </nav>

      {route.name === 'home' && <HomePage />}
      {route.name === 'about' && <AboutPage />}
      {route.name === 'user' && <UserPage userId={route.params.id} />}
    </div>
  );
}
```

## Query Parameters

```typescript
// Navigate with query params
router.push('search', {}, { q: 'zen', sort: 'date' });

// Access query params
const query = router.query.value; // { q: 'zen', sort: 'date' }
```

## Links

```tsx
function Link({ to, params, children }) {
  return (
    <a
      href={router.path(to, params)}
      onClick={(e) => {
        e.preventDefault();
        router.push(to, params);
      }}
    >
      {children}
    </a>
  );
}
```

## Bundle Size

- Core: 3.2KB gzipped
- Zero dependencies (except @sylphx/zen)

## Next Steps

- [Persistence](/ecosystem/persistent)
- [Craft](/ecosystem/craft)
