import { For, signal } from '@zen/zen';

export function MigrationPaths() {
  const activeTab = signal('react');

  const frameworks = [
    { id: 'react', name: 'React', icon: '⚛️' },
    { id: 'vue', name: 'Vue', icon: '💚' },
    { id: 'solid', name: 'Solid', icon: '🔷' },
    { id: 'svelte', name: 'Svelte', icon: '🧡' },
  ];

  const migrationSteps = {
    react: {
      title: '從 React 無縫遷移',
      subtitle: 'React 開發者會感覺非常熟悉',
      steps: [
        {
          step: 1,
          title: '先用 Signal (唔改現有代碼)',
          code: `// 喺現有 React 項目加入 @zen/signal
import { useZen } from '@zen/signal-react'
import { signal } from '@zen/signal'

// 創建全局 signal
const count = signal(0)

// 喺任何 React 組件使用
function Counter() {
  const value = useZen(count)
  return (
    <button onClick={() => count.value++}>
      Count: {value}
    </button>
  )
}`,
          benefit: '✅ 零重寫，立即享受 1.75KB Signal',
        },
        {
          step: 2,
          title: '漸進替換組件 (一個個來)',
          code: `// React 同 Zen 組件可以共存
<ReactApp>
  <ReactHeader />
  <ZenCounter />  {/* 新組件用 Zen */}
  <ReactFooter />
</ReactApp>

// 慢慢將複雜組件遷移到 Zen
// 享受更小 bundle 同更快性能`,
          benefit: '✅ 逐步遷移，無風險',
        },
        {
          step: 3,
          title: '完全遷移 (可選)',
          code: `// 當你準備好，全面使用 Zen
import { render, signal } from '@zen/zen'

function App() {
  const count = signal(0)

  return (
    <div>
      <h1>My App</h1>
      <button onClick={() => count.value++}>
        {count}
      </button>
    </div>
  )
}

render(() => <App />, document.getElementById('app'))`,
          benefit: '✅ Bundle 從 42KB → <5KB',
        },
      ],
    },
    vue: {
      title: '從 Vue 無縫遷移',
      subtitle: 'Vue 3 Composition API 用戶會覺得係咁熟悉',
      steps: [
        {
          step: 1,
          title: 'API 幾乎一樣',
          code: `// Vue 3 Composition API
import { ref, computed } from 'vue'
const count = ref(0)
const doubled = computed(() => count.value * 2)

// Zen Signal - 一模一樣！
import { signal, computed } from '@zen/signal'
const count = signal(0)
const doubled = computed(() => count.value * 2)`,
          benefit: '✅ 零學習成本',
        },
        {
          step: 2,
          title: '喺 Vue 入面用 Zen Signal',
          code: `// 可以喺 Vue 組件使用 Zen Signal
import { useZen } from '@zen/signal-vue'
import { signal } from '@zen/signal'

const globalState = signal({ user: null })

export default {
  setup() {
    const state = useZen(globalState)
    return { state }
  }
}`,
          benefit: '✅ 更好的全局狀態管理',
        },
        {
          step: 3,
          title: '遷移到 Zen 框架',
          code: `// Zen 的寫法同 Vue 3 好似
import { signal, computed } from '@zen/zen'

function Counter() {
  const count = signal(0)
  const doubled = computed(() => count.value * 2)

  return (
    <div>
      <p>Count: {count}</p>
      <p>Doubled: {doubled}</p>
      <button onClick={() => count.value++}>+</button>
    </div>
  )
}`,
          benefit: '✅ 34KB → <5KB',
        },
      ],
    },
    solid: {
      title: '從 Solid 遷移',
      subtitle: 'Solid 用戶會發現 Zen 更簡單',
      steps: [
        {
          step: 1,
          title: '統一的 .value API',
          code: `// Solid - 要記幾時用 ()
const [count, setCount] = createSignal(0)
const doubled = createMemo(() => count() * 2)
console.log(count())  // 讀取用 ()
setCount(1)           // 寫入用 setter

// Zen - 統一用 .value
const count = signal(0)
const doubled = computed(() => count.value * 2)
console.log(count.value)  // 讀取用 .value
count.value = 1           // 寫入用 .value`,
          benefit: '✅ 更一致的 API',
        },
        {
          step: 2,
          title: '更小的 Bundle',
          code: `// Solid: 7KB (不錯，但 Zen 更小)
// Zen: <5KB Signal + Framework

// 性能相似，但 Zen 更輕量
// 而且唔需要編譯器設置`,
          benefit: '✅ 7KB → <5KB',
        },
      ],
    },
    svelte: {
      title: '從 Svelte 遷移',
      subtitle: 'Svelte 用戶會喜歡唔需要編譯器',
      steps: [
        {
          step: 1,
          title: 'Svelte 要編譯器',
          code: `// Svelte - 需要特殊編譯器
let count = 0
$: doubled = count * 2  // 特殊語法

// Zen - 純 JavaScript/TypeScript
const count = signal(0)
const doubled = computed(() => count.value * 2)`,
          benefit: '✅ 標準 JS，任何工具都支持',
        },
        {
          step: 2,
          title: '可以喺 Svelte 用 Zen Signal',
          code: `// 用 Zen Signal 做全局狀態管理
import { toStore } from '@zen/signal-svelte'
import { signal } from '@zen/signal'

const count = signal(0)
const countStore = toStore(count)

// 喺 Svelte 組件使用
$: value = $countStore`,
          benefit: '✅ 更好的全局狀態',
        },
      ],
    },
  };

  return (
    <section class="py-16 px-0 bg-bg">
      <div class="max-w-screen-xl mx-auto px-6">
        <div class="text-center mb-12">
          <h2 class="text-4xl md:text-5xl font-bold text-text mb-4">無縫遷移</h2>
          <p class="text-xl text-text-muted max-w-2xl mx-auto">
            從任何框架遷移到 Zen，或者單獨使用 Zen Signal
          </p>
        </div>

        {/* Framework tabs */}
        <div class="flex flex-wrap gap-3 justify-center mb-8">
          <For each={frameworks}>
            {(fw) => (
              <button
                type="button"
                class={
                  activeTab.value === fw.id
                    ? 'px-6 py-3 bg-primary text-white rounded-zen font-medium transition-all shadow-zen'
                    : 'px-6 py-3 bg-bg-light hover:bg-bg-lighter text-text-muted hover:text-text border border-border rounded-zen font-medium transition-all'
                }
                onClick={() => {
                  activeTab.value = fw.id;
                }}
              >
                <span class="mr-2">{fw.icon}</span>
                {fw.name}
              </button>
            )}
          </For>
        </div>

        {/* Migration content */}
        <div class="bg-bg-light border border-border rounded-zen p-8">
          <div class="text-center mb-8">
            <h3 class="text-3xl font-bold text-text mb-2">
              {migrationSteps[activeTab.value]?.title}
            </h3>
            <p class="text-lg text-text-muted">
              {migrationSteps[activeTab.value]?.subtitle}
            </p>
          </div>

          <div class="space-y-8">
            <For each={migrationSteps[activeTab.value]?.steps}>
              {(step) => (
                <div class="bg-bg border border-border rounded-zen overflow-hidden">
                  <div class="bg-bg-lighter border-b border-border px-6 py-4">
                    <div class="flex items-start justify-between">
                      <div>
                        <div class="flex items-center gap-3 mb-2">
                          <span class="flex items-center justify-center w-8 h-8 bg-primary text-white rounded-full font-bold">
                            {step.step}
                          </span>
                          <h4 class="text-xl font-semibold text-text">{step.title}</h4>
                        </div>
                        <p class="text-success font-medium ml-11">{step.benefit}</p>
                      </div>
                    </div>
                  </div>
                  <pre class="p-6 text-sm text-text-muted font-mono overflow-x-auto">
                    {step.code}
                  </pre>
                </div>
              )}
            </For>
          </div>
        </div>

        {/* CTA */}
        <div class="mt-12 text-center">
          <a
            href="#/docs/migration"
            class="inline-block px-8 py-4 bg-primary hover:bg-primary-dark text-white font-semibold rounded-zen shadow-zen transition-all hover:scale-105"
          >
            查看完整遷移指南 →
          </a>
        </div>
      </div>
    </section>
  );
}
