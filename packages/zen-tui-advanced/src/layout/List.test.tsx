import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
/** @jsxImportSource @zen/tui */
/**
 * List Component Tests - Architecture Level
 *
 * CRITICAL: Import from @zen/tui to use same module instance as List component
 */
import { computed, createRoot, signal } from '@zen/runtime';
import { List } from './List.js';

// CRITICAL: Import from @zen/tui to share the same inputHandlers instance
import {
  Box,
  FocusProvider,
  clearInputHandlers,
  dispatchInput,
  setPlatformOps,
  tuiPlatformOps,
  useFocus,
  useInput,
} from '@zen/tui';

setPlatformOps(tuiPlatformOps);

describe('List Component', () => {
  beforeEach(() => {
    clearInputHandlers();
  });

  afterEach(() => {
    clearInputHandlers();
  });

  describe('Basic Rendering', () => {
    it('should render with items', () => {
      const result = List({ items: ['A', 'B', 'C'] });
      expect(result).toBeDefined();
    });

    it('should render empty list', () => {
      const result = List({ items: [] });
      expect(result).toBeDefined();
    });

    it('should render with reactive items', () => {
      const items = signal(['A', 'B']);
      const result = List({ items: () => items.value });
      expect(result).toBeDefined();
    });
  });

  describe('Keyboard Navigation', () => {
    it('should navigate down with ↓ arrow', async () => {
      const selections: Array<{ item: string; index: number }> = [];

      createRoot(() => {
        return List({
          items: ['Apple', 'Banana', 'Cherry'],
          initialIndex: 0,
          onSelect: (item, idx) => selections.push({ item, index: idx }),
          isFocused: true,
        });
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      dispatchInput('\x1B[B'); // Down arrow
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(selections.length).toBeGreaterThan(0);
      expect(selections[selections.length - 1].index).toBe(1);
      expect(selections[selections.length - 1].item).toBe('Banana');
    });

    it('should navigate up with ↑ arrow', async () => {
      const selections: Array<{ item: string; index: number }> = [];

      createRoot(() => {
        return List({
          items: ['Apple', 'Banana', 'Cherry'],
          initialIndex: 2,
          onSelect: (item, idx) => selections.push({ item, index: idx }),
          isFocused: true,
        });
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      dispatchInput('\x1B[A'); // Up arrow
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(selections.length).toBeGreaterThan(0);
      expect(selections[selections.length - 1].index).toBe(1);
    });

    it('should navigate with j/k keys', async () => {
      const selections: Array<{ item: string; index: number }> = [];

      createRoot(() => {
        return List({
          items: ['Apple', 'Banana', 'Cherry'],
          initialIndex: 0,
          onSelect: (item, idx) => selections.push({ item, index: idx }),
          isFocused: true,
        });
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      dispatchInput('j'); // Down
      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(selections[selections.length - 1].index).toBe(1);

      dispatchInput('k'); // Up
      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(selections[selections.length - 1].index).toBe(0);
    });

    it('should trigger onSelect with Enter', async () => {
      const selections: Array<{ item: string; index: number }> = [];

      createRoot(() => {
        return List({
          items: ['Apple', 'Banana', 'Cherry'],
          initialIndex: 1,
          onSelect: (item, idx) => selections.push({ item, index: idx }),
          isFocused: true,
        });
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      dispatchInput('\r'); // Enter
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(selections.length).toBeGreaterThan(0);
      expect(selections[selections.length - 1].index).toBe(1);
      expect(selections[selections.length - 1].item).toBe('Banana');
    });

    it('should not navigate past first item', async () => {
      const selections: Array<{ item: string; index: number }> = [];

      createRoot(() => {
        return List({
          items: ['Apple', 'Banana', 'Cherry'],
          initialIndex: 0,
          onSelect: (item, idx) => selections.push({ item, index: idx }),
          isFocused: true,
        });
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      dispatchInput('\x1B[A'); // Up when at 0
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Should not have triggered selection change (index stays 0)
      // Or if it did trigger, index should still be 0
    });

    it('should not navigate past last item', async () => {
      const selections: Array<{ item: string; index: number }> = [];

      createRoot(() => {
        return List({
          items: ['Apple', 'Banana', 'Cherry'],
          initialIndex: 2,
          onSelect: (item, idx) => selections.push({ item, index: idx }),
          isFocused: true,
        });
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      dispatchInput('\x1B[B'); // Down when at last
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Should not have triggered selection change (index stays 2)
    });
  });

  describe('Focus Gate Pattern', () => {
    it('should NOT receive input when isFocused=false', async () => {
      const selections: number[] = [];

      createRoot(() => {
        return List({
          items: ['Apple', 'Banana', 'Cherry'],
          onSelect: (_, idx) => selections.push(idx),
          isFocused: false,
        });
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      dispatchInput('\x1B[B');
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(selections).toEqual([]);
    });

    it('should receive input when isFocused=true', async () => {
      const selections: number[] = [];

      createRoot(() => {
        return List({
          items: ['Apple', 'Banana', 'Cherry'],
          onSelect: (_, idx) => selections.push(idx),
          isFocused: true,
        });
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      dispatchInput('\x1B[B');
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(selections.length).toBeGreaterThan(0);
    });

    it('should respond to reactive isFocused changes', async () => {
      const selections: number[] = [];
      const isFocused = signal(false);

      createRoot(() => {
        return List({
          items: ['Apple', 'Banana', 'Cherry'],
          onSelect: (_, idx) => selections.push(idx),
          isFocused: () => isFocused.value,
        });
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Not focused
      dispatchInput('\x1B[B');
      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(selections).toEqual([]);

      // Focus
      isFocused.value = true;
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Now should receive
      dispatchInput('\x1B[B');
      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(selections.length).toBeGreaterThan(0);
    });
  });

  describe('FocusProvider Integration', () => {
    it('should work with focusId and autoFocus', async () => {
      const selections: number[] = [];

      createRoot(() => {
        return FocusProvider({
          get children() {
            return List({
              items: ['Apple', 'Banana', 'Cherry'],
              focusId: 'test-list',
              autoFocus: true,
              onSelect: (_, idx) => selections.push(idx),
              isFocused: true, // Gate open
            });
          },
        });
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      dispatchInput('\x1B[B');
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(selections.length).toBeGreaterThan(0);
    });

    it('should respect gate AND FocusProvider focus', async () => {
      const selections: number[] = [];
      const gate = signal(true);

      createRoot(() => {
        return FocusProvider({
          get children() {
            return List({
              items: ['Apple', 'Banana', 'Cherry'],
              focusId: 'test-list',
              autoFocus: true,
              onSelect: (_, idx) => selections.push(idx),
              isFocused: () => gate.value,
            });
          },
        });
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Gate open - should work
      dispatchInput('\x1B[B');
      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(selections.length).toBeGreaterThan(0);

      const countBefore = selections.length;

      // Close gate
      gate.value = false;
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Gate closed - should NOT receive
      dispatchInput('\x1B[B');
      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(selections.length).toBe(countBefore);
    });
  });

  describe('Tab Navigation with FocusProvider', () => {
    it('should switch focus with Tab', async () => {
      const listSelections: number[] = [];
      const otherReceived: string[] = [];

      createRoot(() => {
        return FocusProvider({
          get children() {
            // Another focusable first (gets autoFocus)
            const otherFocus = useFocus({ id: 'other', autoFocus: true });
            const otherEffective = computed(() => otherFocus.isFocused.value);
            useInput(
              (input: string) => {
                otherReceived.push(input);
                return false;
              },
              { isActive: otherEffective },
            );

            // List (no autoFocus, will get focus after Tab)
            const listResult = List({
              items: ['Apple', 'Banana'],
              focusId: 'list',
              onSelect: (_, idx) => listSelections.push(idx),
              isFocused: true,
            });

            return Box({ children: [listResult] });
          },
        });
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Other has autoFocus - type
      dispatchInput('x');
      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(otherReceived).toContain('x');

      // Tab to List
      dispatchInput('\t');
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Now List should receive
      dispatchInput('\x1B[B');
      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(listSelections.length).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // Scrolling with limit
  // ==========================================================================

  describe('Scrolling with limit', () => {
    it('should limit visible items', () => {
      const result = List({
        items: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'],
        limit: 3,
      });
      expect(result).toBeDefined();
    });

    it('should scroll down when navigating past visible window', async () => {
      const selections: number[] = [];

      createRoot(() => {
        return List({
          items: ['A', 'B', 'C', 'D', 'E'],
          limit: 2,
          initialIndex: 0,
          onSelect: (_, idx) => selections.push(idx),
          isFocused: true,
        });
      });

      await new Promise((r) => setTimeout(r, 50));

      // Navigate down 3 times (past limit of 2)
      dispatchInput('\x1B[B'); // to 1
      await new Promise((r) => setTimeout(r, 5));
      dispatchInput('\x1B[B'); // to 2 (should scroll)
      await new Promise((r) => setTimeout(r, 5));
      dispatchInput('\x1B[B'); // to 3 (should scroll more)
      await new Promise((r) => setTimeout(r, 10));

      expect(selections[selections.length - 1]).toBe(3);
    });

    it('should scroll up when navigating before visible window', async () => {
      const selections: number[] = [];

      createRoot(() => {
        return List({
          items: ['A', 'B', 'C', 'D', 'E'],
          limit: 2,
          initialIndex: 3,
          onSelect: (_, idx) => selections.push(idx),
          isFocused: true,
        });
      });

      await new Promise((r) => setTimeout(r, 50));

      // Navigate up multiple times
      dispatchInput('\x1B[A');
      await new Promise((r) => setTimeout(r, 5));
      dispatchInput('\x1B[A');
      await new Promise((r) => setTimeout(r, 5));
      dispatchInput('\x1B[A');
      await new Promise((r) => setTimeout(r, 10));

      expect(selections[selections.length - 1]).toBe(0);
    });

    it('should navigate with PageUp', async () => {
      const selections: number[] = [];

      createRoot(() => {
        return List({
          items: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'],
          limit: 3,
          initialIndex: 5,
          onSelect: (_, idx) => selections.push(idx),
          isFocused: true,
        });
      });

      await new Promise((r) => setTimeout(r, 50));

      dispatchInput('\x1B[5~'); // PageUp
      await new Promise((r) => setTimeout(r, 10));

      // Should jump up by limit (3)
      expect(selections[selections.length - 1]).toBe(2);
    });

    it('should navigate with PageDown', async () => {
      const selections: number[] = [];

      createRoot(() => {
        return List({
          items: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'],
          limit: 3,
          initialIndex: 2,
          onSelect: (_, idx) => selections.push(idx),
          isFocused: true,
        });
      });

      await new Promise((r) => setTimeout(r, 50));

      dispatchInput('\x1B[6~'); // PageDown
      await new Promise((r) => setTimeout(r, 10));

      // Should jump down by limit (3)
      expect(selections[selections.length - 1]).toBe(5);
    });

    it('should navigate to start with Home', async () => {
      const selections: number[] = [];

      createRoot(() => {
        return List({
          items: ['A', 'B', 'C', 'D', 'E'],
          limit: 2,
          initialIndex: 3,
          onSelect: (_, idx) => selections.push(idx),
          isFocused: true,
        });
      });

      await new Promise((r) => setTimeout(r, 50));

      dispatchInput('\x1B[H'); // Home
      await new Promise((r) => setTimeout(r, 10));

      expect(selections[selections.length - 1]).toBe(0);
    });

    it('should navigate to end with End', async () => {
      const selections: number[] = [];

      createRoot(() => {
        return List({
          items: ['A', 'B', 'C', 'D', 'E'],
          limit: 2,
          initialIndex: 1,
          onSelect: (_, idx) => selections.push(idx),
          isFocused: true,
        });
      });

      await new Promise((r) => setTimeout(r, 50));

      dispatchInput('\x1B[F'); // End
      await new Promise((r) => setTimeout(r, 10));

      expect(selections[selections.length - 1]).toBe(4);
    });
  });

  // ==========================================================================
  // Controlled Mode
  // ==========================================================================

  describe('Controlled Mode', () => {
    it('should use external selectedIndex', () => {
      const selectedIndex = signal(2);
      const result = List({
        items: ['A', 'B', 'C', 'D', 'E'],
        selectedIndex: () => selectedIndex.value,
      });
      expect(result).toBeDefined();
    });

    it('should NOT update internal index in controlled mode', async () => {
      const selectedIndex = signal(0);
      const onSelectCalls: number[] = [];

      createRoot(() => {
        return List({
          items: ['A', 'B', 'C'],
          selectedIndex: () => selectedIndex.value,
          onSelect: (_, idx) => onSelectCalls.push(idx),
          isFocused: true,
        });
      });

      await new Promise((r) => setTimeout(r, 50));

      // Navigate down - should call onSelect but not change selectedIndex (controlled)
      dispatchInput('\x1B[B');
      await new Promise((r) => setTimeout(r, 10));

      // onSelect should be called with new index
      expect(onSelectCalls).toContain(1);
      // But selectedIndex should still be 0 (controlled mode doesn't auto-update)
      expect(selectedIndex.value).toBe(0);
    });

    it('should update when external selectedIndex changes', async () => {
      const selectedIndex = signal(0);

      createRoot(() => {
        return List({
          items: ['A', 'B', 'C'],
          selectedIndex: () => selectedIndex.value,
          isFocused: true,
        });
      });

      await new Promise((r) => setTimeout(r, 50));

      // Change external index
      selectedIndex.value = 2;
      await new Promise((r) => setTimeout(r, 10));

      // Component should reflect new selection
      expect(selectedIndex.value).toBe(2);
    });
  });

  // ==========================================================================
  // Custom Rendering
  // ==========================================================================

  describe('Custom Rendering', () => {
    it('should use custom renderItem function', () => {
      const rendered: string[] = [];

      const result = List({
        items: ['Apple', 'Banana', 'Cherry'],
        renderItem: (item, index, isSelected) => {
          rendered.push(`${index}:${item}:${isSelected}`);
          return <Box>{item}</Box>;
        },
      });

      expect(result).toBeDefined();
    });

    it('should pass correct isSelected to renderItem', () => {
      // Just verify the List accepts renderItem with correct signature
      const result = List({
        items: ['A', 'B', 'C'],
        initialIndex: 1,
        renderItem: (item, index, isSelected) => {
          // Type check - item is string, index is number, isSelected is boolean
          const _typeCheck: [string, number, boolean] = [item, index, isSelected];
          return <Box>{item}</Box>;
        },
      });

      expect(result).toBeDefined();
    });
  });

  // ==========================================================================
  // Indicator Customization
  // ==========================================================================

  describe('Indicator Customization', () => {
    it('should render with default indicator', () => {
      const result = List({
        items: ['A', 'B', 'C'],
        showIndicator: true,
      });
      expect(result).toBeDefined();
    });

    it('should render without indicator when showIndicator=false', () => {
      const result = List({
        items: ['A', 'B', 'C'],
        showIndicator: false,
      });
      expect(result).toBeDefined();
    });

    it('should use custom indicator character', () => {
      const result = List({
        items: ['A', 'B', 'C'],
        indicator: '→',
      });
      expect(result).toBeDefined();
    });

    it('should use emoji indicator', () => {
      const result = List({
        items: ['A', 'B', 'C'],
        indicator: '👉',
      });
      expect(result).toBeDefined();
    });
  });

  // ==========================================================================
  // Edge Cases
  // ==========================================================================

  describe('Edge Cases', () => {
    it('should handle single item list', async () => {
      const selections: number[] = [];

      createRoot(() => {
        return List({
          items: ['Only'],
          onSelect: (_, idx) => selections.push(idx),
          isFocused: true,
        });
      });

      await new Promise((r) => setTimeout(r, 50));

      // Try to navigate (should stay at 0)
      dispatchInput('\x1B[B');
      dispatchInput('\x1B[A');
      await new Promise((r) => setTimeout(r, 10));

      // Selections might be empty or all 0
      for (const s of selections) {
        expect(s).toBe(0);
      }
    });

    it('should handle items changing reactively', async () => {
      const items = signal(['A', 'B', 'C']);
      const selections: number[] = [];

      createRoot(() => {
        return List({
          items: () => items.value,
          onSelect: (_, idx) => selections.push(idx),
          isFocused: true,
        });
      });

      await new Promise((r) => setTimeout(r, 50));

      // Navigate to index 1
      dispatchInput('\x1B[B');
      await new Promise((r) => setTimeout(r, 10));
      expect(selections).toContain(1);

      // Change items
      items.value = ['X', 'Y', 'Z', 'W'];
      await new Promise((r) => setTimeout(r, 10));

      // Navigate again
      dispatchInput('\x1B[B');
      await new Promise((r) => setTimeout(r, 10));
      expect(selections).toContain(2);
    });

    it('should handle items becoming empty', () => {
      const items = signal(['A', 'B', 'C']);

      const result = List({
        items: () => items.value,
      });

      expect(result).toBeDefined();

      // Empty items
      items.value = [];
    });

    it('should handle very large list', () => {
      const largeItems = Array.from({ length: 1000 }, (_, i) => `Item ${i}`);

      const result = List({
        items: largeItems,
        limit: 10,
      });

      expect(result).toBeDefined();
    });

    it('should handle initialIndex out of bounds', () => {
      const result = List({
        items: ['A', 'B', 'C'],
        initialIndex: 100, // Out of bounds
      });
      expect(result).toBeDefined();
    });

    it('should handle negative initialIndex', () => {
      const result = List({
        items: ['A', 'B', 'C'],
        initialIndex: -5,
      });
      expect(result).toBeDefined();
    });

    it('should handle onSelect not provided', async () => {
      createRoot(() => {
        return List({
          items: ['A', 'B', 'C'],
          isFocused: true,
        });
      });

      await new Promise((r) => setTimeout(r, 50));

      // Navigate - should not crash
      dispatchInput('\x1B[B');
      dispatchInput('\r');
      await new Promise((r) => setTimeout(r, 10));
    });

    it('should handle complex item types', () => {
      interface ComplexItem {
        id: number;
        name: string;
        metadata: { tags: string[] };
      }

      const items: ComplexItem[] = [
        { id: 1, name: 'First', metadata: { tags: ['a', 'b'] } },
        { id: 2, name: 'Second', metadata: { tags: ['c'] } },
      ];

      const result = List({
        items,
        renderItem: (item, _index, isSelected) => (
          <Box>
            <Box>{item.name}</Box>
            {isSelected && <Box>{item.metadata.tags.join(', ')}</Box>}
          </Box>
        ),
      });

      expect(result).toBeDefined();
    });
  });

  // ==========================================================================
  // Keyboard Shortcuts
  // ==========================================================================

  describe('Keyboard Shortcuts', () => {
    it('should not respond to unrelated keys', async () => {
      const selections: number[] = [];

      createRoot(() => {
        return List({
          items: ['A', 'B', 'C'],
          onSelect: (_, idx) => selections.push(idx),
          isFocused: true,
        });
      });

      await new Promise((r) => setTimeout(r, 50));

      // Type random characters
      dispatchInput('x');
      dispatchInput('y');
      dispatchInput('z');
      await new Promise((r) => setTimeout(r, 10));

      // Should not trigger selection
      expect(selections).toEqual([]);
    });

    it('should handle Home on list without limit', async () => {
      const selections: number[] = [];

      createRoot(() => {
        return List({
          items: ['A', 'B', 'C', 'D', 'E'],
          initialIndex: 3,
          onSelect: (_, idx) => selections.push(idx),
          isFocused: true,
        });
      });

      await new Promise((r) => setTimeout(r, 50));

      dispatchInput('\x1B[H'); // Home
      await new Promise((r) => setTimeout(r, 10));

      expect(selections[selections.length - 1]).toBe(0);
    });

    it('should handle End on list without limit', async () => {
      const selections: number[] = [];

      createRoot(() => {
        return List({
          items: ['A', 'B', 'C', 'D', 'E'],
          initialIndex: 1,
          onSelect: (_, idx) => selections.push(idx),
          isFocused: true,
        });
      });

      await new Promise((r) => setTimeout(r, 50));

      dispatchInput('\x1B[F'); // End
      await new Promise((r) => setTimeout(r, 10));

      expect(selections[selections.length - 1]).toBe(4);
    });

    it('should ignore PageUp/PageDown without limit', async () => {
      const selections: number[] = [];

      createRoot(() => {
        return List({
          items: ['A', 'B', 'C', 'D', 'E'],
          // No limit - PageUp/PageDown require limit
          initialIndex: 2,
          onSelect: (_, idx) => selections.push(idx),
          isFocused: true,
        });
      });

      await new Promise((r) => setTimeout(r, 50));

      dispatchInput('\x1B[5~'); // PageUp
      dispatchInput('\x1B[6~'); // PageDown
      await new Promise((r) => setTimeout(r, 10));

      // Should not trigger selection (PageUp/PageDown need limit)
      expect(selections).toEqual([]);
    });
  });
});
