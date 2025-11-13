# Phase 3 分析：尋找真正的性能瓶頸

## 當前狀態

**v3.4 (Phase 2)**:
- Average: 8.62x slower vs Solid
- Test 1 (Unobserved): 9.70x
- Test 2 (Observed): 8.37x
- Test 3 (No access): 7.80x

**目標**: 3-5x slower vs Solid

**差距**: 需要再提升 ~60% 性能

---

## 嘗試的優化

### ❌ hasPendingWork 單一標誌

**理論**：用單一 boolean 替代 3 個屬性檢查
```typescript
// Phase 2
const hasWork = Updates.size > 0 || pendingNotifications.size > 0 || Effects.length > 0;

// Phase 3 (嘗試)
if (hasPendingWork) { ... }
```

**結果**：**退步** 8.62x → 8.85x

**原因分析**：
1. 每次 queue 時都要設置標誌（3個地方 + effect）
2. 額外的標誌重置操作
3. Set/Map/Array 的 size/length 訪問已經很快（O(1)）
4. **設置標誌的成本 > 檢查屬性的成本**

**結論**：放棄此優化

---

## 真正的性能瓶頸在哪裡？

### 分析工具：Micro-benchmark 結果

```
Empty batch:        2.29ms (43.7M ops/sec)  ← 基準
Signal updates:     20.02ms (5.0M ops/sec)  ← +17.73ms
Lazy computed:      20.84ms (4.8M ops/sec)  ← +0.82ms
Dependency chain:   21.64ms (4.6M ops/sec)  ← +0.80ms
```

**關鍵發現**：
- Empty batch 非常快（2.29ms）
- **Signal updates 增加 17.73ms** ← 主要開銷
- Lazy computed 只增加 0.82ms
- Dependency chain 只增加 0.80ms

### Signal updates 做了什麼？

```typescript
// Empty batch: 只有 batch() 自身開銷
batch(() => {});

// Signal updates: batch + 2 次 signal 寫入
batch(() => {
  a.value = i;      // ← 寫入 1
  b.value = i * 2;  // ← 寫入 2
});
```

**17.73ms 增加 = 2 次 signal 寫入的成本**

**每次 signal 寫入**：~8.87ms / 100k = **88.7ns**

### Signal 寫入在做什麼？

```typescript
set value(newValue: any) {
  const oldValue = this._value;
  if (Object.is(newValue, oldValue)) return;  // ← 操作 1: 相等性檢查

  this._value = newValue;  // ← 操作 2: 賦值

  // OPTIMIZATION: Mark computed dependents as dirty
  const listeners = this._listeners;  // ← 操作 3: 訪問 listeners
  if (listeners) {  // ← 檢查 4
    for (let i = 0; i < listeners.length; i++) {  // ← 循環 5
      const listener = listeners[i];
      const computedZen = (listener as any)._computedZen;  // ← 訪問 6
      if (computedZen && !computedZen._dirty) {  // ← 檢查 7
        computedZen._dirty = true;  // ← 操作 8
        if (batchDepth > 0) {  // ← 檢查 9
          Updates.add(computedZen);  // ← 操作 10: Set.add
        }
      }
    }
  }

  if (batchDepth > 0) {  // ← 檢查 11
    if (!pendingNotifications.has(this)) {  // ← 檢查 12: Map.has
      pendingNotifications.set(this, oldValue);  // ← 操作 13: Map.set
    }
    return;
  }

  notifyListeners(this, newValue, oldValue);  // ← 外部調用（batch 內不執行）
}
```

**在 batch 中（無 listeners 的 signal）**：
- 最少操作：12 個檢查/操作
- Map.has + Map.set 相對昂貴

### Solid 的 Signal 寫入

```typescript
// 推測 Solid 的實現
export function setSignal(node, value) {
  if (node.comparator && node.comparator(node.value, value)) return;
  node.value = value;

  if (Listener === 0) {  // 不在 batch
    runUpdates(() => {
      // 立即通知
    });
  }
  // 在 batch 中：什麼都不做！
}
```

**關鍵差異**：
- Zen: 在 batch 中也要處理 listeners 循環 + Map 操作
- Solid: 在 batch 中幾乎什麼都不做

---

## 性能差距的根本原因

### Zen 的架構負擔

1. **雙重實現兼容**
   - zen.ts 內部 computed
   - computed.ts 導出 computed
   - 需要檢查 `(computed as any)._update`

2. **複雜的通知系統**
   - pendingNotifications (Map)
   - Updates (Set)
   - Effects (Array)
   - 3 個不同的佇列

3. **eager dirty marking**
   - Signal 更新時立即遍歷 listeners
   - 標記 computed dirty
   - 加入 Updates Set

### Solid 的簡潔性

1. **單一實現**
   - 只有一種 createMemo

2. **簡單的佇列**
   - 單一 Updates 佇列
   - 或者根本不用佇列（lazy）

3. **lazy marking**
   - Signal 更新時幾乎不做事
   - 只在訪問時才檢查 dirty

---

## 可行的優化方向

### 優化 1: 簡化 Signal setter (HIGH IMPACT)

**目標**：減少 batch 中 signal 寫入的開銷

**方案 A：延遲 dirty marking**
```typescript
set value(newValue: any) {
  const oldValue = this._value;
  if (Object.is(newValue, oldValue)) return;
  this._value = newValue;

  if (batchDepth > 0) {
    // 只記錄變更，不處理 listeners
    if (!pendingNotifications.has(this)) {
      pendingNotifications.set(this, oldValue);
    }
    return;
  }

  // 外部：正常處理
  notifyListeners(this, newValue, oldValue);
}
```

**問題**：computed 不會被加入 Updates → 無法在 batch 結束時處理

**方案 B：簡化 listener 處理**
```typescript
// 當前：每次都遍歷 listeners
for (let i = 0; i < listeners.length; i++) {
  const listener = listeners[i];
  const computedZen = (listener as any)._computedZen;
  // ...
}

// 優化：預處理 computed listeners
// 在訂閱時分類 listeners
_computedListeners?: ComputedCore<any>[];
_effectListeners?: Listener<T>[];
```

**預期提升**：10-15%

### 優化 2: 移除 pendingNotifications (MEDIUM IMPACT)

**問題**：每次 signal 更新都要 Map.has + Map.set

**方案**：使用 signal 自身的標誌
```typescript
type ZenCore<T> = {
  _kind: 'zen' | 'computed';
  _value: T;
  _listeners?: Listener<T>[];
  _pendingOldValue?: T;  // ← 新增：替代 Map
};

set value(newValue: any) {
  // ...
  if (batchDepth > 0) {
    if (this._pendingOldValue === undefined) {
      this._pendingOldValue = oldValue;
    }
    return;
  }
}
```

**預期提升**：5-10%

### 優化 3: 統一 computed 實現 (LOW IMPACT, HIGH EFFORT)

**問題**：雙重實現增加檢查成本

**方案**：只保留 computed.ts，移除 zen.ts 內部 computed

**預期提升**：5%

**成本**：Breaking change（v4.0）

### 優化 4: 內聯 Object.is (MICRO IMPACT)

**問題**：函數調用開銷

```typescript
// 當前
if (Object.is(newValue, oldValue)) return;

// 優化
if (newValue === oldValue || (newValue !== newValue && oldValue !== oldValue)) return;
```

**預期提升**：1-2%

---

## 推薦的優化路徑

### 立即實現（v3.5）

1. ✅ **優化 4: 內聯 Object.is** (simple, safe)
2. ✅ **優化 2: 移除 pendingNotifications** (medium complexity)
3. ✅ **優化 1: 簡化 listener 處理** (分類 listeners)

**預期總提升**：15-25% → 從 8.6x → 6.5-7.3x

### 未來考慮（v4.0）

1. **優化 3: 統一 computed 實現** (breaking)
2. **完整的 Solid-style lazy** (breaking)
3. **重新設計通知系統** (breaking)

**預期總提升**：50%+ → 從 6.5x → <3x

---

## 下一步行動

1. 實現優化 4 (內聯 Object.is)
2. 實現優化 2 (移除 pendingNotifications Map)
3. 實現優化 1 (分類 listeners)
4. Benchmark 驗證
5. 發布 v3.5

**目標**：達到 6.5-7.3x slower vs Solid
