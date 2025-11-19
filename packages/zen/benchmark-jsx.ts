/**
 * Simple JSX Runtime Performance Comparison
 */

import { signal } from '@zen/signal';

// Import both versions
import { jsx as jsxOld } from './src/jsx-runtime.js';
import { jsx as jsxNew } from './src/jsx-runtime-optimized.js';

// Simple benchmark utility
function benchmark(name: string, fn: () => void, iterations = 100000) {
  // Warmup
  for (let i = 0; i < 1000; i++) fn();

  // Measure
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    fn();
  }
  const end = performance.now();

  const duration = end - start;
  const opsPerSec = (iterations / duration) * 1000;

  console.log(
    `${name.padEnd(50)} ${duration.toFixed(2)}ms  ${opsPerSec.toFixed(0)} ops/sec`
  );

  return duration;
}

console.log('\n🔥 JSX Runtime Performance Comparison\n');
console.log('='.repeat(80));

// Test 1: Simple div
console.log('\n📦 Test 1: Simple div creation');
const old1 = benchmark('OLD: Simple div', () => {
  jsxOld('div', { className: 'test', id: 'foo' });
});

const new1 = benchmark('NEW: Simple div', () => {
  jsxNew('div', { className: 'test', id: 'foo' });
});

const improvement1 = ((old1 - new1) / old1) * 100;
console.log(`Improvement: ${improvement1.toFixed(1)}%`);

// Test 2: Many props
console.log('\n📦 Test 2: Element with 10 props');
const props = {
  className: 'test',
  id: 'foo',
  'data-foo': 'bar',
  'data-baz': 'qux',
  title: 'Test',
  role: 'button',
  tabIndex: 0,
  'aria-label': 'Test',
  'aria-hidden': 'false',
  'data-test': 'value',
};

const old2 = benchmark('OLD: 10 props', () => {
  jsxOld('div', props);
});

const new2 = benchmark('NEW: 10 props', () => {
  jsxNew('div', props);
});

const improvement2 = ((old2 - new2) / old2) * 100;
console.log(`Improvement: ${improvement2.toFixed(1)}%`);

// Test 3: Event listeners
console.log('\n📦 Test 3: Element with 5 event listeners');
const old3 = benchmark('OLD: 5 events', () => {
  jsxOld('button', {
    onClick: () => {},
    onMouseEnter: () => {},
    onMouseLeave: () => {},
    onFocus: () => {},
    onBlur: () => {},
    children: 'Click me',
  });
});

const new3 = benchmark('NEW: 5 events', () => {
  jsxNew('button', {
    onClick: () => {},
    onMouseEnter: () => {},
    onMouseLeave: () => {},
    onFocus: () => {},
    onBlur: () => {},
    children: 'Click me',
  });
});

const improvement3 = ((old3 - new3) / old3) * 100;
console.log(`Improvement: ${improvement3.toFixed(1)}%`);

// Test 4: Reactive props
console.log('\n📦 Test 4: Reactive className');
const count = signal(0);

const old4 = benchmark('OLD: Reactive className', () => {
  jsxOld('div', { className: count, children: 'Test' });
});

const new4 = benchmark('NEW: Reactive className', () => {
  jsxNew('div', { className: count, children: 'Test' });
});

const improvement4 = ((old4 - new4) / old4) * 100;
console.log(`Improvement: ${improvement4.toFixed(1)}%`);

// Test 5: List rendering
console.log('\n📦 Test 5: List of 50 items');
const items = Array.from({ length: 50 }, (_, i) => ({
  id: i,
  name: `Item ${i}`,
  active: i % 2 === 0,
}));

const old5 = benchmark(
  'OLD: 50 items',
  () => {
    jsxOld('ul', {
      className: 'list',
      children: items.map((item) =>
        jsxOld('li', {
          key: item.id,
          className: item.active ? 'active' : 'inactive',
          onClick: () => {},
          children: item.name,
        })
      ),
    });
  },
  10000
);

const new5 = benchmark(
  'NEW: 50 items',
  () => {
    jsxNew('ul', {
      className: 'list',
      children: items.map((item) =>
        jsxNew('li', {
          key: item.id,
          className: item.active ? 'active' : 'inactive',
          onClick: () => {},
          children: item.name,
        })
      ),
    });
  },
  10000
);

const improvement5 = ((old5 - new5) / old5) * 100;
console.log(`Improvement: ${improvement5.toFixed(1)}%`);

// Summary
console.log('\n' + '='.repeat(80));
console.log('📊 SUMMARY\n');

const avgImprovement =
  (improvement1 + improvement2 + improvement3 + improvement4 + improvement5) /
  5;

console.log(`Average improvement: ${avgImprovement.toFixed(1)}%`);

if (avgImprovement > 0) {
  console.log(
    `✅ Optimized version is ${avgImprovement.toFixed(1)}% faster overall`
  );
} else {
  console.log(
    `❌ Optimized version is ${Math.abs(avgImprovement).toFixed(1)}% slower overall`
  );
}

console.log('\n' + '='.repeat(80));
