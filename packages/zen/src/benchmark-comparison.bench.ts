/**
 * Performance Benchmark: Standard vs Optimized vs Ultra Build
 *
 * Tests common operations on all builds to ensure
 * optimized versions maintain performance.
 */

import { bench, describe } from 'vitest';

// Import from all builds
import * as StandardZen from '../src/index';
import * as OptimizedZen from '../src/zen-optimized';
import * as UltraZen from '../src/zen-ultra';

describe('Signal Operations', () => {
  bench('Standard: zen create + read', () => {
    const count = StandardZen.zen(0);
    const _ = count.value;
  });

  bench('Optimized: zen create + read', () => {
    const count = OptimizedZen.zen(0);
    const _ = count.value;
  });

  bench('Ultra: zen create + read', () => {
    const count = UltraZen.zen(0);
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

  bench('Ultra: zen write', () => {
    const count = UltraZen.zen(0);
    count.value = 1;
    count.value = 2;
    count.value = 3;
  });
});

describe('Computed', () => {
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

  bench('Ultra: computed (1 dep)', () => {
    const a = UltraZen.zen(1);
    const doubled = UltraZen.computed([a], (v) => v * 2);
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

  bench('Ultra: computed (3 deps)', () => {
    const a = UltraZen.zen(1);
    const b = UltraZen.zen(2);
    const c = UltraZen.zen(3);
    const sum = UltraZen.computed([a, b, c], (av, bv, cv) => av + bv + cv);
    a.value = 2;
    const _ = sum.value;
  });
});

describe('Select (Standard + Optimized only)', () => {
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

  // Note: Ultra build uses computed() instead of select()
  bench('Ultra: computed (as select alternative)', () => {
    const state = UltraZen.zen({ count: 0, name: 'test' });
    const count = UltraZen.computed([state], (s) => s.count);
    state.value = { count: 1, name: 'test' };
    const _ = count.value;
  });
});

describe('Subscribe', () => {
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

  bench('Ultra: subscribe + notify', () => {
    const count = UltraZen.zen(0);
    let _value = 0;
    const unsub = UltraZen.subscribe(count, (v) => {
      _value = v;
    });
    count.value = 1;
    unsub();
  });
});

describe('Batch', () => {
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

  bench('Ultra: batch 10 updates', () => {
    const count = UltraZen.zen(0);
    let _value = 0;
    UltraZen.subscribe(count, (v) => {
      _value = v;
    });
    UltraZen.batch(() => {
      for (let i = 0; i < 10; i++) {
        count.value = i;
      }
    });
  });
});

describe('Map (Standard + Optimized only)', () => {
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

  // Note: Ultra build uses plain zen with objects instead
  bench('Ultra: zen with object (as map alternative)', () => {
    const users = UltraZen.zen<Record<number, { name: string; age: number }>>({
      1: { name: 'Alice', age: 30 },
      2: { name: 'Bob', age: 25 },
    });
    users.value = { ...users.value, 3: { name: 'Charlie', age: 35 } };
    const _ = users.value[3];
  });
});

describe('Real-world Scenario', () => {
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

  bench('Ultra: Todo list operations', () => {
    const todos = UltraZen.zen([
      { id: 1, text: 'Buy milk', done: false },
      { id: 2, text: 'Walk dog', done: false },
    ]);

    const activeTodos = UltraZen.computed([todos], (list) => list.filter((t) => !t.done));

    const activeCount = UltraZen.computed([activeTodos], (list) => list.length);

    let _count = 0;
    UltraZen.subscribe(activeCount, (v) => {
      _count = v;
    });

    // Add todo
    todos.value = [...todos.value, { id: 3, text: 'Read book', done: false }];

    // Complete todo
    todos.value = todos.value.map((t) => (t.id === 1 ? { ...t, done: true } : t));

    const _ = activeCount.value;
  });
});
