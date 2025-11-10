# Data Fetching Example

Complete data fetching with loading states and error handling.

## Basic Fetching

```typescript
import { zen } from '@sylphx/zen';

interface User {
  id: number;
  name: string;
  email: string;
}

const users = zen<User[]>([]);
const loading = zen(false);
const error = zen<Error | null>(null);

async function fetchUsers() {
  loading.value = true;
  error.value = null;

  try {
    const response = await fetch('/api/users');
    if (!response.ok) throw new Error('Failed to fetch');
    const data = await response.json();
    users.value = data;
  } catch (err) {
    error.value = err as Error;
  } finally {
    loading.value = false;
  }
}
```

## React Component

```tsx
import { useStore } from '@sylphx/zen-react';
import { useEffect } from 'react';

export function UserList() {
  const userList = useStore(users);
  const isLoading = useStore(loading);
  const fetchError = useStore(error);

  useEffect(() => {
    fetchUsers();
  }, []);

  if (isLoading) return <div>Loading...</div>;
  if (fetchError) return <div>Error: {fetchError.message}</div>;

  return (
    <ul>
      {userList.map(user => (
        <li key={user.id}>
          {user.name} ({user.email})
        </li>
      ))}
    </ul>
  );
}
```

## With Pagination

```typescript
const items = zen<Item[]>([]);
const page = zen(0);
const hasMore = zen(true);
const loading = zen(false);

async function loadMore() {
  if (loading.value || !hasMore.value) return;

  loading.value = true;

  try {
    const response = await fetch(`/api/items?page=${page.value}&limit=20`);
    const data = await response.json();

    items.value = [...items.value, ...data.items];
    hasMore.value = data.hasMore;
    page.value++;
  } finally {
    loading.value = false;
  }
}
```

## With Debounced Search

```typescript
const searchTerm = zen('');
const searchResults = zen<Result[]>([]);
const searching = zen(false);

let debounceTimer: NodeJS.Timeout;

subscribe(searchTerm, (term) => {
  clearTimeout(debounceTimer);

  if (!term) {
    searchResults.value = [];
    return;
  }

  debounceTimer = setTimeout(async () => {
    searching.value = true;
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(term)}`);
      searchResults.value = await response.json();
    } finally {
      searching.value = false;
    }
  }, 300);
});
```

## With Caching

```typescript
const cache = new Map<string, any>();

async function fetchWithCache(url: string) {
  if (cache.has(url)) {
    return cache.get(url);
  }

  const response = await fetch(url);
  const data = await response.json();
  cache.set(url, data);
  return data;
}

async function loadUser(id: number) {
  loading.value = true;
  try {
    const data = await fetchWithCache(`/api/users/${id}`);
    users.value = data;
  } finally {
    loading.value = false;
  }
}
```

## Next Steps

- [Async Operations Guide](/guide/async)
- [Todo List Example](/examples/todo)
- [Form Example](/examples/form)
