/**
 * Detailed trace to understand batching behavior
 */

import { batch, computed, subscribe, zen } from './packages/zen/dist/index.js';

const a = zen(1);
const b = zen(2);

let _computeCount = 0;
const c = computed([a, b], (aVal, bVal) => {
  _computeCount++;
  return aVal + bVal;
});

let _listenerCount = 0;
subscribe(c, (_val) => {
  _listenerCount++;
});
batch(() => {
  a.value = 10;
  b.value = 20;
});
