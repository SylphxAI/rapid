import { bench, describe } from 'vitest';
import { createSignal, createMemo, batch as solidBatch } from 'solid-js';
import * as ZenUltra from './zen-ultra';

describe('Zen Ultra vs SolidJS', () => {
  bench('Zen Ultra: diamond with 1k updates', () => {
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

    // Trigger subscription
    result();

    for (let i = 0; i < 1000; i++) {
      setSource(i);
    }
  });

  bench('Zen Ultra: triangle 1->2->1 pattern', () => {
    const source = ZenUltra.zen(0);
    const middle1 = ZenUltra.computed(() => source.value * 2);
    const middle2 = ZenUltra.computed(() => source.value + 10);
    const result = ZenUltra.computed(() => middle1.value + middle2.value);

    ZenUltra.subscribe(result, () => {});

    for (let i = 0; i < 1000; i++) {
      source.value = i;
    }
  });

  bench('Solid: triangle 1->2->1 pattern', () => {
    const [source, setSource] = createSignal(0);
    const middle1 = createMemo(() => source() * 2);
    const middle2 = createMemo(() => source() + 10);
    const result = createMemo(() => middle1() + middle2());

    result();

    for (let i = 0; i < 1000; i++) {
      setSource(i);
    }
  });

  bench('Zen Ultra: 1 source -> 100 computeds', () => {
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

  bench('Zen Ultra: 10-level chain', () => {
    let current: any = ZenUltra.zen(0);
    for (let i = 0; i < 10; i++) {
      const prev = current;
      current = ZenUltra.computed(() => prev.value + 1);
    }

    ZenUltra.subscribe(current, () => {});

    const source = current;
    for (let i = 0; i < 1000; i++) {
      // Walk back to source
      let s: any = source;
      while (s._sources && s._sources[0]) {
        s = s._sources[0];
      }
      s.value = i;
    }
  });

  bench('Solid: 10-level chain', () => {
    let current: any = createSignal(0);
    let setter = current[1];
    current = current[0];

    for (let i = 0; i < 10; i++) {
      const prev = current;
      current = createMemo(() => prev() + 1);
    }

    current();

    for (let i = 0; i < 1000; i++) {
      setter(i);
    }
  });

  bench('Zen Ultra: 50 sources merged', () => {
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

  bench('Zen Ultra: batch 100 updates', () => {
    const sources = Array.from({ length: 10 }, () => ZenUltra.zen(0));
    const result = ZenUltra.computed(() => sources.reduce((sum, s) => sum + s.value, 0));

    ZenUltra.subscribe(result, () => {});

    for (let i = 0; i < 10; i++) {
      ZenUltra.batch(() => {
        sources.forEach(s => s.value = i);
      });
    }
  });

  bench('Solid: batch 100 updates', () => {
    const sources = Array.from({ length: 10 }, () => createSignal(0));
    const result = createMemo(() => sources.reduce((sum, s) => sum + s[0](), 0));

    result();

    for (let i = 0; i < 10; i++) {
      solidBatch(() => {
        sources.forEach(s => s[1](i));
      });
    }
  });
});
