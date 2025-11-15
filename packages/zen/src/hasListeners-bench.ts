/**
 * FOCUSED Benchmark: hasListeners Cache Optimization
 *
 * Tests ONLY the specific optimization: caching _hasListeners flag
 * to avoid repeated .size checks in the hot path.
 *
 * Uses dist build for accurate performance measurement.
 */

import { bench, describe } from 'vitest';
import { computed, zen } from '../dist/index.js';

describe('hasListeners Cache: Wide Fanout (1→100)', () => {
  const source = zen(0);
  const computeds = Array.from({ length: 100 }, () => computed(() => source.value * 2));

  bench('update + read all', () => {
    source.value++;
    for (let i = 0; i < computeds.length; i++) {
      const _ = computeds[i].value;
    }
  });
});

describe('hasListeners Cache: Large Fanout (1→500)', () => {
  const source = zen(0);
  const computeds = Array.from({ length: 500 }, () => computed(() => source.value * 2));

  bench('update + read all', () => {
    source.value++;
    for (let i = 0; i < computeds.length; i++) {
      const _ = computeds[i].value;
    }
  });
});

describe('hasListeners Cache: Massive Fanout (1→1000)', () => {
  const source = zen(0);
  const computeds = Array.from({ length: 1000 }, () => computed(() => source.value * 2));

  bench('update + read all', () => {
    source.value++;
    for (let i = 0; i < computeds.length; i++) {
      const _ = computeds[i].value;
    }
  });
});
