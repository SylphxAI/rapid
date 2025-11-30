/** @jsxImportSource @zen/tui */
import { describe, expect, it } from 'bun:test';
import { signal } from '@zen/signal';
import { Box } from './Box.js';
import { Static } from './Static.js';
import { Text } from './Text.js';

describe('Static Component', () => {
  describe('Static node creation', () => {
    it('should create a box node with tagName "static"', () => {
      const items = signal<string[]>([]);
      const node = Static({
        items: () => items.value,
        children: (item) => Text({ children: item }),
      });

      expect(node.type).toBe('box');
      expect(node.tagName).toBe('static');
    });

    it('should store __itemsGetter in props', () => {
      const items = signal<string[]>(['a', 'b']);
      const node = Static({
        items: () => items.value,
        children: (item) => Text({ children: item }),
      });

      expect(node.props.__itemsGetter).toBeDefined();
      expect(typeof node.props.__itemsGetter).toBe('function');
      expect(node.props.__itemsGetter()).toEqual(['a', 'b']);
    });

    it('should store __renderChild in props', () => {
      const renderChild = (item: string) => Text({ children: item });
      const node = Static({
        items: () => [],
        children: renderChild,
      });

      expect(node.props.__renderChild).toBe(renderChild);
    });

    it('should render initial items as children', () => {
      const items = ['item1', 'item2', 'item3'];
      const node = Static({
        items,
        children: (item) => Text({ children: item }),
      });

      expect(node.children.length).toBe(3);
    });

    it('should support reactive items getter', () => {
      const items = signal<string[]>(['a']);
      const node = Static({
        items: () => items.value,
        children: (item) => Text({ children: item }),
      });

      // Initial items rendered
      expect(node.children.length).toBe(1);

      // Items getter should return current value
      items.value = ['a', 'b', 'c'];
      expect(node.props.__itemsGetter()).toEqual(['a', 'b', 'c']);
    });
  });

  describe('Static rendering behavior', () => {
    it('should track __lastRenderedCount for incremental rendering', () => {
      const node = Static({
        items: ['a', 'b'],
        children: (item) => Text({ children: item }),
      });

      // After initial render, lastRenderedCount should match items length
      expect(node.props.__lastRenderedCount).toBe(2);
    });

    it('should detect new items by comparing counts', () => {
      const items = signal<string[]>(['a', 'b']);
      const node = Static({
        items: () => items.value,
        children: (item) => Text({ children: item }),
      });

      // Initial: 2 items rendered
      expect(node.props.__lastRenderedCount).toBe(2);

      // Simulate adding new items
      items.value = ['a', 'b', 'c', 'd'];

      // Getter returns 4 items, but lastRenderedCount is still 2
      // Renderer should detect 2 new items (indices 2 and 3)
      const currentItems = node.props.__itemsGetter();
      const lastCount = node.props.__lastRenderedCount;
      const newItems = currentItems.slice(lastCount);

      expect(newItems).toEqual(['c', 'd']);
    });
  });

  describe('Static with complex items', () => {
    interface LogEntry {
      id: number;
      message: string;
    }

    it('should work with object items', () => {
      const logs: LogEntry[] = [
        { id: 1, message: 'First' },
        { id: 2, message: 'Second' },
      ];

      const node = Static({
        items: logs,
        children: (log) => (
          <Box key={log.id}>
            <Text>{log.message}</Text>
          </Box>
        ),
      });

      expect(node.children.length).toBe(2);
    });

    it('should pass index to render function', () => {
      const indices: number[] = [];

      Static({
        items: ['a', 'b', 'c'],
        children: (item, index) => {
          indices.push(index);
          return Text({ children: item });
        },
      });

      expect(indices).toEqual([0, 1, 2]);
    });
  });
});
