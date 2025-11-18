import { For, signal } from '@zen/zen';

export function EcosystemIntegrations() {
  const activeCategory = signal('css');

  const categories = [
    { id: 'css', name: 'CSS 框架', icon: '🎨' },
    { id: 'icons', name: '圖標庫', icon: '🎭' },
    { id: 'ui', name: 'UI 組件', icon: '🧩' },
    { id: 'tools', name: '開發工具', icon: '🛠️' },
  ];

  const integrations = {
    css: [
      {
        name: 'Tailwind CSS',
        logo: '🌊',
        description: '最流行的 Utility-first CSS 框架',
        setup: `// tailwind.config.js
export default {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {}
  }
}

// 直接使用
function Button() {
  return (
    <button class="px-4 py-2 bg-blue-500 text-white rounded">
      Click me
    </button>
  )
}`,
        features: ['開箱即用', '完整支持', 'JIT 模式', '自定義主題'],
      },
      {
        name: 'Panda CSS',
        logo: '🐼',
        description: '零運行時的 CSS-in-JS',
        setup: `// panda.config.ts
import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  include: ['./src/**/*.{js,jsx,ts,tsx}'],
  outdir: 'styled-system'
})

// 使用
import { css } from '../styled-system/css'

function Button() {
  return (
    <button class={css({
      px: 4,
      py: 2,
      bg: 'blue.500',
      color: 'white',
      rounded: 'md'
    })}>
      Click me
    </button>
  )
}`,
        features: ['零運行時', '類型安全', '完美整合', '設計令牌'],
      },
      {
        name: 'UnoCSS',
        logo: '⚡',
        description: '即時按需的原子化 CSS 引擎',
        setup: `// uno.config.ts
import { defineConfig } from 'unocss'

export default defineConfig({
  // 預設配置
})

// 直接使用
function Card() {
  return (
    <div class="p-4 bg-white rounded-lg shadow-md">
      Card content
    </div>
  )
}`,
        features: ['極快速度', '靈活配置', '預設豐富', '插件生態'],
      },
    ],
    icons: [
      {
        name: 'Iconify',
        logo: '🎯',
        description: '200,000+ 圖標，統一訪問',
        setup: `// 安裝
npm install @iconify/react

// 使用
import { Icon } from '@iconify/react'

function Header() {
  return (
    <div>
      <Icon icon="mdi:home" />
      <Icon icon="heroicons:user" />
      <Icon icon="ph:heart-fill" />
    </div>
  )
}`,
        features: ['20萬+ 圖標', '按需加載', 'SVG 優化', '離線支持'],
      },
      {
        name: 'Lucide',
        logo: '🌟',
        description: '美觀的 SVG 圖標庫',
        setup: `// 安裝
npm install lucide

// 使用
import { Home, User, Heart } from 'lucide'

function Nav() {
  return (
    <nav>
      <Home size={24} />
      <User size={24} />
      <Heart size={24} />
    </nav>
  )
}`,
        features: ['設計精美', '體積小巧', '易於定制', 'Tree-shakable'],
      },
      {
        name: 'Phosphor Icons',
        logo: '💎',
        description: '靈活的圖標家族',
        setup: `// 安裝
npm install phosphor-icons

// 使用
import { House, User, Heart } from 'phosphor-icons'

function Icons() {
  return (
    <div>
      <House weight="fill" />
      <User weight="duotone" />
      <Heart weight="bold" />
    </div>
  )
}`,
        features: ['多種風格', '6種粗細', '完整集合', 'React 友好'],
      },
    ],
    ui: [
      {
        name: '自建組件庫',
        logo: '🎨',
        description: '基於 Zen 構建自己的 UI 組件',
        setup: `// Button.tsx
import { signal } from '@zen/zen'

export function Button({ variant = 'primary', children, onClick }) {
  const variants = {
    primary: 'bg-blue-500 hover:bg-blue-600',
    secondary: 'bg-gray-500 hover:bg-gray-600',
    danger: 'bg-red-500 hover:bg-red-600'
  }

  return (
    <button
      class={\`px-4 py-2 rounded text-white \${variants[variant]}\`}
      onClick={onClick}
    >
      {children}
    </button>
  )
}`,
        features: ['完全控制', '輕量靈活', '無依賴', '易於維護'],
      },
      {
        name: 'Headless UI',
        logo: '🎭',
        description: '無樣式的可訪問 UI 組件',
        setup: `// 可以整合 Headless UI 概念
import { signal, Show } from '@zen/zen'

export function Dropdown({ items }) {
  const isOpen = signal(false)

  return (
    <div class="relative">
      <button onClick={() => isOpen.value = !isOpen.value}>
        Menu
      </button>
      <Show when={isOpen.value}>
        <div class="absolute mt-2 bg-white shadow-lg">
          {items.map(item => (
            <a href={item.href}>{item.label}</a>
          ))}
        </div>
      </Show>
    </div>
  )
}`,
        features: ['可訪問性', '鍵盤導航', '自定義樣式', '完整控制'],
      },
    ],
    tools: [
      {
        name: 'Vite',
        logo: '⚡',
        description: '極速開發服務器',
        setup: `// vite.config.ts
import { defineConfig } from 'vite'

export default defineConfig({
  esbuild: {
    jsx: 'automatic',
    jsxImportSource: '@zen/zen'
  }
})`,
        features: ['即時 HMR', '極快構建', '原生 ESM', '插件豐富'],
      },
      {
        name: 'Biome',
        logo: '🌿',
        description: '一體化工具鏈',
        setup: `// biome.json
{
  "formatter": {
    "enabled": true
  },
  "linter": {
    "enabled": true
  }
}

// 單一命令格式化和檢查
biome check --apply .`,
        features: ['格式化', '代碼檢查', '極快速度', '零配置'],
      },
      {
        name: 'TypeScript',
        logo: '💙',
        description: '完整類型支持',
        setup: `// tsconfig.json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "@zen/zen",
    "strict": true,
    "types": ["@zen/zen"]
  }
}

// 完整類型推斷
const count = signal(0)  // Signal<number>
const doubled = computed(() => count.value * 2)  // Computed<number>`,
        features: ['類型安全', '智能提示', '重構工具', '錯誤檢查'],
      },
    ],
  };

  return (
    <section class="py-16 px-0 bg-bg">
      <div class="max-w-screen-xl mx-auto px-6">
        <div class="text-center mb-12">
          <h2 class="text-4xl md:text-5xl font-bold text-text mb-4">生態系統整合</h2>
          <p class="text-xl text-text-muted max-w-3xl mx-auto">
            與主流工具完美配合，開箱即用
          </p>
        </div>

        {/* Category tabs */}
        <div class="flex flex-wrap gap-3 justify-center mb-8">
          <For each={categories}>
            {(cat) => (
              <button
                type="button"
                class={
                  activeCategory.value === cat.id
                    ? 'px-6 py-3 bg-primary text-white rounded-zen font-medium transition-all shadow-zen'
                    : 'px-6 py-3 bg-bg-light hover:bg-bg-lighter text-text-muted hover:text-text border border-border rounded-zen font-medium transition-all'
                }
                onClick={() => {
                  activeCategory.value = cat.id;
                }}
              >
                <span class="mr-2">{cat.icon}</span>
                {cat.name}
              </button>
            )}
          </For>
        </div>

        {/* Integrations grid */}
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <For each={integrations[activeCategory.value]}>
            {(integration) => (
              <div class="bg-bg-light border border-border rounded-zen overflow-hidden hover:border-primary/50 transition-colors">
                <div class="bg-bg-lighter border-b border-border px-6 py-4">
                  <div class="flex items-center gap-3 mb-2">
                    <span class="text-4xl">{integration.logo}</span>
                    <div>
                      <h3 class="text-xl font-bold text-text">{integration.name}</h3>
                      <p class="text-sm text-text-muted">{integration.description}</p>
                    </div>
                  </div>
                  <div class="flex flex-wrap gap-2 mt-3">
                    <For each={integration.features}>
                      {(feature) => (
                        <span class="px-2 py-1 bg-bg border border-border rounded text-xs text-text-muted">
                          ✓ {feature}
                        </span>
                      )}
                    </For>
                  </div>
                </div>
                <div class="p-6">
                  <pre class="text-sm text-text-muted font-mono overflow-x-auto bg-bg border border-border rounded-zen p-4">
                    {integration.setup}
                  </pre>
                </div>
              </div>
            )}
          </For>
        </div>

        {/* Bottom message */}
        <div class="mt-12 text-center bg-bg-light border border-border rounded-zen p-8">
          <p class="text-lg text-text mb-2">
            <span class="font-semibold text-primary">完全兼容現有生態系統</span>
          </p>
          <p class="text-text-muted">
            唔需要特殊配置，任何 JavaScript/TypeScript 工具都可以用
          </p>
        </div>
      </div>
    </section>
  );
}
