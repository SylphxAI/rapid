/**
 * MultiSelect component for TUI
 *
 * Multi-selection list with checkboxes, matching Ink's ink-multi-select behavior.
 *
 * Features:
 * - Space to toggle selection
 * - Arrow keys for navigation
 * - Enter to submit
 * - Checkbox indicators
 * - Limit visible items (scrolling)
 */

import { type Signal, signal } from '@zen/runtime';
import { useFocus } from '../focus';
import type { TUINode } from '../types';
import { useInput } from '../useInput';
import { Box } from './Box';
import { Text } from './Text';

export interface MultiSelectOption<T = string> {
  label: string;
  value: T;
}

export interface MultiSelectProps<T = string> {
  items: MultiSelectOption<T>[];
  selected?: Signal<T[]> | T[]; // Currently selected values
  onSubmit?: (selected: T[]) => void;
  limit?: number; // Max visible items (scrolling)
  id?: string;
  style?: any;
  highlightedIndex?: Signal<number>; // Optional external highlight control
}

export function MultiSelect<T = string>(props: MultiSelectProps<T>): TUINode {
  // Generate unique ID if not provided
  const id = props.id || `multiselect-${Math.random().toString(36).slice(2, 9)}`;

  // Selected items management
  const selectedSignal =
    typeof props.selected === 'object' && 'value' in props.selected
      ? (props.selected as Signal<T[]>)
      : signal((props.selected as T[]) || []);

  // Highlighted option index
  const highlightedIndex = props.highlightedIndex || signal(0);

  // Scroll offset for limited view
  const scrollOffset = signal(0);

  // Focus management
  const { isFocused } = useFocus({
    id,
    onFocus: () => {
      // Reset highlight and scroll on focus
      highlightedIndex.value = 0;
      scrollOffset.value = 0;
    },
  });

  // Handle keyboard input
  useInput((input, _key) => {
    if (!isFocused.value) return;

    handleMultiSelectInput(
      highlightedIndex,
      selectedSignal,
      scrollOffset,
      props.items,
      input,
      props.limit,
      props.onSubmit,
    );
  });

  const limit = props.limit || props.items.length;

  // Use reactive function for rendering
  return Box({
    style: {
      flexDirection: 'column',
      borderStyle: () => (isFocused.value ? 'round' : 'single'),
      borderColor: () => (isFocused.value ? 'cyan' : undefined),
      padding: 0,
      ...props.style,
    },
    children: () => {
      // This function re-runs when signals change
      const highlighted = highlightedIndex.value;
      const selected = selectedSignal.value;
      const offset = scrollOffset.value;

      // Calculate visible range
      const visibleItems = props.items.slice(offset, offset + limit);

      return visibleItems.map((item, visibleIndex) => {
        const actualIndex = offset + visibleIndex;
        const isHighlighted = actualIndex === highlighted;
        const isSelected = selected.includes(item.value);

        // Checkbox indicator
        const checkbox = isSelected ? '☑' : '☐';
        const indicator = isHighlighted ? '→ ' : '  ';

        return Box({
          key: `${actualIndex}`,
          style: {
            backgroundColor: isHighlighted ? 'cyan' : undefined,
            paddingX: 1,
          },
          children: Text({
            children: `${indicator}${checkbox} ${item.label}`,
            color: isHighlighted ? 'black' : undefined,
            bold: isSelected,
          }),
        });
      });
    },
  });
}

/**
 * Input handler for MultiSelect
 * Handles navigation, selection toggle, and submit
 */
export function handleMultiSelectInput<T>(
  highlightedIndex: Signal<number>,
  selectedSignal: Signal<T[]>,
  scrollOffset: Signal<number>,
  items: MultiSelectOption<T>[],
  key: string,
  limit = items.length,
  onSubmit?: (selected: T[]) => void,
): boolean {
  const currentIndex = highlightedIndex.value;
  const currentSelected = selectedSignal.value;

  // Arrow Up: Move highlight up
  if (key === 'up' || key === 'k') {
    if (currentIndex > 0) {
      highlightedIndex.value = currentIndex - 1;

      // Scroll up if needed
      if (highlightedIndex.value < scrollOffset.value) {
        scrollOffset.value = highlightedIndex.value;
      }
    }
    return true;
  }

  // Arrow Down: Move highlight down
  if (key === 'down' || key === 'j') {
    if (currentIndex < items.length - 1) {
      highlightedIndex.value = currentIndex + 1;

      // Scroll down if needed
      if (highlightedIndex.value >= scrollOffset.value + limit) {
        scrollOffset.value = highlightedIndex.value - limit + 1;
      }
    }
    return true;
  }

  // Space: Toggle selection
  if (key === ' ' || key === 'space') {
    const item = items[currentIndex];
    if (!item) return false;

    const isCurrentlySelected = currentSelected.includes(item.value);

    if (isCurrentlySelected) {
      // Deselect
      selectedSignal.value = currentSelected.filter((v) => v !== item.value);
    } else {
      // Select
      selectedSignal.value = [...currentSelected, item.value];
    }
    return true;
  }

  // Enter/Return: Submit selection
  if (key === 'return' || key === 'enter') {
    onSubmit?.(selectedSignal.value);
    return true;
  }

  // 'a': Select all
  if (key === 'a') {
    selectedSignal.value = items.map((item) => item.value);
    return true;
  }

  // 'c': Clear all selections
  if (key === 'c') {
    selectedSignal.value = [];
    return true;
  }

  return false;
}
