/**
 * Trace what happens during batch execution
 */

import { batch, computed, subscribe, zen } from './packages/zen/dist/index.js';

// Simple scenario: 2 signals, 1 computed, batched update
const a = zen(1);
const b = zen(2);
const c = computed(() => {
  return a.value + b.value;
});

// Subscribe to make it reactive
let _callCount = 0;
subscribe(c, (_val) => {
  _callCount++;
});

batch(() => {
  a.value = 10;
  b.value = 20;
});
