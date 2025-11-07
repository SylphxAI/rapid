import { describe, expect, it } from 'vitest';
import { karma, runKarma, subscribeToKarma, karmaCache } from './karma';

const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('karma performance benchmarks', () => {
  describe('Cache performance', () => {
    it('cache miss (first call)', async () => {
      const fetchData = karma(async (id: number) => {
        await tick();
        return { id, data: `Data ${id}` };
      });

      await runKarma(fetchData, Math.random());
    });

    it('cache hit (immediate return)', async () => {
      const fetchData = karma(async (id: number) => {
        await tick();
        return { id, data: `Data ${id}` };
      });

      // Prime cache
      const missStart = performance.now();
      await runKarma(fetchData, 1);
      const missDuration = performance.now() - missStart;

      // Benchmark cache hit
      const hitStart = performance.now();
      await runKarma(fetchData, 1);
      const hitDuration = performance.now() - hitStart;

      console.log(`  Cache miss: ${missDuration.toFixed(2)}ms, Cache hit: ${hitDuration.toFixed(2)}ms (${(missDuration / hitDuration).toFixed(0)}x faster)`);
      expect(hitDuration).toBeLessThan(missDuration);
    });

    it('cache hit with 100 entries', async () => {
      const fetchData = karma(async (id: number) => {
        await tick();
        return { id };
      });

      // Prime cache with 100 entries
      for (let i = 0; i < 100; i++) {
        await runKarma(fetchData, i);
      }

      // Benchmark cache hit
      await runKarma(fetchData, 50);
    });

    it('cache hit with 1000 entries', async () => {
      const fetchData = karma(async (id: number) => {
        await tick();
        return { id };
      });

      // Prime cache with 1000 entries
      for (let i = 0; i < 1000; i++) {
        await runKarma(fetchData, i);
      }

      // Benchmark cache hit
      const start = performance.now();
      await runKarma(fetchData, 500);
      const duration = performance.now() - start;

      console.log(`  Cache hit with 1000 entries: ${duration.toFixed(2)}ms`);
      expect(duration).toBeLessThan(5);
    });
  });

  describe('Concurrent requests', () => {
    it('10 concurrent requests (same args)', async () => {
      const fetchData = karma(async (id: number) => {
        await tick();
        return { id };
      });

      const promises = Array(10).fill(0).map(() => runKarma(fetchData, 1));
      await Promise.all(promises);
    });

    it('100 concurrent requests (same args)', async () => {
      let execCount = 0;
      const fetchData = karma(async (id: number) => {
        execCount++;
        await tick();
        return { id };
      });

      const start = performance.now();
      const promises = Array(100).fill(0).map(() => runKarma(fetchData, 1));
      await Promise.all(promises);
      const duration = performance.now() - start;

      console.log(`  100 concurrent (same args): ${duration.toFixed(2)}ms, execCount: ${execCount} (deduplication working!)`);
      expect(execCount).toBe(1);
    });

    it('10 concurrent requests (different args)', async () => {
      const fetchData = karma(async (id: number) => {
        await tick();
        return { id };
      });

      const promises = Array(10).fill(0).map((_, i) => runKarma(fetchData, i));
      await Promise.all(promises);
    });

    it('100 concurrent requests (different args)', async () => {
      const fetchData = karma(async (id: number) => {
        await tick();
        return { id };
      });

      const promises = Array(100).fill(0).map((_, i) => runKarma(fetchData, i));
      await Promise.all(promises);
    });
  });

  describe('Listener notifications', () => {
    it('1 listener notification', async () => {
      const fetchData = karma(async (id: number) => {
        await tick();
        return { id };
      });

      const unsub = subscribeToKarma(fetchData, [1], () => {});
      await tick();
      await tick();
      unsub();
    });

    it('10 listeners notification', async () => {
      const fetchData = karma(async (id: number) => {
        await tick();
        return { id };
      });

      const unsubs = Array(10).fill(0).map(() =>
        subscribeToKarma(fetchData, [1], () => {})
      );

      await tick();
      await tick();

      for (const unsub of unsubs) {
        unsub();
      }
    });

    it('100 listeners notification', async () => {
      const fetchData = karma(async (id: number) => {
        await tick();
        return { id };
      });

      const unsubs = Array(100).fill(0).map(() =>
        subscribeToKarma(fetchData, [1], () => {})
      );

      await tick();
      await tick();

      for (const unsub of unsubs) {
        unsub();
      }
    });

    it('1000 listeners notification', async () => {
      const fetchData = karma(async (id: number) => {
        await tick();
        return { id };
      });

      const start = performance.now();
      const unsubs = Array(1000).fill(0).map(() =>
        subscribeToKarma(fetchData, [1], () => {})
      );

      await tick();
      await tick();

      for (const unsub of unsubs) {
        unsub();
      }
      const duration = performance.now() - start;

      console.log(`  1000 listeners: ${duration.toFixed(2)}ms`);
    });
  });

  describe('Invalidation performance', () => {
    it('invalidate with 1 listener', async () => {
      const fetchData = karma(async (id: number) => {
        await tick();
        return { id };
      });

      const unsub = subscribeToKarma(fetchData, [1], () => {});
      await tick();
      await tick();

      karmaCache.invalidate(fetchData, 1);
      await tick();
      await tick();

      unsub();
    });

    it('invalidate with 10 listeners', async () => {
      const fetchData = karma(async (id: number) => {
        await tick();
        return { id };
      });

      const unsubs = Array(10).fill(0).map(() =>
        subscribeToKarma(fetchData, [1], () => {})
      );
      await tick();
      await tick();

      karmaCache.invalidate(fetchData, 1);
      await tick();
      await tick();

      for (const unsub of unsubs) {
        unsub();
      }
    });

    it('invalidate with 100 listeners', async () => {
      const fetchData = karma(async (id: number) => {
        await tick();
        return { id };
      });

      const unsubs = Array(100).fill(0).map(() =>
        subscribeToKarma(fetchData, [1], () => {})
      );
      await tick();
      await tick();

      karmaCache.invalidate(fetchData, 1);
      await tick();
      await tick();

      for (const unsub of unsubs) {
        unsub();
      }
    });
  });

  describe('Cache key generation', () => {
    it('JSON.stringify cache key (simple)', async () => {
      const fetchData = karma(async (id: number) => {
        await tick();
        return { id };
      });

      await runKarma(fetchData, 1);
      await runKarma(fetchData, 1);
    });

    it('JSON.stringify cache key (complex object)', async () => {
      const fetchData = karma(async (obj: { id: number; name: string; tags: string[] }) => {
        await tick();
        return { ...obj };
      });

      const complexObj = { id: 1, name: 'Test', tags: ['a', 'b', 'c'] };

      await runKarma(fetchData, complexObj);
      await runKarma(fetchData, complexObj);
    });

    it('custom cache key function', async () => {
      const fetchData = karma(
        async (obj: { id: number; name: string }) => {
          await tick();
          return { ...obj };
        },
        {
          cacheKey: (obj) => ['user', obj.id],
        }
      );

      const obj = { id: 1, name: 'Test' };

      await runKarma(fetchData, obj);
      await runKarma(fetchData, obj);
    });
  });

  describe('Stale-while-revalidate', () => {
    it('stale cache (background refetch)', async () => {
      const fetchData = karma(
        async (id: number) => {
          await tick();
          return { id };
        },
        { staleTime: 0 }
      );

      await runKarma(fetchData, 1);
      await new Promise(r => setTimeout(r, 5));
      await runKarma(fetchData, 1);
    });
  });

  describe('Memory and cleanup', () => {
    it('auto-dispose (no listeners)', async () => {
      const fetchData = karma(
        async (id: number) => {
          await tick();
          return { id };
        },
        { cacheTime: 10 }
      );

      const unsub = subscribeToKarma(fetchData, [1], () => {});
      await tick();
      await tick();
      unsub();

      await new Promise(r => setTimeout(r, 20));
    });

    it('keepAlive (no disposal)', async () => {
      const fetchData = karma(
        async (id: number) => {
          await tick();
          return { id };
        },
        { keepAlive: true }
      );

      const unsub = subscribeToKarma(fetchData, [1], () => {});
      await tick();
      await tick();
      unsub();

      await new Promise(r => setTimeout(r, 20));
    });
  });
});
