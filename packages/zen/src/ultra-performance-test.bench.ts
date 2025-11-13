import { bench, describe } from 'vitest';
import { zen, computed, batch, subscribe } from './index.js';

describe('ULTRA PERFORMANCE - Core Operations', () => {
  bench('Atom Creation', () => {
    for (let i = 0; i < 1000000; i++) {
      zen(i);
    }
  });

  bench('Atom Read (no listeners)', () => {
    const atom = zen(42);
    for (let i = 0; i < 1000000; i++) {
      const _ = atom.value;
    }
  });

  bench('Atom Write (no listeners)', () => {
    const atom = zen(42);
    for (let i = 0; i < 1000000; i++) {
      atom.value = i;
    }
  });

  bench('Atom Write (1 listener)', () => {
    const atom = zen(42);
    const unsub = subscribe(atom, () => {});
    for (let i = 0; i < 1000000; i++) {
      atom.value = i;
    }
    unsub();
  });

  bench('Computed Creation', () => {
    const a = zen(1);
    const b = zen(2);
    for (let i = 0; i < 500000; i++) {
      computed(() => a.value + b.value);
    }
  });

  bench('Computed Read', () => {
    const a = zen(1);
    const b = zen(2);
    const sum = computed(() => a.value + b.value);
    for (let i = 0; i < 1000000; i++) {
      const _ = sum.value;
    }
  });

  bench('Computed Update', () => {
    const a = zen(1);
    const b = zen(2);
    const sum = computed(() => a.value + b.value);
    for (let i = 0; i < 500000; i++) {
      a.value = i;
      const _ = sum.value;
    }
  });

  bench('Batch Operations (10 signals)', () => {
    const signals = Array.from({ length: 10 }, () => zen(0));
    for (let i = 0; i < 100000; i++) {
      batch(() => {
        signals.forEach((s, idx) => (s.value = i + idx));
      });
    }
  });

  bench('Batch Operations (100 signals)', () => {
    const signals = Array.from({ length: 100 }, () => zen(0));
    for (let i = 0; i < 10000; i++) {
      batch(() => {
        signals.forEach((s, idx) => (s.value = i + idx));
      });
    }
  });

  bench('Subscribe/Unsubscribe', () => {
    const atom = zen(42);
    for (let i = 0; i < 500000; i++) {
      const unsub = subscribe(atom, () => {});
      unsub();
    }
  });
});