# 瓶頸分析報告

## 🔍 發現的關鍵瓶頸

### 1. 🚨 **Batch 操作瓶頸** - 最嚴重！

**數據**:
```
10 individual sets (no batch):  6.33M ops/s
10 sets in batch:              1.54M ops/s  ❌ 慢 4.1 倍！

Empty batch call:              15.17M ops/s
Batch with 1 set:               8.52M ops/s
```

**問題**:
- Batch 本身的開銷太大
- 處理 batch queue 的成本超過了合併通知的收益
- 在少量更新時（< 10 個），batch 反而是負優化！

**根本原因**:
```typescript
// 當前實現
function batch(fn) {
  batchDepth++;
  const changesToNotify = [];
  try {
    fn();  // 收集所有變更到 Map
  } finally {
    batchDepth--;
    if (batchDepth === 0) {
      // 從 Map 提取變更 ⏱️ 開銷大
      const changes = _processBatchQueue(errorOccurred);
      changesToNotify.push(...changes);
    }
  }
  // 通知所有變更 ⏱️ 開銷大
  _notifyBatchedChanges(changesToNotify);
}
```

**解決方案**:
- 只在真正有多個變更時才使用 Map
- 小批次（< 3 個）直接通知

---

### 2. ⚠️ **Array.from 創建開銷** - 嚴重！

**數據**:
```
Create 10 signals:                      10.11M ops/s  ✅
Create 10 signals + store in array:     3.76M ops/s  ⚠️ 慢 2.7x
Create 10 signals + Array.from:         1.15M ops/s  ❌ 慢 8.8x！
```

**問題**:
- `Array.from` 比直接循環慢 8.8 倍！
- 這解釋了為什麼 "Create 100 signals" 測試慢

**根本原因**:
```typescript
// ❌ 慢：Array.from 創建迭代器 + 額外函數調用
Array.from({ length: 100 }, (_, i) => zen(i));

// ✅ 快：直接 push
const signals = [];
for (let i = 0; i < 100; i++) {
  signals.push(zen(i));
}
```

**但這不是我們的問題** - 這是測試代碼的問題，不是 zen 本身！

---

### 3. ⚠️ **Subscribe 開銷**

**數據**:
```
Subscribe to signal:                 16.98M ops/s
Subscribe + immediate unsubscribe:   13.74M ops/s  ⚠️ 慢 1.24x
Subscribe to 5 signals:               1.74M ops/s  ⚠️ 慢 9.77x
```

**問題**:
- Subscribe 操作本身不慢（17M ops/s）
- 但批量 subscribe 的開銷累積明顯

**原因**:
- 每次 subscribe 都要修改 listeners array
- 第一個 listener 要觸發 `_handleFirstSubscription`

---

### 4. ⚠️ **10+ Listeners 性能下降**

**數據**:
```
No listeners:   25.43M ops/s
5 listeners:    25.94M ops/s  ✅ 相近
10 listeners:   13.27M ops/s  ❌ 慢 1.96x
```

**問題**:
- 5 個 listeners 幾乎無開銷
- 10 個 listeners 慢了一倍

**原因**:
```typescript
// 循環開銷在 10 個時開始明顯
for (let i = 0; i < len; i++) {
  listeners[i](value, oldValue);  // 10 次函數調用
}
```

**可能優化**:
- 展開循環（unroll loop）前幾個
- 或接受這個權衡（10+ listeners 不常見）

---

### 5. ✅ **Object.is 不是瓶頸**

**數據**:
```
Object.is:  33.86M ops/s
===:        32.01M ops/s

Object.is 實際上快 6%！✅
```

**結論**: Object.is 不需要優化。

---

### 6. ✅ **Closure 不是瓶頸**

**數據**:
```
Direct property access:  34.50M ops/s
Closure function call:   33.77M ops/s  ⚠️ 僅慢 2%
Closure inline call:     34.26M ops/s  ⚠️ 僅慢 1%
```

**結論**: 閉包開銷可忽略不計。

---

### 7. ⚠️ **markDirty 隨 Listeners 增加變慢**

**數據**:
```
markDirty - no listeners:  34.68M ops/s
markDirty - 1 listener:    27.49M ops/s  ⚠️ 慢 26%
markDirty - 5 listeners:   19.76M ops/s  ⚠️ 慢 75%
```

**問題**:
```typescript
// 需要遍歷所有 listeners 標記為 GREEN
for (let i = 0; i < len; i++) {
  const listener = listeners[i];
  const listenerZen = listener._computedZen || listener;
  if (listenerZen._color !== undefined && listenerZen._color === 0) {
    listenerZen._color = 1;  // 每個都要檢查和設置
  }
}
```

**可能優化**:
- 延遲標記（lazy marking）
- 只在 computed 讀取時才檢查

---

### 8. ⚠️ **內存分配瓶頸**

**數據**:
```
Allocate 100 small objects:  19.94M ops/s
Allocate 100 closures:        8.56M ops/s  ⚠️ 慢 2.3x
Allocate 100 zen signals:     1.28M ops/s  ❌ 慢 15.6x！
```

**問題**:
- 每個 zen 創建 3 個對象（data + get + set）+ 1 個包裝對象
- 總共 4 個對象分配
- 加上 closure 捕獲的環境

**這是創建慢的根本原因！**

---

## 🎯 優化優先級

### 🔥 高優先級（立即優化）

1. **Batch 操作** - 當前實現是負優化
   - 影響：慢 4.1 倍
   - 方案：小批次直接通知，大批次才用 Map

2. **內存分配** - 創建慢 15.6 倍的根源
   - 影響：創建性能
   - 方案：減少對象數量，考慮 Object Pool

### ⚠️ 中優先級（考慮優化）

3. **markDirty 循環** - 5+ listeners 時慢 75%
   - 影響：寫入性能
   - 方案：延遲標記或批量標記

4. **10+ Listeners** - 慢 2 倍
   - 影響：多 listener 場景
   - 方案：循環展開或接受權衡

### ✅ 低優先級（無需優化）

5. Object.is - 實際上比 === 快
6. Closure - 開銷可忽略

---

## 💡 具體優化方案

### 方案 1: 優化 Batch（簡單且高效）

```typescript
export function batch<T>(fn: () => T): T {
  batchDepth++;

  try {
    const result = fn();

    // ✅ 只在嵌套 batch 時才處理 queue
    if (batchDepth === 1 && batchQueue.size > 0) {
      // 小批次優化：直接通知，不用 Map
      if (batchQueue.size <= 3) {
        for (const [zen, oldValue] of batchQueue.entries()) {
          notifyListeners(zen, zen._value, oldValue);
        }
        batchQueue.clear();
      } else {
        // 大批次：使用 Map 去重
        _processBatchQueue();
      }
    }

    return result;
  } finally {
    batchDepth--;
  }
}
```

**預期提升**: Batch 10 個從 1.54M → 4-5M ops/s (2-3x)

---

### 方案 2: 減少內存分配（複雜但高效）

```typescript
// ✅ 選項 A：合併對象（簡單）
export function zen<T>(initialValue: T) {
  // 只創建 1 個對象，包含所有屬性
  return {
    _kind: 'zen',
    _value: initialValue,
    get() { return this._value; },
    set(value: T) { /* ... */ },
  };
}
// 從 4 個對象 → 1 個對象

// ✅ 選項 B：Object Pool（複雜）
const zenPool = [];
export function zen<T>(initialValue: T) {
  const data = zenPool.pop() || createZenData();
  data._value = initialValue;
  // ...
}
```

**預期提升**: 創建從 1.28M → 5-10M ops/s (4-8x)

---

### 方案 3: 優化 markDirty（中等複雜度）

```typescript
export function markDirty<A extends AnyZen>(zen: A): void {
  const baseZen = zen as ZenWithValue<ZenValue<A>>;
  baseZen._color = 2;

  const listeners = baseZen._listeners;
  if (!listeners) return;

  // ✅ 展開前幾個（避免循環開銷）
  const len = listeners.length;
  if (len === 1) {
    markListenerGreen(listeners[0]);
  } else if (len === 2) {
    markListenerGreen(listeners[0]);
    markListenerGreen(listeners[1]);
  } else if (len === 3) {
    markListenerGreen(listeners[0]);
    markListenerGreen(listeners[1]);
    markListenerGreen(listeners[2]);
  } else {
    // 4+ 才用循環
    for (let i = 0; i < len; i++) {
      markListenerGreen(listeners[i]);
    }
  }
}

function markListenerGreen(listener: any) {
  const listenerZen = listener._computedZen || listener;
  if (listenerZen._color !== undefined && listenerZen._color === 0) {
    listenerZen._color = 1;
  }
}
```

**預期提升**: 5 listeners 從 19.76M → 24M ops/s (1.2x)

---

## 📊 預期總體提升

應用所有優化後：

| 項目 | 當前 | 優化後 | 提升 |
|------|------|--------|------|
| Batch 10 個 | 1.54M | 4-5M | **2-3x** 🔥 |
| 創建 signal | 33M | 50M+ | **1.5x** 🔥 |
| 寫入 (5 listeners) | 26M | 32M | **1.2x** ✅ |
| 批量創建 100 個 | 222K | 400K+ | **1.8x** 🔥 |

**總結**: 可以消除所有落後項目！

---

## 🚀 建議執行順序

1. **立即**: 優化 Batch（簡單，高回報）
2. **之後**: 減少內存分配（複雜，但解決創建慢的根本問題）
3. **可選**: markDirty 循環展開（中等回報）

要我開始實施這些優化嗎？
