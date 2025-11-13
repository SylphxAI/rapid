# Zen Version Comparison Analysis
## v3.1.1 vs v3.2.0 vs v3.3.0

Based on code analysis and architectural changes.

---

## 🔍 Architecture Comparison

### v3.1.1 (Baseline)

**Batching Strategy**: Simple Map-based
```typescript
// v3.1.1 zen.ts
let batchDepth = 0;
const pendingNotifications = new Map<AnyZen, any>();
const pendingEffects: Array<() => void> = [];

export function batch<T>(fn: () => T): T {
  batchDepth++;
  try {
    return fn();
  } finally {
    batchDepth--;
    if (batchDepth === 0) {
      // Process pendingNotifications
      // Process pendingEffects
    }
  }
}
```

**Computed Evaluation**: Immediate
- Signal 更新 → 立即標記 computed dirty
- Batch 結束 → 處理 pendingNotifications
- **No queue-based batching**
- **No lazy evaluation**

**Characteristics**:
- ✅ Simple implementation
- ✅ Small bundle (1.68 KB gzipped)
- ❌ Computed 總是立即更新（即使在 batch 內）
- ❌ 無 Updates queue
- ❌ 無 lazy evaluation

---

### v3.2.0 (Queue-Based Eager)

**Batching Strategy**: Queue-based with Set
```typescript
// v3.2.0 zen.ts
let batchDepth = 0;
let Updates: Set<ComputedCore<any>> | null = null;  // NEW!
let Effects: Array<() => void> | null = null;        // NEW!
const pendingNotifications = new Map<AnyZen, any>();
let isProcessingUpdates = false;

export function batch<T>(fn: () => T): T {
  batchDepth = 1;
  Updates = new Set();     // Create per batch
  Effects = [];            // Create per batch

  try {
    const result = fn();

    // STEP 1: Process Updates (EAGER - all computed)
    if (Updates.size > 0) {
      for (const computed of Updates) {
        updateComputed(computed);  // Force update
      }
    }

    // STEP 2: Process pendingNotifications
    // STEP 3: Process Effects

    return result;
  } finally {
    batchDepth = 0;
    Updates = null;
    Effects = null;
  }
}
```

**Computed Evaluation**: Eager in batch
- Signal 更新 → 標記 dirty + 加入 Updates
- Batch 結束 → **強制計算所有 Updates**（即使沒有 listeners）
- 3-stage batch processing (Updates → Notifications → Effects)

**Characteristics**:
- ✅ Queue-based batching (更好的順序控制)
- ✅ Iterative Updates processing (處理依賴鏈)
- ✅ Set-based deduplication
- ❌ **Eager evaluation**（浪費計算）
- ❌ Per-batch allocation (GC 壓力)
- ⚠️ Bundle: 1.97 KB (+17% vs v3.1.1)

**性能問題**:
```typescript
// v3.2.0 行為
batch(() => {
  a.value = 1;
  b.value = 2;
});
// Batch 結束 → 計算所有 computed（即使沒人訪問）
// 浪費：100k batches = 100k 無用計算
```

---

### v3.3.0 (Pull-Based Lazy)

**Batching Strategy**: Queue-based with lazy evaluation
```typescript
// v3.3.0 zen.ts
let batchDepth = 0;
const Updates: Set<ComputedCore<any>> = new Set();  // Global reuse!
const Effects: Array<() => void> = [];              // Global reuse!
const pendingNotifications = new Map<AnyZen, any>();
let isProcessingUpdates = false;

export function batch<T>(fn: () => T): T {
  if (batchDepth > 0) {  // Nested batch
    batchDepth++;
    try { return fn(); }
    finally { batchDepth--; }
  }

  batchDepth = 1;

  try {
    const result = fn();

    if (batchDepth === 1) {  // Only outermost
      // STEP 1: Process Updates (LAZY - only with listeners)
      if (Updates.size > 0) {
        for (const computed of Updates) {
          // KEY CHANGE: Check for listeners!
          if (computed._listeners && computed._listeners.length > 0) {
            updateComputed(computed);  // Only if observed
          }
          // No listeners? Stay dirty, compute on access (lazy)
        }
        Updates.clear();  // Reuse!
      }

      // STEP 2: Process pendingNotifications
      // STEP 3: Process Effects
    }

    return result;
  } finally {
    batchDepth--;
    if (batchDepth === 0) {
      isProcessingUpdates = false;
    }
  }
}
```

**Computed Evaluation**: Pull-based lazy
- Signal 更新 → 標記 dirty + 加入 Updates
- Batch 結束 → **只計算有 listeners 的 computed**
- 無 listeners → 保持 dirty，等待訪問時計算（pull）

**Characteristics**:
- ✅ **Pull-based lazy evaluation** (0 wasted computes)
- ✅ **Global queue reuse** (減少 GC 壓力)
- ✅ Conditional dirty marking (skip already dirty)
- ✅ Simplified nesting (single depth counter)
- ✅ Bundle: 1.98 KB (maintained)

**性能提升**:
```typescript
// v3.3.0 行為
batch(() => {
  a.value = 1;
  b.value = 2;
});
// Batch 結束 → 檢查 listeners → 無則跳過
// 節省：100k batches with unobserved = 0 computes!

const val = c.value;  // ← 這時才計算（pull）
```

---

## 📊 性能對比分析

### 理論預測

基於架構差異，預測性能變化：

| Scenario | v3.1.1 | v3.2.0 | v3.3.0 | 預測 |
|----------|--------|--------|--------|------|
| **Simple Read/Write** | Baseline | Same | Same | v3.1.1 ≈ v3.2.0 ≈ v3.3.0 |
| **Batch (observed)** | Baseline | +10-15% | +30% | v3.3.0 > v3.2.0 > v3.1.1 |
| **Batch (unobserved)** | Baseline | **-50%** | +200% | v3.3.0 >> v3.1.1 > v3.2.0 |
| **Diamond Pattern** | Baseline | +20% | +30% | v3.3.0 > v3.2.0 > v3.1.1 |
| **Wide Fanout** | Baseline | +10% | +25% | v3.3.0 > v3.2.0 > v3.1.1 |
| **Memory Overhead** | Baseline | +15% | +5% | v3.1.1 > v3.3.0 > v3.2.0 |

### 關鍵差異場景

#### Scenario 1: Unobserved Computed (最大差異)

```typescript
const a = zen(1);
const b = zen(2);
const c = computed([a, b], (x, y) => x + y);

// No subscribe, just batch
for (let i = 0; i < 100000; i++) {
  batch(() => {
    a.value = i;
    b.value = i * 2;
  });
  // Don't access c.value
}
```

**預測結果**:
- v3.1.1: ~100k computes (computed 每次 signal 更新都算)
- v3.2.0: ~100k computes (batch 結束強制計算)
- v3.3.0: **0 computes** (無 listeners，完全 lazy)

**預測**: v3.2.0 ≈ v3.1.1, v3.3.0 **無限快** (因為不計算)

#### Scenario 2: Observed Computed (有 listeners)

```typescript
const a = zen(1);
const b = zen(2);
const c = computed([a, b], (x, y) => x + y);

subscribe(c, () => {});  // Has listener

for (let i = 0; i < 100000; i++) {
  batch(() => {
    a.value = i;
    b.value = i * 2;
  });
}
```

**預測結果**:
- v3.1.1: 處理 pendingNotifications（簡單）
- v3.2.0: 處理 Updates queue（額外開銷）
- v3.3.0: 處理 Updates queue + check listeners（優化過的）

**預測**: v3.3.0 > v3.1.1 > v3.2.0 (v3.2.0 最慢因為有額外 queue overhead 但沒優化)

#### Scenario 3: Simple Operations (無 batching)

```typescript
const s = zen(0);

for (let i = 0; i < 100000; i++) {
  s.value = i;
}
```

**預測結果**:
- v3.1.1: Direct setter (簡單)
- v3.2.0: Same as v3.1.1 (無 batch)
- v3.3.0: Same as v3.1.1 (無 batch)

**預測**: v3.1.1 ≈ v3.2.0 ≈ v3.3.0

---

## 🎯 關鍵發現

### v3.2.0 不一定全部快過 v3.1.1

**v3.2.0 會更慢的場景**:

1. **Observed Computed with Batch**
   - v3.2.0 有額外的 Updates queue 開銷
   - v3.1.1 只有簡單的 pendingNotifications
   - 預測：v3.1.1 可能快 10-20%

2. **Memory Allocation**
   - v3.2.0: 每次 batch 創建新的 Set + Array
   - v3.1.1: 只有 Map (更少 allocation)
   - 預測：v3.1.1 memory overhead 更低

3. **Simple Patterns Without Lazy Benefit**
   - 如果所有 computed 都有 listeners
   - v3.2.0 的 queue overhead 沒有回報
   - 預測：v3.1.1 可能略快

**v3.2.0 會更快的場景**:

1. **Deep Dependency Chains**
   - v3.2.0 有 iterative Updates processing
   - v3.1.1 可能有重複計算
   - 預測：v3.2.0 快 15-25%

2. **Diamond Patterns**
   - v3.2.0 的 Set deduplication
   - v3.1.1 可能重複通知
   - 預測：v3.2.0 快 10-20%

### v3.3.0 應該全面快過 v3.2.0

**v3.3.0 改進所有 v3.2.0 的問題**:

1. ✅ Queue reuse → 減少 GC
2. ✅ Lazy evaluation → 減少無用計算
3. ✅ Conditional dirty marking → 減少重複操作
4. ✅ Simplified nesting → 減少檢查開銷

**預測**: v3.3.0 應該在**所有場景**都快過或等於 v3.2.0

---

## 📋 需要實際測試驗證的場景

### 高優先級測試

1. **Batch with Observed Computed**
   ```typescript
   const a = zen(1);
   const c = computed([a], x => x * 2);
   subscribe(c, () => {});

   // Which is faster?
   for (i in 100k) {
     batch(() => a.value = i);
   }
   ```
   **預測**: v3.1.1 > v3.3.0 > v3.2.0

2. **Batch with Unobserved Computed**
   ```typescript
   const a = zen(1);
   const c = computed([a], x => x * 2);
   // No subscribe

   for (i in 100k) {
     batch(() => a.value = i);
   }
   ```
   **預測**: v3.3.0 >> v3.1.1 ≈ v3.2.0

3. **Simple Read/Write (No Batch)**
   ```typescript
   const s = zen(0);
   for (i in 100k) {
     s.value = i;
     const v = s.value;
   }
   ```
   **預測**: v3.1.1 ≈ v3.2.0 ≈ v3.3.0

4. **Diamond Pattern**
   ```typescript
   const root = zen(1);
   const left = computed([root], x => x * 2);
   const right = computed([root], x => x * 3);
   const merge = computed([left, right], (l, r) => l + r);
   subscribe(merge, () => {});

   for (i in 10k) {
     batch(() => root.value = i);
   }
   ```
   **預測**: v3.3.0 > v3.2.0 > v3.1.1

---

## 💡 結論

**v3.2.0 不一定全部好過 v3.1.1**

可能的結果：
- ✅ v3.2.0 在 **deep chains** 和 **diamond patterns** 更快
- ❌ v3.2.0 在 **simple batching** 和 **observed computed** 可能更慢
- ❓ v3.2.0 的 queue overhead 可能抵消部分優化

**v3.3.0 應該全面勝出**

預測：
- ✅ v3.3.0 在**所有場景**都 ≥ v3.2.0
- ✅ v3.3.0 在**大部分場景** > v3.1.1
- ✅ v3.3.0 只在極簡單場景可能 ≈ v3.1.1

**需要實際 benchmark 來驗證這些假設！**
