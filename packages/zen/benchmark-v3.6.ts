/**
 * v3.6 Performance Benchmark
 *
 * Tests the impact of v3.6 optimizations:
 * 1. Version Number Tracking
 * 2. Observer Slots O(1) Cleanup
 */

import { zen, computed, batch } from './src/zen';

function benchmark(name: string, fn: () => void, iterations = 1000): number {
  // Warmup
  for (let i = 0; i < 10; i++) fn();

  // Actual benchmark
  const start = performance.now();
  for (let i = 0; i < iterations; i++) fn();
  const duration = performance.now() - start;

  const opsPerSec = (iterations / duration) * 1000;
  console.log(`${name.padEnd(60)} ${duration.toFixed(2).padStart(10)}ms  ${opsPerSec.toFixed(0).padStart(15)} ops/sec`);

  return duration;
}

console.log('\n=== Zen v3.6.0 Performance Benchmark ===\n');
console.log('Test Name'.padEnd(60) + 'Time'.padStart(12) + 'Ops/Sec'.padStart(20));
console.log('─'.repeat(92));

// ============================================================================
// Version Tracking Tests
// ============================================================================

console.log('\n📊 Version Tracking: Unchanged Dependencies (should benefit)');

benchmark('Diamond pattern - unchanged base (1k updates)', () => {
  const base = zen(10);
  const left = computed(() => base.value * 2);
  const right = computed(() => base.value * 3);
  const merge = computed(() => left.value + right.value);

  merge.value; // Establish dependencies

  // Trigger dirty but value unchanged
  batch(() => base.value = 10);
  merge.value;
});

benchmark('Deep chain (10 layers) - unchanged values (500 updates)', () => {
  const base = zen(5);
  let current = base;
  for (let i = 0; i < 10; i++) {
    const prev = current;
    current = computed(() => prev.value + 0);
  }

  current.value;

  for (let i = 0; i < 500; i++) {
    batch(() => base.value = 5);
    current.value;
  }
}, 1);

console.log('\n📊 Version Tracking: Changed Dependencies (normal case)');

benchmark('Diamond pattern - changing base (1k updates)', () => {
  const base = zen(0);
  const left = computed(() => base.value * 2);
  const right = computed(() => base.value * 3);
  const merge = computed(() => left.value + right.value);

  batch(() => base.value = Math.random());
  merge.value;
});

benchmark('Deep chain (10 layers) - changing values (500 updates)', () => {
  const base = zen(0);
  let current = base;
  for (let i = 0; i < 10; i++) {
    const prev = current;
    current = computed(() => prev.value + 1);
  }

  for (let i = 0; i < 500; i++) {
    batch(() => base.value = i);
    current.value;
  }
}, 1);

// ============================================================================
// Observer Slots Tests
// ============================================================================

console.log('\n📊 Observer Slots: Subscription Changes (O(1) cleanup)');

benchmark('Create and destroy computed (1k times)', () => {
  const base = zen(0);
  const c = computed(() => base.value * 2);
  c.value; // Subscribe
  base.value = Math.random();
  // c will be cleaned up
});

benchmark('Dynamic dependencies (500 toggles)', () => {
  const toggle = zen(true);
  const a = zen(1);
  const b = zen(2);
  const c = zen(3);
  const d = zen(4);

  const result = computed(() => {
    if (toggle.value) {
      return a.value + b.value;
    } else {
      return c.value + d.value;
    }
  });

  result.value;

  for (let i = 0; i < 500; i++) {
    toggle.value = !toggle.value;
    result.value;
  }
}, 1);

benchmark('Multiple computeds sharing sources (100 iterations)', () => {
  const sources = Array.from({ length: 10 }, () => zen(0));

  for (let i = 0; i < 100; i++) {
    const computeds = Array.from({ length: 20 }, (_, j) => {
      const idx1 = j % 10;
      const idx2 = (j + 1) % 10;
      return computed(() => sources[idx1].value + sources[idx2].value);
    });

    computeds.forEach(c => c.value);
    sources.forEach((s, i) => s.value = i);
    computeds.forEach(c => c.value);
  }
}, 1);

// ============================================================================
// Real-World Patterns
// ============================================================================

console.log('\n📊 Real-World Patterns');

benchmark('Form validation (100 updates)', () => {
  const email = zen('');
  const password = zen('');
  const confirmPassword = zen('');
  const agreeToTerms = zen(false);

  const emailValid = computed(() =>
    email.value.includes('@') && email.value.length > 5
  );
  const passwordValid = computed(() => password.value.length >= 8);
  const passwordsMatch = computed(() =>
    password.value === confirmPassword.value && password.value.length > 0
  );
  const formValid = computed(() =>
    emailValid.value && passwordValid.value && passwordsMatch.value && agreeToTerms.value
  );

  for (let i = 0; i < 100; i++) {
    batch(() => {
      email.value = `user${i}@example.com`;
      password.value = `password${i}`;
      confirmPassword.value = `password${i}`;
      agreeToTerms.value = i % 2 === 0;
    });
    formValid.value;
  }
}, 1);

benchmark('Shopping cart (20 items, 100 updates)', () => {
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

  for (let i = 0; i < 100; i++) {
    batch(() => {
      items[i % 20].quantity.value = (i % 5) + 1;
      items[(i + 5) % 20].selected.value = !items[(i + 5) % 20].selected.value;
    });
    total.value;
  }
}, 1);

// ============================================================================
// Stress Tests
// ============================================================================

console.log('\n📊 Stress Tests');

benchmark('Large graph (100 base, 500 computed, 20 updates)', () => {
  const bases = Array.from({ length: 100 }, () => zen(0));

  const layer1 = Array.from({ length: 200 }, (_, i) => {
    const idx1 = i % 100;
    const idx2 = (i + 17) % 100;
    return computed(() => bases[idx1].value + bases[idx2].value);
  });

  const layer2 = Array.from({ length: 200 }, (_, i) => {
    const idx1 = i % 200;
    const idx2 = (i + 37) % 200;
    return computed(() => layer1[idx1].value * layer1[idx2].value);
  });

  const layer3 = Array.from({ length: 100 }, (_, i) => {
    const idx1 = i * 2;
    const idx2 = i * 2 + 1;
    return computed(() => layer2[idx1].value + layer2[idx2].value);
  });

  for (let i = 0; i < 20; i++) {
    batch(() => {
      bases.forEach((b, idx) => b.value = i + idx);
    });
    layer3.forEach(c => c.value);
  }
}, 1);

benchmark('Rapid subscription changes (100 iterations)', () => {
  const sources = Array.from({ length: 50 }, () => zen(0));

  for (let i = 0; i < 100; i++) {
    const c = computed(() => {
      let sum = 0;
      for (let j = 0; j < i % 10; j++) {
        sum += sources[j].value;
      }
      return sum;
    });

    c.value;
    sources[i % 50].value = i;
    c.value;
  }
}, 1);

// ============================================================================
// Basic Operations (Baseline)
// ============================================================================

console.log('\n📊 Basic Operations (Baseline)');

benchmark('Signal write (10k)', () => {
  const s = zen(0);
  for (let i = 0; i < 10000; i++) {
    s.value = i;
  }
}, 1);

benchmark('Signal read (10k)', () => {
  const s = zen(42);
  let sum = 0;
  for (let i = 0; i < 10000; i++) {
    sum += s.value;
  }
}, 1);

benchmark('Computed access (1k)', () => {
  const a = zen(1);
  const b = zen(2);
  const c = computed(() => a.value + b.value);

  a.value = Math.random();
  b.value = Math.random();
  c.value;
});

console.log('\n' + '─'.repeat(92));
console.log('\n✅ Benchmark Complete!\n');
