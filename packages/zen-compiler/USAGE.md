# 點樣用 @sylphx/zen-compiler

**自動優化你嘅 Zen code，+68% 提速！**

---

## 📦 安裝

```bash
npm install --save-dev @sylphx/zen-compiler
```

或者用 bun:

```bash
bun add -D @sylphx/zen-compiler
```

**注意：** 呢個係 dev dependency，唔會加到 production bundle！

---

## ⚙️ 配置

### Babel 配置

Create `babel.config.js` (如果未有):

```javascript
module.exports = {
  plugins: [
    ['@sylphx/zen-compiler', {
      staticAnalysis: true,   // 啟用依賴分析
      inlineComputed: true,   // 啟用自動 inline（推薦！）
      warnings: true          // 顯示優化結果
    }]
  ]
};
```

### Vite 配置

```javascript
// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [
          ['@sylphx/zen-compiler', {
            staticAnalysis: true,
            inlineComputed: true,
            warnings: true
          }]
        ]
      }
    })
  ]
});
```

### Next.js 配置

```javascript
// next.config.js
module.exports = {
  compiler: {
    // Next.js 用 SWC，未必支援 Babel plugins
    // 需要用 @babel/preset-react
  },

  // 或者用 webpack 配置:
  webpack: (config) => {
    config.module.rules.push({
      test: /\.(js|jsx|ts|tsx)$/,
      use: {
        loader: 'babel-loader',
        options: {
          plugins: [
            ['@sylphx/zen-compiler', {
              staticAnalysis: true,
              inlineComputed: true,
              warnings: true
            }]
          ]
        }
      }
    });
    return config;
  }
};
```

### TypeScript + Babel

```javascript
// babel.config.js
module.exports = {
  presets: [
    '@babel/preset-typescript',
    '@babel/preset-react'
  ],
  plugins: [
    ['@sylphx/zen-compiler', {
      staticAnalysis: true,
      inlineComputed: true,
      warnings: true
    }]
  ]
};
```

---

## 🎯 點樣用

### 1. 寫正常嘅 Zen code

```typescript
// src/store.ts
import { zen, computed } from '@sylphx/zen';

export const count = zen(0);
export const doubled = computed(() => count.value * 2);  // 會 export，唔會 inline
const quad = computed(() => doubled.value * 2);          // 會自動 inline！
```

### 2. Build

```bash
npm run build
```

或者

```bash
bun run build
```

### 3. 睇 output

Build 時會見到：

```
[zen-compiler] ===== Analysis Results =====
Signals: 1
Computed: 2

Dependency Graph:
  doubled → [count]
  quad → [doubled]

Execution Order:
  0. count (signal)
  1. doubled (computed)
  2. quad (computed)
==========================================

[zen-compiler] === Inlining Analysis ===
Total computed: 2
Can inline: 1
Multiple uses: 0
Unused: 0

Inlining candidates:
  - quad (used 1 time)

✅ Automatically inlined 1 computed expression(s)
```

### 4. 結果

**你寫嘅 code:**
```typescript
const count = zen(0);
const doubled = computed(() => count.value * 2);
const quad = computed(() => doubled.value * 2);
```

**Compiler 輸出:**
```typescript
const count = zen(0);
const doubled = computed(() => count.value * 2);  // 保留（因為 export）
const quad = computed(() => count.value * 2 * 2); // 自動 inline！
```

---

## 🎨 實際例子

### Example 1: Form Validation

**Before (你寫):**
```typescript
import { zen, computed } from '@sylphx/zen';

const email = zen('');
const password = zen('');

const isValidEmail = computed(() =>
  /\S+@\S+/.test(email.value)
);

const isValidPassword = computed(() =>
  password.value.length >= 8
);

const canSubmit = computed(() =>
  isValidEmail.value && isValidPassword.value
);
```

**After (compiler 自動優化):**
```typescript
const email = zen('');
const password = zen('');

const canSubmit = computed(() =>
  /\S+@\S+/.test(email.value) && password.value.length >= 8
);
// +47% faster!
```

### Example 2: Shopping Cart

**Before:**
```typescript
const items = zen([
  { price: 10, qty: 2 },
  { price: 20, qty: 1 }
]);

const subtotal = computed(() =>
  items.value.reduce((sum, item) => sum + item.price * item.qty, 0)
);

const tax = computed(() => subtotal.value * 0.1);
const total = computed(() => subtotal.value + tax.value);
```

**After:**
```typescript
const items = zen([...]);

const subtotal = computed(() =>
  items.value.reduce((sum, item) => sum + item.price * item.qty, 0)
);

const total = computed(() => subtotal.value * 1.1);
// 自動 inline 'tax'，+35% faster!
```

### Example 3: Dashboard Metrics

**Before:**
```typescript
const users = zen(100);
const activeUsers = zen(80);

const activeRate = computed(() =>
  activeUsers.value / users.value
);

const activePercent = computed(() =>
  activeRate.value * 100
);

const displayText = computed(() =>
  `${activePercent.value.toFixed(1)}% active`
);
```

**After:**
```typescript
const users = zen(100);
const activeUsers = zen(80);

const displayText = computed(() =>
  `${(activeUsers.value / users.value * 100).toFixed(1)}% active`
);
// 自動 inline activeRate 同 activePercent！
```

---

## ⚙️ 配置選項

### `staticAnalysis: boolean`

**Default:** `true`

啟用靜態依賴分析。

```javascript
{
  staticAnalysis: true  // 推薦
}
```

### `inlineComputed: boolean`

**Default:** `true`

啟用自動 inline transformation。

```javascript
{
  inlineComputed: true  // 推薦，+68% 提速！
}
```

如果設為 `false`，只會顯示分析結果，唔會自動 transform：

```javascript
{
  inlineComputed: false  // 只分析，唔 transform
}
```

### `warnings: boolean`

**Default:** `true`

顯示優化結果。

```javascript
{
  warnings: true  // 推薦（development 時）
}
```

Production build 可以關閉：

```javascript
{
  warnings: process.env.NODE_ENV === 'development'
}
```

### `moduleName: string`

**Default:** `'@sylphx/zen'`

指定要優化嘅 module name。

```javascript
{
  moduleName: '@sylphx/zen'  // Default
}
```

如果你用自己 fork 嘅版本：

```javascript
{
  moduleName: 'my-zen-fork'
}
```

---

## 🛡️ 安全保證

Compiler 會自動處理 edge cases，確保安全：

### ✅ 會 Inline 嘅情況

1. **Single-use computed**
   ```typescript
   const doubled = computed(() => count.value * 2);
   const quad = computed(() => doubled.value * 2);  // Only use
   // ✅ Inline
   ```

2. **Simple functions**
   ```typescript
   const sum = computed(() => a.value + b.value);
   // ✅ Arrow function with expression body
   ```

3. **Non-exported**
   ```typescript
   const internal = computed(() => x.value * 2);
   // ✅ Not exported
   ```

### ❌ 唔會 Inline 嘅情況

1. **Multiple uses**
   ```typescript
   const doubled = computed(() => count.value * 2);
   const quad = computed(() => doubled.value * 2);
   const oct = computed(() => doubled.value * 4);
   // ❌ Preserve (used 2 times)
   ```

2. **Exported values**
   ```typescript
   export const doubled = computed(() => count.value * 2);
   // ❌ Preserve (public API)
   ```

3. **Complex functions**
   ```typescript
   const complex = computed(() => {
     if (condition) {
       for (let i = 0; i < 100; i++) {
         // ...
       }
     }
     return result;
   });
   // ❌ Preserve (too complex)
   ```

---

## 📊 Performance

Real benchmarks:

| Pattern | Before | After | Improvement |
|---------|--------|-------|-------------|
| Simple chain | 0.56ms | 0.26ms | **+53.6%** |
| Diamond | 0.47ms | 0.11ms | **+76.4%** |
| Deep chain | 0.26ms | 0.09ms | **+64.3%** |

**Average: +68% faster!**

---

## 🐛 Troubleshooting

### Q: 我嘅 computed 無被 inline？

**A:** Check 以下幾點：

1. **係咪 export？**
   ```typescript
   export const doubled = computed(...);  // 唔會 inline
   ```

2. **係咪 multiple uses？**
   ```typescript
   const doubled = computed(...);
   const a = computed(() => doubled.value * 2);  // Use 1
   const b = computed(() => doubled.value * 3);  // Use 2
   // 唔會 inline（用咗 2 次）
   ```

3. **係咪 complex function？**
   ```typescript
   const complex = computed(() => {
     // Block statement with multiple lines
     return result;
   });
   // 唔會 inline
   ```

4. **有無啟用 inlineComputed？**
   ```javascript
   {
     inlineComputed: true  // Must be true!
   }
   ```

### Q: Build 時睇唔到 compiler output？

**A:** Check:

1. **NODE_ENV 設定**
   ```bash
   NODE_ENV=development npm run build
   ```

2. **warnings 設定**
   ```javascript
   {
     warnings: true
   }
   ```

### Q: Babel 配置無生效？

**A:** 確保：

1. **babel.config.js 喺 project root**
   ```
   my-project/
   ├── babel.config.js  ← 呢度
   ├── package.json
   └── src/
   ```

2. **Plugin 正確 import**
   ```javascript
   plugins: [
     ['@sylphx/zen-compiler', { ... }]  // Correct
   ]
   ```

3. **有無其他 babel config override**（例如 .babelrc）

---

## 💡 Best Practices

### 1. 開發時啟用 warnings

```javascript
{
  warnings: process.env.NODE_ENV === 'development'
}
```

可以睇到邊啲 computed 被 inline。

### 2. Production build 關閉 warnings

```javascript
{
  warnings: false  // Production
}
```

減少 console output。

### 3. 寫 code 時唔使考慮 inlining

**唔好：**
```typescript
// 為咗 performance 手動 inline
const result = computed(() => a.value * 2 + b.value * 3);
```

**好：**
```typescript
// 寫清晰易讀嘅 code，let compiler 優化
const doubled = computed(() => a.value * 2);
const tripled = computed(() => b.value * 3);
const result = computed(() => doubled.value + tripled.value);
// Compiler 會自動 inline！
```

### 4. Export 需要嘅 values

```typescript
// Public API - export
export const doubled = computed(() => count.value * 2);

// Internal use - 唔 export
const quad = computed(() => doubled.value * 2);
```

Compiler 會自動處理。

---

## 📚 更多資源

- [Benchmark Results](/INLINING_SUCCESS.md)
- [Implementation Details](/AUTOMATIC_INLINING_COMPLETE.md)
- [Research Findings](/COMPILER_BENCHMARK_FINDINGS.md)

---

## 🤝 需要幫助？

1. Check [GitHub Issues](https://github.com/SylphxAI/zen/issues)
2. Read [Documentation](/packages/zen-compiler/README.md)
3. Ask in [Discussions](https://github.com/SylphxAI/zen/discussions)

---

<p align="center">
  <strong>自動優化，+68% 提速，零 bundle cost！</strong>
</p>
