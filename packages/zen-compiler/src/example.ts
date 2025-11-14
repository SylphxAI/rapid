/**
 * Example code to test zen-compiler plugin
 * This file shows what the compiler plugin should optimize
 */

import { zen, computed } from '@sylphx/zen';

// Simple signals
const count = zen(0);
const name = zen('Alice');

// Simple computed (depends on count)
const doubled = computed(() => count.value * 2);

// Diamond dependency
const a = zen(1);
const b = zen(2);
const left = computed(() => a.value * 2);
const right = computed(() => b.value * 3);
const merge = computed(() => left.value + right.value);

// What the compiler should generate:
/*
const __zenGraph = {
  signals: [
    { id: 0, name: 'count', value: 0 },
    { id: 1, name: 'name', value: 'Alice' },
    { id: 2, name: 'a', value: 1 },
    { id: 3, name: 'b', value: 2 }
  ],
  computed: [
    {
      id: 4,
      name: 'doubled',
      deps: [0], // depends on count
      fn: (count) => count * 2
    },
    {
      id: 5,
      name: 'left',
      deps: [2], // depends on a
      fn: (a) => a * 2
    },
    {
      id: 6,
      name: 'right',
      deps: [3], // depends on b
      fn: (b) => b * 3
    },
    {
      id: 7,
      name: 'merge',
      deps: [5, 6], // depends on left, right
      fn: (left, right) => left + right
    }
  ],
  executionOrder: [0, 1, 2, 3, 4, 5, 6, 7] // topologically sorted
};
*/

export { count, name, doubled, a, b, left, right, merge };
