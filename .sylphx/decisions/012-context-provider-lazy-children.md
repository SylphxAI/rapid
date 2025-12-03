# ADR-012: Context Provider Lazy Children Pattern

**Status:** ✅ Accepted
**Date:** 2024-12-XX

---

## Context

Descriptor Pattern (ADR-011) 解決了 JSX eager evaluation 問題，但 Context.Provider 需要特殊處理。

### 問題

JavaScript 語意限制：**傳遞屬性值必然讀取該值**

```typescript
// 任何傳遞 props.children 的方式都會讀取它
{ children: props.children }  // 讀取!
jsx(Component, { children: props.children })  // 讀取!
<Component>{props.children}</Component>  // 轉換後也讀取!
```

當 props.children 是 lazy getter 時，讀取會立即執行children，可能在 Context 設置之前。

---

## Decision

採用 **分層解決方案**：

### 1. 普通用戶：ContextProvider Helper（零配置）

```tsx
import { ContextProvider } from '@rapid/runtime';

// 純 JSX，零配置！
<ContextProvider context={MyContext} value={myValue}>
  <Child />
</ContextProvider>
```

ContextProvider 內部使用 manual getter 處理 lazy children。

### 2. 框架層 Provider：Manual Getter（顯式控制）

```typescript
// FocusProvider, ThemeProvider 等框架級組件
return MyContext.Provider({
  value: contextValue,
  get children() {
    return props.children;  // Manual getter preserves lazy
  },
});
```

### 3. Memoized Lazy Getter（防止重複執行）

`makeLazyPropsForDescriptor` 創建的 getter 使用 memoization：

```typescript
let executed: unknown;
let hasExecuted = false;

get children() {
  if (!hasExecuted) {
    executed = executeDescriptor(children);  // 只執行一次
    hasExecuted = true;
  }
  return executed;  // 後續讀取返回緩存結果
}
```

允許 props.children 被安全讀取多次。

---

## Rationale

**為何不能全用 JSX？**

嵌套 Provider 時，外層 Provider 不能用 JSX 傳遞 children：

```tsx
// ❌ 不工作
function FocusProvider(props) {
  return <ContextProvider context={...}>{props.children}</ContextProvider>;
  //                                     ^^^^^^^^^^^^^^^^ 過早讀取！
}

// ✅ 必須手動 getter
function FocusProvider(props) {
  return FocusContext.Provider({
    value: contextValue,
    get children() { return props.children; }  // 延遲到 Provider 執行後
  });
}
```

**為何 memoization 重要？**

即使手動 getter，Provider 內部可能多次訪問 children（例如 `children(() => props.children)` + 後續處理）。Memoization 確保：
- 第一次讀取：執行 descriptor
- 後續讀取：返回緩存結果
- 避免重複執行同一組件

---

## Implementation

### ContextProvider Helper

**文件**: `packages/zen-runtime/src/components/ContextProvider.tsx`

```typescript
export function ContextProvider<T>(props: ContextProviderProps<T>): unknown {
  const { context, value } = props;

  return context.Provider({
    value,
    get children() {
      return props.children;  // Manual getter
    },
  });
}
```

### Memoized Lazy Props

**文件**: `packages/zen-runtime/src/descriptor.ts`

```typescript
function makeLazyPropsForDescriptor(props) {
  if (isDescriptor(props.children)) {
    let executed: unknown;
    let hasExecuted = false;

    return {
      ...props,
      get children() {
        if (!hasExecuted) {
          executed = executeDescriptor(children);
          hasExecuted = true;
        }
        return executed;
      },
    };
  }
  // ...
}
```

---

## Usage Guidelines

### For Framework Authors

創建自定義 Provider 時，使用 manual getter：

```typescript
export function MyProvider(props: { children: unknown }) {
  const value = setupMyContext();

  return MyContext.Provider({
    value,
    get children() {  // ✅ Manual getter
      return props.children;
    },
  });
}
```

**不要使用** JSX 傳遞 children 到另一個 Provider。

### For App Developers

直接使用 ContextProvider helper：

```tsx
import { ContextProvider } from '@rapid/runtime';

// ✅ 純 JSX，零配置
<ContextProvider context={ThemeContext} value={theme}>
  <App />
</ContextProvider>
```

或使用框架提供的 Provider：

```tsx
// ✅ 框架已處理 lazy children
<FocusProvider>
  <TextInput />
</FocusProvider>
```

---

## Consequences

### Positive

1. **用戶零配置** - ContextProvider helper 支持純 JSX
2. **框架層可控** - Manual getter 提供精確控制
3. **防止重複執行** - Memoization 確保性能
4. **Runtime-first** - 無需 compiler
5. **向後兼容** - 現有 Context.Provider 語法仍然有效

### Negative

1. **框架作者需了解** - 創建嵌套 Provider 時需使用 manual getter
2. **語法不一致** - 用戶用 ContextProvider，框架用 manual getter
3. **額外組件層** - ContextProvider 增加一層組件（性能影響極小）

### Trade-offs

**放棄**：完全統一的 JSX 語法（框架層仍需 manual getter）
**獲得**：
- 普通用戶零配置體驗
- 框架層精確控制
- Runtime-first 原則保持
- 性能優化（memoization）

---

## Alternatives Considered

### Alternative 1: 完全 Manual Getter

所有 Provider 都用 manual getter，包括用戶代碼。

**Rejected**: 用戶體驗差，違反 zero-config 原則。

### Alternative 2: Compiler Transformation

Compiler 檢測 Context.Provider 並自動插入 getter。

**Rejected**: 違反 Runtime-First 原則，compiler 變成必需。

### Alternative 3: Proxy-Based Lazy Props

使用 Proxy 攔截屬性訪問。

**Rejected**:
- 性能開銷
- 複雜度高
- 難以調試
- Proxy 無法完全解決讀取時序問題

---

## References

- Related: ADR-011 (Descriptor Pattern)
- Implementation: `packages/zen-runtime/src/components/ContextProvider.tsx`
- Example: `examples/tui-demo/src/context-provider-test.tsx`

---

## Documentation Updates

### API Reference

**ContextProvider Component**:
```typescript
import { ContextProvider } from '@rapid/runtime';

<ContextProvider context={MyContext} value={myValue}>
  {children}
</ContextProvider>
```

**Creating Custom Providers** (Framework Authors):
```typescript
function MyProvider(props: { children: unknown }) {
  return MyContext.Provider({
    value: myValue,
    get children() { return props.children; }
  });
}
```

---

## Testing

Verified patterns:
- ✅ ContextProvider with pure JSX
- ✅ Framework Provider with manual getter
- ✅ Nested Providers
- ✅ Memoization prevents double execution
- ✅ Context propagates correctly
