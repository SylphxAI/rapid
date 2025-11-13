/**
 * Comprehensive Benchmark: v3.1.1 vs v3.2.0 vs v3.3.0
 *
 * 26 test scenarios covering all reactive patterns
 */

import { batch, computed, effect, zen } from './packages/zen/dist/index.js';

const WARMUP = 100;

type BenchmarkResult = {
  name: string;
  time: number;
  opsPerSec: number;
};

function benchmark(name: string, fn: () => void, iterations: number): BenchmarkResult {
  // Warmup
  for (let i = 0; i < WARMUP; i++) fn();

  // Actual benchmark
  const start = performance.now();
  for (let i = 0; i < iterations; i++) fn();
  const time = performance.now() - start;

  return {
    name,
    time,
    opsPerSec: (iterations / time) * 1000,
  };
}

const results: BenchmarkResult[] = [];

console.log('=== Comprehensive Zen v3.3.0 Benchmark ===\n');

// ============================================================================
// 1. Wide Fanout (1→100)
// ============================================================================
{
  const root = zen(0);
  const fanout = Array.from({ length: 100 }, () =>
    computed([root], (x) => x * 2)
  );

  results.push(benchmark(
    '1. Wide Fanout (1→100)',
    () => {
      batch(() => root.value = Math.random());
      fanout.forEach(c => c.value);
    },
    1000
  ));
}

// ============================================================================
// 2. Extreme Read (10000x)
// ============================================================================
{
  const signal = zen(42);

  results.push(benchmark(
    '2. Extreme Read (10000x)',
    () => {
      for (let i = 0; i < 10000; i++) {
        signal.value;
      }
    },
    100
  ));
}

// ============================================================================
// 3. Repeated Diamonds (5x)
// ============================================================================
{
  const root = zen(1);
  const diamonds = Array.from({ length: 5 }, () => {
    const left = computed([root], x => x * 2);
    const right = computed([root], x => x * 3);
    return computed([left, right], (l, r) => l + r);
  });

  results.push(benchmark(
    '3. Repeated Diamonds (5x)',
    () => {
      batch(() => root.value = Math.random());
      diamonds.forEach(d => d.value);
    },
    1000
  ));
}

// ============================================================================
// 4. Heavy Write (1000x)
// ============================================================================
{
  const signal = zen(0);

  results.push(benchmark(
    '4. Heavy Write (1000x)',
    () => {
      for (let i = 0; i < 1000; i++) {
        signal.value = i;
      }
    },
    100
  ));
}

// ============================================================================
// 5. Computed Value Access
// ============================================================================
{
  const a = zen(1);
  const b = zen(2);
  const c = computed([a, b], (x, y) => x + y);

  results.push(benchmark(
    '5. Computed Value Access',
    () => {
      batch(() => {
        a.value = Math.random();
        b.value = Math.random();
      });
      c.value;
    },
    10000
  ));
}

// ============================================================================
// 6. Cache Invalidation
// ============================================================================
{
  const source = zen(0);
  const derived = computed([source], x => x * 2);

  results.push(benchmark(
    '6. Cache Invalidation',
    () => {
      source.value = Math.random();
      derived.value;
      source.value = Math.random();
      derived.value;
    },
    5000
  ));
}

// ============================================================================
// 7. Deep Chain (10 layers)
// ============================================================================
{
  const root = zen(1);
  let current: any = root;
  for (let i = 0; i < 10; i++) {
    const prev = current;
    current = computed([prev], x => x + 1);
  }
  const deepChain = current;

  results.push(benchmark(
    '7. Deep Chain (10 layers)',
    () => {
      batch(() => root.value = Math.random());
      deepChain.value;
    },
    1000
  ));
}

// ============================================================================
// 8. Moderate Read (100x)
// ============================================================================
{
  const signal = zen(42);

  results.push(benchmark(
    '8. Moderate Read (100x)',
    () => {
      for (let i = 0; i < 100; i++) {
        signal.value;
      }
    },
    1000
  ));
}

// ============================================================================
// 9. Massive Fanout (1→1000)
// ============================================================================
{
  const root = zen(0);
  const fanout = Array.from({ length: 1000 }, () =>
    computed([root], (x) => x * 2)
  );

  results.push(benchmark(
    '9. Massive Fanout (1→1000)',
    () => {
      batch(() => root.value = Math.random());
      fanout.forEach(c => c.value);
    },
    100
  ));
}

// ============================================================================
// 10. Deep Diamond (5 layers)
// ============================================================================
{
  const root = zen(1);
  let leftChain: any = root;
  let rightChain: any = root;

  for (let i = 0; i < 5; i++) {
    const prevLeft = leftChain;
    const prevRight = rightChain;
    leftChain = computed([prevLeft], x => x * 2);
    rightChain = computed([prevRight], x => x * 3);
  }

  const merge = computed([leftChain, rightChain], (l, r) => l + r);

  results.push(benchmark(
    '10. Deep Diamond (5 layers)',
    () => {
      batch(() => root.value = Math.random());
      merge.value;
    },
    1000
  ));
}

// ============================================================================
// 11. Diamond Pattern (3 layers)
// ============================================================================
{
  const root = zen(1);
  const left = computed([root], x => x * 2);
  const right = computed([root], x => x * 3);
  const merge = computed([left, right], (l, r) => l + r);

  results.push(benchmark(
    '11. Diamond Pattern (3 layers)',
    () => {
      batch(() => root.value = Math.random());
      merge.value;
    },
    10000
  ));
}

// ============================================================================
// 12. Nested Object Update
// ============================================================================
{
  const obj = zen({ user: { name: 'Alice', age: 30 }, posts: 10 });

  results.push(benchmark(
    '12. Nested Object Update',
    () => {
      obj.value = {
        ...obj.value,
        user: { ...obj.value.user, age: obj.value.user.age + 1 }
      };
    },
    10000
  ));
}

// ============================================================================
// 13. Batch Write (10x)
// ============================================================================
{
  const signals = Array.from({ length: 10 }, () => zen(0));

  results.push(benchmark(
    '13. Batch Write (10x)',
    () => {
      batch(() => {
        signals.forEach((s, i) => s.value = i);
      });
    },
    5000
  ));
}

// ============================================================================
// 14. Dynamic Dependencies
// ============================================================================
{
  const toggle = zen(true);
  const a = zen(1);
  const b = zen(2);
  const dynamic = computed([toggle, a, b], (t, x, y) => t ? x : y);

  results.push(benchmark(
    '14. Dynamic Dependencies',
    () => {
      batch(() => {
        toggle.value = !toggle.value;
        a.value = Math.random();
        b.value = Math.random();
      });
      dynamic.value;
    },
    5000
  ));
}

// ============================================================================
// 15. Single Write
// ============================================================================
{
  const signal = zen(0);

  results.push(benchmark(
    '15. Single Write',
    () => {
      signal.value = Math.random();
    },
    100000
  ));
}

// ============================================================================
// 16. Extreme Write (10000x)
// ============================================================================
{
  const signal = zen(0);

  results.push(benchmark(
    '16. Extreme Write (10000x)',
    () => {
      for (let i = 0; i < 10000; i++) {
        signal.value = i;
      }
    },
    10
  ));
}

// ============================================================================
// 17. Single Read
// ============================================================================
{
  const signal = zen(42);

  results.push(benchmark(
    '17. Single Read',
    () => {
      signal.value;
    },
    100000
  ));
}

// ============================================================================
// 18. Large Array (1000 items)
// ============================================================================
{
  const arr = zen(Array.from({ length: 1000 }, (_, i) => i));

  results.push(benchmark(
    '18. Large Array (1000 items)',
    () => {
      arr.value = arr.value.map(x => x + 1);
    },
    1000
  ));
}

// ============================================================================
// 19. Simple Form (3 fields)
// ============================================================================
{
  const name = zen('');
  const email = zen('');
  const age = zen(0);
  const isValid = computed([name, email, age], (n, e, a) =>
    n.length > 0 && e.includes('@') && a >= 18
  );

  results.push(benchmark(
    '19. Simple Form (3 fields)',
    () => {
      batch(() => {
        name.value = 'Alice';
        email.value = 'alice@example.com';
        age.value = 25;
      });
      isValid.value;
    },
    10000
  ));
}

// ============================================================================
// 20. Complex Form (nested+array)
// ============================================================================
{
  type FormData = {
    user: { name: string; email: string };
    addresses: Array<{ city: string; zip: string }>;
  };

  const form = zen<FormData>({
    user: { name: '', email: '' },
    addresses: []
  });

  const addressCount = computed([form], f => f.addresses.length);

  results.push(benchmark(
    '20. Complex Form (nested+array)',
    () => {
      batch(() => {
        form.value = {
          user: { name: 'Bob', email: 'bob@example.com' },
          addresses: [
            { city: 'NYC', zip: '10001' },
            { city: 'LA', zip: '90001' }
          ]
        };
      });
      addressCount.value;
    },
    5000
  ));
}

// ============================================================================
// 21. Array Push
// ============================================================================
{
  const arr = zen<number[]>([]);

  results.push(benchmark(
    '21. Array Push',
    () => {
      arr.value = [...arr.value, Math.random()];
    },
    10000
  ));
}

// ============================================================================
// 22. Burst Write (100x)
// ============================================================================
{
  const signal = zen(0);

  results.push(benchmark(
    '22. Burst Write (100x)',
    () => {
      for (let i = 0; i < 100; i++) {
        signal.value = i;
      }
    },
    1000
  ));
}

// ============================================================================
// 23. Concurrent Updates (50x)
// ============================================================================
{
  const signals = Array.from({ length: 50 }, () => zen(0));

  results.push(benchmark(
    '23. Concurrent Updates (50x)',
    () => {
      batch(() => {
        signals.forEach((s, i) => s.value = i);
      });
    },
    1000
  ));
}

// ============================================================================
// 24. Async Throughput (20 ops)
// ============================================================================
{
  const counter = zen(0);
  const doubled = computed([counter], x => x * 2);

  results.push(benchmark(
    '24. Async Throughput (20 ops)',
    () => {
      for (let i = 0; i < 20; i++) {
        batch(() => counter.value = i);
        doubled.value;
      }
    },
    1000
  ));
}

// ============================================================================
// 25. Memory Management
// ============================================================================
{
  results.push(benchmark(
    '25. Memory Management',
    () => {
      const temp = zen(Math.random());
      const comp = computed([temp], x => x * 2);
      comp.value;
      // Let GC collect
    },
    1000
  ));
}

// ============================================================================
// 26. Array Update
// ============================================================================
{
  const arr = zen([1, 2, 3, 4, 5]);

  results.push(benchmark(
    '26. Array Update',
    () => {
      arr.value = arr.value.map(x => x + 1);
    },
    10000
  ));
}

// ============================================================================
// Results
// ============================================================================

console.log('\n=== Benchmark Results ===\n');
console.log('| # | Test Name | Time (ms) | Ops/sec |');
console.log('|---|-----------|-----------|---------|');

results.forEach((result, i) => {
  console.log(
    `| ${(i + 1).toString().padStart(2)} | ${result.name.padEnd(35)} | ` +
    `${result.time.toFixed(2).padStart(9)} | ${result.opsPerSec.toFixed(0).padStart(7)} |`
  );
});

console.log('\n=== Summary ===\n');

const totalTime = results.reduce((sum, r) => sum + r.time, 0);
const avgOpsPerSec = results.reduce((sum, r) => sum + r.opsPerSec, 0) / results.length;

console.log(`Total tests: ${results.length}`);
console.log(`Total time: ${totalTime.toFixed(2)}ms`);
console.log(`Average ops/sec: ${avgOpsPerSec.toFixed(0)}`);

// Find fastest and slowest
const fastest = results.reduce((min, r) => r.opsPerSec > min.opsPerSec ? r : min);
const slowest = results.reduce((max, r) => r.opsPerSec < max.opsPerSec ? r : max);

console.log(`\nFastest: ${fastest.name} (${fastest.opsPerSec.toFixed(0)} ops/sec)`);
console.log(`Slowest: ${slowest.name} (${slowest.opsPerSec.toFixed(0)} ops/sec)`);

// Category analysis
const categories = {
  read: results.filter(r => r.name.toLowerCase().includes('read')),
  write: results.filter(r => r.name.toLowerCase().includes('write')),
  computed: results.filter(r => r.name.toLowerCase().includes('computed') || r.name.includes('Diamond') || r.name.includes('Chain') || r.name.includes('Fanout')),
  batch: results.filter(r => r.name.toLowerCase().includes('batch')),
  form: results.filter(r => r.name.toLowerCase().includes('form')),
  array: results.filter(r => r.name.toLowerCase().includes('array')),
};

console.log('\n=== Category Averages ===\n');
Object.entries(categories).forEach(([name, tests]) => {
  if (tests.length > 0) {
    const avg = tests.reduce((sum, t) => sum + t.opsPerSec, 0) / tests.length;
    console.log(`${name.padEnd(10)}: ${avg.toFixed(0).padStart(8)} ops/sec (${tests.length} tests)`);
  }
});

console.log('\n✅ Benchmark complete!');
