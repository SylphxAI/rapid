/** @jsxImportSource @zen/tui */
/**
 * List Component
 *
 * General-purpose list component with keyboard navigation.
 * Unlike MultiSelect, this is a simple single-selection list without checkboxes.
 *
 * Features:
 * - Single selection or no selection
 * - Keyboard navigation (↑↓, j/k)
 * - Custom item rendering
 * - Scrolling support for large lists
 * - Optional selection indicator
 */

import { Box, Text, computed, signal, useInput } from '@zen/tui';

export interface ListProps<T = unknown> {
  /** Array of items to display */
  items: T[];

  /** Currently selected index (-1 for no selection) */
  selectedIndex?: number;

  /** Callback when item is selected (Enter key) */
  onSelect?: (item: T, index: number) => void;

  /** Custom item renderer - returns a TUI node */
  // biome-ignore lint/suspicious/noExplicitAny: JSX return types vary by runtime
  renderItem?: (item: T, index: number, isSelected: boolean) => any;

  /** Maximum visible items (enables scrolling) */
  limit?: number;

  /** Show selection indicator (default: true) */
  showIndicator?: boolean;

  /** Selection indicator character (default: '>') */
  indicator?: string;

  /** Focus management */
  isFocused?: boolean;
}

/**
 * List Component
 *
 * @example
 * ```tsx
 * const files = ['file1.txt', 'file2.txt', 'file3.txt'];
 * const selected = signal(0);
 *
 * <List
 *   items={files}
 *   selectedIndex={selected.value}
 *   onSelect={(file, index) => {
 *     console.log('Selected:', file);
 *     selected.value = index;
 *   }}
 *   renderItem={(file, index, isSelected) => (
 *     <Text color={isSelected ? 'cyan' : 'white'}>{file}</Text>
 *   )}
 * />
 * ```
 */
export function List<T = unknown>(props: ListProps<T>) {
  const {
    items,
    selectedIndex: externalSelectedIndex,
    onSelect,
    renderItem,
    limit,
    showIndicator = true,
    indicator = '>',
    isFocused = true,
  } = props;

  // Internal state for selection
  const internalSelectedIndex = signal(externalSelectedIndex ?? -1);
  const scrollOffset = signal(0);

  // Use external selection if provided, otherwise use internal
  const selectedIndex = computed(() =>
    externalSelectedIndex !== undefined ? externalSelectedIndex : internalSelectedIndex.value,
  );

  // Calculate visible window
  const visibleLimit = limit ?? items.length;
  const visibleItems = computed(() => {
    const start = scrollOffset.value;
    const end = Math.min(start + visibleLimit, items.length);
    return items.slice(start, end);
  });

  // Handle keyboard input
  // Use high priority (10) when focused to consume events before parent handlers
  useInput(
    (input, key) => {
      if (!isFocused) return false;

      const currentIndex = selectedIndex.value;

      // Move up
      if (key.upArrow || input === 'k') {
        const newIndex = Math.max(0, currentIndex - 1);
        if (externalSelectedIndex === undefined) {
          internalSelectedIndex.value = newIndex;
        }

        // Scroll up if needed
        if (limit && newIndex < scrollOffset.value) {
          scrollOffset.value = newIndex;
        }

        // Call onSelect if provided
        if (onSelect && newIndex !== currentIndex) {
          onSelect(items[newIndex], newIndex);
        }
        return true; // consumed
      }

      // Move down
      if (key.downArrow || input === 'j') {
        const newIndex = Math.min(items.length - 1, currentIndex + 1);
        if (externalSelectedIndex === undefined) {
          internalSelectedIndex.value = newIndex;
        }

        // Scroll down if needed
        if (limit && newIndex >= scrollOffset.value + visibleLimit) {
          scrollOffset.value = newIndex - visibleLimit + 1;
        }

        // Call onSelect if provided
        if (onSelect && newIndex !== currentIndex) {
          onSelect(items[newIndex], newIndex);
        }
        return true; // consumed
      }

      // Select current item (Enter)
      if (key.return && onSelect) {
        const index = selectedIndex.value;
        if (index >= 0 && index < items.length) {
          onSelect(items[index], index);
        }
        return true; // consumed
      }

      // Page up
      if (key.pageUp && limit) {
        const newIndex = Math.max(0, currentIndex - visibleLimit);
        if (externalSelectedIndex === undefined) {
          internalSelectedIndex.value = newIndex;
        }
        scrollOffset.value = Math.max(0, scrollOffset.value - visibleLimit);
        if (onSelect) {
          onSelect(items[newIndex], newIndex);
        }
        return true; // consumed
      }

      // Page down
      if (key.pageDown && limit) {
        const newIndex = Math.min(items.length - 1, currentIndex + visibleLimit);
        if (externalSelectedIndex === undefined) {
          internalSelectedIndex.value = newIndex;
        }
        scrollOffset.value = Math.min(
          items.length - visibleLimit,
          scrollOffset.value + visibleLimit,
        );
        if (onSelect) {
          onSelect(items[newIndex], newIndex);
        }
        return true; // consumed
      }

      // Home
      if (key.home) {
        if (externalSelectedIndex === undefined) {
          internalSelectedIndex.value = 0;
        }
        scrollOffset.value = 0;
        if (onSelect) {
          onSelect(items[0], 0);
        }
        return true; // consumed
      }

      // End
      if (key.end) {
        const lastIndex = items.length - 1;
        if (externalSelectedIndex === undefined) {
          internalSelectedIndex.value = lastIndex;
        }
        scrollOffset.value = Math.max(0, items.length - visibleLimit);
        if (onSelect) {
          onSelect(items[lastIndex], lastIndex);
        }
        return true; // consumed
      }

      return false; // not consumed
    },
    { isActive: isFocused, priority: 10 },
  );

  // Default item renderer
  const defaultRenderItem = (item: T, _index: number, isSelected: boolean) => {
    return <Text style={{ color: isSelected ? 'cyan' : 'white' }}>{String(item)}</Text>;
  };

  const itemRenderer = renderItem || defaultRenderItem;

  return (
    <Box style={{ flexDirection: 'column' }}>
      {() =>
        visibleItems.value.map((item, localIndex) => {
          const globalIndex = scrollOffset.value + localIndex;
          const isSelected = globalIndex === selectedIndex.value;

          return (
            <Box key={globalIndex} style={{ flexDirection: 'row', gap: 1 }}>
              {showIndicator && (
                <Text style={{ color: isSelected ? 'cyan' : 'transparent' }}>
                  {isSelected ? indicator : ' '}
                </Text>
              )}
              {itemRenderer(item, globalIndex, isSelected)}
            </Box>
          );
        })
      }

      {/* Scroll indicator */}
      {limit && items.length > limit && (
        <Box style={{ marginTop: 1 }}>
          <Text style={{ dim: true }}>
            {() =>
              `${scrollOffset.value + 1}-${Math.min(scrollOffset.value + visibleLimit, items.length)} of ${items.length}`
            }
          </Text>
        </Box>
      )}
    </Box>
  );
}
