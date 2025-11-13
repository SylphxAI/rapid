/**
 * Standalone benchmark comparing optimized zen v3.2 vs Solid Signals
 */

import { createMemo, createSignal, batch as solidBatch } from 'solid-js';
import { batch, computed, zen } from './packages/zen/dist/index.js';

const ITERATIONS = 100_000;

function benchmark(_name: string, fn: () => void) {
  // Warmup
  for (let i = 0; i < 1000; i++) fn();

  const start = performance.now();
  for (let i = 0; i < ITERATIONS; i++) {
    fn();
  }
  const end = performance.now();
  const time = end - start;
  const _opsPerSec = (ITERATIONS / time) * 1000;
  return time;
}
const zenTime1 = benchmark('zen: write', () => {
  const count = zen(0);
  count.value = 1;
});

const solidTime1 = benchmark('Solid: write', () => {
  const [_count, setCount] = createSignal(0);
  setCount(1);
});
const zenTime2 = benchmark('zen: computed(1)', () => {
  const a = zen(1);
  const b = computed(() => a.value * 2);
  a.value = 2;
  b.value;
});

const solidTime2 = benchmark('Solid: memo(1)', () => {
  const [a, setA] = createSignal(1);
  const b = createMemo(() => a() * 2);
  setA(2);
  b();
});
const zenTime3 = benchmark('zen: deep chain', () => {
  const a = zen(1);
  const b = computed(() => a.value * 2);
  const c = computed(() => b.value * 2);
  const d = computed(() => c.value * 2);
  const e = computed(() => d.value * 2);
  a.value = 2;
  e.value;
});

const solidTime3 = benchmark('Solid: deep chain', () => {
  const [a, setA] = createSignal(1);
  const b = createMemo(() => a() * 2);
  const c = createMemo(() => b() * 2);
  const d = createMemo(() => c() * 2);
  const e = createMemo(() => d() * 2);
  setA(2);
  e();
});
const zenTime4 = benchmark('zen: diamond', () => {
  const a = zen(1);
  const b = computed(() => a.value * 2);
  const c = computed(() => a.value + 10);
  const d = computed(() => b.value + c.value);
  a.value = 2;
  d.value;
});

const solidTime4 = benchmark('Solid: diamond', () => {
  const [a, setA] = createSignal(1);
  const b = createMemo(() => a() * 2);
  const c = createMemo(() => a() + 10);
  const d = createMemo(() => b() + c());
  setA(2);
  d();
});
const zenTime5 = benchmark('zen: batch updates', () => {
  const a = zen(1);
  const b = zen(2);
  const c = computed(() => a.value + b.value);
  batch(() => {
    a.value = 10;
    b.value = 20;
  });
  c.value;
});

const solidTime5 = benchmark('Solid: batch updates', () => {
  const [a, setA] = createSignal(1);
  const [b, setB] = createSignal(2);
  const c = createMemo(() => a() + b());
  solidBatch(() => {
    setA(10);
    setB(20);
  });
  c();
});
const zenTime6 = benchmark('zen: computed(5)', () => {
  const a = zen(1);
  const b = zen(2);
  const c = zen(3);
  const d = zen(4);
  const e = zen(5);
  const sum = computed(() => a.value + b.value + c.value + d.value + e.value);
  a.value = 10;
  sum.value;
});

const solidTime6 = benchmark('Solid: memo(5)', () => {
  const [a, setA] = createSignal(1);
  const [b] = createSignal(2);
  const [c] = createSignal(3);
  const [d] = createSignal(4);
  const [e] = createSignal(5);
  const sum = createMemo(() => a() + b() + c() + d() + e());
  setA(10);
  sum();
});

const _zenWins = [
  zenTime1 < solidTime1 ? 'Basic Write' : null,
  zenTime2 < solidTime2 ? 'Computed' : null,
  zenTime3 < solidTime3 ? 'Deep Chain' : null,
  zenTime4 < solidTime4 ? 'Diamond' : null,
  zenTime5 < solidTime5 ? 'Batching ⚡' : null,
  zenTime6 < solidTime6 ? 'Multi-source' : null,
].filter(Boolean);

const _solidWins = [
  solidTime1 < zenTime1 ? 'Basic Write' : null,
  solidTime2 < zenTime2 ? 'Computed' : null,
  solidTime3 < zenTime3 ? 'Deep Chain' : null,
  solidTime4 < zenTime4 ? 'Diamond' : null,
  solidTime5 < zenTime5 ? 'Batching' : null,
  solidTime6 < zenTime6 ? 'Multi-source' : null,
].filter(Boolean);

const _batchingSpeedup = (solidTime5 / zenTime5).toFixed(2);
