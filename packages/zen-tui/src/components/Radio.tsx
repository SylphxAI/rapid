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

    handleRadioInput(
      input,
      highlightedIndex,
      valueSignal,
      props.options,
      props.onChange,
    );
  });

  // Render options
  const optionNodes = props.options.map((option, index) => {
    const isHighlighted = () => isFocused.value && highlightedIndex.value === index;
    const isSelected = () => valueSignal.value === option.value;

    return Box({
      key: `option-${index}`,
      style: {
        flexDirection: 'row',
        marginBottom: index < props.options.length - 1 ? 0 : 0,
      },
      children: [
        // Indicator
        Text({
          children: () => (isSelected() ? '◉' : '○'),
          color: () => {
            if (isSelected()) return 'cyan';
            if (isHighlighted()) return 'white';
            return 'gray';
          },
          bold: () => isSelected(),
          style: { marginRight: 1 },
        }),
        // Label
        Text({
          children: option.label,
          color: () => {
            if (isSelected()) return 'cyan';
            if (isHighlighted()) return 'white';
            return undefined;
          },
          bold: () => isHighlighted(),
          inverse: () => isHighlighted(),
        }),
      ],
    });
  });

  return Box({
    style: {
      flexDirection: 'column',
      borderStyle: () => (isFocused.value ? 'round' : undefined),
      borderColor: () => (isFocused.value ? 'cyan' : undefined),
      padding: () => (isFocused.value ? 0 : 0),
      paddingX: () => (isFocused.value ? 1 : 0),
      ...props.style,
    },
    children: optionNodes,
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
    case ' ': // Space
      const selected = options[currentIndex];
      if (selected) {
        valueSignal.value = selected.value;
        onChange?.(selected.value);
      }
      return true;

    default:
      return false;
  }
}
