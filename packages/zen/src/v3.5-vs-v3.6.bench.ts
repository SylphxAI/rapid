/**
 * v3.5 vs v3.6 Performance Comparison
 *
 * Tests the impact of:
 * 1. Version Number Tracking
 * 2. Observer Slots O(1) Cleanup
 */

import { bench, describe } from 'vitest';
import { zen, computed, batch } from './zen';

// ============================================================================
// Test 1: Version Tracking Impact - Unchanged Dependencies
// ============================================================================

describe('Version Tracking: Skip Recomputation', () => {
  bench('Diamond pattern with unchanged base (benefits from version check)', () => {
    const base = zen(10);
    const left = computed(() => base.value * 2);
    const right = computed(() => base.value * 3);
    const merge = computed(() => left.value + right.value);

    // Access to establish dependencies
    merge.value;

    // Mark dirty but value unchanged
    for (let i = 0; i < 1000; i++) {
      batch(() => {
        base.value = 10; // Same value - triggers dirty but version check should help
      });
      merge.value; // Force evaluation
    }
  });

  bench('Deep chain with unchanged values', () => {
    const base = zen(5);
    let current = base;
    for (let i = 0; i < 10; i++) {
      const prev = current;
      current = computed(() => prev.value + 0); // Add 0 = no real change
    }

    current.value; // Establish dependencies

    for (let i = 0; i < 500; i++) {
      batch(() => {
        base.value = 5; // Same value
      });
      current.value;
    }
  });
});

// ============================================================================
// Test 2: Version Tracking Impact - Changed Dependencies
// ============================================================================

describe('Version Tracking: Changed Dependencies', () => {
  bench('Diamond pattern with changing base', () => {
    const base = zen(0);
    const left = computed(() => base.value * 2);
    const right = computed(() => base.value * 3);
    const merge = computed(() => left.value + right.value);

    for (let i = 0; i < 1000; i++) {
      batch(() => {
        base.value = i;
      });
      merge.value;
    }
  });

  bench('Deep chain with changing values', () => {
    const base = zen(0);
    let current = base;
    for (let i = 0; i < 10; i++) {
      const prev = current;
      current = computed(() => prev.value + 1);
    }

    for (let i = 0; i < 500; i++) {
      batch(() => {
        base.value = i;
      });
      current.value;
    }
  });
});

// ============================================================================
// Test 3: Observer Slots Impact - Subscription Changes
// ============================================================================

describe('Observer Slots: Subscription Churn', () => {
  bench('Create and destroy computed (O(1) cleanup)', () => {
    const base = zen(0);

    for (let i = 0; i < 1000; i++) {
      // Create computed
      const c = computed(() => base.value * 2);
      c.value; // Subscribe

      // Let it be garbage collected (unsubscribe happens internally)
      base.value = i;
    }
  });

  bench('Dynamic dependency changes', () => {
    const toggle = zen(true);
    const a = zen(1);
    const b = zen(2);
    const c = zen(3);
    const d = zen(4);

    // Computed with conditional dependencies
    const result = computed(() => {
      if (toggle.value) {
        return a.value + b.value;
      } else {
        return c.value + d.value;
      }
    });

    result.value; // Initial

    for (let i = 0; i < 500; i++) {
      toggle.value = !toggle.value; // Change dependencies
      result.value; // Re-track

      a.value = i;
      b.value = i * 2;
      c.value = i * 3;
      d.value = i * 4;
      result.value;
    }
  });

  bench('Multiple computeds sharing sources', () => {
    const sources = Array.from({ length: 10 }, () => zen(0));

    for (let iteration = 0; iteration < 100; iteration++) {
      // Create multiple computeds that share sources
      const computeds = Array.from({ length: 20 }, (_, i) => {
        const idx1 = i % 10;
        const idx2 = (i + 1) % 10;
        return computed(() => sources[idx1].value + sources[idx2].value);
      });

      // Access all
      computeds.forEach(c => c.value);

      // Update sources
      sources.forEach((s, i) => s.value = iteration + i);

      // Access again
      computeds.forEach(c => c.value);

      // Let computeds be GC'd (triggers cleanup)
    }
  });
});

// ============================================================================
// Test 4: Realistic Patterns
// ============================================================================

describe('Real-World Patterns', () => {
  bench('Form validation with conditional rules', () => {
    const email = zen('');
    const password = zen('');
    const confirmPassword = zen('');
    const agreeToTerms = zen(false);

    const emailValid = computed(() =>
      email.value.includes('@') && email.value.length > 5
    );

    const passwordValid = computed(() =>
      password.value.length >= 8
    );

    const passwordsMatch = computed(() =>
      password.value === confirmPassword.value && password.value.length > 0
    );

    const formValid = computed(() =>
      emailValid.value && passwordValid.value && passwordsMatch.value && agreeToTerms.value
    );

    // Simulate user typing
    for (let i = 0; i < 100; i++) {
      batch(() => {
        email.value = `user${i}@example.com`;
        password.value = `password${i}`;
        confirmPassword.value = `password${i}`;
        agreeToTerms.value = i % 2 === 0;
      });

      formValid.value; // Check validity
    }
  });

  bench('Shopping cart with dynamic items', () => {
    const items = Array.from({ length: 20 }, (_, i) => ({
      price: zen(10 + i),
      quantity: zen(1),
      selected: zen(true)
    }));

    const subtotals = items.map(item =>
      computed(() => item.price.value * item.quantity.value)
    );

    const selectedSubtotals = items.map((item, i) =>
      computed(() => item.selected.value ? subtotals[i].value : 0)
    );

    const total = computed(() =>
      selectedSubtotals.reduce((sum, st) => sum + st.value, 0)
    );

    // Simulate user interactions
    for (let i = 0; i < 100; i++) {
      batch(() => {
        // Update quantities
        items[i % 20].quantity.value = (i % 5) + 1;

        // Toggle selection
        items[(i + 5) % 20].selected.value = !items[(i + 5) % 20].selected.value;

        // Update price
        items[(i + 10) % 20].price.value = 10 + i;
      });

      total.value; // Recalculate total
    }
  });

  bench('State machine with transitions', () => {
    const state = zen<'idle' | 'loading' | 'success' | 'error'>('idle');
    const data = zen<any>(null);
    const error = zen<string | null>(null);

    const isLoading = computed(() => state.value === 'loading');
    const hasData = computed(() => state.value === 'success' && data.value !== null);
    const hasError = computed(() => state.value === 'error' && error.value !== null);

    const canRetry = computed(() =>
      state.value === 'error' || state.value === 'idle'
    );

    // Simulate state transitions
    const states: Array<'idle' | 'loading' | 'success' | 'error'> =
      ['idle', 'loading', 'success', 'idle', 'loading', 'error', 'idle'];

    for (let i = 0; i < 200; i++) {
      const nextState = states[i % states.length];

      batch(() => {
        state.value = nextState;

        if (nextState === 'success') {
          data.value = { id: i, value: `data${i}` };
          error.value = null;
        } else if (nextState === 'error') {
          error.value = `Error ${i}`;
          data.value = null;
        } else {
          data.value = null;
          error.value = null;
        }
      });

      // Access all computed
      isLoading.value;
      hasData.value;
      hasError.value;
      canRetry.value;
    }
  });
});

// ============================================================================
// Test 5: Stress Tests
// ============================================================================

describe('Stress Tests', () => {
  bench('Large dependency graph (100 base, 500 computed)', () => {
    const bases = Array.from({ length: 100 }, () => zen(0));

    // Layer 1: 200 computed (each depends on 2 bases)
    const layer1 = Array.from({ length: 200 }, (_, i) => {
      const idx1 = i % 100;
      const idx2 = (i + 17) % 100; // Prime offset for better distribution
      return computed(() => bases[idx1].value + bases[idx2].value);
    });

    // Layer 2: 200 computed (each depends on 2 from layer1)
    const layer2 = Array.from({ length: 200 }, (_, i) => {
      const idx1 = i % 200;
      const idx2 = (i + 37) % 200;
      return computed(() => layer1[idx1].value * layer1[idx2].value);
    });

    // Layer 3: 100 computed (each depends on 2 from layer2)
    const layer3 = Array.from({ length: 100 }, (_, i) => {
      const idx1 = i * 2;
      const idx2 = i * 2 + 1;
      return computed(() => layer2[idx1].value + layer2[idx2].value);
    });

    // Update and read
    for (let i = 0; i < 20; i++) {
      batch(() => {
        bases.forEach((b, idx) => b.value = i + idx);
      });

      layer3.forEach(c => c.value);
    }
  });

  bench('Rapid subscription changes (auto-tracking)', () => {
    const sources = Array.from({ length: 50 }, () => zen(0));

    for (let i = 0; i < 100; i++) {
      // Create computed with auto-tracking
      const computed1 = computed(() => {
        let sum = 0;
        // Conditionally access different sources
        for (let j = 0; j < i % 10; j++) {
          sum += sources[j].value;
        }
        return sum;
      });

      computed1.value; // Subscribe

      // Update sources
      sources[i % 50].value = i;

      // Re-evaluate (may have different dependencies)
      computed1.value;
    }
  });
});

// ============================================================================
// Test 6: Edge Cases
// ============================================================================

describe('Edge Cases', () => {
  bench('Self-referential computed (fibonacci-style)', () => {
    const input = zen(0);
    let prev1 = 0;
    let prev2 = 0;

    const fib = computed(() => {
      const n = input.value;
      if (n <= 1) return n;
      const result = prev1 + prev2;
      prev2 = prev1;
      prev1 = result;
      return result;
    });

    for (let i = 0; i < 1000; i++) {
      prev1 = 0;
      prev2 = 0;
      input.value = i % 20;
      fib.value;
    }
  });

  bench('Computed with side effects tracking', () => {
    const counters = Array.from({ length: 10 }, () => zen(0));
    let accessCount = 0;

    const monitored = computed(() => {
      accessCount++;
      return counters.reduce((sum, c) => sum + c.value, 0);
    });

    for (let i = 0; i < 500; i++) {
      batch(() => {
        counters.forEach(c => c.value = i);
      });
      monitored.value;
    }
  });
});
