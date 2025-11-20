import { transformSync } from '@babel/core';
import { describe, it, expect } from 'vitest';
import plugin from './index.js';

describe('babel-plugin-zen-jsx', () => {
  const transform = (code: string) => {
    const result = transformSync(code, {
      plugins: [plugin],
      filename: 'test.tsx',
    });
    return result?.code || '';
  };

  it('should transform children prop to lazy getter', () => {
    const input = `
      jsx(Provider, {
        value: x,
        children: jsx(Child, {})
      })
    `;

    const output = transform(input);

    // Should contain getter instead of children property
    expect(output).toContain('get children()');
    expect(output).toContain('return jsx(Child, {})');
  });

  it('should not transform children that are already functions', () => {
    const input = `
      jsx(Provider, {
        value: x,
        children: () => jsx(Child, {})
      })
    `;

    const output = transform(input);

    // Should remain unchanged
    expect(output).toContain('children: () => jsx(Child, {})');
    expect(output).not.toContain('get children()');
  });

  it('should handle array children', () => {
    const input = `
      jsx(Provider, {
        value: x,
        children: [jsx(Child1, {}), jsx(Child2, {})]
      })
    `;

    const output = transform(input);

    // Should contain getter with array return
    expect(output).toContain('get children()');
    expect(output).toContain('return [jsx(Child1, {}), jsx(Child2, {})]');
  });

  it('should skip jsx calls without children', () => {
    const input = `
      jsx(Component, {
        value: x
      })
    `;

    const output = transform(input);

    // Should remain unchanged
    expect(output).toContain('value: x');
    expect(output).not.toContain('get children()');
  });

  it('should handle jsxs and jsxDEV variants', () => {
    const input1 = `
      jsxs(Provider, {
        value: x,
        children: jsx(Child, {})
      })
    `;

    const input2 = `
      jsxDEV(Provider, {
        value: x,
        children: jsx(Child, {})
      })
    `;

    expect(transform(input1)).toContain('get children()');
    expect(transform(input2)).toContain('get children()');
  });
});
