/**
 * Focused benchmark for batching performance
 * This replicates the exact scenario from the research
 */

import { createMemo, createSignal, batch as solidBatch } from 'solid-js';
import { batch, computed, zen } from './packages/zen/dist/index.js';

const ITERATIONS = 100_000;

const a1 = zen(1);
const b1 = zen(2);
const _c1 = computed(() => a1.value + b1.value);

let zenTime1 = 0;
{
  const start = performance.now();
  for (let i = 0; i < ITERATIONS; i++) {
    batch(() => {
      a1.value = i;
      b1.value = i * 2;
    });
  }
  zenTime1 = performance.now() - start;
}

const [a2, setA2] = createSignal(1);
const [b2, setB2] = createSignal(2);
const _c2 = createMemo(() => a2() + b2());

let solidTime1 = 0;
{
  const start = performance.now();
  for (let i = 0; i < ITERATIONS; i++) {
    solidBatch(() => {
      setA2(i);
      setB2(i * 2);
    });
  }
  solidTime1 = performance.now() - start;
}

const a3 = zen(1);
const b3 = computed(() => a3.value * 2);
const c3 = computed(() => b3.value * 2);
const d3 = computed(() => c3.value * 2);
const _e3 = computed(() => d3.value * 2);

let zenTime2 = 0;
{
  const start = performance.now();
  for (let i = 0; i < ITERATIONS; i++) {
    batch(() => {
      a3.value = i;
      a3.value = i + 1;
      a3.value = i + 2;
    });
  }
  zenTime2 = performance.now() - start;
}

const [a4, setA4] = createSignal(1);
const b4 = createMemo(() => a4() * 2);
const c4 = createMemo(() => b4() * 2);
const d4 = createMemo(() => c4() * 2);
const _e4 = createMemo(() => d4() * 2);

let solidTime2 = 0;
{
  const start = performance.now();
  for (let i = 0; i < ITERATIONS; i++) {
    solidBatch(() => {
      setA4(i);
      setA4(i + 1);
      setA4(i + 2);
    });
  }
  solidTime2 = performance.now() - start;
}

const a5 = zen(1);
const b5 = computed(() => a5.value * 2);
const c5 = computed(() => a5.value + 10);
const _d5 = computed(() => b5.value + c5.value);

let zenTime3 = 0;
{
  const start = performance.now();
  for (let i = 0; i < ITERATIONS; i++) {
    batch(() => {
      a5.value = i;
      a5.value = i + 1;
    });
  }
  zenTime3 = performance.now() - start;
}

const [a6, setA6] = createSignal(1);
const b6 = createMemo(() => a6() * 2);
const c6 = createMemo(() => a6() + 10);
const _d6 = createMemo(() => b6() + c6());

let solidTime3 = 0;
{
  const start = performance.now();
  for (let i = 0; i < ITERATIONS; i++) {
    solidBatch(() => {
      setA6(i);
      setA6(i + 1);
    });
  }
  solidTime3 = performance.now() - start;
}

const _avgZenSpeedup = (solidTime1 + solidTime2 + solidTime3) / (zenTime1 + zenTime2 + zenTime3);
