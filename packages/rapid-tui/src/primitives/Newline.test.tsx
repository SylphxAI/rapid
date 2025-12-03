import { describe, expect, it } from 'vitest';
import { Newline } from './Newline';

describe('Newline', () => {
  it('should create text node with single newline by default', () => {
    const node = Newline();

    expect(node.type).toBe('text');
    expect(node.tagName).toBe('text');
    // count=1 renders as '' because Box already adds newline (-1 logic)
    expect(node.children).toHaveLength(1);
    expect(node.children[0]).toBe('');
  });

  it('should create multiple newlines with count prop', () => {
    const node = Newline({ count: 3 });

    expect(node.children).toHaveLength(1);
    expect(node.children[0]).toBe('\n\n'); // 3 - 1 = 2 newlines
  });

  it('should handle count of 2', () => {
    const node = Newline({ count: 2 });

    expect(node.children[0]).toBe('\n'); // 2 - 1 = 1 newline
  });

  it('should handle count of 0', () => {
    const node = Newline({ count: 0 });

    expect(node.children[0]).toBe(''); // 0 - 1 = -1, max(0, -1) = 0
  });

  it('should handle negative count', () => {
    const node = Newline({ count: -5 });

    expect(node.children[0]).toBe(''); // -5 - 1 = -6, max(0, -6) = 0
  });

  it('should have text type', () => {
    const node = Newline({ count: 5 });

    expect(node.type).toBe('text');
  });

  it('should have empty style', () => {
    const node = Newline({ count: 2 });

    expect(node.style).toEqual({});
  });
});
