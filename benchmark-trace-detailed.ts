/**
 * Detailed trace to understand batching behavior
 */

import { zen, computed, batch, subscribe } from './packages/zen/dist/index.js';

console.log('\n=== Detailed Batching Trace ===\n');

const a = zen(1);
const b = zen(2);

let computeCount = 0;
const c = computed([a, b], (aVal, bVal) => {
  computeCount++;
  console.log(`  [compute #${computeCount}] a=${aVal}, b=${bVal}, result=${aVal + bVal}`);
  return aVal + bVal;
});

let listenerCount = 0;
subscribe(c, (val) => {
  listenerCount++;
  console.log(`  [listener #${listenerCount}] Notified with value: ${val}`);
});

console.log('\n--- Initial subscription complete ---\n');

console.log('Running batched update:');
batch(() => {
  console.log('  [batch] Setting a = 10');
  a.value = 10;
  console.log('  [batch] Setting b = 20');
  b.value = 20;
  console.log('  [batch] Exiting batch block');
});

console.log('\n--- Batch complete ---\n');

console.log(`Total computes: ${computeCount}`);
console.log(`Total notifications: ${listenerCount}`);
console.log(`Final c.value: ${c.value}`);

console.log('\n✅ Expected: 1 initial compute + 1 batch compute + 2 listener calls');
console.log(`⚠️  Actual: ${computeCount} computes + ${listenerCount} listener calls\n`);
