import * as Babel from '@babel/standalone';
import * as ZenSignal from '@zen/signal';
import { Show, signal } from '@zen/zen';
import * as Zen from '@zen/zen';
import { Fragment, jsx } from '@zen/zen/jsx-runtime';

export function Playground() {
  const templates = {
    counter: `// Create reactive state
const count = signal(0);
const doubled = computed(() => count.value * 2);

// Create component
const app = (
  <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
    <h2>Counter: {count}</h2>
    <p>Doubled: {doubled}</p>
    <div style={{ display: 'flex', gap: '10px' }}>
      <button onClick={() => count.value--}>-</button>
      <button onClick={() => count.value++}>+</button>
      <button onClick={() => count.value = 0}>Reset</button>
    </div>
  </div>
);

// Render to preview
const preview = document.getElementById('preview');
if (preview) {
  preview.innerHTML = '';
  preview.appendChild(app);
}`,
    todo: `// Todo list example
const todos = signal([]);
const input = signal('');

const addTodo = () => {
  if (input.value.trim()) {
    todos.value = [...todos.value, { id: Date.now(), text: input.value, done: false }];
    input.value = '';
  }
};

const toggleTodo = (id) => {
  todos.value = todos.value.map(t =>
    t.id === id ? { ...t, done: !t.done } : t
  );
};

const app = (
  <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '500px' }}>
    <h2>Todo List</h2>
    <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
      <input
        type="text"
        value={input.value}
        onInput={(e) => input.value = e.target.value}
        placeholder="Add a todo..."
        style={{ flex: 1, padding: '8px' }}
      />
      <button onClick={addTodo}>Add</button>
    </div>
    <div>
      {todos.value.map(todo => (
        <div key={todo.id} style={{ display: 'flex', gap: '10px', marginBottom: '8px' }}>
          <input
            type="checkbox"
            checked={todo.done}
            onChange={() => toggleTodo(todo.id)}
          />
          <span style={{ textDecoration: todo.done ? 'line-through' : 'none' }}>
            {todo.text}
          </span>
        </div>
      ))}
    </div>
  </div>
);

const preview = document.getElementById('preview');
if (preview) {
  preview.innerHTML = '';
  preview.appendChild(app);
}`,
    form: `// Form with validation
const name = signal('');
const email = signal('');
const submitted = signal(false);

const isValid = computed(() =>
  name.value.length > 0 && email.value.includes('@')
);

const handleSubmit = () => {
  if (isValid.value) {
    submitted.value = true;
  }
};

const app = (
  <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '400px' }}>
    <h2>Contact Form</h2>
    <Show when={!submitted.value}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div>
          <label>Name:</label>
          <input
            type="text"
            value={name.value}
            onInput={(e) => name.value = e.target.value}
            style={{ display: 'block', width: '100%', padding: '8px', marginTop: '5px' }}
          />
        </div>
        <div>
          <label>Email:</label>
          <input
            type="email"
            value={email.value}
            onInput={(e) => email.value = e.target.value}
            style={{ display: 'block', width: '100%', padding: '8px', marginTop: '5px' }}
          />
        </div>
        <button
          onClick={handleSubmit}
          disabled={!isValid.value}
          style={{
            padding: '10px',
            opacity: isValid.value ? 1 : 0.5,
            cursor: isValid.value ? 'pointer' : 'not-allowed'
          }}
        >
          Submit
        </button>
      </div>
    </Show>
    <Show when={submitted.value}>
      <div style={{ color: 'green', padding: '20px', textAlign: 'center' }}>
        <h3>✓ Form submitted!</h3>
        <p>Name: {name.value}</p>
        <p>Email: {email.value}</p>
      </div>
    </Show>
  </div>
);

const preview = document.getElementById('preview');
if (preview) {
  preview.innerHTML = '';
  preview.appendChild(app);
}`,
    async: `// Async data fetching
const loading = signal(false);
const data = signal(null);
const error = signal(null);

const fetchData = async () => {
  loading.value = true;
  error.value = null;
  try {
    const res = await fetch('https://api.github.com/repos/zenjs/zen');
    const json = await res.json();
    data.value = json;
  } catch (e) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
};

const app = (
  <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
    <h2>GitHub Repo Info</h2>
    <button onClick={fetchData} disabled={loading.value}>
      {loading.value ? 'Loading...' : 'Fetch Data'}
    </button>

    <Show when={error.value}>
      <div style={{ color: 'red', marginTop: '20px' }}>
        Error: {error.value}
      </div>
    </Show>

    <Show when={data.value}>
      <div style={{ marginTop: '20px' }}>
        <h3>{data.value.name}</h3>
        <p>{data.value.description}</p>
        <p>⭐ Stars: {data.value.stargazers_count}</p>
        <p>🍴 Forks: {data.value.forks_count}</p>
      </div>
    </Show>
  </div>
);

const preview = document.getElementById('preview');
if (preview) {
  preview.innerHTML = '';
  preview.appendChild(app);
}`,
  };

  const code = signal(templates.counter);
  const selectedTemplate = signal('counter');
  const error = signal('');
  const executeTime = signal(0);
  const renderTime = signal(0);
  const opsPerSecond = signal(0);

  const changeTemplate = (template: string) => {
    selectedTemplate.value = template;
    code.value = templates[template] || templates.counter;
  };

  const runCode = () => {
    const startTime = performance.now();
    try {
      error.value = '';
      const previewEl = document.getElementById('preview');
      if (!previewEl) return;

      // Clear preview
      previewEl.innerHTML = '';

      // Remove import statements (Zen API is provided via context)
      const codeWithoutImports = code.value.replace(/import\s+.*?from\s+['"].*?['"];?\s*/g, '');

      // Transpile JSX to JavaScript using classic runtime
      const transformed = Babel.transform(codeWithoutImports, {
        presets: [
          [
            'react',
            {
              runtime: 'classic',
              pragma: 'jsx',
              pragmaFrag: 'Fragment',
            },
          ],
        ],
        filename: 'playground.tsx',
      });

      // Create React-style createElement wrapper for Zen's jsx
      // Babel classic runtime calls: jsx(type, props, ...children)
      // But Zen expects: jsx(type, { children: [...], ...props })
      const createElement = (type: any, props: any, ...children: any[]) => {
        const allProps = props || {};
        if (children.length > 0) {
          allProps.children = children.length === 1 ? children[0] : children;
        }
        return jsx(type, allProps);
      };

      // Create execution context with Zen API
      const zenContext = {
        ...Zen,
        ...ZenSignal,
        jsx: createElement, // Use adapted createElement
        Fragment,
        document,
        console,
      };

      // Execute transpiled code
      const execStart = performance.now();
      const fn = new Function(...Object.keys(zenContext), transformed.code);
      fn(...Object.values(zenContext));
      const execEnd = performance.now();

      executeTime.value = execEnd - execStart;
      renderTime.value = execEnd - startTime;

      // Calculate rough ops/sec (simple benchmark)
      const iterations = 1000;
      const benchStart = performance.now();
      const testSignal = signal(0);
      for (let i = 0; i < iterations; i++) {
        testSignal.value = i;
      }
      const benchEnd = performance.now();
      const timePerOp = (benchEnd - benchStart) / iterations;
      opsPerSecond.value = Math.round(1000 / timePerOp);
    } catch (e: unknown) {
      error.value = (e as Error).message || 'Unknown error';
      const previewEl = document.getElementById('preview');
      if (previewEl) {
        previewEl.innerHTML = `<div style="padding: 20px; color: #ef4444; font-family: monospace; white-space: pre-wrap;">${error.value}</div>`;
      }
    }
  };

  return (
    <div class="min-h-screen bg-bg py-8">
      <div class="max-w-screen-2xl mx-auto px-6">
        <div class="flex items-center justify-between mb-8">
          <div>
            <h1 class="text-4xl font-bold text-text mb-2">Interactive Playground</h1>
            <p class="text-text-muted">Edit code and see instant results</p>
          </div>
          <div class="flex items-center gap-4">
            {/* Performance Metrics */}
            <Show when={executeTime.value > 0}>
              <div class="flex gap-4 px-4 py-2 bg-bg-light border border-border rounded-zen">
                <div class="text-center">
                  <div class="text-sm text-text-muted">Execute</div>
                  <div class="text-lg font-bold text-success">{executeTime.value.toFixed(2)}ms</div>
                </div>
                <div class="text-center">
                  <div class="text-sm text-text-muted">Total</div>
                  <div class="text-lg font-bold text-primary">{renderTime.value.toFixed(2)}ms</div>
                </div>
                <div class="text-center">
                  <div class="text-sm text-text-muted">Ops/sec</div>
                  <div class="text-lg font-bold text-secondary">
                    {opsPerSecond.value.toLocaleString()}
                  </div>
                </div>
              </div>
            </Show>
            <button
              type="button"
              onClick={runCode}
              class="px-6 py-3 bg-primary hover:bg-primary-dark text-white font-medium rounded-zen shadow-zen transition-colors flex items-center gap-2"
            >
              <span>▶</span>
              Run Code
            </button>
          </div>
        </div>

        <Show when={error.value !== ''}>
          <div class="my-4 p-4 bg-red-900/20 border border-red-500/50 rounded-zen text-red-400 font-mono whitespace-pre-wrap">
            <strong>Error:</strong> {error}
          </div>
        </Show>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div class="flex flex-col">
            <div class="flex items-center justify-between bg-bg-lighter border border-border rounded-t-zen px-4 py-2">
              <span class="text-text font-medium">Code Editor</span>
              <select
                class="px-3 py-1 bg-bg border border-border rounded text-text text-sm focus:outline-none focus:border-primary"
                value={selectedTemplate.value}
                onChange={(e) => changeTemplate((e.target as HTMLSelectElement).value)}
              >
                <option value="counter">Counter</option>
                <option value="todo">Todo App</option>
                <option value="form">Form</option>
                <option value="async">Async Data</option>
              </select>
            </div>
            <textarea
              class="flex-1 min-h-[500px] p-4 bg-bg-lighter border border-t-0 border-border rounded-b-zen text-text font-mono text-sm resize-none focus:outline-none focus:border-primary"
              value={code.value}
              onInput={(e) => {
                code.value = (e.target as HTMLTextAreaElement).value;
              }}
              spellcheck={false}
            />
          </div>

          <div class="flex flex-col">
            <div class="flex items-center justify-between bg-bg-lighter border border-border rounded-t-zen px-4 py-2">
              <span class="text-text font-medium">Preview</span>
              <button
                type="button"
                class="px-3 py-1 bg-bg hover:bg-border border border-border text-text text-sm rounded transition-colors"
                onClick={() => {
                  document.getElementById('preview').innerHTML = '';
                }}
              >
                Clear
              </button>
            </div>
            <div
              id="preview"
              class="flex-1 min-h-[500px] p-4 bg-bg-lighter border border-t-0 border-border rounded-b-zen overflow-auto"
            />
          </div>
        </div>

        <div class="bg-bg-light border border-border rounded-zen p-6">
          <h3 class="text-xl font-semibold text-text mb-4">💡 Playground Tips</h3>
          <ul class="space-y-2 mb-4 text-text-muted">
            <li class="flex items-start gap-2">
              <span class="text-primary">•</span>
              Write JSX code using Zen's API
            </li>
            <li class="flex items-start gap-2">
              <span class="text-primary">•</span>
              Click "Run Code" to see your component
            </li>
            <li class="flex items-start gap-2">
              <span class="text-primary">•</span>
              Try modifying the example to see live updates
            </li>
            <li class="flex items-start gap-2">
              <span class="text-primary">•</span>
              All Zen features are available: signal, computed, effect, components
            </li>
          </ul>
          <p class="text-sm text-text-muted bg-bg border border-border rounded p-3">
            <strong class="text-text">Note:</strong> This playground uses Babel Standalone for
            runtime JSX transpilation. Your code runs directly in the browser with access to all Zen
            APIs.
          </p>
        </div>
      </div>
    </div>
  );
}
