/**
 * StatusMessage component for TUI
 *
 * Status indicator with icon and colored message.
 * Matches @inkjs/ui StatusMessage behavior.
 */

import type { TUINode } from '../types';
import { Box } from './Box';
import { Text } from './Text';

export interface StatusMessageProps {
  type: 'success' | 'error' | 'warning' | 'info';
  children: string;
  style?: any;
}

const STATUS_CONFIG = {
  success: {
    icon: '✓',
    color: 'green' as const,
  },
  error: {
    icon: '✗',
    color: 'red' as const,
  },
  warning: {
    icon: '⚠',
    color: 'yellow' as const,
  },
  info: {
    icon: 'ℹ',
    color: 'cyan' as const,
  },
};

export function StatusMessage(props: StatusMessageProps): TUINode {
  const config = STATUS_CONFIG[props.type];

  return Box({
    style: {
      flexDirection: 'row',
      ...props.style,
    },
    children: [
      Text({
        children: config.icon,
        color: config.color,
        bold: true,
        style: { marginRight: 1 },
      }),
      Text({
        children: props.children,
        color: config.color,
      }),
    ],
  });
}
