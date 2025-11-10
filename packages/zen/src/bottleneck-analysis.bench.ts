/**
 * 深度瓶頸分析 - 找出所有性能熱點
 */

import { bench, describe } from 'vitest';
import * as ZenOptimized from '../dist/optimized/zen-optimized.js';

// ============================================================================
// 1. 創建瓶頸分析
// ============================================================================

describe('Creation Bottleneck: Step by Step', () => {
  bench('1. Create bare object', () => {
    const data = { _kind: 'zen', _value: 0 };
  });

  bench('2. Create object + closure getter', () => {
    const data = { _kind: 'zen', _value: 0 };
    const get = () => data._value;
  });

  bench('3. Create object + closure setter', () => {
    const data = { _kind: 'zen', _value: 0 };
    const set = (val: number) => { data._value = val; };
  });

  bench('4. Create object + both closures', () => {
    const data = { _kind: 'zen', _value: 0 };
    const get = () => data._value;
    const set = (val: number) => { data._value = val; };
  });

  bench('5. Full creation (with wrapper object)', () => {
    const data = { _kind: 'zen', _value: 0 };
    const get = () => data._value;
    const set = (val: number) => { data._value = val; };
    const result = { get, set, _zenData: data };
  });

  bench('6. Actual zen creation', () => {
    ZenOptimized.zen(0);
  });
});

// ============================================================================
// 2. Setter 瓶頸分析
// ============================================================================

describe('Setter Bottleneck: With Listeners', () => {
  const sig1 = ZenOptimized.zen(0);

  const sig5 = ZenOptimized.zen(0);
  for (let i = 0; i < 5; i++) {
    ZenOptimized.subscribe(sig5._zenData, () => {});
  }

  const sig10 = ZenOptimized.zen(0);
  for (let i = 0; i < 10; i++) {
    ZenOptimized.subscribe(sig10._zenData, () => {});
  }

  let counter = 0;

  bench('No listeners', () => {
    sig1.set(++counter);
  });

  bench('5 listeners', () => {
    sig5.set(++counter);
  });

  bench('10 listeners', () => {
    sig10.set(++counter);
  });
});

describe('Setter Bottleneck: Listener Call Overhead', () => {
  // 測試不同複雜度的 listener
  const sigEmpty = ZenOptimized.zen(0);
  ZenOptimized.subscribe(sigEmpty._zenData, () => {});

  const sigSimple = ZenOptimized.zen(0);
  ZenOptimized.subscribe(sigSimple._zenData, (val) => { const x = val + 1; });

  const sigComplex = ZenOptimized.zen(0);
  ZenOptimized.subscribe(sigComplex._zenData, (val) => {
    let sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += val;
    }
  });

  let counter = 0;

  bench('Empty listener', () => {
    sigEmpty.set(++counter);
  });

  bench('Simple listener', () => {
    sigSimple.set(++counter);
  });

  bench('Complex listener', () => {
    sigComplex.set(++counter);
  });
});

// ============================================================================
// 3. Object.is vs === 性能對比
// ============================================================================

describe('Object.is vs === Overhead', () => {
  const testValues = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  let i = 0;

  bench('Object.is', () => {
    const oldVal = testValues[i % 10];
    const newVal = testValues[++i % 10];
    if (!Object.is(newVal, oldVal)) {
      // simulate update
    }
  });

  bench('===', () => {
    const oldVal = testValues[i % 10];
    const newVal = testValues[++i % 10];
    if (newVal !== oldVal) {
      // simulate update
    }
  });
});

// ============================================================================
// 4. Array 操作瓶頸
// ============================================================================

describe('Array Operations: Listener Management', () => {
  bench('Array push (add listener)', () => {
    const listeners: Array<() => void> = [];
    for (let i = 0; i < 5; i++) {
      listeners.push(() => {});
    }
  });

  bench('Array swap-remove (remove listener)', () => {
    const listeners: Array<() => void> = [() => {}, () => {}, () => {}, () => {}, () => {}];
    const idx = 2;
    const lastIdx = listeners.length - 1;
    if (idx !== lastIdx) {
      listeners[idx] = listeners[lastIdx];
    }
    listeners.pop();
  });

  bench('Array splice (alternative)', () => {
    const listeners: Array<() => void> = [() => {}, () => {}, () => {}, () => {}, () => {}];
    listeners.splice(2, 1);
  });
});

// ============================================================================
// 5. Closure vs Direct Access
// ============================================================================

describe('Closure Overhead Analysis', () => {
  const data = { _value: 42 };
  const getClosure = () => data._value;

  bench('Direct property access', () => {
    const val = data._value;
  });

  bench('Closure function call', () => {
    const val = getClosure();
  });

  bench('Closure inline call', () => {
    const val = (() => data._value)();
  });
});

// ============================================================================
// 6. markDirty 瓶頸
// ============================================================================

describe('markDirty Performance', () => {
  const sig0 = ZenOptimized.zen(0);  // No listeners

  const sig1 = ZenOptimized.zen(0);
  ZenOptimized.subscribe(sig1._zenData, () => {});

  const sig5 = ZenOptimized.zen(0);
  for (let i = 0; i < 5; i++) {
    ZenOptimized.subscribe(sig5._zenData, () => {});
  }

  let counter = 0;

  bench('markDirty - no listeners', () => {
    sig0.set(++counter);
  });

  bench('markDirty - 1 listener', () => {
    sig1.set(++counter);
  });

  bench('markDirty - 5 listeners', () => {
    sig5.set(++counter);
  });
});

// ============================================================================
// 7. 批量創建的開銷分析
// ============================================================================

describe('Bulk Creation Overhead', () => {
  bench('Create 10 signals', () => {
    for (let i = 0; i < 10; i++) {
      ZenOptimized.zen(i);
    }
  });

  bench('Create 10 signals + store in array', () => {
    const signals = [];
    for (let i = 0; i < 10; i++) {
      signals.push(ZenOptimized.zen(i));
    }
  });

  bench('Create 10 signals + Array.from', () => {
    Array.from({ length: 10 }, (_, i) => ZenOptimized.zen(i));
  });
});

// ============================================================================
// 8. 內存分配模式
// ============================================================================

describe('Memory Allocation Patterns', () => {
  bench('Allocate 100 small objects', () => {
    for (let i = 0; i < 100; i++) {
      const obj = { a: i, b: i * 2 };
    }
  });

  bench('Allocate 100 zen signals', () => {
    for (let i = 0; i < 100; i++) {
      ZenOptimized.zen(i);
    }
  });

  bench('Allocate 100 closures', () => {
    for (let i = 0; i < 100; i++) {
      const fn = () => i;
    }
  });
});

// ============================================================================
// 9. Subscribe 操作瓶頸
// ============================================================================

describe('Subscribe Operation Overhead', () => {
  bench('Subscribe to signal', () => {
    const sig = ZenOptimized.zen(0);
    ZenOptimized.subscribe(sig._zenData, () => {});
  });

  bench('Subscribe + immediate unsubscribe', () => {
    const sig = ZenOptimized.zen(0);
    const unsub = ZenOptimized.subscribe(sig._zenData, () => {});
    unsub();
  });

  bench('Subscribe to 5 signals', () => {
    const signals = Array.from({ length: 5 }, () => ZenOptimized.zen(0));
    signals.forEach(sig => ZenOptimized.subscribe(sig._zenData, () => {}));
  });
});

// ============================================================================
// 10. Batch 操作詳細分析
// ============================================================================

describe('Batch Operation Breakdown', () => {
  const signals = Array.from({ length: 10 }, (_, i) => ZenOptimized.zen(i));
  signals.forEach(sig => ZenOptimized.subscribe(sig._zenData, () => {}));

  let counter = 0;

  bench('10 individual sets (no batch)', () => {
    signals.forEach(sig => sig.set(++counter));
  });

  bench('10 sets in batch', () => {
    ZenOptimized.batch(() => {
      signals.forEach(sig => sig.set(++counter));
    });
  });

  bench('Empty batch call', () => {
    ZenOptimized.batch(() => {});
  });

  bench('Batch with 1 set', () => {
    ZenOptimized.batch(() => {
      signals[0].set(++counter);
    });
  });
});
