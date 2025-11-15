import { createMemo, createSignal } from 'solid-js';
/**
 * Comprehensive Benchmark: Zen (DIST) vs SolidJS
 * Uses production builds only for fair comparison
 */
import { bench, describe } from 'vitest';
import * as Zen from '../dist/index.js';

describe('Zen DIST vs SolidJS - Comprehensive', () => {
  // Diamond pattern: Source -> Left, Right -> Result
  bench('Zen DIST: Diamond (1k updates)', () => {
    const source = Zen.zen(0);
    const left = Zen.computed(() => source.value * 2);
    const right = Zen.computed(() => source.value + 10);
    const result = Zen.computed(() => left.value + right.value);
    Zen.subscribe(result, () => {});

    for (let i = 0; i < 1000; i++) {
      source.value = i;
    }
  });

  bench('SolidJS: Diamond (1k updates)', () => {
    const [source, setSource] = createSignal(0);
    const left = createMemo(() => source() * 2);
    const right = createMemo(() => source() + 10);
    const result = createMemo(() => left() + right());
    result();

    for (let i = 0; i < 1000; i++) {
      setSource(i);
    }
  });

  // Triangle: Source -> Mid1, Mid2 -> Result
  bench('Zen DIST: Triangle (1k updates)', () => {
    const source = Zen.zen(0);
    const mid1 = Zen.computed(() => source.value * 2);
    const mid2 = Zen.computed(() => source.value + 10);
    const result = Zen.computed(() => mid1.value + mid2.value);
    Zen.subscribe(result, () => {});

    for (let i = 0; i < 1000; i++) {
      source.value = i;
    }
  });

  bench('SolidJS: Triangle (1k updates)', () => {
    const [source, setSource] = createSignal(0);
    const mid1 = createMemo(() => source() * 2);
    const mid2 = createMemo(() => source() + 10);
    const result = createMemo(() => mid1() + mid2());
    result();

    for (let i = 0; i < 1000; i++) {
      setSource(i);
    }
  });

  // Fanout: 1 source -> 100 computeds
  bench('Zen DIST: Fanout (100 computeds)', () => {
    const source = Zen.zen(0);
    const computeds = Array.from({ length: 100 }, () => Zen.computed(() => source.value * 2));
    for (const c of computeds) {
      Zen.subscribe(c, () => {});
    }

    for (let i = 0; i < 100; i++) {
      source.value = i;
    }
  });

  bench('SolidJS: Fanout (100 memos)', () => {
    const [source, setSource] = createSignal(0);
    const memos = Array.from({ length: 100 }, () => createMemo(() => source() * 2));
    for (const m of memos) {
      m();
    }

    for (let i = 0; i < 100; i++) {
      setSource(i);
    }
  });

  // Deep chain: 10-level dependency chain
  bench('Zen DIST: Deep chain (10 levels)', () => {
    let current: any = Zen.zen(0);
    const start = current;

    for (let i = 0; i < 10; i++) {
      const prev = current;
      current = Zen.computed(() => prev.value + 1);
    }
    Zen.subscribe(current, () => {});

    for (let i = 0; i < 1000; i++) {
      start.value = i;
    }
  });

  bench('SolidJS: Deep chain (10 levels)', () => {
    const [source, setSource] = createSignal(0);
    let current: any = source;

    for (let i = 0; i < 10; i++) {
      const prev = current;
      current = createMemo(() => prev() + 1);
    }
    current();

    for (let i = 0; i < 1000; i++) {
      setSource(i);
    }
  });

  // Broad: 50 sources merged
  bench('Zen DIST: Broad (50 sources)', () => {
    const sources = Array.from({ length: 50 }, () => Zen.zen(0));
    const merged = Zen.computed(() => sources.reduce((sum, s) => sum + s.value, 0));
    Zen.subscribe(merged, () => {});

    for (let i = 0; i < 50; i++) {
      sources[i]!.value = i;
    }
  });

  bench('SolidJS: Broad (50 sources)', () => {
    const sources = Array.from({ length: 50 }, () => createSignal(0));
    const merged = createMemo(() => sources.reduce((sum, s) => sum + s[0](), 0));
    merged();

    for (let i = 0; i < 50; i++) {
      sources[i]?.[1](i);
    }
  });

  // Creation overhead
  bench('Zen DIST: Create 1000 signals', () => {
    const signals = Array.from({ length: 1000 }, (_, i) => Zen.zen(i));
    signals[0]!.value = 999;
  });

  bench('SolidJS: Create 1000 signals', () => {
    const signals = Array.from({ length: 1000 }, (_, i) => createSignal(i));
    signals[0]?.[1](999);
  });

  bench('Zen DIST: Create 1000 computeds', () => {
    const source = Zen.zen(0);
    const _computeds = Array.from({ length: 1000 }, () => Zen.computed(() => source.value * 2));
    source.value = 1;
  });

  bench('SolidJS: Create 1000 memos', () => {
    const [source] = createSignal(0);
    const memos = Array.from({ length: 1000 }, () => createMemo(() => source() * 2));
    memos[0]?.();
  });
});
