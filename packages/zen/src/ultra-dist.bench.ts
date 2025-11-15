/**
 * Zen Ultra vs SolidJS - Using DIST versions only
 */
import { bench, describe } from 'vitest';
import { createSignal, createMemo } from 'solid-js';

// Import from dist
import * as ZenUltra from '../dist/index-ultra';

describe('Zen Ultra (DIST) vs SolidJS', () => {
  bench('Zen Ultra DIST: diamond with 1k updates', () => {
    const source = ZenUltra.zen(0);
    const left = ZenUltra.computed(() => source.value * 2);
    const right = ZenUltra.computed(() => source.value + 10);
    const result = ZenUltra.computed(() => left.value + right.value);

    ZenUltra.subscribe(result, () => {});

    for (let i = 0; i < 1000; i++) {
      source.value = i;
    }
  });

  bench('Solid: diamond with 1k updates', () => {
    const [source, setSource] = createSignal(0);
    const left = createMemo(() => source() * 2);
    const right = createMemo(() => source() + 10);
    const result = createMemo(() => left() + right());

    result();

    for (let i = 0; i < 1000; i++) {
      setSource(i);
    }
  });

  bench('Zen Ultra DIST: triangle 1->2->1', () => {
    const source = ZenUltra.zen(0);
    const middle1 = ZenUltra.computed(() => source.value * 2);
    const middle2 = ZenUltra.computed(() => source.value + 10);
    const result = ZenUltra.computed(() => middle1.value + middle2.value);

    ZenUltra.subscribe(result, () => {});

    for (let i = 0; i < 1000; i++) {
      source.value = i;
    }
  });

  bench('Solid: triangle 1->2->1', () => {
    const [source, setSource] = createSignal(0);
    const middle1 = createMemo(() => source() * 2);
    const middle2 = createMemo(() => source() + 10);
    const result = createMemo(() => middle1() + middle2());

    result();

    for (let i = 0; i < 1000; i++) {
      setSource(i);
    }
  });

  bench('Zen Ultra DIST: 1 source -> 100 computeds', () => {
    const source = ZenUltra.zen(0);
    const computeds = Array.from({ length: 100 }, () =>
      ZenUltra.computed(() => source.value * 2)
    );

    computeds.forEach(c => ZenUltra.subscribe(c, () => {}));

    for (let i = 0; i < 100; i++) {
      source.value = i;
    }
  });

  bench('Solid: 1 source -> 100 memos', () => {
    const [source, setSource] = createSignal(0);
    const memos = Array.from({ length: 100 }, () => createMemo(() => source() * 2));

    memos.forEach(m => m());

    for (let i = 0; i < 100; i++) {
      setSource(i);
    }
  });

  bench('Zen Ultra DIST: 50 sources merged', () => {
    const sources = Array.from({ length: 50 }, () => ZenUltra.zen(0));
    const merged = ZenUltra.computed(() => sources.reduce((sum, s) => sum + s.value, 0));

    ZenUltra.subscribe(merged, () => {});

    for (let i = 0; i < 50; i++) {
      sources[i]!.value = i;
    }
  });

  bench('Solid: 50 sources merged', () => {
    const sources = Array.from({ length: 50 }, () => createSignal(0));
    const merged = createMemo(() => sources.reduce((sum, s) => sum + s[0](), 0));

    merged();

    for (let i = 0; i < 50; i++) {
      sources[i]![1](i);
    }
  });
});
