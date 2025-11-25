import { signal } from '@zen/tui';
/** @jsxImportSource @zen/tui */
import { describe, expect, it } from 'vitest';
import { List } from './List.js';

describe('List', () => {
  it('should render items', () => {
    const items = ['Item 1', 'Item 2', 'Item 3'];

    const result = List({ items });

    expect(result).toBeDefined();
    expect(result.type).toBe('box');
  });

  it('should support custom renderItem', () => {
    const items = [
      { id: 1, name: 'File 1' },
      { id: 2, name: 'File 2' },
    ];

    const result = List({
      items,
      renderItem: (item, _index, isSelected) => ({
        type: 'text' as const,
        props: {
          children: `${item.id}: ${item.name}`,
          color: isSelected ? 'cyan' : 'white',
        },
      }),
    });

    expect(result).toBeDefined();
  });

  it('should support selectedIndex', () => {
    const items = ['Item 1', 'Item 2', 'Item 3'];
    const selected = signal(1);

    const result = List({
      items,
      selectedIndex: selected.value,
    });

    expect(result).toBeDefined();
  });

  it('should support limit (scrolling)', () => {
    const items = Array.from({ length: 20 }, (_, i) => `Item ${i + 1}`);

    const result = List({
      items,
      limit: 10, // Only show 10 items at a time
    });

    expect(result).toBeDefined();
  });

  it('should support onSelect callback', () => {
    const items = ['Item 1', 'Item 2', 'Item 3'];
    let _selectedItem: string | null = null;

    const result = List({
      items,
      onSelect: (item) => {
        _selectedItem = item;
      },
    });

    expect(result).toBeDefined();
    // onSelect will be called when user presses Enter or arrow keys
  });

  it('should support custom indicator', () => {
    const items = ['Item 1', 'Item 2', 'Item 3'];

    const result = List({
      items,
      showIndicator: true,
      indicator: '→',
    });

    expect(result).toBeDefined();
  });

  it('should handle empty items array', () => {
    const items: string[] = [];

    const result = List({ items });

    expect(result).toBeDefined();
  });
});
