/**
 * Comprehensive Benchmark Suite (Vitest + Dist Version)
 *
 * 26 test scenarios covering all reactive patterns
 * Uses built dist files for accurate production performance
 */

import { describe, it, expect } from 'vitest';
import { batch, computed, zen } from '../dist/index.js';

const ITERATIONS = {
  extreme: 100000,
  high: 10000,
  medium: 1000,
  low: 100,
};

type BenchResult = {
  name: string;
  opsPerSec: number;
  timeMs: number;
};

const results: BenchResult[] = [];

function benchmark(name: string, fn: () => void, iterations: number): BenchResult {
  // Warmup
  for (let i = 0; i < 100; i++) fn();

  // Actual benchmark
  const start = performance.now();
  for (let i = 0; i < iterations; i++) fn();
  const timeMs = performance.now() - start;

  const result = {
    name,
    opsPerSec: (iterations / timeMs) * 1000,
    timeMs,
  };

  results.push(result);
  return result;
}

describe('Zen v3.3.0 Comprehensive Benchmark (Dist Version)', () => {
  describe('Basic Operations', () => {
    it('1. Single Read', () => {
      const result = benchmark(
        'Single Read',
        () => {
          const s = zen(42);
          s.value;
        },
        ITERATIONS.extreme
      );
      expect(result.opsPerSec).toBeGreaterThan(1_000_000);
    });

    it('2. Single Write', () => {
      const result = benchmark(
        'Single Write',
        () => {
          const s = zen(0);
          s.value = Math.random();
        },
        ITERATIONS.extreme
      );
      expect(result.opsPerSec).toBeGreaterThan(1_000_000);
    });

    it('3. Extreme Read (10000x)', () => {
      const result = benchmark(
        'Extreme Read (10000x)',
        () => {
          const signal = zen(42);
          for (let i = 0; i < 10000; i++) {
            signal.value;
          }
        },
        ITERATIONS.low
      );
      expect(result.opsPerSec).toBeGreaterThan(100);
    });
  });

  describe('Computed Operations', () => {
    it('4. Computed Value Access', () => {
      const result = benchmark(
        'Computed Value Access',
        () => {
          const a = zen(1);
          const b = zen(2);
          const c = computed([a, b], (x, y) => x + y);
          batch(() => {
            a.value = Math.random();
            b.value = Math.random();
          });
          c.value;
        },
        ITERATIONS.high
      );
      expect(result.opsPerSec).toBeGreaterThan(100_000);
    });

    it('5. Cache Invalidation', () => {
      const result = benchmark(
        'Cache Invalidation',
        () => {
          const source = zen(0);
          const derived = computed([source], x => x * 2);
          source.value = Math.random();
          derived.value;
          source.value = Math.random();
          derived.value;
        },
        ITERATIONS.medium
      );
      expect(result.opsPerSec).toBeGreaterThan(100_000);
    });
  });

  describe('Reactive Patterns', () => {
    it('6. Diamond Pattern (3 layers)', () => {
      const result = benchmark(
        'Diamond Pattern',
        () => {
          const root = zen(1);
          const left = computed([root], x => x * 2);
          const right = computed([root], x => x * 3);
          const merge = computed([left, right], (l, r) => l + r);
          batch(() => root.value = Math.random());
          merge.value;
        },
        ITERATIONS.high
      );
      expect(result.opsPerSec).toBeGreaterThan(100_000);
    });

    it('7. Deep Chain (10 layers)', () => {
      const result = benchmark(
        'Deep Chain (10 layers)',
        () => {
          const root = zen(1);
          let current: any = root;
          for (let i = 0; i < 10; i++) {
            const prev = current;
            current = computed([prev], x => x + 1);
          }
          batch(() => root.value = Math.random());
          current.value;
        },
        ITERATIONS.medium
      );
      expect(result.opsPerSec).toBeGreaterThan(10_000);
    });

    it('8. Wide Fanout (1→100)', () => {
      const result = benchmark(
        'Wide Fanout (1→100)',
        () => {
          const root = zen(0);
          const fanout = Array.from({ length: 100 }, () =>
            computed([root], (x) => x * 2)
          );
          batch(() => root.value = Math.random());
          fanout.forEach(c => c.value);
        },
        ITERATIONS.medium
      );
      expect(result.opsPerSec).toBeGreaterThan(10_000);
    });

    it('9. Massive Fanout (1→1000)', () => {
      const result = benchmark(
        'Massive Fanout (1→1000)',
        () => {
          const root = zen(0);
          const fanout = Array.from({ length: 1000 }, () =>
            computed([root], (x) => x * 2)
          );
          batch(() => root.value = Math.random());
          fanout.forEach(c => c.value);
        },
        ITERATIONS.low
      );
      expect(result.opsPerSec).toBeGreaterThan(100);
    });

    it('10. Repeated Diamonds (5x)', () => {
      const result = benchmark(
        'Repeated Diamonds (5x)',
        () => {
          const root = zen(1);
          const diamonds = Array.from({ length: 5 }, () => {
            const left = computed([root], x => x * 2);
            const right = computed([root], x => x * 3);
            return computed([left, right], (l, r) => l + r);
          });
          batch(() => root.value = Math.random());
          diamonds.forEach(d => d.value);
        },
        ITERATIONS.medium
      );
      expect(result.opsPerSec).toBeGreaterThan(10_000);
    });

    it('11. Deep Diamond (5 layers)', () => {
      const result = benchmark(
        'Deep Diamond (5 layers)',
        () => {
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
          batch(() => root.value = Math.random());
          merge.value;
        },
        ITERATIONS.medium
      );
      expect(result.opsPerSec).toBeGreaterThan(10_000);
    });
  });

  describe('Batch Operations', () => {
    it('12. Batch Write (10x)', () => {
      const result = benchmark(
        'Batch Write (10x)',
        () => {
          const signals = Array.from({ length: 10 }, () => zen(0));
          batch(() => {
            signals.forEach((s, i) => s.value = i);
          });
        },
        ITERATIONS.medium
      );
      expect(result.opsPerSec).toBeGreaterThan(100_000);
    });

    it('13. Burst Write (100x)', () => {
      const result = benchmark(
        'Burst Write (100x)',
        () => {
          const signal = zen(0);
          for (let i = 0; i < 100; i++) {
            signal.value = i;
          }
        },
        ITERATIONS.medium
      );
      expect(result.opsPerSec).toBeGreaterThan(100_000);
    });

    it('14. Concurrent Updates (50x)', () => {
      const result = benchmark(
        'Concurrent Updates (50x)',
        () => {
          const signals = Array.from({ length: 50 }, () => zen(0));
          batch(() => {
            signals.forEach((s, i) => s.value = i);
          });
        },
        ITERATIONS.medium
      );
      expect(result.opsPerSec).toBeGreaterThan(100_000);
    });
  });

  describe('Heavy Operations', () => {
    it('15. Heavy Write (1000x)', () => {
      const result = benchmark(
        'Heavy Write (1000x)',
        () => {
          const signal = zen(0);
          for (let i = 0; i < 1000; i++) {
            signal.value = i;
          }
        },
        ITERATIONS.low
      );
      expect(result.opsPerSec).toBeGreaterThan(100);
    });

    it('16. Extreme Write (10000x)', () => {
      const result = benchmark(
        'Extreme Write (10000x)',
        () => {
          const signal = zen(0);
          for (let i = 0; i < 10000; i++) {
            signal.value = i;
          }
        },
        10 // Only 10 iterations
      );
      expect(result.opsPerSec).toBeGreaterThan(10);
    });

    it('17. Moderate Read (100x)', () => {
      const result = benchmark(
        'Moderate Read (100x)',
        () => {
          const signal = zen(42);
          for (let i = 0; i < 100; i++) {
            signal.value;
          }
        },
        ITERATIONS.medium
      );
      expect(result.opsPerSec).toBeGreaterThan(100_000);
    });
  });

  describe('Real-world Patterns', () => {
    it('18. Simple Form (3 fields)', () => {
      const result = benchmark(
        'Simple Form',
        () => {
          const name = zen('');
          const email = zen('');
          const age = zen(0);
          const isValid = computed([name, email, age], (n, e, a) =>
            n.length > 0 && e.includes('@') && a >= 18
          );
          batch(() => {
            name.value = 'Alice';
            email.value = 'alice@example.com';
            age.value = 25;
          });
          isValid.value;
        },
        ITERATIONS.high
      );
      expect(result.opsPerSec).toBeGreaterThan(100_000);
    });

    it('19. Complex Form (nested+array)', () => {
      const result = benchmark(
        'Complex Form',
        () => {
          type FormData = {
            user: { name: string; email: string };
            addresses: Array<{ city: string; zip: string }>;
          };

          const form = zen<FormData>({
            user: { name: '', email: '' },
            addresses: []
          });

          const addressCount = computed([form], f => f.addresses.length);

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
        ITERATIONS.medium
      );
      expect(result.opsPerSec).toBeGreaterThan(100_000);
    });

    it('20. Nested Object Update', () => {
      const result = benchmark(
        'Nested Object Update',
        () => {
          const obj = zen({ user: { name: 'Alice', age: 30 }, posts: 10 });
          obj.value = {
            ...obj.value,
            user: { ...obj.value.user, age: obj.value.user.age + 1 }
          };
        },
        ITERATIONS.high
      );
      expect(result.opsPerSec).toBeGreaterThan(1_000_000);
    });

    it('21. Dynamic Dependencies', () => {
      const result = benchmark(
        'Dynamic Dependencies',
        () => {
          const toggle = zen(true);
          const a = zen(1);
          const b = zen(2);
          const dynamic = computed([toggle, a, b], (t, x, y) => t ? x : y);
          batch(() => {
            toggle.value = !toggle.value;
            a.value = Math.random();
            b.value = Math.random();
          });
          dynamic.value;
        },
        ITERATIONS.medium
      );
      expect(result.opsPerSec).toBeGreaterThan(100_000);
    });
  });

  describe('Array Operations', () => {
    it('22. Array Update', () => {
      const result = benchmark(
        'Array Update',
        () => {
          const arr = zen([1, 2, 3, 4, 5]);
          arr.value = arr.value.map(x => x + 1);
        },
        ITERATIONS.high
      );
      expect(result.opsPerSec).toBeGreaterThan(1_000_000);
    });

    it('23. Array Push', () => {
      const result = benchmark(
        'Array Push',
        () => {
          const arr = zen<number[]>([]);
          arr.value = [...arr.value, Math.random()];
        },
        ITERATIONS.high
      );
      expect(result.opsPerSec).toBeGreaterThan(100_000);
    });

    it('24. Large Array (1000 items)', () => {
      const result = benchmark(
        'Large Array (1000 items)',
        () => {
          const arr = zen(Array.from({ length: 1000 }, (_, i) => i));
          arr.value = arr.value.map(x => x + 1);
        },
        ITERATIONS.medium
      );
      expect(result.opsPerSec).toBeGreaterThan(100);
    });
  });

  describe('Advanced Patterns', () => {
    it('25. Async Throughput (20 ops)', () => {
      const result = benchmark(
        'Async Throughput',
        () => {
          const counter = zen(0);
          const doubled = computed([counter], x => x * 2);
          for (let i = 0; i < 20; i++) {
            batch(() => counter.value = i);
            doubled.value;
          }
        },
        ITERATIONS.medium
      );
      expect(result.opsPerSec).toBeGreaterThan(10_000);
    });

    it('26. Memory Management', () => {
      const result = benchmark(
        'Memory Management',
        () => {
          const temp = zen(Math.random());
          const comp = computed([temp], x => x * 2);
          comp.value;
          // Let GC collect
        },
        ITERATIONS.medium
      );
      expect(result.opsPerSec).toBeGreaterThan(100_000);
    });
  });

  // Print results summary
  describe('Results Summary', () => {
    it('should print benchmark results', () => {
      console.log('\n=== Zen v3.3.0 Benchmark Results (Dist Version) ===\n');
      console.log('| # | Test Name | Time (ms) | Ops/sec |');
      console.log('|---|-----------|-----------|---------|');

      results.forEach((r, i) => {
        console.log(
          `| ${(i + 1).toString().padStart(2)} | ${r.name.padEnd(35)} | ` +
          `${r.timeMs.toFixed(2).padStart(9)} | ${r.opsPerSec.toFixed(0).padStart(11)} |`
        );
      });

      const totalTime = results.reduce((sum, r) => sum + r.timeMs, 0);
      const avgOpsPerSec = results.reduce((sum, r) => sum + r.opsPerSec, 0) / results.length;

      console.log('\n=== Summary ===');
      console.log(`Total tests: ${results.length}`);
      console.log(`Total time: ${totalTime.toFixed(2)}ms`);
      console.log(`Average ops/sec: ${avgOpsPerSec.toFixed(0)}`);

      const fastest = results.reduce((max, r) => r.opsPerSec > max.opsPerSec ? r : max);
      const slowest = results.reduce((min, r) => r.opsPerSec < min.opsPerSec ? r : min);

      console.log(`\nFastest: ${fastest.name} (${fastest.opsPerSec.toFixed(0)} ops/sec)`);
      console.log(`Slowest: ${slowest.name} (${slowest.opsPerSec.toFixed(0)} ops/sec)`);

      // Category analysis
      const categories = {
        basic: results.slice(0, 3),
        computed: results.slice(3, 5),
        reactive: results.slice(5, 11),
        batch: results.slice(11, 14),
        heavy: results.slice(14, 17),
        realWorld: results.slice(17, 21),
        array: results.slice(21, 24),
        advanced: results.slice(24, 26),
      };

      console.log('\n=== Category Averages ===');
      Object.entries(categories).forEach(([name, tests]) => {
        const avg = tests.reduce((sum, t) => sum + t.opsPerSec, 0) / tests.length;
        console.log(`${name.padEnd(12)}: ${avg.toFixed(0).padStart(12)} ops/sec`);
      });

      expect(results.length).toBe(26);
    });
  });
});
