/**
 * Badge component for TUI
 *
 * Small status indicator with colored background.
 */

import type { TUINode } from '../types';
import { Box } from './Box';
import { Text } from './Text';

export interface BadgeProps {
  children: string;
  color?: 'green' | 'red' | 'yellow' | 'blue' | 'cyan' | 'magenta' | 'white' | 'gray';
  style?: any;
}

export function Badge(props: BadgeProps): TUINode {
  const color = props.color || 'cyan';

  return Box({
    style: {
      backgroundColor: color,
      paddingX: 1,
      ...props.style,
    },
    children: Text({
      children: props.children,
      color: 'black',
      bold: true,
    }),
  });
}
