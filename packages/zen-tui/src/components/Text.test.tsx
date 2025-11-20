import { describe, expect, it } from 'vitest';
import { Text } from './Text';

describe('Text', () => {
  it('should create text node with default props', () => {
    const node = Text({});

    expect(node.type).toBe('text');
    expect(node.tagName).toBe('text');
    expect(node.children).toEqual([]);
    expect(node.style?.flexDirection).toBe('row'); // Text children are inline by default
  });

  it('should apply color prop', () => {
    const node = Text({ color: 'red' });

    expect(node.style?.color).toBe('red');
  });

  it('should apply backgroundColor prop', () => {
    const node = Text({ backgroundColor: 'blue' });

    expect(node.style?.backgroundColor).toBe('blue');
  });

  it('should apply text style props', () => {
    const node = Text({
      bold: true,
      italic: true,
      underline: true,
      strikethrough: true,
      dim: true,
    });

    expect(node.style?.bold).toBe(true);
    expect(node.style?.italic).toBe(true);
    expect(node.style?.underline).toBe(true);
    expect(node.style?.strikethrough).toBe(true);
    expect(node.style?.dim).toBe(true);
  });

  it('should handle string children', () => {
    const node = Text({ children: 'Hello World' });

    expect(node.children).toHaveLength(1);
    expect(node.children[0]).toBe('Hello World');
  });

  it('should handle nested Text components', () => {
    const inner = Text({ children: 'Inner', color: 'red' });
    const outer = Text({ children: inner });

    expect(outer.children).toHaveLength(1);
    expect(outer.children[0]).toBe(inner);
  });

  it('should prioritize direct props over style props', () => {
    const node = Text({
      color: 'red',
      bold: true,
      style: { color: 'blue', bold: false },
    });

    expect(node.style?.color).toBe('red');
    expect(node.style?.bold).toBe(true);
  });

  it('should handle array of children', () => {
    const child1 = Text({ children: 'Hello' });
    const child2 = Text({ children: 'World' });

    const node = Text({ children: [child1, ' ', child2] });

    expect(node.children).toHaveLength(3);
    expect(node.children[1]).toBe(' ');
  });

  it('should default to row flexDirection for inline rendering', () => {
    const node = Text({ children: 'Test' });

    expect(node.style?.flexDirection).toBe('row');
  });

  it('should allow flexDirection override', () => {
    const node = Text({
      children: 'Test',
      style: { flexDirection: 'column' },
    });

    expect(node.style?.flexDirection).toBe('column');
  });
});
