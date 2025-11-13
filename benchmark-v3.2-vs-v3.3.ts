/**
 * Benchmark: v3.2 vs v3.3 Lazy Optimization
 * Compare batching performance before and after lazy evaluation
 */

import { createMemo, createSignal, batch as solidBatch } from 'solid-js';
import { batch, computed, subscribe, zen } from './packages/zen/dist/index.js';

const ITERATIONS = 100_000;

// Zen v3.3
const zenA1 = zen(1);
const zenB1 = zen(2);
let _zenComputes1 = 0;
const zenC1 = computed([zenA1, zenB1], (a, b) => {
  _zenComputes1++;
  return a + b;
});

// Warmup
for (let i = 0; i < 1000; i++) {
  batch(() => {
    zenA1.value = i;
    zenB1.value = i * 2;
  });
  const _ = zenC1.value;
}

// Benchmark
_zenComputes1 = 0;
const zenStart1 = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  batch(() => {
    zenA1.value = i;
    zenB1.value = i * 2;
  });
  const _ = zenC1.value;
}
const zenTime1 = performance.now() - zenStart1;

// Solid
const [solidA1, setSolidA1] = createSignal(1);
const [solidB1, setSolidB1] = createSignal(2);
let _solidComputes1 = 0;
const solidC1 = createMemo(() => {
  _solidComputes1++;
  return solidA1() + solidB1();
});

// Warmup
for (let i = 0; i < 1000; i++) {
  solidBatch(() => {
    setSolidA1(i);
    setSolidB1(i * 2);
  });
  const _ = solidC1();
}

// Benchmark
_solidComputes1 = 0;
const solidStart1 = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  solidBatch(() => {
    setSolidA1(i);
    setSolidB1(i * 2);
  });
  const _ = solidC1();
}
const solidTime1 = performance.now() - solidStart1;

// Zen v3.3
const zenA2 = zen(1);
const zenB2 = zen(2);
let _zenComputes2 = 0;
const zenC2 = computed([zenA2, zenB2], (a, b) => {
  _zenComputes2++;
  return a + b;
});
let zenListenerCalls2 = 0;
const zenUnsub2 = subscribe(zenC2, () => zenListenerCalls2++);

// Warmup
for (let i = 0; i < 1000; i++) {
  batch(() => {
    zenA2.value = i;
    zenB2.value = i * 2;
  });
}

// Benchmark
_zenComputes2 = 0;
zenListenerCalls2 = 0;
const zenStart2 = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  batch(() => {
    zenA2.value = i;
    zenB2.value = i * 2;
  });
}
const zenTime2 = performance.now() - zenStart2;

// Solid
const [solidA2, setSolidA2] = createSignal(1);
const [solidB2, setSolidB2] = createSignal(2);
let _solidComputes2 = 0;
const solidC2 = createMemo(() => {
  _solidComputes2++;
  return solidA2() + solidB2();
});
let _solidListenerCalls2 = 0;
// Create effect to simulate subscription
import { createEffect } from 'solid-js';
createEffect(() => {
  solidC2();
  _solidListenerCalls2++;
});

// Warmup
for (let i = 0; i < 1000; i++) {
  solidBatch(() => {
    setSolidA2(i);
    setSolidB2(i * 2);
  });
}

// Benchmark
_solidComputes2 = 0;
_solidListenerCalls2 = 0;
const solidStart2 = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  solidBatch(() => {
    setSolidA2(i);
    setSolidB2(i * 2);
  });
}
const solidTime2 = performance.now() - solidStart2;

// Zen v3.3
const zenA3 = zen(1);
const zenB3 = zen(2);
let zenComputes3 = 0;
const _zenC3 = computed([zenA3, zenB3], (a, b) => {
  zenComputes3++;
  return a + b;
});

// Warmup
for (let i = 0; i < 1000; i++) {
  batch(() => {
    zenA3.value = i;
    zenB3.value = i * 2;
  });
}

// Benchmark
zenComputes3 = 0;
const zenStart3 = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  batch(() => {
    zenA3.value = i;
    zenB3.value = i * 2;
  });
  // Don't access zenC3.value
}
const zenTime3 = performance.now() - zenStart3;

// Solid
const [solidA3, setSolidA3] = createSignal(1);
const [solidB3, setSolidB3] = createSignal(2);
let solidComputes3 = 0;
const _solidC3 = createMemo(() => {
  solidComputes3++;
  return solidA3() + solidB3();
});

// Warmup
for (let i = 0; i < 1000; i++) {
  solidBatch(() => {
    setSolidA3(i);
    setSolidB3(i * 2);
  });
}

// Benchmark
solidComputes3 = 0;
const solidStart3 = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  solidBatch(() => {
    setSolidA3(i);
    setSolidB3(i * 2);
  });
  // Don't access solidC3()
}
const solidTime3 = performance.now() - solidStart3;

// Overall assessment
const avgRatio = (zenTime1 / solidTime1 + zenTime2 / solidTime2 + zenTime3 / solidTime3) / 3;

if (zenComputes3 === 0 && solidComputes3 === 0) {
} else if (zenComputes3 === 0) {
} else {
}
if (avgRatio < 2) {
} else if (avgRatio < 5) {
} else {
}

zenUnsub2();
