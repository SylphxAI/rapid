/**
 * FAIR BENCHMARK: Zen v3.1.1 vs Solid Signals
 *
 * This benchmark uses built distributions:
 * - Zen: from /packages/zen/dist
 * - Solid: from node_modules
 *
 * All tests are run with production builds to ensure fair comparison.
 */

import { bench, describe } from 'vitest';

// Import Zen from built dist
import { zen, computed as zenComputed, batch as zenBatch, subscribe as zenSubscribe } from '../packages/zen/dist/index.js';

// Import Solid from node_modules
import { createSignal, createEffect, createMemo, batch as solidBatch } from 'solid-js';

// ============================================================================
// 1. BASIC SIGNAL OPERATIONS
// ============================================================================

describe('Basic Operations: Signal Read/Write', () => {
  bench('Zen: 10k writes', () => {
    const signal = zen(0);
    for (let i = 0; i < 10000; i++) {
      signal.value = i;
    }
  });

  bench('Solid: 10k writes', () => {
    const [_, setValue] = createSignal(0);
    for (let i = 0; i < 10000; i++) {
      setValue(i);
    }
  });

  bench('Zen: 10k reads', () => {
    const signal = zen(42);
    let sum = 0;
    for (let i = 0; i < 10000; i++) {
      sum += signal.value;
    }
  });

  bench('Solid: 10k reads', () => {
    const [value] = createSignal(42);
    let sum = 0;
    for (let i = 0; i < 10000; i++) {
      sum += value();
    }
  });

  bench('Zen: alternating read/write (10k)', () => {
    const signal = zen(0);
    for (let i = 0; i < 10000; i++) {
      signal.value = i;
      const _ = signal.value;
    }
  });

  bench('Solid: alternating read/write (10k)', () => {
    const [value, setValue] = createSignal(0);
    for (let i = 0; i < 10000; i++) {
      setValue(i);
      const _ = value();
    }
  });
});

// ============================================================================
// 2. COMPUTED VALUES - Single Dependency
// ============================================================================

describe('Computed: Single Dependency', () => {
  bench('Zen: 1 source, 1k updates', () => {
    const source = zen(0);
    const derived = zenComputed(() => source.value * 2);

    for (let i = 0; i < 1000; i++) {
      source.value = i;
      const _ = derived.value;
    }
  });

  bench('Solid: 1 source, 1k updates', () => {
    const [source, setSource] = createSignal(0);
    const derived = createMemo(() => source() * 2);

    for (let i = 0; i < 1000; i++) {
      setSource(i);
      const _ = derived();
    }
  });
});

// ============================================================================
// 3. COMPUTED VALUES - Multiple Dependencies
// ============================================================================

describe('Computed: Multiple Dependencies', () => {
  bench('Zen: 5 sources, 1k updates', () => {
    const sources = Array.from({ length: 5 }, () => zen(0));
    const sum = zenComputed(() => {
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

  bench('Solid: 5 sources, 1k updates', () => {
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

  bench('Zen: 10 sources, 1k updates', () => {
    const sources = Array.from({ length: 10 }, () => zen(0));
    const sum = zenComputed(() => {
      let total = 0;
      for (const s of sources) {
        total += s.value;
      }
      return total;
    });

    for (let i = 0; i < 1000; i++) {
      sources[i % 10].value = i;
      const _ = sum.value;
    }
  });

  bench('Solid: 10 sources, 1k updates', () => {
    const signals = Array.from({ length: 10 }, () => createSignal(0));
    const sum = createMemo(() => {
      let total = 0;
      for (const [get] of signals) {
        total += get();
      }
      return total;
    });

    for (let i = 0; i < 1000; i++) {
      signals[i % 10][1](i);
      const _ = sum();
    }
  });
});

// ============================================================================
// 4. DEEP CHAINS
// ============================================================================

describe('Computed: Deep Chains', () => {
  bench('Zen: 5-level chain, 500 updates', () => {
    const base = zen(0);
    const c1 = zenComputed(() => base.value * 2);
    const c2 = zenComputed(() => c1.value + 1);
    const c3 = zenComputed(() => c2.value * 3);
    const c4 = zenComputed(() => c3.value - 5);
    const c5 = zenComputed(() => c4.value * 2);

    for (let i = 0; i < 500; i++) {
      base.value = i;
      const _ = c5.value;
    }
  });

  bench('Solid: 5-level chain, 500 updates', () => {
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

  bench('Zen: 10-level chain, 200 updates', () => {
    const base = zen(0);
    let prev: any = base;
    const chain: any[] = [];

    for (let i = 0; i < 10; i++) {
      const next = zenComputed(() => {
        const val = prev.value ?? prev;
        return val * 2 + 1;
      });
      chain.push(next);
      prev = next;
    }

    const final = chain[chain.length - 1];
    for (let i = 0; i < 200; i++) {
      base.value = i;
      const _ = final.value;
    }
  });

  bench('Solid: 10-level chain, 200 updates', () => {
    const [base, setBase] = createSignal(0);
    let prev: any = base;
    const chain: any[] = [];

    for (let i = 0; i < 10; i++) {
      const next = createMemo(() => prev() * 2 + 1);
      chain.push(next);
      prev = next;
    }

    const final = chain[chain.length - 1];
    for (let i = 0; i < 200; i++) {
      setBase(i);
      const _ = final();
    }
  });
});

// ============================================================================
// 5. DIAMOND PATTERN
// ============================================================================

describe('Computed: Diamond Pattern', () => {
  bench('Zen: simple diamond, 1k updates', () => {
    const base = zen(0);
    const left = zenComputed(() => base.value * 2);
    const right = zenComputed(() => base.value * 3);
    const final = zenComputed(() => left.value + right.value);

    for (let i = 0; i < 1000; i++) {
      base.value = i;
      const _ = final.value;
    }
  });

  bench('Solid: simple diamond, 1k updates', () => {
    const [base, setBase] = createSignal(0);
    const left = createMemo(() => base() * 2);
    const right = createMemo(() => base() * 3);
    const final = createMemo(() => left() + right());

    for (let i = 0; i < 1000; i++) {
      setBase(i);
      const _ = final();
    }
  });

  bench('Zen: wide diamond (4->2->1), 500 updates', () => {
    const base = zen(0);
    const a = zenComputed(() => base.value * 2);
    const b = zenComputed(() => base.value * 3);
    const c = zenComputed(() => base.value * 4);
    const d = zenComputed(() => base.value * 5);
    const e = zenComputed(() => a.value + b.value);
    const f = zenComputed(() => c.value + d.value);
    const final = zenComputed(() => e.value + f.value);

    for (let i = 0; i < 500; i++) {
      base.value = i;
      const _ = final.value;
    }
  });

  bench('Solid: wide diamond (4->2->1), 500 updates', () => {
    const [base, setBase] = createSignal(0);
    const a = createMemo(() => base() * 2);
    const b = createMemo(() => base() * 3);
    const c = createMemo(() => base() * 4);
    const d = createMemo(() => base() * 5);
    const e = createMemo(() => a() + b());
    const f = createMemo(() => c() + d());
    const final = createMemo(() => e() + f());

    for (let i = 0; i < 500; i++) {
      setBase(i);
      const _ = final();
    }
  });
});

// ============================================================================
// 6. BATCHING (Critical Performance Area)
// ============================================================================

describe('Batching: Multiple Updates', () => {
  bench('Zen: batch 100 updates', () => {
    const signals = Array.from({ length: 100 }, () => zen(0));

    for (let i = 0; i < 100; i++) {
      zenBatch(() => {
        for (let j = 0; j < signals.length; j++) {
          signals[j].value = i + j;
        }
      });
    }
  });

  bench('Solid: batch 100 updates', () => {
    const signals = Array.from({ length: 100 }, () => createSignal(0));

    for (let i = 0; i < 100; i++) {
      solidBatch(() => {
        for (let j = 0; j < signals.length; j++) {
          signals[j][1](i + j);
        }
      });
    }
  });

  bench('Zen: batch with computed, 100 iterations', () => {
    const base = Array.from({ length: 10 }, () => zen(0));
    const sum = zenComputed(() => {
      let total = 0;
      for (const s of base) {
        total += s.value;
      }
      return total;
    });

    // Subscribe to trigger updates
    let count = 0;
    zenSubscribe(sum, () => { count++; });

    for (let i = 0; i < 100; i++) {
      zenBatch(() => {
        for (const s of base) {
          s.value = i;
        }
      });
    }
  });

  bench('Solid: batch with memo, 100 iterations', () => {
    const signals = Array.from({ length: 10 }, () => createSignal(0));
    const sum = createMemo(() => {
      let total = 0;
      for (const [get] of signals) {
        total += get();
      }
      return total;
    });

    // Subscribe to trigger updates
    let count = 0;
    createEffect(() => {
      sum();
      count++;
    });

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
// 7. COMPLEX DEPENDENCY GRAPHS
// ============================================================================

describe('Complex: Large Dependency Graph', () => {
  bench('Zen: 100 signals + 50 computed (diamond patterns)', () => {
    const bases = Array.from({ length: 100 }, () => zen(0));

    const layer1 = Array.from({ length: 50 }, (_, i) => {
      const idx1 = i * 2;
      const idx2 = i * 2 + 1;
      return zenComputed(() => bases[idx1].value + bases[idx2].value);
    });

    const layer2 = Array.from({ length: 25 }, (_, i) => {
      const idx1 = i * 2;
      const idx2 = i * 2 + 1;
      return zenComputed(() => layer1[idx1].value * layer1[idx2].value);
    });

    const final = zenComputed(() => {
      let sum = 0;
      for (const c of layer2) {
        sum += c.value;
      }
      return sum;
    });

    for (let i = 0; i < 100; i++) {
      bases[i % 100].value = i;
      const _ = final.value;
    }
  });

  bench('Solid: 100 signals + 50 memos (diamond patterns)', () => {
    const bases = Array.from({ length: 100 }, () => createSignal(0));

    const layer1 = Array.from({ length: 50 }, (_, i) => {
      const idx1 = i * 2;
      const idx2 = i * 2 + 1;
      return createMemo(() => bases[idx1][0]() + bases[idx2][0]());
    });

    const layer2 = Array.from({ length: 25 }, (_, i) => {
      const idx1 = i * 2;
      const idx2 = i * 2 + 1;
      return createMemo(() => layer1[idx1]() * layer1[idx2]());
    });

    const final = createMemo(() => {
      let sum = 0;
      for (const memo of layer2) {
        sum += memo();
      }
      return sum;
    });

    for (let i = 0; i < 100; i++) {
      bases[i % 100][1](i);
      const _ = final();
    }
  });
});

// ============================================================================
// 8. CREATION/INSTANTIATION
// ============================================================================

describe('Creation: Instantiation Overhead', () => {
  bench('Zen: create 1000 signals', () => {
    for (let i = 0; i < 1000; i++) {
      const _ = zen(i);
    }
  });

  bench('Solid: create 1000 signals', () => {
    for (let i = 0; i < 1000; i++) {
      const _ = createSignal(i);
    }
  });

  bench('Zen: create 1000 computed', () => {
    const base = zen(0);
    for (let i = 0; i < 1000; i++) {
      const _ = zenComputed(() => base.value * i);
    }
  });

  bench('Solid: create 1000 memos', () => {
    const [base] = createSignal(0);
    for (let i = 0; i < 1000; i++) {
      const _ = createMemo(() => base() * i);
    }
  });
});

// ============================================================================
// 9. STRESS TESTS
// ============================================================================

describe('Stress: High-Frequency Updates', () => {
  bench('Zen: 10k rapid updates', () => {
    const signal = zen(0);
    const derived = zenComputed(() => signal.value * 2);

    for (let i = 0; i < 10000; i++) {
      signal.value = i;
    }

    const _ = derived.value;
  });

  bench('Solid: 10k rapid updates', () => {
    const [signal, setSignal] = createSignal(0);
    const derived = createMemo(() => signal() * 2);

    for (let i = 0; i < 10000; i++) {
      setSignal(i);
    }

    const _ = derived();
  });

  bench('Zen: 1k updates across 100 signals', () => {
    const signals = Array.from({ length: 100 }, () => zen(0));

    for (let i = 0; i < 1000; i++) {
      signals[i % 100].value = i;
    }
  });

  bench('Solid: 1k updates across 100 signals', () => {
    const signals = Array.from({ length: 100 }, () => createSignal(0));

    for (let i = 0; i < 1000; i++) {
      signals[i % 100][1](i);
    }
  });
});

// ============================================================================
// 10. REAL-WORLD PATTERNS
// ============================================================================

describe('Real-World: Shopping Cart', () => {
  bench('Zen: shopping cart with computed totals', () => {
    const items = Array.from({ length: 10 }, (_, i) => zen(10 + i));
    const quantities = Array.from({ length: 10 }, () => zen(1));

    const subtotals = items.map((price, i) =>
      zenComputed(() => price.value * quantities[i].value)
    );

    const total = zenComputed(() => {
      let sum = 0;
      for (const st of subtotals) {
        sum += st.value;
      }
      return sum;
    });

    for (let i = 0; i < 100; i++) {
      quantities[i % 10].value = (i % 5) + 1;
      const _ = total.value;
    }
  });

  bench('Solid: shopping cart with computed totals', () => {
    const items = Array.from({ length: 10 }, (_, i) => createSignal(10 + i));
    const quantities = Array.from({ length: 10 }, () => createSignal(1));

    const subtotals = items.map((price, i) =>
      createMemo(() => price[0]() * quantities[i][0]())
    );

    const total = createMemo(() => {
      let sum = 0;
      for (const st of subtotals) {
        sum += st();
      }
      return sum;
    });

    for (let i = 0; i < 100; i++) {
      quantities[i % 10][1]((i % 5) + 1);
      const _ = total();
    }
  });
});

describe('Real-World: Form Validation', () => {
  bench('Zen: form with validation', () => {
    const email = zen('');
    const password = zen('');
    const confirmPassword = zen('');

    const emailValid = zenComputed(() =>
      email.value.includes('@') && email.value.length > 5
    );

    const passwordValid = zenComputed(() =>
      password.value.length >= 8
    );

    const passwordsMatch = zenComputed(() =>
      password.value === confirmPassword.value && password.value.length > 0
    );

    const formValid = zenComputed(() =>
      emailValid.value && passwordValid.value && passwordsMatch.value
    );

    for (let i = 0; i < 100; i++) {
      email.value = `user${i}@example.com`;
      password.value = `password${i}`;
      confirmPassword.value = `password${i}`;
      const _ = formValid.value;
    }
  });

  bench('Solid: form with validation', () => {
    const [email, setEmail] = createSignal('');
    const [password, setPassword] = createSignal('');
    const [confirmPassword, setConfirmPassword] = createSignal('');

    const emailValid = createMemo(() =>
      email().includes('@') && email().length > 5
    );

    const passwordValid = createMemo(() =>
      password().length >= 8
    );

    const passwordsMatch = createMemo(() =>
      password() === confirmPassword() && password().length > 0
    );

    const formValid = createMemo(() =>
      emailValid() && passwordValid() && passwordsMatch()
    );

    for (let i = 0; i < 100; i++) {
      setEmail(`user${i}@example.com`);
      setPassword(`password${i}`);
      setConfirmPassword(`password${i}`);
      const _ = formValid();
    }
  });
});
