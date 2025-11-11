/**
 * Performance Benchmark: Standard vs Optimized Build
 *
 * Tests common operations on both builds to ensure
 * optimized version maintains performance.
 */

import { bench, describe } from 'vitest';

// Import from both builds
import * as StandardZen from '../src/index';
import * as OptimizedZen from '../src/zen-optimized';

describe('Standard vs Optimized - Signal Operations', () => {
  bench('Standard: zen create + read', () => {
    const count = StandardZen.zen(0);
    const _ = count.value;
  });

  bench('Optimized: zen create + read', () => {
    const count = OptimizedZen.zen(0);
    const _ = count.value;
  });

  bench('Standard: zen write', () => {
    const count = StandardZen.zen(0);
    count.value = 1;
    count.value = 2;
    count.value = 3;
  });

  bench('Optimized: zen write', () => {
    const count = OptimizedZen.zen(0);
    count.value = 1;
    count.value = 2;
    count.value = 3;
  });
});

describe('Standard vs Optimized - Computed', () => {
  bench('Standard: computed (1 dep)', () => {
    const a = StandardZen.zen(1);
    const doubled = StandardZen.computed([a], (v) => v * 2);
    a.value = 2;
    const _ = doubled.value;
  });

  bench('Optimized: computed (1 dep)', () => {
    const a = OptimizedZen.zen(1);
    const doubled = OptimizedZen.computed([a], (v) => v * 2);
    a.value = 2;
    const _ = doubled.value;
  });

  bench('Standard: computed (3 deps)', () => {
    const a = StandardZen.zen(1);
    const b = StandardZen.zen(2);
    const c = StandardZen.zen(3);
    const sum = StandardZen.computed([a, b, c], (av, bv, cv) => av + bv + cv);
    a.value = 2;
    const _ = sum.value;
  });

  bench('Optimized: computed (3 deps)', () => {
    const a = OptimizedZen.zen(1);
    const b = OptimizedZen.zen(2);
    const c = OptimizedZen.zen(3);
    const sum = OptimizedZen.computed([a, b, c], (av, bv, cv) => av + bv + cv);
    a.value = 2;
    const _ = sum.value;
  });
});

describe('Standard vs Optimized - Select', () => {
  bench('Standard: select', () => {
    const state = StandardZen.zen({ count: 0, name: 'test' });
    const count = StandardZen.select(state, (s) => s.count);
    state.value = { count: 1, name: 'test' };
    const _ = count.value;
  });

  bench('Optimized: select', () => {
    const state = OptimizedZen.zen({ count: 0, name: 'test' });
    const count = OptimizedZen.select(state, (s) => s.count);
    state.value = { count: 1, name: 'test' };
    const _ = count.value;
  });
});

describe('Standard vs Optimized - Subscribe', () => {
  bench('Standard: subscribe + notify', () => {
    const count = StandardZen.zen(0);
    let _value = 0;
    const unsub = StandardZen.subscribe(count, (v) => {
      _value = v;
    });
    count.value = 1;
    unsub();
  });

  bench('Optimized: subscribe + notify', () => {
    const count = OptimizedZen.zen(0);
    let _value = 0;
    const unsub = OptimizedZen.subscribe(count, (v) => {
      _value = v;
    });
    count.value = 1;
    unsub();
  });
});

describe('Standard vs Optimized - Batch', () => {
  bench('Standard: batch 10 updates', () => {
    const count = StandardZen.zen(0);
    let _value = 0;
    StandardZen.subscribe(count, (v) => {
      _value = v;
    });
    StandardZen.batch(() => {
      for (let i = 0; i < 10; i++) {
        count.value = i;
      }
    });
  });

  bench('Optimized: batch 10 updates', () => {
    const count = OptimizedZen.zen(0);
    let _value = 0;
    OptimizedZen.subscribe(count, (v) => {
      _value = v;
    });
    OptimizedZen.batch(() => {
      for (let i = 0; i < 10; i++) {
        count.value = i;
      }
    });
  });
});

describe('Standard vs Optimized - Map', () => {
  bench('Standard: map operations', () => {
    const users = StandardZen.map(
      new Map([
        [1, { name: 'Alice', age: 30 }],
        [2, { name: 'Bob', age: 25 }],
      ]),
    );
    StandardZen.setKey(users, 3, { name: 'Charlie', age: 35 });
    const _ = users.value.get(3);
  });

  bench('Optimized: map operations', () => {
    const users = OptimizedZen.map(
      new Map([
        [1, { name: 'Alice', age: 30 }],
        [2, { name: 'Bob', age: 25 }],
      ]),
    );
    OptimizedZen.setKey(users, 3, { name: 'Charlie', age: 35 });
    const _ = users.value.get(3);
  });
});

describe('Standard vs Optimized - Real-world Scenario', () => {
  bench('Standard: Todo list operations', () => {
    const todos = StandardZen.zen([
      { id: 1, text: 'Buy milk', done: false },
      { id: 2, text: 'Walk dog', done: false },
    ]);

    const activeTodos = StandardZen.computed([todos], (list) => list.filter((t) => !t.done));

    const activeCount = StandardZen.computed([activeTodos], (list) => list.length);

    let _count = 0;
    StandardZen.subscribe(activeCount, (v) => {
      _count = v;
    });

    // Add todo
    todos.value = [...todos.value, { id: 3, text: 'Read book', done: false }];

    // Complete todo
    todos.value = todos.value.map((t) => (t.id === 1 ? { ...t, done: true } : t));

    const _ = activeCount.value;
  });

  bench('Optimized: Todo list operations', () => {
    const todos = OptimizedZen.zen([
      { id: 1, text: 'Buy milk', done: false },
      { id: 2, text: 'Walk dog', done: false },
    ]);

    const activeTodos = OptimizedZen.computed([todos], (list) => list.filter((t) => !t.done));

    const activeCount = OptimizedZen.computed([activeTodos], (list) => list.length);

    let _count = 0;
    OptimizedZen.subscribe(activeCount, (v) => {
      _count = v;
    });

    // Add todo
    todos.value = [...todos.value, { id: 3, text: 'Read book', done: false }];

    // Complete todo
    todos.value = todos.value.map((t) => (t.id === 1 ? { ...t, done: true } : t));

    const _ = activeCount.value;
  });
});
