import { bench, describe } from 'vitest';
import { zen, set, computed, subscribe } from './zen';

describe('Computed Performance - Version Tracking Benefits', () => {
  bench('computed: source updates but value unchanged (version check benefit)', () => {
    const base = zen(0);
    const doubled = computed([base], ([v]: [number]) => Math.floor(v / 2) * 2); // Rounds to even
    subscribe(doubled, () => {});

    // Update base but doubled value stays same (0,1 -> 0, 2,3 -> 2, etc)
    for (let i = 0; i < 200; i++) {
      set(base, i);
    }
  });

  bench('computed: source updates and value changes every time', () => {
    const base = zen(0);
    const doubled = computed([base], ([v]: [number]) => v * 2);
    subscribe(doubled, () => {});

    for (let i = 0; i < 200; i++) {
      set(base, i);
    }
  });

  bench('computed with 1 source (most common case)', () => {
    const base = zen(0);
    const doubled = computed([base], ([v]: [number]) => v * 2);
    subscribe(doubled, () => {});

    for (let i = 0; i < 100; i++) {
      set(base, i);
    }
  });

  bench('computed with 3 sources', () => {
    const a = zen(0);
    const b = zen(0);
    const c = zen(0);
    const sum = computed([a, b, c], ([x, y, z]: [number, number, number]) => x + y + z);
    subscribe(sum, () => {});

    for (let i = 0; i < 100; i++) {
      set(a, i);
      set(b, i);
      set(c, i);
    }
  });

  bench('computed with 5 sources', () => {
    const sources = Array.from({ length: 5 }, () => zen(0));
    const sum = computed(sources, (...vals: number[]) => vals.reduce((a, b) => a + b, 0));
    subscribe(sum, () => {});

    for (let i = 0; i < 100; i++) {
      for (const source of sources) {
        set(source, i);
      }
    }
  });
});

describe('Computed Performance - Chain Depth', () => {
  bench('2-level chain: base -> c1 -> c2', () => {
    const base = zen(0);
    const c1 = computed([base], ([v]: [number]) => v * 2);
    const c2 = computed([c1], ([v]: [number]) => v + 1);
    subscribe(c2, () => {});

    for (let i = 0; i < 100; i++) {
      set(base, i);
    }
  });

  bench('3-level chain: base -> c1 -> c2 -> c3', () => {
    const base = zen(0);
    const c1 = computed([base], ([v]: [number]) => v * 2);
    const c2 = computed([c1], ([v]: [number]) => v + 1);
    const c3 = computed([c2], ([v]: [number]) => v * 3);
    subscribe(c3, () => {});

    for (let i = 0; i < 100; i++) {
      set(base, i);
    }
  });

  bench('5-level chain (deep)', () => {
    const base = zen(0);
    const c1 = computed([base], ([v]: [number]) => v * 2);
    const c2 = computed([c1], ([v]: [number]) => v + 1);
    const c3 = computed([c2], ([v]: [number]) => v * 3);
    const c4 = computed([c3], ([v]: [number]) => v - 5);
    const c5 = computed([c4], ([v]: [number]) => v * 2);
    subscribe(c5, () => {});

    for (let i = 0; i < 100; i++) {
      set(base, i);
    }
  });
});

describe('Computed Performance - Diamond Pattern', () => {
  bench('diamond: base -> [left, right] -> final', () => {
    const base = zen(0);
    const left = computed([base], ([v]: [number]) => v * 2);
    const right = computed([base], ([v]: [number]) => v * 3);
    const final = computed([left, right], ([l, r]: [number, number]) => l + r);
    subscribe(final, () => {});

    for (let i = 0; i < 100; i++) {
      set(base, i);
    }
  });

  bench('wide diamond: base -> 4 computed -> 2 computed -> 1 final', () => {
    const base = zen(0);
    const a = computed([base], ([v]: [number]) => v * 2);
    const b = computed([base], ([v]: [number]) => v * 3);
    const c = computed([base], ([v]: [number]) => v * 4);
    const d = computed([base], ([v]: [number]) => v * 5);
    const e = computed([a, b], ([x, y]: [number, number]) => x + y);
    const f = computed([c, d], ([x, y]: [number, number]) => x + y);
    const final = computed([e, f], ([x, y]: [number, number]) => x + y);
    subscribe(final, () => {});

    for (let i = 0; i < 100; i++) {
      set(base, i);
    }
  });
});
