# Todo List Example

A complete todo list with filtering and persistence.

## Data Model

```typescript
interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

type Filter = 'all' | 'active' | 'completed';
```

## Stores

```typescript
import { zen, computed } from '@sylphx/zen';

// State
const todos = zen<Todo[]>([]);
const filter = zen<Filter>('all');

// Computed
const filteredTodos = computed([todos, filter], (list, f) => {
  if (f === 'active') return list.filter(t => !t.completed);
  if (f === 'completed') return list.filter(t => t.completed);
  return list;
});

const activeCount = computed(
  [todos],
  (list) => list.filter(t => !t.completed).length
);

const completedCount = computed(
  [todos],
  (list) => list.filter(t => t.completed).length
);
```

## Actions

```typescript
function addTodo(text: string) {
  todos.value = [
    ...todos.value,
    { id: Date.now(), text, completed: false }
  ];
}

function toggleTodo(id: number) {
  todos.value = todos.value.map(todo =>
    todo.id === id ? { ...todo, completed: !todo.completed } : todo
  );
}

function deleteTodo(id: number) {
  todos.value = todos.value.filter(t => t.id !== id);
}

function clearCompleted() {
  todos.value = todos.value.filter(t => !t.completed);
}
```

## React Component

```tsx
import { useStore } from '@sylphx/zen-react';
import { useState } from 'react';

export function TodoApp() {
  const [input, setInput] = useState('');
  const list = useStore(filteredTodos);
  const currentFilter = useStore(filter);
  const active = useStore(activeCount);
  const completed = useStore(completedCount);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      addTodo(input);
      setInput('');
    }
  };

  return (
    <div>
      <h1>Todos</h1>

      <form onSubmit={handleSubmit}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="What needs to be done?"
        />
        <button type="submit">Add</button>
      </form>

      <div>
        <button
          onClick={() => filter.value = 'all'}
          disabled={currentFilter === 'all'}
        >
          All ({list.length})
        </button>
        <button
          onClick={() => filter.value = 'active'}
          disabled={currentFilter === 'active'}
        >
          Active ({active})
        </button>
        <button
          onClick={() => filter.value = 'completed'}
          disabled={currentFilter === 'completed'}
        >
          Completed ({completed})
        </button>
      </div>

      <ul>
        {list.map(todo => (
          <li key={todo.id}>
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => toggleTodo(todo.id)}
            />
            <span style={{
              textDecoration: todo.completed ? 'line-through' : 'none'
            }}>
              {todo.text}
            </span>
            <button onClick={() => deleteTodo(todo.id)}>Delete</button>
          </li>
        ))}
      </ul>

      {completed > 0 && (
        <button onClick={clearCompleted}>
          Clear completed ({completed})
        </button>
      )}
    </div>
  );
}
```

## With Persistence

```typescript
import { subscribe } from '@sylphx/zen';

// Load from localStorage
const savedTodos = localStorage.getItem('todos');
if (savedTodos) {
  todos.value = JSON.parse(savedTodos);
}

// Save to localStorage
subscribe(todos, (value) => {
  localStorage.setItem('todos', JSON.stringify(value));
});
```

## Next Steps

- [Form Example](/examples/form)
- [Data Fetching Example](/examples/fetching)
- [Persistence Guide](/ecosystem/persistent)
