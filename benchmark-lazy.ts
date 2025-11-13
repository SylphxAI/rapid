/**
 * Benchmark: v3.3 Lazy Optimization vs v3.2
 * Test scenario: Unobserved computed (no subscribers)
 */

import { batch, computed, subscribe, zen } from './packages/zen/dist/index.js';

const ITERATIONS = 10_000;
const a1 = zen(1);
const b1 = zen(2);
const c1 = computed([a1, b1], (a, b) => a + b);

let _computeCount1 = 0;
const a1WithCount = zen(1);
const b1WithCount = zen(2);
const c1WithCount = computed([a1WithCount, b1WithCount], (a, b) => {
  _computeCount1++;
  return a + b;
});

// Warmup
for (let i = 0; i < 100; i++) {
  batch(() => {
    a1.value = i;
    b1.value = i * 2;
  });
  const _ = c1.value;
}

// Benchmark
const start1 = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  batch(() => {
    a1.value = i;
    b1.value = i * 2;
  });
  const _ = c1.value; // Access after batch
}
const _time1 = performance.now() - start1;

// Count computes during benchmark
_computeCount1 = 0;
for (let i = 0; i < ITERATIONS; i++) {
  batch(() => {
    a1WithCount.value = i;
    b1WithCount.value = i * 2;
  });
  const _ = c1WithCount.value;
}
const a2 = zen(1);
const b2 = zen(2);
const c2 = computed([a2, b2], (a, b) => a + b);

let _computeCount2 = 0;
const a2WithCount = zen(1);
const b2WithCount = zen(2);
const c2WithCount = computed([a2WithCount, b2WithCount], (a, b) => {
  _computeCount2++;
  return a + b;
});

// Subscribe to make it observed
let callCount = 0;
const _unsub = subscribe(c2WithCount, () => callCount++);

// Warmup
for (let i = 0; i < 100; i++) {
  batch(() => {
    a2.value = i;
    b2.value = i * 2;
  });
  const _ = c2.value;
}

// Benchmark
const start2 = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  batch(() => {
    a2.value = i;
    b2.value = i * 2;
  });
  const _ = c2.value;
}
const _time2 = performance.now() - start2;

// Count computes during benchmark
_computeCount2 = 0;
callCount = 0;
for (let i = 0; i < ITERATIONS; i++) {
  batch(() => {
    a2WithCount.value = i;
    b2WithCount.value = i * 2;
  });
  const _ = c2WithCount.value;
}
const a3 = zen(1);
const b3 = zen(2);

let computeCount3 = 0;
const _c3 = computed([a3, b3], (a, b) => {
  computeCount3++;
  return a + b;
});

// Warmup
for (let i = 0; i < 100; i++) {
  batch(() => {
    a3.value = i;
    b3.value = i * 2;
  });
}

// Benchmark
const start3 = performance.now();
computeCount3 = 0;
for (let i = 0; i < ITERATIONS; i++) {
  batch(() => {
    a3.value = i;
    b3.value = i * 2;
  });
  // Don't access c3.value - should be fully lazy
}
const _time3 = performance.now() - start3;

if (computeCount3 === 0) {
} else {
}
