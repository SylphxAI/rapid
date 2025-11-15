/**
 * Simple benchmark to test batching performance
 */

import { createMemo, createSignal, batch as solidBatch } from 'solid-js';
import { batch, computed, zen } from './packages/zen/dist/index.js';

const ITERATIONS = 100_000;

// Test zen batching
const a1 = zen(1);
const b1 = zen(2);
const c1 = computed([a1, b1], (a, b) => a + b);

const start1 = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  batch(() => {
    a1.value = i;
    b1.value = i * 2;
  });
  const _result = c1.value; // Force evaluation
}
const zenTime = performance.now() - start1;

// Test Solid batching
const [a2, setA2] = createSignal(1);
const [b2, setB2] = createSignal(2);
const c2 = createMemo(() => a2() + b2());

const start2 = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  solidBatch(() => {
    setA2(i);
    setB2(i * 2);
  });
  const _result = c2(); // Force evaluation
}
const solidTime = performance.now() - start2;

const _speedup = (solidTime / zenTime).toFixed(2);
