/**
 * JSX Runtime Performance Benchmarks
 *
 * Compares old vs optimized implementations
 */

import { describe, bench } from 'bun:test';
import { signal } from '@zen/signal';

// Import both versions
import { jsx as jsxOld } from './jsx-runtime.js';
import { jsx as jsxNew } from './jsx-runtime-optimized.js';

describe('JSX Runtime Benchmarks', () => {
  // Setup
  const container = document.createElement('div');
  const count = signal(0);

  // Benchmark 1: Simple element creation
  bench('OLD: Simple div creation', () => {
    jsxOld('div', { className: 'test', id: 'foo' });
  });

  bench('NEW: Simple div creation', () => {
    jsxNew('div', { className: 'test', id: 'foo' });
  });

  // Benchmark 2: Element with many props
  bench('OLD: Element with 10 props', () => {
    jsxOld('div', {
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
    });
  });

  bench('NEW: Element with 10 props', () => {
    jsxNew('div', {
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
    });
  });

  // Benchmark 3: Element with event listeners
  bench('OLD: Element with 5 event listeners', () => {
    jsxOld('button', {
      onClick: () => {},
      onMouseEnter: () => {},
      onMouseLeave: () => {},
      onFocus: () => {},
      onBlur: () => {},
      children: 'Click me',
    });
  });

  bench('NEW: Element with 5 event listeners', () => {
    jsxNew('button', {
      onClick: () => {},
      onMouseEnter: () => {},
      onMouseLeave: () => {},
      onFocus: () => {},
      onBlur: () => {},
      children: 'Click me',
    });
  });

  // Benchmark 4: Element with reactive props
  bench('OLD: Element with reactive className', () => {
    jsxOld('div', {
      className: count,
      children: 'Test',
    });
  });

  bench('NEW: Element with reactive className', () => {
    jsxNew('div', {
      className: count,
      children: 'Test',
    });
  });

  // Benchmark 5: Nested elements
  bench('OLD: Nested elements (depth 3)', () => {
    jsxOld('div', {
      children: jsxOld('div', {
        children: jsxOld('div', {
          children: 'Deep',
        }),
      }),
    });
  });

  bench('NEW: Nested elements (depth 3)', () => {
    jsxNew('div', {
      children: jsxNew('div', {
        children: jsxNew('div', {
          children: 'Deep',
        }),
      }),
    });
  });

  // Benchmark 6: Children array
  bench('OLD: Array of 10 children', () => {
    jsxOld('ul', {
      children: Array.from({ length: 10 }, (_, i) =>
        jsxOld('li', { children: `Item ${i}` })
      ),
    });
  });

  bench('NEW: Array of 10 children', () => {
    jsxNew('ul', {
      children: Array.from({ length: 10 }, (_, i) =>
        jsxNew('li', { children: `Item ${i}` })
      ),
    });
  });

  // Benchmark 7: Style object
  bench('OLD: Element with style object', () => {
    jsxOld('div', {
      style: {
        color: 'red',
        fontSize: '16px',
        padding: '10px',
        margin: '5px',
      },
      children: 'Styled',
    });
  });

  bench('NEW: Element with style object', () => {
    jsxNew('div', {
      style: {
        color: 'red',
        fontSize: '16px',
        padding: '10px',
        margin: '5px',
      },
      children: 'Styled',
    });
  });

  // Benchmark 8: Complex component
  bench('OLD: Complex component', () => {
    const Card = ({ title, content }: { title: string; content: string }) =>
      jsxOld('div', {
        className: 'card',
        children: [
          jsxOld('h2', { className: 'title', children: title }),
          jsxOld('p', { className: 'content', children: content }),
          jsxOld('button', {
            onClick: () => {},
            children: 'Click',
          }),
        ],
      });

    jsxOld(Card, { title: 'Test', content: 'Content' });
  });

  bench('NEW: Complex component', () => {
    const Card = ({ title, content }: { title: string; content: string }) =>
      jsxNew('div', {
        className: 'card',
        children: [
          jsxNew('h2', { className: 'title', children: title }),
          jsxNew('p', { className: 'content', children: content }),
          jsxNew('button', {
            onClick: () => {},
            children: 'Click',
          }),
        ],
      });

    jsxNew(Card, { title: 'Test', content: 'Content' });
  });

  // Benchmark 9: Form elements
  bench('OLD: Form with reactive input', () => {
    const value = signal('');
    jsxOld('input', {
      type: 'text',
      value: value,
      onChange: () => {},
    });
  });

  bench('NEW: Form with reactive input', () => {
    const value = signal('');
    jsxNew('input', {
      type: 'text',
      value: value,
      onChange: () => {},
    });
  });

  // Benchmark 10: List rendering (realistic scenario)
  bench('OLD: Render list of 50 items', () => {
    const items = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      name: `Item ${i}`,
      active: i % 2 === 0,
    }));

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
  });

  bench('NEW: Render list of 50 items', () => {
    const items = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      name: `Item ${i}`,
      active: i % 2 === 0,
    }));

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
  });
});
