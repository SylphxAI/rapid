/**
 * Radio component for TUI
 *
 * Radio button group - select one option from multiple choices.
 * Matches Ink radio button behavior.
 */

import { type Signal, signal } from '@zen/runtime';
import { useFocus } from '../focus';
import type { TUINode } from '../types';
import { useInput } from '../useInput';
import { Box } from './Box';
import { Text } from './Text';

export interface RadioOption<T = string> {
  label: string;
  value: T;
}

export interface RadioProps<T = string> {
  options: RadioOption<T>[];
  value?: Signal<T | undefined> | T | undefined;
  onChange?: (value: T) => void;
  id?: string;
  style?: any;
  highlightedIndex?: Signal<number>;
}

export function Radio<T = string>(props: RadioProps<T>): TUINode {
  const id = props.id || `radio-${Math.random().toString(36).slice(2, 9)}`;

  // Value management
  const valueSignal =
    typeof props.value === 'object' && props.value && 'value' in props.value
      ? (props.value as Signal<T | undefined>)
      : signal<T | undefined>(props.value as T | undefined);

  // Highlighted option index
  const highlightedIndex = props.highlightedIndex || signal(0);

  // Focus management
  const { isFocused } = useFocus({ id });

  // Handle keyboard input
  useInput((input, _key) => {
    if (!isFocused.value) return;

    handleRadioInput(input, highlightedIndex, valueSignal, props.options, props.onChange);
  });

  return Box({
    style: {
      flexDirection: 'column',
      borderStyle: 'round',
      borderColor: 'cyan',
      paddingX: 1,
      ...props.style,
    },
    children: () => {
      const focused = isFocused.value;
      const highlighted = highlightedIndex.value;
      const currentValue = valueSignal.value;

      return props.options.map((option, index) => {
        const isHighlighted = focused && highlighted === index;
        const isSelected = currentValue === option.value;
        const indicator = isSelected ? '◉' : '○';
        const prefix = isHighlighted ? '> ' : '  ';

        return Text({
          key: `option-${index}`,
          children: `${prefix}${indicator} ${option.label}`,
          color: isSelected ? 'cyan' : isHighlighted ? 'white' : 'white',
          bold: isHighlighted || isSelected,
          inverse: isHighlighted,
        });
      });
    },
  });
}

/**
 * Input handler for Radio
 */
export function handleRadioInput<T>(
  key: string,
  highlightedIndex: Signal<number>,
  valueSignal: Signal<T | undefined>,
  options: RadioOption<T>[],
  onChange?: (value: T) => void,
): boolean {
  const currentIndex = highlightedIndex.value;

  switch (key) {
    case '\x1b[A': // Up arrow
    case 'k':
      if (currentIndex > 0) {
        highlightedIndex.value = currentIndex - 1;
      }
      return true;

    case '\x1b[B': // Down arrow
    case 'j':
      if (currentIndex < options.length - 1) {
        highlightedIndex.value = currentIndex + 1;
      }
      return true;

    case '\r': // Enter
    case ' ': {
      // Space
      const selected = options[currentIndex];
      if (selected) {
        valueSignal.value = selected.value;
        onChange?.(selected.value);
      }
      return true;
    }

    default:
      return false;
  }
}
