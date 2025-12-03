import { describe, expect, it } from 'vitest';
import { Spacer } from './Spacer';

describe('Spacer', () => {
  it('should create box node with flexGrow and flexShrink', () => {
    const node = Spacer();

    expect(node.type).toBe('box');
    expect(node.tagName).toBe('spacer');
    expect(node.children).toEqual([]);
    expect(node.style?.flexGrow).toBe(1);
    expect(node.style?.flexShrink).toBe(1);
  });

  it('should handle minHeight prop', () => {
    const node = Spacer({ minHeight: 5 });

    expect(node.style?.minHeight).toBe(5);
    expect(node.style?.flexGrow).toBe(1);
    expect(node.style?.flexShrink).toBe(1);
  });

  it('should handle minWidth prop', () => {
    const node = Spacer({ minWidth: 10 });

    expect(node.style?.minWidth).toBe(10);
    expect(node.style?.flexGrow).toBe(1);
    expect(node.style?.flexShrink).toBe(1);
  });

  it('should handle both minHeight and minWidth', () => {
    const node = Spacer({ minHeight: 3, minWidth: 20 });

    expect(node.style?.minHeight).toBe(3);
    expect(node.style?.minWidth).toBe(20);
  });

  it('should maintain flexbox properties with min constraints', () => {
    const node = Spacer({ minHeight: 1 });

    // Flexbox properties should still be set
    expect(node.style?.flexGrow).toBe(1);
    expect(node.style?.flexShrink).toBe(1);
  });

  it('should have empty children array', () => {
    const node = Spacer();

    expect(node.children).toEqual([]);
  });

  it('should store props', () => {
    const props = { minHeight: 5, minWidth: 10 };
    const node = Spacer(props);

    expect(node.props).toEqual(props);
  });
});
