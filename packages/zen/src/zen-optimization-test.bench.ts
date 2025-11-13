/**
 * Benchmark: Current Zen vs Optimized Zen vs Solid
 *
 * This benchmark compares:
 * 1. Current zen implementation (from zen.ts)
 * 2. Optimized zen implementation (from zen-optimized.ts)
 * 3. Solid Signals (baseline)
 */

import { bench, describe } from 'vitest';

// Current zen
import { batch as zenBatchCurrent, computed as zenComputedCurrent, zen as zenCurrent } from './zen';

// Optimized zen
import { batch as zenBatchOpt, computed as zenComputedOpt, zen as zenOpt } from './zen-optimized';

// Solid
import { createMemo, createSignal, batch as solidBatch } from 'solid-js';

// ============================================================================
// 1. BATCHING - THE CRITICAL ISSUE (Current: 12-100x slower than Solid)
// ============================================================================

describe('Batching: 100 Updates (CRITICAL TEST)', () => {
  bench('[Baseline] Solid: batch 100 updates', () => {
    const signals = Array.from({ length: 100 }, () => createSignal(0));

    for (let i = 0; i < 100; i++) {
      solidBatch(() => {
        for (let j = 0; j < signals.length; j++) {
          signals[j][1](i + j);
        }
      });
    }
  });

  bench('[Current] Zen: batch 100 updates', () => {
    const signals = Array.from({ length: 100 }, () => zenCurrent(0));

    for (let i = 0; i < 100; i++) {
      zenBatchCurrent(() => {
        for (let j = 0; j < signals.length; j++) {
          signals[j].value = i + j;
        }
      });
    }
  });

  bench('[OPTIMIZED] Zen: batch 100 updates', () => {
    const signals = Array.from({ length: 100 }, () => zenOpt(0));

    for (let i = 0; i < 100; i++) {
      zenBatchOpt(() => {
        for (let j = 0; j < signals.length; j++) {
          signals[j].value = i + j;
        }
      });
    }
  });
});

describe('Batching: With Computed (CRITICAL TEST)', () => {
  bench('[Baseline] Solid: batch with memo', () => {
    const signals = Array.from({ length: 10 }, () => createSignal(0));
    const sum = createMemo(() => {
      let total = 0;
      for (const [get] of signals) {
        total += get();
      }
      return total;
    });

    for (let i = 0; i < 100; i++) {
      solidBatch(() => {
        for (const [_, set] of signals) {
          set(i);
        }
      });
      const _ = sum();
    }
  });

  bench('[Current] Zen: batch with computed', () => {
    const base = Array.from({ length: 10 }, () => zenCurrent(0));
    const sum = zenComputedCurrent(() => {
      let total = 0;
      for (const s of base) {
        total += s.value;
      }
      return total;
    });

    for (let i = 0; i < 100; i++) {
      zenBatchCurrent(() => {
        for (const s of base) {
          s.value = i;
        }
      });
      const _ = sum.value;
    }
  });

  bench('[OPTIMIZED] Zen: batch with computed', () => {
    const base = Array.from({ length: 10 }, () => zenOpt(0));
    const sum = zenComputedOpt(() => {
      let total = 0;
      for (const s of base) {
        total += s.value;
      }
      return total;
    });

    for (let i = 0; i < 100; i++) {
      zenBatchOpt(() => {
        for (const s of base) {
          s.value = i;
        }
      });
      const _ = sum.value;
    }
  });
});

// ============================================================================
// 2. BASIC OPERATIONS
// ============================================================================

describe('Basic: 10k Signal Writes', () => {
  bench('[Baseline] Solid', () => {
    const [_, setValue] = createSignal(0);
    for (let i = 0; i < 10000; i++) {
      setValue(i);
    }
  });

  bench('[Current] Zen', () => {
    const signal = zenCurrent(0);
    for (let i = 0; i < 10000; i++) {
      signal.value = i;
    }
  });

  bench('[OPTIMIZED] Zen', () => {
    const signal = zenOpt(0);
    for (let i = 0; i < 10000; i++) {
      signal.value = i;
    }
  });
});

describe('Basic: 10k Signal Reads', () => {
  bench('[Baseline] Solid', () => {
    const [value] = createSignal(42);
    let _sum = 0;
    for (let i = 0; i < 10000; i++) {
      _sum += value();
    }
  });

  bench('[Current] Zen', () => {
    const signal = zenCurrent(42);
    let _sum = 0;
    for (let i = 0; i < 10000; i++) {
      _sum += signal.value;
    }
  });

  bench('[OPTIMIZED] Zen', () => {
    const signal = zenOpt(42);
    let _sum = 0;
    for (let i = 0; i < 10000; i++) {
      _sum += signal.value;
    }
  });
});

// ============================================================================
// 3. COMPUTED VALUES
// ============================================================================

describe('Computed: Single Source', () => {
  bench('[Baseline] Solid: 1k updates', () => {
    const [source, setSource] = createSignal(0);
    const derived = createMemo(() => source() * 2);

    for (let i = 0; i < 1000; i++) {
      setSource(i);
      const _ = derived();
    }
  });

  bench('[Current] Zen: 1k updates', () => {
    const source = zenCurrent(0);
    const derived = zenComputedCurrent(() => source.value * 2);

    for (let i = 0; i < 1000; i++) {
      source.value = i;
      const _ = derived.value;
    }
  });

  bench('[OPTIMIZED] Zen: 1k updates', () => {
    const source = zenOpt(0);
    const derived = zenComputedOpt(() => source.value * 2);

    for (let i = 0; i < 1000; i++) {
      source.value = i;
      const _ = derived.value;
    }
  });
});

describe('Computed: 5 Sources', () => {
  bench('[Baseline] Solid: 1k updates', () => {
    const signals = Array.from({ length: 5 }, () => createSignal(0));
    const sum = createMemo(() => {
      let total = 0;
      for (const [get] of signals) {
        total += get();
      }
      return total;
    });

    for (let i = 0; i < 1000; i++) {
      signals[i % 5][1](i);
      const _ = sum();
    }
  });

  bench('[Current] Zen: 1k updates', () => {
    const sources = Array.from({ length: 5 }, () => zenCurrent(0));
    const sum = zenComputedCurrent(() => {
      let total = 0;
      for (const s of sources) {
        total += s.value;
      }
      return total;
    });

    for (let i = 0; i < 1000; i++) {
      sources[i % 5].value = i;
      const _ = sum.value;
    }
  });

  bench('[OPTIMIZED] Zen: 1k updates', () => {
    const sources = Array.from({ length: 5 }, () => zenOpt(0));
    const sum = zenComputedOpt(() => {
      let total = 0;
      for (const s of sources) {
        total += s.value;
      }
      return total;
    });

    for (let i = 0; i < 1000; i++) {
      sources[i % 5].value = i;
      const _ = sum.value;
    }
  });
});

// ============================================================================
// 4. DEEP CHAINS
// ============================================================================

describe('Computed: 5-Level Chain', () => {
  bench('[Baseline] Solid: 500 updates', () => {
    const [base, setBase] = createSignal(0);
    const c1 = createMemo(() => base() * 2);
    const c2 = createMemo(() => c1() + 1);
    const c3 = createMemo(() => c2() * 3);
    const c4 = createMemo(() => c3() - 5);
    const c5 = createMemo(() => c4() * 2);

    for (let i = 0; i < 500; i++) {
      setBase(i);
      const _ = c5();
    }
  });

  bench('[Current] Zen: 500 updates', () => {
    const base = zenCurrent(0);
    const c1 = zenComputedCurrent(() => base.value * 2);
    const c2 = zenComputedCurrent(() => c1.value + 1);
    const c3 = zenComputedCurrent(() => c2.value * 3);
    const c4 = zenComputedCurrent(() => c3.value - 5);
    const c5 = zenComputedCurrent(() => c4.value * 2);

    for (let i = 0; i < 500; i++) {
      base.value = i;
      const _ = c5.value;
    }
  });

  bench('[OPTIMIZED] Zen: 500 updates', () => {
    const base = zenOpt(0);
    const c1 = zenComputedOpt(() => base.value * 2);
    const c2 = zenComputedOpt(() => c1.value + 1);
    const c3 = zenComputedOpt(() => c2.value * 3);
    const c4 = zenComputedOpt(() => c3.value - 5);
    const c5 = zenComputedOpt(() => c4.value * 2);

    for (let i = 0; i < 500; i++) {
      base.value = i;
      const _ = c5.value;
    }
  });
});

// ============================================================================
// 5. DIAMOND PATTERN
// ============================================================================

describe('Computed: Diamond Pattern', () => {
  bench('[Baseline] Solid: 1k updates', () => {
    const [base, setBase] = createSignal(0);
    const left = createMemo(() => base() * 2);
    const right = createMemo(() => base() * 3);
    const final = createMemo(() => left() + right());

    for (let i = 0; i < 1000; i++) {
      setBase(i);
      const _ = final();
    }
  });

  bench('[Current] Zen: 1k updates', () => {
    const base = zenCurrent(0);
    const left = zenComputedCurrent(() => base.value * 2);
    const right = zenComputedCurrent(() => base.value * 3);
    const final = zenComputedCurrent(() => left.value + right.value);

    for (let i = 0; i < 1000; i++) {
      base.value = i;
      const _ = final.value;
    }
  });

  bench('[OPTIMIZED] Zen: 1k updates', () => {
    const base = zenOpt(0);
    const left = zenComputedOpt(() => base.value * 2);
    const right = zenComputedOpt(() => base.value * 3);
    const final = zenComputedOpt(() => left.value + right.value);

    for (let i = 0; i < 1000; i++) {
      base.value = i;
      const _ = final.value;
    }
  });
});

// ============================================================================
// 6. CREATION OVERHEAD
// ============================================================================

describe('Creation: 1000 Signals', () => {
  bench('[Baseline] Solid', () => {
    for (let i = 0; i < 1000; i++) {
      const _ = createSignal(i);
    }
  });

  bench('[Current] Zen', () => {
    for (let i = 0; i < 1000; i++) {
      const _ = zenCurrent(i);
    }
  });

  bench('[OPTIMIZED] Zen', () => {
    for (let i = 0; i < 1000; i++) {
      const _ = zenOpt(i);
    }
  });
});

describe('Creation: 1000 Computed', () => {
  bench('[Baseline] Solid', () => {
    const [base] = createSignal(0);
    for (let i = 0; i < 1000; i++) {
      const _ = createMemo(() => base() * i);
    }
  });

  bench('[Current] Zen', () => {
    const base = zenCurrent(0);
    for (let i = 0; i < 1000; i++) {
      const _ = zenComputedCurrent(() => base.value * i);
    }
  });

  bench('[OPTIMIZED] Zen', () => {
    const base = zenOpt(0);
    for (let i = 0; i < 1000; i++) {
      const _ = zenComputedOpt(() => base.value * i);
    }
  });
});
