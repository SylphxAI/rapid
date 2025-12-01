import { For, signal } from '@zen/web';
import { Icon } from '../components/Icon.tsx';

export function Migration() {
  const activeFramework = signal('react');

  const frameworks = [
    { id: 'react', name: 'React', icon: 'lucide:atom' },
    { id: 'vue', name: 'Vue', icon: 'lucide:triangle' },
    { id: 'solid', name: 'Solid', icon: 'lucide:box' },
    { id: 'svelte', name: 'Svelte', icon: 'lucide:flame' },
    { id: 'vanilla', name: 'Vanilla JS', icon: 'lucide:code' },
  ];

  const migrations = {
    react: {
      title: 'Migrating from React',
      description: 'React developers will find Zen familiar with a much smaller footprint',
      comparison: [
        {
          aspect: 'State Management',
          before: `const [count, setCount] = useState(0);
setCount(count + 1);`,
          after: `const count = signal(0);
count.value++;`,
        },
        {
          aspect: 'Derived State',
          before: `const doubled = useMemo(
  () => count * 2, [count]
);`,
          after: `const doubled = computed(
  () => count.value * 2
);`,
        },
        {
          aspect: 'Side Effects',
          before: `useEffect(() => {
  console.log(count);
}, [count]);`,
          after: `effect(() => {
  console.log(count.value);
});`,
        },
        {
          aspect: 'Conditional Render',
          before: `{condition && <Child />}
{condition ? <A /> : <B />}`,
          after: `<Show when={condition}>
  <Child />
</Show>`,
        },
        {
          aspect: 'List Rendering',
          before: `{items.map(item => (
  <Item key={item.id} {...item} />
))}`,
          after: `<For each={items}>
  {item => <Item {...item} />}
</For>`,
        },
      ],
      steps: [
        {
          step: 1,
          title: 'Install Zen packages',
          code: 'npm install @zen/signal @zen/web',
        },
        {
          step: 2,
          title: 'Update tsconfig.json',
          code: `{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "@zen/web"
  }
}`,
        },
        {
          step: 3,
          title: 'Migrate components gradually',
          code: `// Before (React)
function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
}

// After (Zen)
function Counter() {
  const count = signal(0);
  return <button onClick={() => count.value++}>{count}</button>;
}`,
        },
      ],
      benefits: [
        'Bundle size: 42KB to <5KB (90% smaller)',
        'No dependency array bugs',
        'Automatic dependency tracking',
        'Fine-grained updates (no re-renders)',
        '150M+ operations per second',
      ],
    },
    vue: {
      title: 'Migrating from Vue',
      description: 'Vue 3 Composition API users will feel right at home with Zen',
      comparison: [
        {
          aspect: 'Reactive State',
          before: `const count = ref(0);
count.value++;`,
          after: `const count = signal(0);
count.value++;`,
        },
        {
          aspect: 'Computed',
          before: `const doubled = computed(
  () => count.value * 2
);`,
          after: `const doubled = computed(
  () => count.value * 2
);`,
        },
        {
          aspect: 'Watch Effect',
          before: `watchEffect(() => {
  console.log(count.value);
});`,
          after: `effect(() => {
  console.log(count.value);
});`,
        },
      ],
      steps: [
        {
          step: 1,
          title: 'Install Zen packages',
          code: 'npm install @zen/signal @zen/web',
        },
        {
          step: 2,
          title: 'Migrate reactive state',
          code: `// Vue 3
import { ref, computed } from 'vue';
const count = ref(0);

// Zen (nearly identical!)
import { signal, computed } from '@zen/signal';
const count = signal(0);`,
        },
      ],
      benefits: [
        'Almost identical API - minimal learning curve',
        'Smaller bundle (34KB to <5KB)',
        'Works with any build tool',
        'No .vue file format required',
      ],
    },
    solid: {
      title: 'Migrating from Solid',
      description: 'Solid users will appreciate the unified .value API',
      comparison: [
        {
          aspect: 'Signals',
          before: `const [count, setCount] = createSignal(0);
count(); // read
setCount(1); // write`,
          after: `const count = signal(0);
count.value; // read
count.value = 1; // write`,
        },
        {
          aspect: 'Computed',
          before: `const doubled = createMemo(
  () => count() * 2
);`,
          after: `const doubled = computed(
  () => count.value * 2
);`,
        },
      ],
      steps: [
        {
          step: 1,
          title: 'Replace signal syntax',
          code: `// Solid
const [count, setCount] = createSignal(0);
setCount(prev => prev + 1);

// Zen
const count = signal(0);
count.value++;`,
        },
      ],
      benefits: [
        'Consistent .value API (no getter function confusion)',
        'Slightly smaller bundle (7KB to <5KB)',
        'Same fine-grained reactivity model',
      ],
    },
    svelte: {
      title: 'Migrating from Svelte',
      description: 'Use standard JavaScript instead of compiler magic',
      comparison: [
        {
          aspect: 'Reactive State',
          before: `let count = 0;
$: doubled = count * 2;`,
          after: `const count = signal(0);
const doubled = computed(() => count.value * 2);`,
        },
      ],
      steps: [
        {
          step: 1,
          title: 'Replace reactive declarations',
          code: `// Svelte (requires compiler)
<script>
  let count = 0;
  $: doubled = count * 2;
</script>

// Zen (standard JavaScript)
const count = signal(0);
const doubled = computed(() => count.value * 2);`,
        },
      ],
      benefits: [
        'No special compiler required',
        'Standard JavaScript/TypeScript',
        'Works in any environment',
        'Better IDE support',
      ],
    },
    vanilla: {
      title: 'Adding Zen to Vanilla JS',
      description: 'Supercharge vanilla JavaScript with reactive primitives',
      comparison: [
        {
          aspect: 'State + DOM',
          before: `let count = 0;
const el = document.getElementById('count');
function update() {
  el.textContent = count;
}
button.onclick = () => { count++; update(); };`,
          after: `const count = signal(0);
effect(() => {
  el.textContent = count.value;
});
button.onclick = () => count.value++;`,
        },
      ],
      steps: [
        {
          step: 1,
          title: 'Install @zen/signal',
          code: 'npm install @zen/signal',
        },
        {
          step: 2,
          title: 'Add reactivity',
          code: `import { signal, effect } from '@zen/signal';

const count = signal(0);

effect(() => {
  document.getElementById('count').textContent = count.value;
});

document.getElementById('btn').onclick = () => count.value++;`,
        },
      ],
      benefits: [
        'Add reactivity without a framework',
        'Only 1.75KB',
        'Works with any DOM manipulation',
        'Gradual adoption',
      ],
    },
  };

  const currentMigration = () => migrations[activeFramework.value as keyof typeof migrations];

  return (
    <div class="min-h-screen bg-bg">
      {/* Hero */}
      <section class="py-16 px-6 bg-gradient-hero border-b border-border">
        <div class="max-w-4xl mx-auto text-center">
          <span class="badge badge-primary mb-4">Switch to Zen</span>
          <h1 class="heading-1 text-text mb-4">Migration Guide</h1>
          <p class="text-xl text-text-muted max-w-2xl mx-auto">
            Migrate to Zen from your current framework with confidence. Our API is designed to feel
            familiar while delivering superior performance.
          </p>
        </div>
      </section>

      <div class="max-w-6xl mx-auto px-6 py-12">
        {/* Framework selector */}
        <div class="flex flex-wrap gap-2 justify-center mb-12">
          <For each={frameworks}>
            {(fw) => (
              <button
                type="button"
                class={activeFramework.value === fw.id ? 'btn btn-primary' : 'btn btn-secondary'}
                onClick={() => {
                  activeFramework.value = fw.id;
                }}
              >
                <Icon icon={fw.icon} width="20" height="20" />
                {fw.name}
              </button>
            )}
          </For>
        </div>

        {/* Migration content */}
        <div class="space-y-8">
          {/* Title */}
          <div class="card text-center">
            <h2 class="heading-2 text-text mb-2">{currentMigration().title}</h2>
            <p class="text-lg text-text-muted">{currentMigration().description}</p>
          </div>

          {/* Comparison table */}
          <div class="card p-0 overflow-hidden">
            <div class="bg-bg-lighter border-b border-border px-6 py-4">
              <h3 class="heading-3 text-text">Side-by-Side Comparison</h3>
            </div>
            <div class="divide-y divide-border">
              <For each={currentMigration().comparison}>
                {(item) => (
                  <div class="grid grid-cols-1 md:grid-cols-3">
                    <div class="p-4 bg-bg-lighter border-b md:border-b-0 md:border-r border-border flex items-center">
                      <span class="font-medium text-text">{item.aspect}</span>
                    </div>
                    <div class="p-4 border-b md:border-b-0 md:border-r border-border">
                      <div class="text-xs text-text-subtle uppercase tracking-wide mb-2">
                        Before
                      </div>
                      <pre class="text-sm text-text-muted font-mono whitespace-pre-wrap">
                        {item.before}
                      </pre>
                    </div>
                    <div class="p-4 bg-success/5">
                      <div class="text-xs text-success uppercase tracking-wide font-medium mb-2">
                        After (Zen)
                      </div>
                      <pre class="text-sm text-text font-mono whitespace-pre-wrap">
                        {item.after}
                      </pre>
                    </div>
                  </div>
                )}
              </For>
            </div>
          </div>

          {/* Migration steps */}
          <div class="card p-0 overflow-hidden">
            <div class="bg-bg-lighter border-b border-border px-6 py-4">
              <h3 class="heading-3 text-text">Migration Steps</h3>
            </div>
            <div class="p-6 space-y-6">
              <For each={currentMigration().steps}>
                {(step) => (
                  <div class="flex gap-4">
                    <div class="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-primary text-white rounded-full font-bold">
                      {step.step}
                    </div>
                    <div class="flex-1 min-w-0">
                      <h4 class="font-semibold text-text mb-3">{step.title}</h4>
                      <pre class="code-block overflow-x-auto">{step.code}</pre>
                    </div>
                  </div>
                )}
              </For>
            </div>
          </div>

          {/* Benefits */}
          <div class="card p-0 overflow-hidden">
            <div class="bg-bg-lighter border-b border-border px-6 py-4">
              <h3 class="heading-3 text-text">Benefits</h3>
            </div>
            <div class="p-6">
              <ul class="space-y-3">
                <For each={currentMigration().benefits}>
                  {(benefit) => (
                    <li class="flex items-start gap-3">
                      <div class="w-6 h-6 flex items-center justify-center bg-success/10 text-success rounded-full flex-shrink-0">
                        <Icon icon="lucide:check" width="14" height="14" />
                      </div>
                      <span class="text-text-muted">{benefit}</span>
                    </li>
                  )}
                </For>
              </ul>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div class="mt-12 card text-center">
          <h3 class="heading-3 text-text mb-3">Ready to get started?</h3>
          <p class="text-text-muted mb-6 max-w-xl mx-auto">
            Check out our documentation for detailed guides and API references.
          </p>
          <div class="flex gap-4 justify-center flex-wrap">
            <a href="/docs" class="btn btn-primary text-lg px-8 py-4">
              <Icon icon="lucide:book-open" width="20" height="20" />
              Read the Docs
            </a>
            <a href="/playground" class="btn btn-secondary text-lg px-8 py-4">
              <Icon icon="lucide:terminal" width="20" height="20" />
              Try in Playground
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
