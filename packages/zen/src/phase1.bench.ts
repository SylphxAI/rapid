/**
 * Phase 1 Optimization Benchmarks
 * Measures performance impact of:
 * - Object Pooling
 * - Lifecycle Cleanup API
 * - Untracked Execution
 */

import { bench, describe } from 'vitest';
import { computed, dispose } from './computed';
import { cleanup, onMount, onStart, onStop } from './lifecycle';
import { tracked, untracked } from './untracked';
import { zen } from './zen';

describe('Phase 1: Object Pooling Impact', () => {
  bench('Computed creation with pooling', () => {
    const a = zen(1);
    const b = zen(2);
    const _c = computed([a, b], (x, y) => x + y);
  });

  bench('Computed creation + disposal (pool reuse)', () => {
    const a = zen(1);
    const b = zen(2);
    const c = computed([a, b], (x, y) => x + y);
    dispose(c);
  });

  bench('Mass computed creation + disposal', () => {
    const a = zen(1);
    const computeds = [];

    // Create 100 computed values
    for (let i = 0; i < 100; i++) {
      computeds.push(computed([a], (x) => x * i));
    }

    // Dispose all
    for (const c of computeds) {
      dispose(c);
    }
  });
});

describe('Phase 1: Lifecycle Cleanup Overhead', () => {
  bench('onMount without cleanup', () => {
    const z = zen(0);
    const unsub = onMount(z, () => {
      // No cleanup
    });
    unsub();
  });

  bench('onMount with cleanup', () => {
    const z = zen(0);
    const unsub = onMount(z, () => {
      return () => {
        // Cleanup
      };
    });
    unsub();
  });

  bench('onStart/onStop with cleanup', () => {
    const z = zen(0);
    const unsub1 = onStart(z, () => {
      return () => {};
    });
    const unsub2 = onStop(z, () => {
      return () => {};
    });
    unsub1();
    unsub2();
  });

  bench('Manual cleanup call', () => {
    const z = zen(0);
    onMount(z, () => {
      return () => {};
    });
    cleanup(z);
  });
});

describe('Phase 1: Untracked Execution Performance', () => {
  bench('Normal reactive read', () => {
    const a = zen(1);
    const b = zen(2);

    const c = computed([a], (x) => {
      const y = b._value;
      return x + y;
    });

    const _ = c._value;
  });

  bench('Untracked reactive read', () => {
    const a = zen(1);
    const b = zen(2);

    const c = computed([a], (x) => {
      const y = untracked(() => b._value);
      return x + y;
    });

    const _ = c._value;
  });

  bench('Deep untracked nesting', () => {
    const a = zen(1);

    untracked(() => {
      untracked(() => {
        untracked(() => {
          const _ = a._value;
        });
      });
    });
  });

  bench('Tracked/untracked alternation', () => {
    const a = zen(1);

    untracked(() => {
      tracked(() => {
        untracked(() => {
          tracked(() => {
            const _ = a._value;
          });
        });
      });
    });
  });
});

describe('Phase 1: Combined Optimization Stress Test', () => {
  bench('Realistic app scenario', () => {
    // Create base state
    const count = zen(0);
    const name = zen('test');

    // Create derived values with pooled arrays
    const doubled = computed([count], (n) => n * 2);
    const tripled = computed([count], (n) => n * 3);

    // Complex computed with untracked logging
    const complex = computed([count, name], (n, str) => {
      // Log without creating dependency
      untracked(() => {
        // Simulating console.log or debug output
        const _debug = `${str}: ${n}`;
      });
      return `${str}-${n}`;
    });

    // Lifecycle with cleanup
    const unsub = onMount(count, () => {
      return () => {
        // Cleanup side effect
      };
    });

    // Trigger updates
    count._value = 10;
    name._value = 'updated';

    // Cleanup
    unsub();
    dispose(doubled);
    dispose(tripled);
    dispose(complex);
  });

  bench('High-frequency updates with pooling', () => {
    const values = [];

    // Create many atoms
    for (let i = 0; i < 10; i++) {
      values.push(zen(i));
    }

    // Create computed values (using pooled arrays)
    const computeds = values.map((v, i) => computed([v], (x) => x * i));

    // Rapid updates
    for (let i = 0; i < 10; i++) {
      values[i]._value = i * 2;
    }

    // Cleanup (return to pool)
    for (const c of computeds) {
      dispose(c);
    }
  });
});
