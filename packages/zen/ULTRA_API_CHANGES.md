# Zen Ultra API Changes

## ✅ 完成的改動

### 1. **統一使用 `.value` API**

```typescript
const count = zen(0);

// ✅ 到處都用 .value（一致）
console.log(count.value);
count.value = 5;

const doubled = computed(() => count.value * 2);
console.log(doubled.value);
```

**理由：**
- 完全一致的 API
- 類似 Vue Composition API
- 沒有參數傳值的混亂

---

### 2. **自動依賴追蹤（Auto-tracking）**

```typescript
// ✅ 主要用法：自動追蹤
const fullName = computed(() =>
  `${firstName.value} ${lastName.value}`
);
// → 自動追蹤 firstName 和 lastName

// ✅ 條件依賴（自動追蹤的優勢）
const result = computed(() => {
  return useA.value ? x.value : y.value;
});
// → 自動只訂閱當前分支的 signals
```

**特性：**
- Lazy subscription（第一次訪問才訂閱）
- Lazy evaluation（只在需要時計算）
- 動態依賴追蹤（每次重新計算都重新追蹤）

---

### 3. **Explicit Dependencies 作為性能優化選項**

```typescript
// 性能優先場景：跳過追蹤
const sum = computed(
  () => a.value + b.value,
  [a, b] // ← Explicit deps
);
```

**何時使用：**
- 性能關鍵路徑
- 依賴不會改變
- 避免追蹤開銷

---

### 4. **移除 equalityFn 參數**

```typescript
// ❌ 舊 API（複雜）
computed(() => ..., customEquals, [deps])

// ✅ 新 API（簡潔）
computed(() => ...)
computed(() => ..., [deps])
```

**理由：**
- 99% 的情況用不到
- `Object.is` 預設夠用
- 簡化 API

**內置使用 Object.is：**
- 自動跳過相同值的通知
- 正確處理 `NaN`、`+0/-0`
- Immutable pattern 完美配合

---

## 📝 最終 API

### computed

```typescript
// 自動追蹤（主要用法）
const doubled = computed(() => count.value * 2);

// Explicit deps（性能優化）
const sum = computed(() => a.value + b.value, [a, b]);
```

### computedAsync

```typescript
// 自動追蹤
const user = computedAsync(async () => {
  const id = userId.value; // ✅ 追蹤到
  await fetch(...);
  return { id };
});

// Explicit deps
const user = computedAsync(
  async () => {
    await someAsyncOp();
    return userName.value; // await 後需要 explicit
  },
  [userName]
);
```

---

## ⚖️ 與其他庫對比

### Preact Signals
```typescript
const doubled = computed(() => count.value * 2);
```
✅ 相同 API

### SolidJS
```typescript
const doubled = createMemo(() => count() * 2);
```
⚠️ 用函數調用而非 `.value`

### Vue
```typescript
const doubled = computed(() => count.value * 2);
```
✅ 相同 API

---

## 🎯 優勢總結

1. **一致性** - 到處都是 `.value`
2. **簡潔性** - 自動追蹤，無需手動聲明
3. **靈活性** - Explicit deps 作為性能優化
4. **符合主流** - 類似 Vue 和 Preact Signals
5. **條件依賴** - 自動追蹤的最大優勢

---

## 📊 性能特徵

- **Lazy subscription** - 未使用的 computed 零開銷
- **Lazy evaluation** - 只在訪問時計算
- **自動追蹤開銷** - 每次 `.value` 訪問需檢查 currentListener
- **Explicit deps** - 跳過追蹤開銷（更快）

---

## 🔄 下一步

- [ ] 測試性能對比（auto-tracking vs explicit）
- [ ] 更新文檔
- [ ] 更新所有 benchmarks
- [ ] 考慮是否需要改回 Standard/Optimized builds
