/**
 * Divider component for TUI
 *
 * Horizontal divider line for separating content.
 * Automatically fills available width when no explicit width is specified.
 */

import type { TUINode, TUIStyle } from '../core/types.js';
import { terminalWidthSignal } from '../hooks/useTerminalSize.js';
import { Text } from '../primitives/Text.js';

export interface DividerProps {
  character?: string; // Character to use for divider (default: '─')
  width?: number; // Width of divider (default: fills parent)
  color?: string;
  padding?: number; // Vertical padding (default: 0)
  style?: TUIStyle;
}

export function Divider(props: DividerProps): TUINode {
  const char = props.character || '─';
  const padding = props.padding || 0;

  // Use explicit width, or reactive terminal width minus typical padding (2)
  // The -2 accounts for parent padding (1 on each side) which is common
  const getWidth = () => props.width ?? Math.max(10, terminalWidthSignal.value - 2);

  return Text({
    // Reactive children - regenerates line when width changes
    children: () => char.repeat(getWidth()),
    color: props.color,
    dim: true,
    style: {
      marginTop: padding,
      marginBottom: padding,
      alignSelf: 'stretch', // Fill parent width
      ...props.style,
    },
  });
}
