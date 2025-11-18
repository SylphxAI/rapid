import { For } from '@zen/zen';

export function StandalonePackages() {
  const packages = [
    {
      name: '@zen/signal',
      size: '1.75 KB',
      description: '極致輕量的響應式原語',
      features: [
        '喺任何框架使用 (React, Vue, Svelte, Solid)',
        'Vanilla JS 項目都可以用',
        '150M+ 操作/秒',
        '自動依賴追蹤',
        '零依賴',
      ],
      integrations: [
        { name: 'React', pkg: '@zen/signal-react', icon: '⚛️' },
        { name: 'Vue', pkg: '@zen/signal-vue', icon: '💚' },
        { name: 'Svelte', pkg: '@zen/signal-svelte', icon: '🧡' },
        { name: 'Solid', pkg: '@zen/signal-solid', icon: '🔷' },
        { name: 'Preact', pkg: '@zen/signal-preact', icon: '⚡' },
      ],
      example: `// Vanilla JS
import { signal, computed, effect } from '@zen/signal'

const count = signal(0)
const doubled = computed(() => count.value * 2)

effect(() => {
  console.log('Count:', count.value)
})

count.value++ // Logs: "Count: 1"`,
    },
    {
      name: '@zen/router',
      size: '<3 KB',
      description: '輕量的路由解決方案',
      features: [
        '框架無關，可用於任何項目',
        '支持動態路由參數',
        'Hash 或 History 模式',
        'TypeScript 類型安全',
        '簡單易用',
      ],
      integrations: [
        { name: 'Zen', pkg: '@zen/zen', icon: '⚡' },
        { name: 'React', pkg: 'react-router', icon: '⚛️' },
        { name: 'Vue', pkg: 'vue-router', icon: '💚' },
        { name: 'Vanilla', pkg: '@zen/router', icon: '📦' },
      ],
      example: `// 可用於任何項目
import { createRouter } from '@zen/router'

const router = createRouter({
  '/': () => renderHome(),
  '/about': () => renderAbout(),
  '/users/:id': ({ params }) => renderUser(params.id),
  '*': () => render404()
})

router.navigate('/users/123')`,
    },
    {
      name: '@zen/signal-patterns',
      size: '<2 KB',
      description: '常用狀態管理模式',
      features: [
        'Store (類似 Redux/Zustand)',
        'Async Signal (處理異步狀態)',
        'Computed Map (批量計算)',
        'Signal Array/Map (集合響應式)',
        '即用模式庫',
      ],
      integrations: [],
      example: `// 創建 Store
import { createStore } from '@zen/signal-patterns'

const useStore = createStore({
  count: 0,
  user: null,

  increment() {
    this.count++
  },

  async login(credentials) {
    const user = await api.login(credentials)
    this.user = user
  }
})

// 任何地方使用
const store = useStore()
store.increment()`,
    },
    {
      name: '@zen/signal-persistent',
      size: '<1 KB',
      description: '持久化 Signal',
      features: [
        '自動同步到 localStorage',
        '支持 sessionStorage',
        '可自定義存儲後端',
        '類型安全的序列化',
        '跨 Tab 同步',
      ],
      integrations: [],
      example: `// 自動持久化
import { persistentSignal } from '@zen/signal-persistent'

const theme = persistentSignal('theme', 'dark')
const settings = persistentSignal('settings', {
  language: 'zh-HK',
  notifications: true
})

// 自動保存到 localStorage
theme.value = 'light'
settings.value.language = 'en'`,
    },
  ];

  return (
    <section class="py-16 px-0 bg-bg-light">
      <div class="max-w-screen-xl mx-auto px-6">
        <div class="text-center mb-12">
          <h2 class="text-4xl md:text-5xl font-bold text-text mb-4">獨立套件</h2>
          <p class="text-xl text-text-muted max-w-3xl mx-auto">
            唔一定要用成個框架，可以單獨使用任何套件
            <br />
            <span class="text-primary font-medium">
              喺 React/Vue/Svelte/Solid 或者任何項目都可以用
            </span>
          </p>
        </div>

        <div class="space-y-12">
          <For each={packages}>
            {(pkg) => (
              <div class="bg-bg border border-border rounded-zen overflow-hidden">
                {/* Package header */}
                <div class="bg-bg-lighter border-b border-border px-8 py-6">
                  <div class="flex items-start justify-between mb-4">
                    <div>
                      <h3 class="text-2xl font-bold text-primary mb-2">{pkg.name}</h3>
                      <p class="text-lg text-text-muted">{pkg.description}</p>
                    </div>
                    <div class="px-4 py-2 bg-success/20 text-success rounded-zen font-bold text-lg">
                      {pkg.size}
                    </div>
                  </div>

                  {/* Framework integrations */}
                  {pkg.integrations.length > 0 && (
                    <div class="flex flex-wrap gap-2">
                      <span class="text-sm text-text-muted mr-2">可用於:</span>
                      <For each={pkg.integrations}>
                        {(integration) => (
                          <span class="px-3 py-1 bg-bg border border-border rounded-full text-sm text-text">
                            <span class="mr-1">{integration.icon}</span>
                            {integration.name}
                          </span>
                        )}
                      </For>
                    </div>
                  )}
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-2 gap-0">
                  {/* Features */}
                  <div class="p-8 border-b lg:border-b-0 lg:border-r border-border">
                    <h4 class="text-lg font-semibold text-text mb-4">特點</h4>
                    <ul class="space-y-3">
                      <For each={pkg.features}>
                        {(feature) => (
                          <li class="flex items-start gap-2 text-text-muted">
                            <span class="text-success mt-1">✓</span>
                            <span>{feature}</span>
                          </li>
                        )}
                      </For>
                    </ul>

                    <div class="mt-6">
                      <code class="px-3 py-1 bg-bg-lighter border border-border rounded text-sm text-primary font-mono">
                        npm install {pkg.name}
                      </code>
                    </div>
                  </div>

                  {/* Example */}
                  <div class="p-8 bg-bg-lighter">
                    <h4 class="text-lg font-semibold text-text mb-4">使用示例</h4>
                    <pre class="text-sm text-text-muted font-mono overflow-x-auto">
                      {pkg.example}
                    </pre>
                  </div>
                </div>
              </div>
            )}
          </For>
        </div>

        {/* CTA */}
        <div class="mt-12 text-center">
          <p class="text-lg text-text-muted mb-6">
            所有套件都可以獨立使用，唔需要遷移整個項目
          </p>
          <a
            href="#/docs/packages"
            class="inline-block px-8 py-4 bg-primary hover:bg-primary-dark text-white font-semibold rounded-zen shadow-zen transition-all hover:scale-105"
          >
            查看完整套件文檔 →
          </a>
        </div>
      </div>
    </section>
  );
}
