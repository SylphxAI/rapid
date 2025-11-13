/**
 * Micro-benchmark: Epoch optimization impact
 * Compare allocation overhead between Set-based and epoch-based deduplication
 */

import { batch, computed, zen } from './packages/zen/dist/index.js';

const ITERATIONS = 100_000;

console.log('=== Epoch Optimization Benchmark ===\n');

// Test: Pure batch overhead (no computed processing)
console.log('Test 1: Pure batch overhead (empty batches)');

const start1 = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  batch(() => {
    // Empty batch - measures overhead only
  });
}
const time1 = performance.now() - start1;
const opsPerSec1 = (ITERATIONS / time1) * 1000;

console.log(`Time: ${time1.toFixed(2)}ms`);
console.log(`Throughput: ${opsPerSec1.toLocaleString('en-US', { maximumFractionDigits: 0 })} ops/sec`);
console.log();

// Test: Batch with signal updates (no computed)
console.log('Test 2: Batch with signal updates');

const a = zen(1);
const b = zen(2);

const start2 = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  batch(() => {
    a.value = i;
    b.value = i * 2;
  });
}
const time2 = performance.now() - start2;
const opsPerSec2 = (ITERATIONS / time2) * 1000;

console.log(`Time: ${time2.toFixed(2)}ms`);
console.log(`Throughput: ${opsPerSec2.toLocaleString('en-US', { maximumFractionDigits: 0 })} ops/sec`);
console.log();

// Test: Batch with unobserved computed (lazy)
console.log('Test 3: Batch with unobserved computed (lazy - no allocation)');

const a3 = zen(1);
const b3 = zen(2);
const c3 = computed([a3, b3], (a, b) => a + b);

// Warmup
for (let i = 0; i < 1000; i++) {
  batch(() => {
    a3.value = i;
    b3.value = i * 2;
  });
}

const start3 = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  batch(() => {
    a3.value = i;
    b3.value = i * 2;
  });
}
const time3 = performance.now() - start3;
const opsPerSec3 = (ITERATIONS / time3) * 1000;

console.log(`Time: ${time3.toFixed(2)}ms`);
console.log(`Throughput: ${opsPerSec3.toLocaleString('en-US', { maximumFractionDigits: 0 })} ops/sec`);
console.log();

// Test: Batch with dependency chain (a → sum → doubled)
console.log('Test 4: Batch with dependency chain (epoch deduplication tested)');

const a4 = zen(1);
const b4 = zen(2);
const sum = computed([a4, b4], (a, b) => a + b);
const doubled = computed([sum], (s) => (s || 0) * 2);

// Access to activate
doubled.value;

// Warmup
for (let i = 0; i < 1000; i++) {
  batch(() => {
    a4.value = i;
    b4.value = i * 2;
  });
  const _ = doubled.value;
}

const start4 = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  batch(() => {
    a4.value = i;
    b4.value = i * 2;
  });
  const _ = doubled.value;
}
const time4 = performance.now() - start4;
const opsPerSec4 = (ITERATIONS / time4) * 1000;

console.log(`Time: ${time4.toFixed(2)}ms`);
console.log(`Throughput: ${opsPerSec4.toLocaleString('en-US', { maximumFractionDigits: 0 })} ops/sec`);
console.log();

// Summary
console.log('=== Summary ===');
console.log(`Empty batch:        ${time1.toFixed(2)}ms (${opsPerSec1.toLocaleString('en-US', { maximumFractionDigits: 0 })} ops/sec)`);
console.log(`Signal updates:     ${time2.toFixed(2)}ms (${opsPerSec2.toLocaleString('en-US', { maximumFractionDigits: 0 })} ops/sec)`);
console.log(`Lazy computed:      ${time3.toFixed(2)}ms (${opsPerSec3.toLocaleString('en-US', { maximumFractionDigits: 0 })} ops/sec)`);
console.log(`Dependency chain:   ${time4.toFixed(2)}ms (${opsPerSec4.toLocaleString('en-US', { maximumFractionDigits: 0 })} ops/sec)`);
console.log();

// Calculate overhead
const signalOverhead = ((time2 - time1) / time1 * 100).toFixed(1);
const lazyOverhead = ((time3 - time2) / time2 * 100).toFixed(1);
const chainOverhead = ((time4 - time3) / time3 * 100).toFixed(1);

console.log('Overhead Analysis:');
console.log(`Signal updates add: ${signalOverhead}% overhead`);
console.log(`Lazy computed adds: ${lazyOverhead}% overhead`);
console.log(`Dependency chain adds: ${chainOverhead}% overhead`);
console.log();

if (parseFloat(lazyOverhead) < 10) {
  console.log('✅ Epoch optimization successful: <10% overhead for lazy computed');
} else {
  console.log('⚠️  Lazy computed overhead higher than expected');
}
