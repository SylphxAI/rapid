/**
 * Tests for SSR JSX Runtime
 */

import { describe, expect, test } from 'bun:test';
import { signal } from '@rapid/signal';
import { Fragment, jsx, jsxs } from './jsx-runtime-server.js';

describe('jsx-runtime-server', () => {
  describe('jsx()', () => {
    test('renders basic element', () => {
      const result = jsx('div', { children: 'Hello' });
      expect(result.html).toBe('<div>Hello</div>');
    });

    test('renders element with attributes', () => {
      const result = jsx('div', { id: 'test', className: 'container', children: 'Content' });
      expect(result.html).toBe('<div id="test" class="container">Content</div>');
    });

    test('renders void elements without closing tag', () => {
      const result = jsx('input', { type: 'text', value: 'test' });
      expect(result.html).toBe('<input type="text" value="test" />');
    });

    test('escapes HTML in text content', () => {
      const result = jsx('div', { children: '<script>alert("xss")</script>' });
      expect(result.html).toBe('<div>&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;</div>');
    });

    test('escapes HTML in attributes', () => {
      const result = jsx('div', { title: 'test"value' });
      expect(result.html).toBe('<div title="test&quot;value"></div>');
    });

    test('handles boolean attributes', () => {
      const result = jsx('input', { disabled: true, readOnly: false });
      expect(result.html).toBe('<input disabled />');
    });

    test('handles style object', () => {
      const result = jsx('div', { style: { color: 'red', fontSize: '16px' } });
      expect(result.html).toBe('<div style="color:red;font-size:16px"></div>');
    });

    test('skips event handlers', () => {
      const result = jsx('button', { onClick: () => {}, children: 'Click' });
      expect(result.html).toBe('<button>Click</button>');
    });

    test('skips null/undefined attributes', () => {
      const result = jsx('div', { id: null, className: undefined, children: 'Test' });
      expect(result.html).toBe('<div>Test</div>');
    });
  });

  describe('signal handling', () => {
    test('unwraps signal values in children', () => {
      const count = signal(42);
      const result = jsx('span', { children: count });
      expect(result.html).toBe('<span><!--signal-->42</span>');
    });

    test('unwraps signal values in attributes', () => {
      const value = signal('test-value');
      const result = jsx('input', { value });
      expect(result.html).toBe('<input value="test-value" />');
    });
  });

  describe('function handling', () => {
    test('unwraps function children as reactive', () => {
      const result = jsx('div', { children: () => 'dynamic' });
      expect(result.html).toBe('<div><!--reactive-->dynamic</div>');
    });

    test('unwraps function values for reactive attributes', () => {
      const result = jsx('input', { value: () => 'computed' });
      expect(result.html).toBe('<input value="computed" />');
    });
  });

  describe('nested elements', () => {
    test('renders nested elements', () => {
      const inner = jsx('span', { children: 'inner' });
      const outer = jsx('div', { children: inner });
      expect(outer.html).toBe('<div><span>inner</span></div>');
    });

    test('renders array of children', () => {
      const children = ['one', ' ', 'two'];
      const result = jsx('div', { children });
      expect(result.html).toBe('<div>one two</div>');
    });
  });

  describe('Fragment', () => {
    test('renders fragment children', () => {
      const result = Fragment({ children: ['a', 'b', 'c'] });
      expect(result.html).toBe('abc');
    });

    test('renders empty fragment', () => {
      const result = Fragment({});
      expect(result.html).toBe('');
    });
  });

  describe('jsxs alias', () => {
    test('jsxs is same as jsx', () => {
      expect(jsxs).toBe(jsx);
    });
  });
});
