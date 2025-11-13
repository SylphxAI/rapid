import { describe, expect, it, vi } from 'vitest';
import { batch, computed, effect, zen } from './zen';

describe('effect (auto-tracking)', () => {
  it('auto-tracks single dependency', () => {
    const count = zen(0);
    const values: number[] = [];

    effect(() => {
      values.push(count.value);
    });

    expect(values).toEqual([0]);

    count.value = 1;
    expect(values).toEqual([0, 1]);

    count.value = 2;
    expect(values).toEqual([0, 1, 2]);
  });

  it('auto-tracks multiple dependencies', () => {
    const a = zen(1);
    const b = zen(2);
    const sums: number[] = [];

    effect(() => {
      sums.push(a.value + b.value);
    });

    expect(sums).toEqual([3]);

    a.value = 10;
    expect(sums).toEqual([3, 12]);

    b.value = 20;
    expect(sums).toEqual([3, 12, 30]);
  });

  it('auto-tracks computed dependencies', () => {
    const count = zen(1);
    const doubled = computed(() => count.value * 2);
    const values: number[] = [];

    effect(() => {
      values.push(doubled.value);
    });

    expect(values).toEqual([2]);

    count.value = 5;
    expect(values).toEqual([2, 10]);
  });

  it('supports cleanup functions', () => {
    const count = zen(0);
    const cleanups: number[] = [];

    effect(() => {
      const val = count.value;
      return () => {
        cleanups.push(val);
      };
    });

    expect(cleanups).toEqual([]);

    count.value = 1;
    expect(cleanups).toEqual([0]); // Previous cleanup called

    count.value = 2;
    expect(cleanups).toEqual([0, 1]);
  });

  it('calls cleanup on dispose', () => {
    const count = zen(0);
    let cleaned = false;

    const dispose = effect(() => {
      count.value;
      return () => {
        cleaned = true;
      };
    });

    expect(cleaned).toBe(false);

    dispose();
    expect(cleaned).toBe(true);
  });

  it('unsubscribes when disposed', () => {
    const count = zen(0);
    const values: number[] = [];

    const dispose = effect(() => {
      values.push(count.value);
    });

    expect(values).toEqual([0]);

    count.value = 1;
    expect(values).toEqual([0, 1]);

    dispose();

    count.value = 2;
    expect(values).toEqual([0, 1]); // No change after dispose
  });

  it('re-tracks conditional dependencies', () => {
    const flag = zen(true);
    const a = zen(1);
    const b = zen(10);
    const values: number[] = [];

    effect(() => {
      values.push(flag.value ? a.value : b.value);
    });

    expect(values).toEqual([1]);

    // Change a (should trigger because flag is true)
    a.value = 2;
    expect(values).toEqual([1, 2]);

    // Change b (should NOT trigger because flag is true)
    b.value = 20;
    expect(values).toEqual([1, 2]);

    // Switch flag
    flag.value = false;
    expect(values).toEqual([1, 2, 20]);

    // Now a should NOT trigger
    a.value = 3;
    expect(values).toEqual([1, 2, 20]);

    // But b should trigger
    b.value = 30;
    expect(values).toEqual([1, 2, 20, 30]);
  });

  it('supports explicit dependencies for performance', () => {
    const count = zen(0);
    const unused = zen(100);
    const values: number[] = [];

    effect(
      () => {
        // Access unused but don't track it
        values.push(count.value + unused.value);
      },
      [count], // Only track count
    );

    expect(values).toEqual([100]);

    count.value = 1;
    expect(values).toEqual([100, 101]);

    // unused change should NOT trigger
    unused.value = 200;
    expect(values).toEqual([100, 101]);
  });

  it('works with batched updates', () => {
    const a = zen(1);
    const b = zen(2);
    const values: number[] = [];

    effect(() => {
      values.push(a.value + b.value);
    });

    expect(values).toEqual([3]);

    batch(() => {
      a.value = 10;
      b.value = 20;
    });

    // Effect runs once at end of batch (v3.2 optimization: deduplicates effect executions)
    // This matches Solid Signals behavior and is more efficient
    expect(values).toEqual([3, 30]);
  });

  it('handles errors gracefully', () => {
    const count = zen(0);
    let runCount = 0;
    const consoleError = console.error;
    console.error = () => {}; // Suppress error logs

    effect(() => {
      runCount++;
      count.value;
      if (runCount === 2) {
        throw new Error('Test error');
      }
    });

    expect(runCount).toBe(1);

    count.value = 1; // Will throw
    expect(runCount).toBe(2);

    // Should still work after error
    count.value = 2;
    expect(runCount).toBe(3);

    console.error = consoleError; // Restore
  });

  it('cleanup runs before error', () => {
    const count = zen(0);
    let cleanupCalled = false;
    let runCount = 0;
    const consoleError = console.error;
    console.error = () => {}; // Suppress error logs

    effect(() => {
      runCount++;
      count.value;
      if (runCount === 2) {
        throw new Error('Test error');
      }
      return () => {
        cleanupCalled = true;
      };
    });

    expect(cleanupCalled).toBe(false);

    count.value = 1; // Will throw but cleanup runs first
    expect(cleanupCalled).toBe(true); // Cleanup from first run

    cleanupCalled = false;
    count.value = 2; // Runs successfully again
    expect(runCount).toBe(3);
    expect(cleanupCalled).toBe(false); // No cleanup yet from errored run

    console.error = consoleError; // Restore
  });

  it('can access multiple computed values', () => {
    const count = zen(1);
    const doubled = computed(() => count.value * 2);
    const tripled = computed(() => count.value * 3);
    const results: string[] = [];

    effect(() => {
      results.push(`${doubled.value}-${tripled.value}`);
    });

    expect(results).toEqual(['2-3']);

    count.value = 5;
    expect(results).toEqual(['2-3', '10-15']);
  });

  it('prevents duplicate subscriptions', () => {
    const count = zen(0);
    let runCount = 0;

    effect(() => {
      // Access same signal multiple times
      count.value;
      count.value;
      count.value;
      runCount++;
    });

    expect(runCount).toBe(1);

    count.value = 1;
    expect(runCount).toBe(2); // Should only run once, not three times
  });
});
