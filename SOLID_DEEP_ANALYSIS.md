# SolidJS 深度源碼分析：為什麼比 Zen 快 25-48x

## 📋 目錄
1. [核心數據結構對比](#核心數據結構對比)
2. [關鍵性能優化點](#關鍵性能優化點)
3. [readSignal 深度分析](#readSignal-深度分析)
4. [writeSignal 深度分析](#writeSignal-深度分析)
5. [updateComputation 深度分析](#updateComputation-深度分析)
6. [與 Zen 的差異](#與-zen-的差異)
7. [可移植的優化](#可移植的優化)

---

## 核心數據結構對比

### SolidJS SignalState

```typescript
export interface SignalState<T> extends SourceMapValue {
  value: T;
  observers: Computation<any>[] | null;
  observerSlots: number[] | null;        // ✅ 關鍵：雙向索引
  tValue?: T;                            // ✅ Transition 支持
  comparator?: (prev: T, next: T) => boolean;
  internal?: true;
}
```

### SolidJS Computation

```typescript
export interface Computation<Init, Next extends Init = Init> extends Owner {
  fn: EffectFunction<Init, Next>;
  state: ComputationState;               // ✅ 0 | STALE(1) | PENDING(2)
  tState?: ComputationState;             // ✅ Transition state
  sources: SignalState<Next>[] | null;
  sourceSlots: number[] | null;          // ✅ 關鍵：雙向索引
  value?: Init;
  updatedAt: number | null;              // ✅ Timestamp tracking
  pure: boolean;                         // ✅ 區分 computed vs effect
  user?: boolean;
  suspense?: SuspenseContextType;
}
```

### Zen V7b (對比)

```typescript
type SNode<T> = {
  value: T;
  observers: CNode<any>[] | null;
  // ❌ 沒有 observerSlots - 無法 O(1) unsubscribe
  // ❌ 沒有 tValue - 無 Transition 支持
  // ❌ 沒有 comparator 字段分離
};

type CNode<T> = {
  value: T | null;
  fn: () => T;
  sources: (SNode<any> | CNode<any>)[] | null;
  // ❌ 沒有 sourceSlots - 無法 O(1) cleanup
  // ❌ 沒有 state/updatedAt - 兩種策略混用
  observers: CNode<any>[] | null;
  equals: (a: T, b: T) => boolean;
};
```

**關鍵發現 1: Bidirectional Slots**

SolidJS 使用 `observerSlots` 和 `sourceSlots` 實現 O(1) unsubscribe：

```typescript
// SolidJS cleanNode - O(1) per edge
while (node.sources!.length) {
  const source = node.sources!.pop()!,
        index = node.sourceSlots!.pop()!,      // ✅ 直接知道自己在 observers 中的位置
        obs = source.observers;
  if (obs && obs.length) {
    const n = obs.pop()!,
          s = source.observerSlots!.pop()!;
    if (index < obs.length) {
      n.sourceSlots![s] = index;               // ✅ Swap-and-pop
      obs[index] = n;
      source.observerSlots![index] = s;
    }
  }
}
```

Zen 的 cleanup 是 O(n) indexOf 查找：

```typescript
// Zen cleanSources - O(n) per edge
for (let i = 0; i < srcs.length; i++) {
  const src = srcs[i];
  const obs = src.observers;
  if (obs) {
    const idx = obs.indexOf(node);  // ❌ O(n) 線性查找
    if (idx !== -1) {
      const last = obs[obs.length - 1];
      obs[idx] = last;
      obs.pop();
    }
  }
}
```

**性能影響**: 對於深層依賴圖，cleanup 開銷是 O(n²) vs O(n)。

---

## 關鍵性能優化點

### 1. ✅ 三狀態管理 (CLEAN/STALE/PENDING)

```typescript
const STALE = 1;    // 確定需要更新
const PENDING = 2;  // 可能需要更新（需要向上檢查）

// writeSignal 標記觀察者
if (TransitionRunning ? !o.tState : !o.state) {
  if (o.pure) Updates!.push(o);
  else Effects!.push(o);
  if (o.observers) markDownstream(o);    // ✅ 只標記 PENDING
}
if (!TransitionRunning) o.state = STALE;
else o.tState = STALE;
```

對比 Zen V4 (只有兩狀態):

```typescript
// Zen V4 - 只有 dirty/clean (通過 timestamp)
function needsUpdate(node) {
  for (const source of node.sources) {
    if (source.updatedAt > node.updatedAt) return true;  // ❌ 總是遍歷所有 sources
  }
  return false;
}
```

**優勢**: SolidJS 的 PENDING 狀態允許延遲檢查，只在真正需要時才向上遍歷。

### 2. ✅ 分離 Updates 和 Effects 隊列

```typescript
let Updates: Computation<any>[] | null = null;  // pure computations
let Effects: Computation<any>[] | null = null;  // side effects

// writeSignal
if (o.pure) Updates!.push(o);
else Effects!.push(o);
```

**執行順序**:

1. `Updates` 先執行 (computations) - 在 `runUpdates` 中通過 `runQueue`
2. `Effects` 後執行 (effects) - 在 `completeUpdates` 中通過 `runEffects`

對比 Zen (沒有分離):

```typescript
// Zen - 所有更新在同一個隊列
const toUpdate = [...node.observers];
for (let i = 0; i < toUpdate.length; i++) {
  updateComputed(toUpdate[i]);  // ❌ 沒有優先級
}
```

**優勢**: 確保 computations 在 effects 之前完成，減少不必要的重計算。

### 3. ✅ runTop - 智能執行祖先鏈

```typescript
function runTop(node: Computation<any>) {
  if (node.state === 0) return;                    // ✅ 已經 CLEAN
  if (node.state === PENDING) return lookUpstream(node);

  const ancestors = [node];
  // ✅ 向上收集所有需要更新的祖先
  while (
    (node = node.owner as Computation<any>) &&
    (!node.updatedAt || node.updatedAt < ExecCount)
  ) {
    if (node.state) ancestors.push(node);
  }

  // ✅ 從最老的祖先開始執行（自頂向下）
  for (let i = ancestors.length - 1; i >= 0; i--) {
    node = ancestors[i];
    if (node.state === STALE) {
      updateComputation(node);
    } else if (node.state === PENDING) {
      lookUpstream(node, ancestors[0]);
    }
  }
}
```

對比 Zen (沒有祖先優化):

```typescript
// Zen - 直接更新，沒有祖先鏈優化
function update(node) {
  // ❌ 沒有檢查父級是否需要先更新
  node.value = node.fn();
  node.updatedAt = ++ExecCount;
}
```

**優勢**: 避免重複計算。如果父級會重新計算子級，子級不需要先更新。

### 4. ✅ lookUpstream - 只在需要時檢查

```typescript
function lookUpstream(node: Computation<any>, ignore?: Computation<any>) {
  node.state = 0;  // ✅ 先假設 CLEAN

  for (let i = 0; i < node.sources!.length; i += 1) {
    const source = node.sources![i] as Memo<any>;
    if (source.sources) {
      const state = source.state;
      if (state === STALE) {
        if (source !== ignore && (!source.updatedAt || source.updatedAt < ExecCount))
          runTop(source);              // ✅ 遞歸更新
      } else if (state === PENDING) {
        lookUpstream(source, ignore);  // ✅ 繼續向上檢查
      }
    }
  }
}
```

對比 Zen (總是檢查所有 sources):

```typescript
// Zen V4
function needsUpdate(node) {
  for (const source of node.sources) {
    if (source.updatedAt > node.updatedAt) return true;  // ❌ 總是完整遍歷
  }
  return false;
}
```

**優勢**: 惰性求值，只在必要時才檢查。

### 5. ✅ readSignal - 內聯的依賴追蹤

```typescript
export function readSignal(this: SignalState<any> | Memo<any>) {
  // ✅ 如果是 computed 且 STALE，先更新
  if (this.sources && this.state) {
    if (this.state === STALE)
      updateComputation(this);
    else {
      // ✅ PENDING - 檢查上游
      const updates = Updates;
      Updates = null;
      runUpdates(() => lookUpstream(this), false);
      Updates = updates;
    }
  }

  // ✅ 追蹤依賴 - 使用 bidirectional slots
  if (Listener) {
    const sSlot = this.observers ? this.observers.length : 0;
    if (!Listener.sources) {
      Listener.sources = [this];
      Listener.sourceSlots = [sSlot];  // ✅ 記錄位置
    } else {
      Listener.sources.push(this);
      Listener.sourceSlots!.push(sSlot);
    }
    if (!this.observers) {
      this.observers = [Listener];
      this.observerSlots = [Listener.sources.length - 1];  // ✅ 雙向索引
    } else {
      this.observers.push(Listener);
      this.observerSlots!.push(Listener.sources.length - 1);
    }
  }

  return this.value;
}
```

對比 Zen V7b:

```typescript
// Zen V7b getter
function getter(): T {
  if (Listener) {
    trackComputedDependency(Listener, node);  // ❌ 函數調用開銷
  }

  // ❌ 沒有 state 檢查，總是在 update 時才計算
  return node.value;
}

// 單獨的 tracking 函數
function trackComputedDependency(listener: CNode, computed: CNode) {
  const sources = listener.sources;
  if (!sources) {
    listener.sources = [computed];
    computed.observers = [listener];
    return;
  }

  // ✅ Check last (good)
  if (sources[sources.length - 1] === computed) return;

  // ❌ 線性查找去重
  for (let i = 0; i < sources.length; i++) {
    if (sources[i] === computed) return;
  }

  // ❌ 沒有 slots
  sources.push(computed);
  (computed.observers ??= []).push(listener);
}
```

**優勢**:
1. 內聯在 `readSignal` - 零函數調用開銷
2. Bidirectional slots - O(1) cleanup
3. State-aware lazy evaluation

### 6. ✅ writeSignal - 高效的觀察者通知

```typescript
export function writeSignal(node: SignalState<any> | Memo<any>, value: any, isComp?: boolean) {
  let current = node.value;

  // ✅ Comparator 檢查
  if (!node.comparator || !node.comparator(current, value)) {
    node.value = value;

    if (node.observers && node.observers.length) {
      runUpdates(() => {
        for (let i = 0; i < node.observers!.length; i += 1) {
          const o = node.observers![i];

          // ✅ 只標記未標記的
          if (!o.state) {
            if (o.pure) Updates!.push(o);
            else Effects!.push(o);
            if (o.observers) markDownstream(o);  // ✅ 標記為 PENDING
          }
          o.state = STALE;  // ✅ 直接觀察者標記為 STALE
        }

        // ✅ 無限循環檢測
        if (Updates!.length > 10e5) {
          Updates = [];
          throw new Error("Potential Infinite Loop Detected.");
        }
      }, false);
    }
  }
  return value;
}
```

對比 Zen V4:

```typescript
// Zen V4 setter
function setter(newValue: T): void {
  if (Object.is(node.value, newValue)) return;

  node.value = newValue;
  node.updatedAt = ++ExecCount;  // ✅ Timestamp

  // ❌ 沒有隊列，沒有批處理
  // ❌ 依賴者在讀取時才檢查 timestamp
}
```

**優勢**:
1. 立即標記 - 快速傳播狀態
2. 分離 Updates/Effects 隊列
3. 批處理執行

### 7. ✅ markDownstream - 延遲標記 PENDING

```typescript
function markDownstream(node: Memo<any>) {
  for (let i = 0; i < node.observers!.length; i += 1) {
    const o = node.observers![i];
    if (!o.state) {                    // ✅ 只標記 CLEAN 的
      o.state = PENDING;               // ✅ 標記為 PENDING，不是 STALE
      if (o.pure) Updates!.push(o);
      else Effects!.push(o);
      if (o.observers) markDownstream(o);  // ✅ 遞歸
    }
  }
}
```

**優勢**: 避免過度計算。間接觀察者標記為 PENDING，只在真正需要時才檢查。

---

## readSignal 深度分析

### 完整執行流程

```typescript
export function readSignal(this: SignalState<any> | Memo<any>) {
  const runningTransition = Transition && Transition.running;

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // PHASE 1: Lazy Evaluation (如果是 computed)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (
    this.sources &&                                    // ✅ 是 computed (有 sources)
    (runningTransition ? this.tState : this.state)   // ✅ 有 dirty state
  ) {
    if ((runningTransition ? this.tState : this.state) === STALE) {
      updateComputation(this);                         // ✅ STALE - 直接更新
    } else {
      // ✅ PENDING - 向上檢查是否真的需要更新
      const updates = Updates;
      Updates = null;                                 // ✅ 暫停當前更新隊列
      runUpdates(() => lookUpstream(this), false);
      Updates = updates;                              // ✅ 恢復隊列
    }
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // PHASE 2: Dependency Tracking (如果在 reactive context 中)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (Listener) {
    const sSlot = this.observers ? this.observers.length : 0;

    // ✅ Listener 首次追蹤依賴
    if (!Listener.sources) {
      Listener.sources = [this];
      Listener.sourceSlots = [sSlot];
    } else {
      // ✅ 追加依賴
      Listener.sources.push(this);
      Listener.sourceSlots!.push(sSlot);
    }

    // ✅ 雙向連接
    if (!this.observers) {
      this.observers = [Listener];
      this.observerSlots = [Listener.sources.length - 1];
    } else {
      this.observers.push(Listener);
      this.observerSlots!.push(Listener.sources.length - 1);
    }
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // PHASE 3: Return Value
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (runningTransition && Transition!.sources.has(this))
    return this.tValue;  // ✅ Transition 模式下返回 tValue

  return this.value;     // ✅ 返回當前值
}
```

### 性能特點

1. **零函數調用開銷** - 所有邏輯內聯在一個函數中
2. **Lazy Evaluation** - 只在真正需要時才計算
3. **State-Aware** - STALE 直接更新，PENDING 向上檢查
4. **Bidirectional Slots** - O(1) dependency management

---

## writeSignal 深度分析

### 完整執行流程

```typescript
export function writeSignal(node: SignalState<any> | Memo<any>, value: any, isComp?: boolean) {
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // PHASE 1: Get Current Value
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  let current =
    Transition && Transition.running && Transition.sources.has(node)
      ? node.tValue
      : node.value;

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // PHASE 2: Equality Check
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (!node.comparator || !node.comparator(current, value)) {
    // ✅ Value 實際改變了

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // PHASE 3: Update Value (考慮 Transition)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (Transition) {
      const TransitionRunning = Transition.running;
      if (TransitionRunning || (!isComp && Transition.sources.has(node))) {
        Transition.sources.add(node);
        node.tValue = value;              // ✅ Transition value
      }
      if (!TransitionRunning) node.value = value;
    } else {
      node.value = value;                 // ✅ 直接更新
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // PHASE 4: Notify Observers
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (node.observers && node.observers.length) {
      runUpdates(() => {
        for (let i = 0; i < node.observers!.length; i += 1) {
          const o = node.observers![i];
          const TransitionRunning = Transition && Transition.running;

          // ✅ 跳過已 disposed 的觀察者 (Transition mode)
          if (TransitionRunning && Transition!.disposed.has(o)) continue;

          // ✅ 只標記未標記的觀察者
          if (TransitionRunning ? !o.tState : !o.state) {
            // ✅ 分離 pure (computations) 和 effects
            if (o.pure) Updates!.push(o);
            else Effects!.push(o);

            // ✅ 如果觀察者有下游，標記為 PENDING
            if (o.observers) markDownstream(o);
          }

          // ✅ 標記直接觀察者為 STALE
          if (!TransitionRunning) o.state = STALE;
          else o.tState = STALE;
        }

        // ✅ 無限循環檢測
        if (Updates!.length > 10e5) {
          Updates = [];
          if (IS_DEV) throw new Error("Potential Infinite Loop Detected.");
          throw new Error();
        }
      }, false);
    }
  }
  return value;
}
```

### 性能特點

1. **智能標記** - 直接觀察者 STALE，間接觀察者 PENDING
2. **批處理** - 所有標記在 `runUpdates` 中完成
3. **分離隊列** - `Updates` (pure) vs `Effects` (side effects)
4. **Transition 支持** - 雙值系統 (value + tValue)

---

## updateComputation 深度分析

### 完整執行流程

```typescript
function updateComputation(node: Computation<any>) {
  if (!node.fn) return;  // ✅ 沒有計算函數，跳過

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // PHASE 1: Cleanup
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  cleanNode(node);  // ✅ O(1) cleanup (bidirectional slots)

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // PHASE 2: Execute Computation
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const time = ExecCount;
  runComputation(
    node,
    Transition && Transition.running && Transition.sources.has(node)
      ? node.tValue
      : node.value,
    time
  );

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // PHASE 3: Handle Transition (如果需要)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (Transition && !Transition.running && Transition.sources.has(node)) {
    queueMicrotask(() => {
      runUpdates(() => {
        Transition && (Transition.running = true);
        Listener = Owner = node;
        runComputation(node, node.tValue, time);
        Listener = Owner = null;
      }, false);
    });
  }
}

function runComputation(node: Computation<any>, value: any, time: number) {
  let nextValue;
  const owner = Owner,
        listener = Listener;

  // ✅ 設置 reactive context
  Listener = Owner = node;

  try {
    // ✅ 執行用戶函數
    nextValue = node.fn(value);
  } catch (err) {
    if (node.pure) {
      if (Transition && Transition.running) {
        node.tState = STALE;
        node.tOwned && node.tOwned!.forEach(cleanNode);
        node.tOwned = undefined;
      } else {
        node.state = STALE;
        node.owned && node.owned.forEach(cleanNode);
        node.owned = null;
      }
    }
    node.updatedAt = time + 1;
    return handleError(err);
  } finally {
    // ✅ 恢復 context
    Listener = listener;
    Owner = owner;
  }

  // ✅ 只在值改變時寫入
  if (!node.updatedAt || node.updatedAt <= time) {
    if (node.updatedAt != null && "observers" in node) {
      // ✅ 是 Memo - 使用 writeSignal 通知觀察者
      writeSignal(node, nextValue, true);
    } else if (Transition && Transition.running && node.pure) {
      Transition.sources.add(node);
      node.tValue = nextValue;
    } else {
      node.value = nextValue;
    }
    node.updatedAt = time;
  }
}
```

### 對比 Zen V4

```typescript
// Zen V4
function update<T>(node: CNode<T>): void {
  const isFirstRun = node.sources === null;

  // ✅ 只在首次追蹤依賴
  let prevListener = null;
  if (isFirstRun) {
    prevListener = Listener;
    Listener = node;
  }

  let newValue: T;
  try {
    newValue = node.fn();
  } finally {
    if (isFirstRun) {
      Listener = prevListener;
    }
  }

  // ❌ 每次都更新 timestamp（即使值沒變）
  node.updatedAt = ++ExecCount;

  // ✅ Equality check
  const old = node.value;
  if (old !== null && node.equals(newValue, old)) {
    return;  // ✅ 值沒變，不通知
  }

  node.value = newValue;

  // ❌ 沒有主動通知觀察者
  // 觀察者在讀取時檢查 timestamp
}
```

**關鍵差異**:

| 方面 | SolidJS | Zen V4 |
|------|---------|--------|
| **Cleanup** | ✅ 每次更新前清理 | ✅ 永久依賴（只追蹤一次） |
| **依賴追蹤** | ❌ 每次重新追蹤 | ✅ 只在首次 |
| **觀察者通知** | ✅ 主動推送 (writeSignal) | ❌ 被動拉取 (timestamp check) |
| **Cleanup 複雜度** | ✅ O(1) per edge (slots) | ❌ O(n) per edge (indexOf) |
| **Timestamp** | ✅ 只在值改變時更新 | ❌ 每次都更新 |

---

## 與 Zen 的差異

### 1. **動態依賴 vs 永久依賴**

**SolidJS** (動態依賴):
```typescript
// 每次更新都清理並重新追蹤
function updateComputation(node) {
  cleanNode(node);  // ✅ 清理舊依賴
  Listener = node;
  node.fn();        // ✅ 重新追蹤
  Listener = null;
}
```

**Zen V4** (永久依賴):
```typescript
// 只在首次追蹤依賴
function update(node) {
  const isFirstRun = node.sources === null;
  if (isFirstRun) {
    Listener = node;
  }
  node.fn();
  if (isFirstRun) {
    Listener = null;
  }
}
```

**權衡**:
- **SolidJS**: 支持動態依賴（條件 signals）- 開銷：每次 cleanup + re-track
- **Zen**: 更快的更新 - 限制：依賴必須靜態

### 2. **Push vs Pull**

**SolidJS** (Push-Pull混合):
```typescript
// Write: Push - 標記 STALE/PENDING
writeSignal(node, value) {
  for (const o of node.observers) {
    o.state = STALE;           // ✅ 推送狀態
    if (o.observers) markDownstream(o);  // ✅ 遞歸標記 PENDING
  }
}

// Read: Pull - 按需計算
readSignal() {
  if (this.state === STALE) {
    updateComputation(this);   // ✅ 拉取計算
  } else if (this.state === PENDING) {
    lookUpstream(this);        // ✅ 檢查是否真的需要更新
  }
  return this.value;
}
```

**Zen V4** (Pure Pull):
```typescript
// Write: 只更新 timestamp
setter(newValue) {
  node.value = newValue;
  node.updatedAt = ++ExecCount;  // ✅ 只標記時間
}

// Read: 檢查 timestamp
getter() {
  if (needsUpdate(node)) {       // ✅ 拉取檢查
    update(node);
  }
  return node.value;
}
```

**性能影響**:
- **SolidJS**: 寫入時標記（快速傳播），讀取時計算（延遲求值）
- **Zen**: 寫入時零開銷，讀取時總是檢查所有 sources

### 3. **State Management**

**SolidJS**: 三狀態
```typescript
const CLEAN = 0;
const STALE = 1;    // 確定髒
const PENDING = 2;  // 可能髒
```

**Zen**: 兩狀態（timestamp）
```typescript
// CLEAN: source.updatedAt <= node.updatedAt
// DIRTY: source.updatedAt > node.updatedAt
```

**優勢**:
- **SolidJS PENDING**: 延遲檢查，減少不必要的遍歷
- **Zen timestamp**: 更簡單，但總是檢查所有 sources

---

## 可移植的優化

### ✅ 可以借鑒的優化

#### 1. **Bidirectional Slots** - 最重要

```typescript
// ✅ 可以直接移植到 Zen
type SNode<T> = {
  value: T;
  observers: CNode<any>[] | null;
  observerSlots: number[] | null;  // ✅ 新增
};

type CNode<T> = {
  value: T | null;
  fn: () => T;
  sources: (SNode<any> | CNode<any>)[] | null;
  sourceSlots: number[] | null;    // ✅ 新增
  observers: CNode<any>[] | null;
  equals: (a: T, b: T) => boolean;
};

// ✅ O(1) cleanup
function cleanNode(node: CNode<any>) {
  while (node.sources.length) {
    const source = node.sources.pop()!;
    const index = node.sourceSlots!.pop()!;
    const obs = source.observers;

    if (obs && obs.length) {
      const n = obs.pop()!;
      const s = source.observerSlots!.pop()!;
      if (index < obs.length) {
        n.sourceSlots![s] = index;
        obs[index] = n;
        source.observerSlots![index] = s;
      }
    }
  }
}
```

**預期收益**: 對於深層依賴圖，cleanup 從 O(n²) → O(n)

#### 2. **內聯 Dependency Tracking** - 高收益

```typescript
// ✅ 不要分離成 trackSignalDependency 函數
function getter(): T {
  if (Listener) {
    const sSlot = node.observers ? node.observers.length : 0;
    if (!Listener.sources) {
      Listener.sources = [node];
      Listener.sourceSlots = [sSlot];
    } else {
      Listener.sources.push(node);
      Listener.sourceSlots.push(sSlot);
    }
    if (!node.observers) {
      node.observers = [Listener];
      node.observerSlots = [Listener.sources.length - 1];
    } else {
      node.observers.push(Listener);
      node.observerSlots.push(Listener.sources.length - 1);
    }
  }
  return node.value;
}
```

**預期收益**: 消除函數調用開銷，~5-10%

#### 3. **分離 Updates 和 Effects 隊列**

```typescript
let Updates: CNode<any>[] | null = null;  // computeds
let Effects: CNode<any>[] | null = null;  // effects

// 在 setter 中分類
function notifyObservers(node: SNode<any>) {
  for (const o of node.observers) {
    if (o.pure) Updates!.push(o);    // ✅ computed
    else Effects!.push(o);           // ✅ effect
  }
}

// 執行順序
function runUpdates() {
  // 1. 先執行 computeds
  if (Updates) {
    for (const c of Updates) updateComputation(c);
    Updates = null;
  }
  // 2. 後執行 effects
  if (Effects) {
    for (const e of Effects) updateComputation(e);
    Effects = null;
  }
}
```

**預期收益**: 減少重複計算，~10-15%

#### 4. **ExecCount Optimization** - 低成本高收益

```typescript
// ✅ 只在值改變時更新 updatedAt
function update(node: CNode<any>) {
  const oldValue = node.value;
  const newValue = node.fn();

  if (!node.equals(oldValue, newValue)) {
    node.value = newValue;
    node.updatedAt = ++ExecCount;  // ✅ 只在值變時更新
  }
  // ❌ 不要每次都更新 updatedAt
}
```

**預期收益**: 減少誤判，~5-8%

### ❌ 不可移植的優化

#### 1. **三狀態管理 (CLEAN/STALE/PENDING)** - 與永久依賴不兼容

原因: V7c 已經證明，PENDING 狀態需要動態依賴配合

#### 2. **Cleanup + Re-track** - 與 Zen 的設計哲學相悖

Zen 的優勢就是永久依賴，不應該放棄

#### 3. **Push-based Notification** - 會導致過度計算

V2/V3 已經證明，純 push-based 在複雜圖很慢

---

## 總結：性能差距的根本原因

### SolidJS 快的原因

1. **Bidirectional Slots** - O(1) cleanup，對深層圖影響巨大
2. **三狀態 + Push-Pull** - 智能的傳播和延遲求值
3. **內聯依賴追蹤** - 零函數調用開銷
4. **分離 Updates/Effects** - 減少重複計算
5. **每次 cleanup + re-track** - 支持動態依賴，允許激進優化

### Zen 的權衡

1. **永久依賴** - 更新快，但限制動態性
2. **Pure Pull** - 寫入零開銷，但讀取總是檢查
3. **簡單設計** - 易理解，易維護
4. **O(n) cleanup** - 對大部分場景足夠，但極端情況慢

### 可行的優化方向

**短期（可立即實現）**:
1. ✅ 加入 Bidirectional Slots - **預期 +30-50%**
2. ✅ 內聯依賴追蹤 - **預期 +5-10%**
3. ✅ 分離 Updates/Effects - **預期 +10-15%**
4. ✅ 優化 ExecCount 更新 - **預期 +5-8%**

**總預期收益**: **+50-83%** (但仍與 Solid 有 10-20x 差距)

**中期（需要重構）**:
- 混合策略：簡單圖用永久依賴，複雜圖用動態依賴

**長期（需要編譯器）**:
- 構建時分析依賴圖
- 內聯所有 signal 訪問
- 生成優化的更新代碼

---

## 下一步建議

### 選項 A: 實現 Zen V8 (Bidirectional Slots + Inline Tracking)

```typescript
// zen-v8.ts - 借鑒 SolidJS 的可移植優化
// 1. Bidirectional slots
// 2. 內聯依賴追蹤
// 3. 分離 Updates/Effects
// 4. 優化 ExecCount

預期性能:
- Diamond: 350-400K ops/s (+50-70% vs V7b)
- 仍與 Solid 有 10-15x 差距
- 但代碼複雜度顯著增加
```

### 選項 B: 接受現實

```
V4/V7b 已經是純運行時優化的極限
剩餘差距需要編譯器支持
繼續優化收益遞減
```

### 選項 C: 研究 Solid 編譯器

```bash
git clone https://github.com/solidjs/solid
# 研究 solid-js/babel-preset-solid
# 了解編譯時優化策略
```

---

**結論**: SolidJS 的性能優勢來自於精心設計的數據結構（Bidirectional Slots）、智能的狀態管理（三狀態）、以及願意每次 cleanup + re-track 的設計決策。Zen 可以借鑒部分優化（Slots, 內聯），但根本的設計哲學不同（永久依賴 vs 動態依賴），導致性能上限不同。

要真正追上 SolidJS，要么放棄永久依賴（回到 V1 的動態追蹤），要么引入編譯器。
