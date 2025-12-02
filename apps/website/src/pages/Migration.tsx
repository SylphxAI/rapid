import { For, signal } from '@zen/web';
import { Icon } from '../components/Icon.tsx';

export function Migration() {
  const activeFramework = signal('react');

  const frameworks = [
    { id: 'react', name: 'React' },
    { id: 'vue', name: 'Vue' },
    { id: 'solid', name: 'Solid' },
    { id: 'svelte', name: 'Svelte' },
  ];

  const migrations: Record<string, {
    title: string;
    tagline: string;
    comparison: Array<{ label: string; before: string; after: string }>;
    benefits: string[];
  }> = {
    react: {
      title: 'React → Zen',
      tagline: 'Same mental model, 90% smaller bundle',
      comparison: [
        {
          label: 'State',
          before: 'const [count, setCount] = useState(0)',
          after: 'const count = signal(0)',
        },
        {
          label: 'Update',
          before: 'setCount(prev => prev + 1)',
          after: 'count.value++',
        },
        {
          label: 'Derived',
          before: 'useMemo(() => count * 2, [count])',
          after: 'computed(() => count.value * 2)',
        },
        {
          label: 'Effect',
          before: 'useEffect(() => {...}, [count])',
          after: 'effect(() => {...})',
        },
      ],
      benefits: [
        '42KB → 1.75KB (96% smaller)',
        'No dependency arrays',
        'No stale closures',
        'Fine-grained updates',
      ],
    },
    vue: {
      title: 'Vue → Zen',
      tagline: 'Nearly identical API, even smaller',
      comparison: [
        {
          label: 'State',
          before: 'const count = ref(0)',
          after: 'const count = signal(0)',
        },
        {
          label: 'Update',
          before: 'count.value++',
          after: 'count.value++',
        },
        {
          label: 'Computed',
          before: 'computed(() => count.value * 2)',
          after: 'computed(() => count.value * 2)',
        },
        {
          label: 'Watch',
          before: 'watchEffect(() => {...})',
          after: 'effect(() => {...})',
        },
      ],
      benefits: [
        '34KB → 1.75KB (95% smaller)',
        'Same .value API',
        'No .vue files required',
        'Works anywhere',
      ],
    },
    solid: {
      title: 'Solid → Zen',
      tagline: 'Unified .value API',
      comparison: [
        {
          label: 'State',
          before: 'const [count, setCount] = createSignal(0)',
          after: 'const count = signal(0)',
        },
        {
          label: 'Read',
          before: 'count()',
          after: 'count.value',
        },
        {
          label: 'Write',
          before: 'setCount(1)',
          after: 'count.value = 1',
        },
        {
          label: 'Memo',
          before: 'createMemo(() => count() * 2)',
          after: 'computed(() => count.value * 2)',
        },
      ],
      benefits: [
        '7KB → 1.75KB (75% smaller)',
        'No getter/setter split',
        'Consistent .value access',
        'Same reactivity model',
      ],
    },
    svelte: {
      title: 'Svelte → Zen',
      tagline: 'No compiler magic needed',
      comparison: [
        {
          label: 'State',
          before: 'let count = 0',
          after: 'const count = signal(0)',
        },
        {
          label: 'Reactive',
          before: '$: doubled = count * 2',
          after: 'computed(() => count.value * 2)',
        },
        {
          label: 'Update',
          before: 'count++',
          after: 'count.value++',
        },
        {
          label: 'Effect',
          before: '$: console.log(count)',
          after: 'effect(() => console.log(count.value))',
        },
      ],
      benefits: [
        'No special compiler',
        'Standard JavaScript',
        'Better IDE support',
        'Portable code',
      ],
    },
  };

  const current = () => migrations[activeFramework.value];

  return (
    <div class="min-h-screen bg-[#fafafa]">
      {/* Hero */}
      <div class="bg-white border-b border-gray-200">
        <div class="max-w-5xl mx-auto px-6 py-16 text-center">
          <h1 class="text-4xl font-bold text-gray-900 mb-3">Migration Guide</h1>
          <p class="text-lg text-gray-500 max-w-2xl mx-auto">
            Switch to Zen from your current framework. Same patterns, better performance.
          </p>
        </div>
      </div>

      <div class="max-w-5xl mx-auto px-6 py-12">
        {/* Framework Tabs */}
        <div class="flex justify-center mb-12">
          <div class="inline-flex bg-white border border-gray-200 rounded-lg p-1 shadow-sm">
            <For each={frameworks}>
              {(fw) => (
                <button
                  type="button"
                  class={
                    activeFramework.value === fw.id
                      ? 'px-6 py-2 text-sm font-medium rounded-md bg-gray-900 text-white transition-all'
                      : 'px-6 py-2 text-sm font-medium rounded-md text-gray-600 hover:text-gray-900 transition-all'
                  }
                  onClick={() => {
                    activeFramework.value = fw.id;
                  }}
                >
                  {fw.name}
                </button>
              )}
            </For>
          </div>
        </div>

        {/* Title Card */}
        <div class="text-center mb-12">
          <h2 class="text-3xl font-bold text-gray-900 mb-2">{current().title}</h2>
          <p class="text-gray-500">{current().tagline}</p>
        </div>

        {/* Comparison Grid */}
        <div class="bg-white border border-gray-200 rounded-xl overflow-hidden mb-8">
          <div class="grid grid-cols-3 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            <div class="px-6 py-3">Concept</div>
            <div class="px-6 py-3">Before</div>
            <div class="px-6 py-3 text-emerald-600">Zen</div>
          </div>
          <For each={current().comparison}>
            {(item, index) => (
              <div class={`grid grid-cols-3 ${index() < current().comparison.length - 1 ? 'border-b border-gray-100' : ''}`}>
                <div class="px-6 py-4 font-medium text-gray-900 bg-gray-50/50">{item.label}</div>
                <div class="px-6 py-4">
                  <code class="text-sm text-gray-600 font-mono">{item.before}</code>
                </div>
                <div class="px-6 py-4 bg-emerald-50/30">
                  <code class="text-sm text-emerald-700 font-mono">{item.after}</code>
                </div>
              </div>
            )}
          </For>
        </div>

        {/* Benefits */}
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
          <For each={current().benefits}>
            {(benefit) => (
              <div class="bg-white border border-gray-200 rounded-lg p-4 text-center">
                <Icon icon="lucide:check" width="20" height="20" class="text-emerald-500 mx-auto mb-2" />
                <p class="text-sm text-gray-700">{benefit}</p>
              </div>
            )}
          </For>
        </div>

        {/* Quick Start */}
        <div class="bg-gray-900 rounded-xl p-8 text-white">
          <h3 class="text-lg font-semibold mb-4">Quick Start</h3>
          <div class="space-y-4">
            <div>
              <p class="text-sm text-gray-400 mb-2">1. Install</p>
              <code class="block bg-black/30 rounded-lg px-4 py-3 text-sm font-mono text-emerald-400">
                npm install @zen/signal @zen/web
              </code>
            </div>
            <div>
              <p class="text-sm text-gray-400 mb-2">2. Configure JSX (tsconfig.json)</p>
              <code class="block bg-black/30 rounded-lg px-4 py-3 text-sm font-mono text-gray-300">
                {`"jsxImportSource": "@zen/web"`}
              </code>
            </div>
            <div>
              <p class="text-sm text-gray-400 mb-2">3. Start coding</p>
              <pre class="bg-black/30 rounded-lg px-4 py-3 text-sm font-mono text-gray-300 overflow-x-auto">
{`import { signal } from '@zen/signal';

const count = signal(0);
count.value++; // That's it!`}
              </pre>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div class="mt-12 text-center">
          <p class="text-gray-500 mb-6">Ready to try it out?</p>
          <div class="flex justify-center gap-4">
            <a
              href="/playground"
              class="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition-colors"
            >
              <Icon icon="lucide:play" width="18" height="18" />
              Try Playground
            </a>
            <a
              href="/docs"
              class="inline-flex items-center gap-2 px-6 py-3 bg-white text-gray-700 font-medium rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <Icon icon="lucide:book-open" width="18" height="18" />
              Read Docs
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
