# Quick Start - 5 分鐘開始用

**最快上手 @sylphx/zen-compiler！**

---

## Step 1: 安裝 (30 秒)

```bash
npm install --save-dev @sylphx/zen-compiler
```

---

## Step 2: 配置 Babel (1 分鐘)

Create `babel.config.js`:

```javascript
module.exports = {
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

## Step 3: 寫 Zen code (正常寫)

```typescript
// src/counter.ts
import { zen, computed } from '@sylphx/zen';

const count = zen(0);
const doubled = computed(() => count.value * 2);
const quad = computed(() => doubled.value * 2);

export { count, quad };
```

---

## Step 4: Build

```bash
npm run build
```

---

## Step 5: 睇結果！

Console output:

```
✅ Automatically inlined 1 computed expression(s)
```

Output code:

```typescript
const count = zen(0);
const quad = computed(() => count.value * 2 * 2);  // +68% 快！

export { count, quad };
```

---

## 完成！🎉

**自動優化，+68% 提速，完全唔使改 code！**

---

## 下一步

- [完整使用指南](/packages/zen-compiler/USAGE.md)
- [實際例子](/packages/zen-compiler/USAGE.md#實際例子)
- [Benchmark 結果](/INLINING_SUCCESS.md)

---

## 唔同 Framework 配置

### Vite

```javascript
// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [['@sylphx/zen-compiler', {
          inlineComputed: true
        }]]
      }
    })
  ]
});
```

### Next.js

```javascript
// next.config.js
module.exports = {
  webpack: (config) => {
    config.module.rules.push({
      test: /\.(js|jsx|ts|tsx)$/,
      use: {
        loader: 'babel-loader',
        options: {
          plugins: [['@sylphx/zen-compiler', {
            inlineComputed: true
          }]]
        }
      }
    });
    return config;
  }
};
```

### Create React App

```javascript
// babel.config.js (需要 eject 或者用 craco)
module.exports = {
  plugins: [
    ['@sylphx/zen-compiler', {
      inlineComputed: true
    }]
  ]
};
```

---

**就係咁簡單！Enjoy +68% 提速！🚀**
