/**
 * Simple Performance Benchmark - No Effects
 * Focus on core primitives without complex scenarios
 */

import { createMemo, createSignal, batch as solidBatch } from 'solid-js';
import { bench, describe } from 'vitest';
import { batch, computed, zen } from './index';

// ============================================================================
// 1. RAW CREATION (Identify bottlenecks)
// ============================================================================

describe('Raw Creation', () => {
  bench('Zen: create 100 signals', () => {
    for (let i = 0; i < 100; i++) {
      zen(i);
    }
  });

  bench('Solid: create 100 signals', () => {
    for (let i = 0; i < 100; i++) {
      createSignal(i);
    }
  });

  bench('Zen: create 100 computeds (simple)', () => {
    const source = zen(0);
    for (let i = 0; i < 100; i++) {
      computed(() => source.value + i);
    }
  });

  bench('Solid: create 100 memos (simple)', () => {
    const [source] = createSignal(0);
    for (let i = 0; i < 100; i++) {
      createMemo(() => source() + i);
    }
  });
});

// ============================================================================
// 2. READ/WRITE OPS (No computed)
// ============================================================================

describe('Basic Read/Write', () => {
  bench('Zen: 1k writes', () => {
    const s = zen(0);
    for (let i = 0; i < 1000; i++) {
      s.value = i;
    }
  });

  bench('Solid: 1k writes', () => {
    const [_, set] = createSignal(0);
    for (let i = 0; i < 1000; i++) {
      set(i);
    }
  });

  bench('Zen: 1k reads', () => {
    const s = zen(42);
    let _sum = 0;
    for (let i = 0; i < 1000; i++) {
      _sum += s.value;
    }
  });

  bench('Solid: 1k reads', () => {
    const [get] = createSignal(42);
    let _sum = 0;
    for (let i = 0; i < 1000; i++) {
      _sum += get();
    }
  });
});

// ============================================================================
// 3. COMPUTED ACCESS (Pull-based evaluation)
// ============================================================================

describe('Computed Pull', () => {
  bench('Zen: computed pull (no subscription)', () => {
    const source = zen(0);
    const double = computed(() => source.value * 2);

    for (let i = 0; i < 1000; i++) {
      source.value = i;
      const _ = double.value; // Force evaluation
    }
  });

  bench('Solid: memo pull (no subscription)', () => {
    const [source, setSource] = createSignal(0);
    const double = createMemo(() => source() * 2);

    for (let i = 0; i < 1000; i++) {
      setSource(i);
      const _ = double(); // Force evaluation
    }
  });

  bench('Zen: diamond pull', () => {
    const source = zen(0);
    const left = computed(() => source.value * 2);
    const right = computed(() => source.value + 10);
    const result = computed(() => left.value + right.value);

    for (let i = 0; i < 1000; i++) {
      source.value = i;
      const _ = result.value;
    }
  });

  bench('Solid: diamond pull', () => {
    const [source, setSource] = createSignal(0);
    const left = createMemo(() => source() * 2);
    const right = createMemo(() => source() + 10);
    const result = createMemo(() => left() + right());

    for (let i = 0; i < 1000; i++) {
      setSource(i);
      const _ = result();
    }
  });
});

// ============================================================================
// 4. DEEP CHAINS (Pull-based)
// ============================================================================

describe('Deep Chain Pull', () => {
  bench('Zen: 5-level chain', () => {
    const base = zen(0);
    const c1 = computed(() => base.value * 2);
    const c2 = computed(() => c1.value + 1);
    const c3 = computed(() => c2.value * 3);
    const c4 = computed(() => c3.value - 5);
    const c5 = computed(() => c4.value * 2);

    for (let i = 0; i < 500; i++) {
      base.value = i;
      const _ = c5.value;
    }
  });

  bench('Solid: 5-level chain', () => {
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
});

// ============================================================================
// 5. BATCHING (Simple)
// ============================================================================

describe('Batching', () => {
  bench('Zen: batch 10 writes', () => {
    const signals = Array.from({ length: 10 }, () => zen(0));

    for (let i = 0; i < 100; i++) {
      batch(() => {
        for (const s of signals) {
          s.value = i;
        }
      });
    }
  });

  bench('Solid: batch 10 writes', () => {
    const signals = Array.from({ length: 10 }, () => createSignal(0));

    for (let i = 0; i < 100; i++) {
      solidBatch(() => {
        for (const [_, set] of signals) {
          set(i);
        }
      });
    }
  });
});

// ============================================================================
// 6. FANOUT (1 -> N)
// ============================================================================

describe('Fanout Pattern', () => {
  bench('Zen: 1 -> 50 computeds (pull)', () => {
    const source = zen(0);
    const computeds = Array.from({ length: 50 }, (_, i) => computed(() => source.value + i));

    for (let i = 0; i < 100; i++) {
      source.value = i;
      // Pull all values
      for (const c of computeds) {
        const _ = c.value;
      }
    }
  });

  bench('Solid: 1 -> 50 memos (pull)', () => {
    const [source, setSource] = createSignal(0);
    const memos = Array.from({ length: 50 }, (_, i) => createMemo(() => source() + i));

    for (let i = 0; i < 100; i++) {
      setSource(i);
      // Pull all values
      for (const m of memos) {
        const _ = m();
      }
    }
  });
});
