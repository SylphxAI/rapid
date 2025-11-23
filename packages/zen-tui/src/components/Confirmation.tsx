/**
 * Confirmation component for TUI
 *
 * Yes/No confirmation dialog with keyboard shortcuts.
 * Press Y/N or arrow keys + enter.
 */

import { signal } from '@zen/runtime';
import { useFocus } from '../focus';
import type { TUINode } from '../types';
import { useInput } from '../useInput';
import { Box } from './Box';
import { Text } from './Text';

export interface ConfirmationProps {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  yesLabel?: string;
  noLabel?: string;
  defaultYes?: boolean; // Default to Yes (default: true)
  id?: string;
  style?: any;
}

export function Confirmation(props: ConfirmationProps): TUINode {
  const id = props.id || `confirmation-${Math.random().toString(36).slice(2, 9)}`;

  const yesLabel = props.yesLabel || 'Yes';
  const noLabel = props.noLabel || 'No';
  const defaultYes = props.defaultYes ?? true;

  // Highlighted choice: 0 = Yes, 1 = No
  const highlighted = signal(defaultYes ? 0 : 1);

  // Focus management
  const { isFocused } = useFocus({ id });

  // Handle keyboard input
  useInput((input, _key) => {
    if (!isFocused.value) return;

    const key = input.toLowerCase();

    // Direct Y/N keys
    if (key === 'y') {
      props.onConfirm();
      return;
    }
    if (key === 'n') {
      props.onCancel();
      return;
    }

    // Arrow key navigation
    if (input === '\x1b[D' || input === 'h') {
      // Left arrow
      highlighted.value = 0; // Yes
      return;
    }
    if (input === '\x1b[C' || input === 'l') {
      // Right arrow
      highlighted.value = 1; // No
      return;
    }

    // Enter to confirm current choice
    if (input === '\r') {
      if (highlighted.value === 0) {
        props.onConfirm();
      } else {
        props.onCancel();
      }
    }
  });

  return Box({
    style: {
      flexDirection: 'column',
      borderStyle: () => (isFocused.value ? 'round' : 'single'),
      borderColor: () => (isFocused.value ? 'cyan' : undefined),
      padding: 1,
      ...props.style,
    },
    children: [
      // Message
      Text({
        children: props.message,
        style: { marginBottom: 1 },
      }),
      // Yes/No buttons
      Box({
        style: { flexDirection: 'row' },
        children: [
          // Yes button
          Text({
            children: () => (highlighted.value === 0 ? `> ${yesLabel}` : `  ${yesLabel}`),
            color: () => (highlighted.value === 0 ? 'green' : 'gray'),
            bold: () => highlighted.value === 0,
            inverse: () => highlighted.value === 0,
            style: { marginRight: 2 },
          }),
          // No button
          Text({
            children: () => (highlighted.value === 1 ? `> ${noLabel}` : `  ${noLabel}`),
            color: () => (highlighted.value === 1 ? 'red' : 'gray'),
            bold: () => highlighted.value === 1,
            inverse: () => highlighted.value === 1,
          }),
        ],
      }),
    ],
  });
}
