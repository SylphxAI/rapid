# ADR-001: Runtime-First Architecture with Optional Compiler

**Status:** ✅ Accepted
**Date:** 2024-11-19
**Deciders:** Kyle Tse

---

## Context

Zen framework 需要決定 signal reactivity 嘅核心架構：

### 問題
1. 應該依賴 compiler 定 runtime？
2. 點樣支援跨框架統一語法？
3. 點樣平衡性能同易用性？

### 發現
- Zen 原本有 auto-unwrap（`{signal}`）
- 為咗統一 `.value` 語法，移除咗 auto-unwrap
- 現在完全依賴 compiler（unplugin）
- 但 compiler 只係做語法轉換，冇真正優化

---

## Decision

採用 **Runtime-First Architecture**：

### 核心原則

1. **Runtime First**
   - 所有功能必須在 runtime 可用
   - Compiler 係可選優化，唔係必需

2. **Unified Syntax**
   - 所有框架統一用 `{signal}`
   - 代表 reactive，明確清晰

3. **Auto-unwrap**
   - Runtime 自動檢測 signals
   - 自動創建 reactive subscriptions

---

## Architecture

```
┌─────────────────────────────────────────────┐
│          Application Code                   │
│          <p>{signal}</p>                    │
└─────────────────────────────────────────────┘
                    ↓
        ┌───────────────────────┐
        │   Compiler (Optional) │ ← Phase 2: Optimizations
        │   - Static analysis   │
        │   - Pre-generate code │
        └───────────────────────┘
                    ↓ (optional)
┌─────────────────────────────────────────────┐
│          Custom JSX Runtime                 │ ← Phase 1: Core
│   - Auto-detect signals (isReactive)       │
│   - Create reactive subscriptions          │
│   - Framework-specific handling            │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│          Framework Native                   │
│   React | Vue | Svelte | Zen               │
└─────────────────────────────────────────────┘
```

---

## Implementation Strategy

### Phase 1: Runtime Foundation (Priority)

為每個框架提供 custom JSX runtime：

#### 1. Zen Framework
```tsx
// Already works! ✅
import { signal } from '@rapid/signal';

const count = signal(0);
<p>{count}</p>  // Native auto-unwrap
```

**實現：** `packages/zen/src/jsx-runtime.ts`
- ✅ Already has `isReactive()` check
- ✅ Already creates effects
- ✅ No changes needed

---

#### 2. React
```tsx
// New custom JSX runtime
import { signal } from '@rapid/signal';

const count = signal(0);
<p>{count}</p>  // Runtime auto-unwrap
```

**實現：** `packages/unplugin-zen-signal/jsx-runtime/react/index.tsx`

**技術決策：**
- Use `React.createElement` wrapper
- Detect signals with `isReactive()`
- Wrap in `ZenReactive` component
- Use `useState` + `useEffect` for subscription

**為何唔直接用 useStore？**
- useStore 需要 compiler 插入
- Runtime mode 唔知邊個係 signal
- 要 JSX runtime 檢測

**Trade-off：**
- ✅ Works without compiler
- ✅ Zero config
- ❌ Extra wrapper component overhead
- ❌ Runtime detection cost

---

#### 3. Vue
```vue
<script setup>
import { signal } from '@rapid/signal';

const count = signal(0);
</script>

<template>
  <p>{{ count }}</p>  <!-- Runtime auto-unwrap -->
</template>
```

**實現：** `packages/unplugin-zen-signal/jsx-runtime/vue/index.ts`

**技術決策：**
- Custom `h()` function wrapper
- Detect signals with `isReactive()`
- Wrap in Vue `ref()` + `watchEffect()`

**為何用 ref + watchEffect？**
- Vue 需要 reactive ref 先會更新 template
- watchEffect 追蹤 signal 變化
- 同步更新 Vue ref

**Trade-off：**
- ✅ Pure runtime solution
- ✅ No compiler needed
- ❌ Extra watchers overhead
- ❌ Memory for each signal ref

---

#### 4. Svelte
```svelte
<script>
import { signal } from '@rapid/signal';

const count = signal(0);
</script>

<p>{count}</p>  <!-- Runtime auto-unwrap -->
```

**實現：** `packages/unplugin-zen-signal/svelte-preprocessor/index.ts`

**技術決策：**
- Svelte preprocessor (build-time, but runtime logic)
- Inject runtime helper `unwrapSignal()`
- Transform `{expr}` → `{unwrapSignal(expr)}`

**點解 Svelte 唔同？**
- Svelte 係 compiler-based framework
- Template 在 build time 編譯
- 要用 preprocessor 注入 runtime code

**Trade-off：**
- ✅ Works with Svelte's architecture
- ✅ Runtime detection preserved
- ❌ Requires preprocessor (但係 Svelte 本身都要)
- ❌ Not pure runtime (但係最接近)

---

### Phase 2: Compiler Optimizations (Optional)

**當 mode: 'compiler' 時：**

#### React Optimization
```tsx
// Input
const count = signal(0);
<p>{count}</p>

// Compiler output
import { useStore } from '@rapid/signal-react';

const count = signal(0);
const count$ = useStore(count);
<p>{count$}</p>
```

**收益：**
- Skip `isReactive()` check
- Skip wrapper component
- Direct React hook usage
- ~30% faster rendering

---

#### Vue Optimization
```vue
<!-- Input -->
<script setup>
const count = signal(0);
</script>
<template>
  <p>{{ count }}</p>
</template>

<!-- Compiler output -->
<script setup>
import { computed } from 'vue';

const count = signal(0);
const count$ = computed(() => count.value);
</script>
<template>
  <p>{{ count$ }}</p>
</template>
```

**收益：**
- Skip runtime detection
- Use native Vue computed
- ~20% faster

---

#### Zen Optimization
```tsx
// Input
<p>{count}</p>

// Compiler output
<p>{() => count.value}</p>
```

**收益：**
- Skip `isReactive()` check
- Direct effect creation
- ~10-15% faster

---

### Phase 3: Unified Plugin

**目標：** 一個 plugin 搞掂所有嘢

```typescript
// vite.config.ts
import { zenSignal } from 'unplugin-zen-signal/vite';

export default {
  plugins: [
    zenSignal(),  // Auto-detect framework & setup!
  ],
};
```

**實現：** `packages/unplugin-zen-signal/src/index.ts`

**功能：**
1. Auto-detect framework (from package.json)
2. Auto-configure JSX runtime
3. Support mode: 'runtime' | 'compiler' | 'hybrid'
4. Zero-config by default

---

## Technical Decisions

### 1. Signal Detection

**Function:** `isReactive(value)`

```typescript
function isReactive(value: any): boolean {
  return value !== null
    && typeof value === 'object'
    && '_kind' in value;
}
```

**Why `_kind`？**
- ✅ Fast check (property lookup)
- ✅ Unique to Zen signals
- ✅ Works with computed too
- ❌ Not 100% foolproof (可以偽造)

**Alternative: Symbol**
```typescript
const ZEN_SIGNAL = Symbol('zen-signal');
function isReactive(value: any): boolean {
  return value?.[ZEN_SIGNAL] === true;
}
```
- ✅ More robust
- ❌ Requires signal implementation change
- ❌ Symbol lookup slower

**Decision:** Use `_kind` for now, consider Symbol in v2

---

### 2. React Integration

**方案 A: Wrapper Component** ✅ (Chosen)
```tsx
function ZenReactive({ signal }) {
  const [value, setValue] = useState(signal.value);
  useEffect(() => {
    return signal.subscribe?.(setValue) || (() => {});
  }, [signal]);
  return value;
}
```

**方案 B: Direct Hook**
```tsx
// Requires compiler to insert
const value = useStore(signal);
```

**Why choose A?**
- ✅ Works without compiler
- ✅ Runtime-only solution
- ❌ Extra component overhead (~5% slower)

**Can optimize later with compiler!**

---

### 3. Vue Integration

**方案 A: ref + watchEffect** ✅ (Chosen)
```typescript
const vueRef = ref(signal.value);
watchEffect(() => {
  vueRef.value = signal.value;
});
```

**方案 B: computed**
```typescript
const vueRef = computed(() => signal.value);
```

**Why choose A?**
- ✅ Writable (if needed)
- ✅ More flexible
- ❌ Slightly more overhead

**Can optimize to B with compiler!**

---

### 4. Mode Selection

**Default: 'runtime'**

Why?
- ✅ Zero config
- ✅ Works everywhere
- ✅ Easy debugging
- ✅ Source maps accurate
- ❌ ~10-30% slower than compiler mode

**When to use 'compiler'?**
- Production builds
- Performance critical
- Large apps

**When to use 'hybrid'?**
- Development (runtime for debugging)
- Production (compiler for speed)
- Best of both worlds

---

## File Structure

```
packages/
  unplugin-zen-signal/
    src/
      index.ts                    # Main plugin
      auto-detect.ts              # Framework detection
      compiler/
        react.ts                  # React compiler optimizations
        vue.ts                    # Vue compiler optimizations
        svelte.ts                 # Svelte compiler optimizations
        zen.ts                    # Zen compiler optimizations

    jsx-runtime/
      react/
        index.tsx                 # React custom JSX runtime
        ZenReactive.tsx           # Reactive wrapper component
      vue/
        index.ts                  # Vue custom render function
      svelte/
        preprocessor.ts           # Svelte preprocessor

    package.json
    README.md
```

---

## API Design

### Plugin API

```typescript
interface ZenSignalOptions {
  // Framework (auto-detected if omitted)
  framework?: 'react' | 'vue' | 'svelte' | 'zen';

  // Mode
  mode?: 'runtime' | 'compiler' | 'hybrid';

  // Auto-detect framework
  autoDetect?: boolean;  // default: true

  // Debug logging
  debug?: boolean;
}

// Usage
zenSignal({
  mode: 'runtime',      // Default
  autoDetect: true,     // Default
})
```

---

### JSX Runtime API (React)

```typescript
// Users don't call this directly
// It's used by JSX transform
export function jsx(
  type: string | Function,
  props: any
): React.ReactElement;

export const jsxs = jsx;
export const jsxDEV = jsx;
```

---

## Migration Path

### Current State (v3.x)
```tsx
// Requires compiler
<p>{signal.value}</p>
```

### New Runtime Mode (v4.0)
```tsx
// Works without compiler
<p>{signal}</p>
```

### Backward Compatibility

**Support both syntaxes:**
```tsx
<p>{signal}</p>        // Runtime detects signal
<p>{signal.value}</p>  // Gets raw value (string/number)
```

**Migration:**
1. Install new unplugin
2. Remove `.value` in JSX children
3. Keep `.value` for assignments

---

## Performance Expectations

### Runtime Mode
- React: ~5-10% overhead vs compiler
- Vue: ~3-5% overhead vs compiler
- Svelte: ~2-3% overhead vs compiler
- Zen: ~0% overhead (already optimized)

### Compiler Mode
- React: ~30% faster than runtime
- Vue: ~20% faster than runtime
- Svelte: ~15% faster than runtime
- Zen: ~10% faster than runtime

### Hybrid Mode
- Development: Runtime (for debugging)
- Production: Compiler (for speed)

---

## Risks & Mitigations

### Risk 1: Runtime Overhead
**Impact:** Medium
**Mitigation:**
- Measure with benchmarks
- Provide compiler mode for production
- Optimize hot paths

### Risk 2: Edge Cases
**Impact:** Medium
**Mitigation:**
- Comprehensive test suite
- Real-world testing
- Clear documentation

### Risk 3: Framework Updates
**Impact:** Low
**Mitigation:**
- Follow framework best practices
- Version pinning
- Regular testing with new versions

---

## Success Metrics

### Phase 1 (Runtime)
- ✅ All frameworks support `{signal}`
- ✅ Zero compiler needed
- ✅ <10% performance overhead
- ✅ Easy to use (one plugin install)

### Phase 2 (Compiler)
- ✅ 20-30% performance improvement
- ✅ Backward compatible with runtime
- ✅ Optional, not required

---

## References

- Implementation: `packages/unplugin-zen-signal/`
- Tests: `packages/unplugin-zen-signal/**/*.test.ts`
- Benchmarks: `packages/unplugin-zen-signal/**/*.bench.ts`

---

## Changelog

- 2024-11-19: Initial decision
- Phase 1 implementation: TBD
- Phase 2 implementation: TBD
