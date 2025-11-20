/**
 * Checkbox component for TUI
 *
 * Interactive checkbox with keyboard toggle.
 */

import { type Signal, signal } from '@zen/runtime';
import { useFocus } from '../focus';
import type { TUINode } from '../types';
import { useInput } from '../useInput';
import { Box } from './Box';
import { Text } from './Text';

export interface CheckboxProps {
  checked?: Signal<boolean> | boolean;
  label?: string;
  onChange?: (checked: boolean) => void;
  id?: string;
  width?: number;
  style?: any;
}

export function Checkbox(props: CheckboxProps): TUINode {
  // Generate unique ID if not provided
  const id = props.id || `checkbox-${Math.random().toString(36).slice(2, 9)}`;

  // Checked state management
  const checkedSignal =
    typeof props.checked === 'object' && 'value' in props.checked
      ? props.checked
      : signal(typeof props.checked === 'boolean' ? props.checked : false);

  // Focus management
  const { isFocused } = useFocus(id);

  // Handle keyboard input
  useInput((input, _key) => {
    if (!isFocused) return;

    handleCheckbox(checkedSignal, input, props.onChange);
  });

  const focused = isFocused;
  const checked = checkedSignal.value;

  // Checkbox character
  const checkboxChar = checked ? '☑' : '☐';

  // Truncate label to fit within width
  let displayLabel = props.label;
  if (props.width && props.label) {
    // Calculate available width: total - checkbox char (1) - space (1) - padding (focused ? 2*2 : 0) - borders (focused ? 2 : 0)
    const overhead = 2 + (focused ? 6 : 0); // checkbox + space + padding + borders
    const maxLabelWidth = props.width - overhead;
    if (props.label.length > maxLabelWidth) {
      displayLabel = props.label.slice(0, maxLabelWidth - 3) + '...';
    }
  }

  return Box({
    style: {
      width: props.width,
      flexDirection: 'row',
      borderStyle: focused ? 'round' : 'none',
      borderColor: focused ? 'cyan' : undefined,
      paddingX: focused ? 1 : 0,
      ...props.style,
    },
    children: [
      Text({
        children: checkboxChar,
        color: checked ? 'green' : 'white',
        bold: focused,
      }),
      displayLabel
        ? Text({
            children: ` ${displayLabel}`,
          })
        : null,
    ].filter(Boolean),
  });
}

/**
 * Input handler for Checkbox
 * Call this from the app's key handler
 */
export function handleCheckbox(
  checkedSignal: Signal<boolean>,
  key: string,
  onChange?: (checked: boolean) => void,
): boolean {
  // Space or Enter: toggle checkbox
  if (key === ' ' || key === '\r' || key === '\n') {
    const newValue = !checkedSignal.value;
    checkedSignal.value = newValue;
    onChange?.(newValue);
    return true;
  }

  return false;
}
