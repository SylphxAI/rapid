/**
 * Benchmark: Phase 2 Optimizations vs Solid.js
 * Test all Phase 2 improvements against Solid
 */

import { batch, computed, subscribe, zen } from './packages/zen/dist/index.js';
import { createMemo, createSignal, batch as solidBatch, createEffect } from 'solid-js';

const ITERATIONS = 100_000;

console.log('=== Phase 2 (Epoch + Queue Merge + Inline) vs Solid.js ===\n');

// ============================================================================
// Test 1: Unobserved computed (pure lazy)
// ============================================================================
console.log('Test 1: Unobserved computed (lazy evaluation)');

// Zen Phase 2
const zenA1 = zen(1);
const zenB1 = zen(2);
const zenC1 = computed([zenA1, zenB1], (a, b) => a + b);

// Warmup
for (let i = 0; i < 1000; i++) {
  batch(() => {
    zenA1.value = i;
    zenB1.value = i * 2;
  });
  const _ = zenC1.value;
}

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
const solidC1 = createMemo(() => solidA1() + solidB1());

// Warmup
for (let i = 0; i < 1000; i++) {
  solidBatch(() => {
    setSolidA1(i);
    setSolidB1(i * 2);
  });
  const _ = solidC1();
}

const solidStart1 = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  solidBatch(() => {
    setSolidA1(i);
    setSolidB1(i * 2);
  });
  const _ = solidC1();
}
const solidTime1 = performance.now() - solidStart1;

console.log(`Zen Phase 2: ${zenTime1.toFixed(2)}ms`);
console.log(`Solid:       ${solidTime1.toFixed(2)}ms`);
console.log(`Ratio:       ${(zenTime1 / solidTime1).toFixed(2)}x ${zenTime1 > solidTime1 ? 'slower' : 'faster'}`);
console.log();

// ============================================================================
// Test 2: Observed computed (with subscription)
// ============================================================================
console.log('Test 2: Observed computed (with subscription)');

// Zen Phase 2
const zenA2 = zen(1);
const zenB2 = zen(2);
const zenC2 = computed([zenA2, zenB2], (a, b) => a + b);
const zenUnsub2 = subscribe(zenC2, () => {});

// Warmup
for (let i = 0; i < 1000; i++) {
  batch(() => {
    zenA2.value = i;
    zenB2.value = i * 2;
  });
}

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
const solidC2 = createMemo(() => solidA2() + solidB2());
createEffect(() => solidC2());

// Warmup
for (let i = 0; i < 1000; i++) {
  solidBatch(() => {
    setSolidA2(i);
    setSolidB2(i * 2);
  });
}

const solidStart2 = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  solidBatch(() => {
    setSolidA2(i);
    setSolidB2(i * 2);
  });
}
const solidTime2 = performance.now() - solidStart2;

console.log(`Zen Phase 2: ${zenTime2.toFixed(2)}ms`);
console.log(`Solid:       ${solidTime2.toFixed(2)}ms`);
console.log(`Ratio:       ${(zenTime2 / solidTime2).toFixed(2)}x ${zenTime2 > solidTime2 ? 'slower' : 'faster'}`);
console.log();

zenUnsub2();

// ============================================================================
// Test 3: Batch without access (fully lazy)
// ============================================================================
console.log('Test 3: Batch without access (pure overhead)');

// Zen Phase 2
const zenA3 = zen(1);
const zenB3 = zen(2);
const zenC3 = computed([zenA3, zenB3], (a, b) => a + b);

const zenStart3 = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  batch(() => {
    zenA3.value = i;
    zenB3.value = i * 2;
  });
}
const zenTime3 = performance.now() - zenStart3;

// Solid
const [solidA3, setSolidA3] = createSignal(1);
const [solidB3, setSolidB3] = createSignal(2);
const solidC3 = createMemo(() => solidA3() + solidB3());

const solidStart3 = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  solidBatch(() => {
    setSolidA3(i);
    setSolidB3(i * 2);
  });
}
const solidTime3 = performance.now() - solidStart3;

console.log(`Zen Phase 2: ${zenTime3.toFixed(2)}ms`);
console.log(`Solid:       ${solidTime3.toFixed(2)}ms`);
console.log(`Ratio:       ${(zenTime3 / solidTime3).toFixed(2)}x ${zenTime3 > solidTime3 ? 'slower' : 'faster'}`);
console.log();

// ============================================================================
// Summary
// ============================================================================
console.log('=== Performance Summary ===');
console.log(`Test 1 (Unobserved): ${(zenTime1 / solidTime1).toFixed(2)}x vs Solid`);
console.log(`Test 2 (Observed):   ${(zenTime2 / solidTime2).toFixed(2)}x vs Solid`);
console.log(`Test 3 (No access):  ${(zenTime3 / solidTime3).toFixed(2)}x vs Solid`);
console.log();

const avgRatio = ((zenTime1 / solidTime1) + (zenTime2 / solidTime2) + (zenTime3 / solidTime3)) / 3;
console.log(`Average performance: ${avgRatio.toFixed(2)}x vs Solid`);
console.log();

if (avgRatio < 5) {
  console.log('🎉 EXCELLENT: Phase 2 brings Zen within 5x of Solid!');
} else if (avgRatio < 7) {
  console.log('✅ GOOD: Phase 2 significantly improves performance');
} else {
  console.log('⚠️  More optimization needed');
}
