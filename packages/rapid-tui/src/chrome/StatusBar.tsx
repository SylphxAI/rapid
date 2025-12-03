/**
 * StatusBar Component
 *
 * A status bar that stays at the bottom of the screen.
 * Commonly used in fullscreen TUI apps like vim, tmux, htop.
 *
 * Features:
 * - Left, center, and right sections
 * - Customizable background and text colors
 * - Built-in helpers for common status items
 *
 * @example
 * ```tsx
 * <StatusBar
 *   left={<Text>NORMAL</Text>}
 *   center={<Text>myfile.txt</Text>}
 *   right={<Text>Ln 42, Col 10</Text>}
 * />
 * ```
 */

import type { TUINode, TUIStyle } from '../core/types.js';
import { Box } from '../primitives/Box.js';
import { Text } from '../primitives/Text.js';

export interface StatusBarProps {
  /** Content for left section */
  left?: TUINode | string;
  /** Content for center section */
  center?: TUINode | string;
  /** Content for right section */
  right?: TUINode | string;
  /** Background color (default: 'blue') */
  backgroundColor?: string;
  /** Text color (default: 'white') */
  color?: string;
  /** Make text bold */
  bold?: boolean;
  /** Additional style */
  style?: TUIStyle;
}

/**
 * StatusBar - Bottom status bar for fullscreen apps
 */
export function StatusBar(props: StatusBarProps): TUINode {
  const {
    left,
    center,
    right,
    backgroundColor = 'blue',
    color = 'white',
    bold = false,
    style,
  } = props;

  const textStyle: TUIStyle = {
    color,
    bold,
  };

  // Helper to wrap string content in Text
  const wrapContent = (content: TUINode | string | undefined): TUINode | null => {
    if (content === undefined) return null;
    if (typeof content === 'string') {
      return Text({ children: content, style: textStyle });
    }
    return content;
  };

  const leftContent = wrapContent(left);
  const centerContent = wrapContent(center);
  const rightContent = wrapContent(right);

  return Box({
    style: {
      flexDirection: 'row',
      width: '100%',
      height: 1,
      backgroundColor,
      ...style,
    },
    children: [
      // Left section - align left
      Box({
        style: {
          flexGrow: 1,
          flexDirection: 'row',
          justifyContent: 'flex-start',
        },
        children: leftContent ? [leftContent] : [],
      }),
      // Center section - centered
      Box({
        style: {
          flexGrow: 1,
          flexDirection: 'row',
          justifyContent: 'center',
        },
        children: centerContent ? [centerContent] : [],
      }),
      // Right section - align right
      Box({
        style: {
          flexGrow: 1,
          flexDirection: 'row',
          justifyContent: 'flex-end',
        },
        children: rightContent ? [rightContent] : [],
      }),
    ],
  });
}

/**
 * StatusBar.Item - A styled item within the status bar
 */
export interface StatusBarItemProps {
  children: string;
  color?: string;
  backgroundColor?: string;
  bold?: boolean;
  /** Add padding around the item */
  padded?: boolean;
}

export function StatusBarItem(props: StatusBarItemProps): TUINode {
  const { children, color, backgroundColor, bold, padded } = props;
  const padding = padded ? ' ' : '';

  return Text({
    children: `${padding}${children}${padding}`,
    style: {
      color,
      backgroundColor,
      bold,
    },
  });
}

/**
 * StatusBar.Mode - Common mode indicator (like vim's NORMAL/INSERT)
 */
export interface StatusBarModeProps {
  mode: string;
  /** Color based on mode - default mappings provided */
  color?: string;
  backgroundColor?: string;
}

const modeColors: Record<string, { bg: string; fg: string }> = {
  NORMAL: { bg: 'green', fg: 'black' },
  INSERT: { bg: 'blue', fg: 'white' },
  VISUAL: { bg: 'magenta', fg: 'white' },
  COMMAND: { bg: 'yellow', fg: 'black' },
  SEARCH: { bg: 'cyan', fg: 'black' },
};

export function StatusBarMode(props: StatusBarModeProps): TUINode {
  const { mode } = props;
  const colors = modeColors[mode.toUpperCase()] || { bg: 'gray', fg: 'white' };
  const backgroundColor = props.backgroundColor || colors.bg;
  const color = props.color || colors.fg;

  return Text({
    children: ` ${mode.toUpperCase()} `,
    style: {
      backgroundColor,
      color,
      bold: true,
    },
  });
}

/**
 * StatusBar.Shortcut - Display a keyboard shortcut hint
 */
export interface StatusBarShortcutProps {
  /** The key combination (e.g., "Ctrl+S") */
  keys: string;
  /** Description of what the shortcut does */
  action: string;
  /** Key color */
  keyColor?: string;
}

export function StatusBarShortcut(props: StatusBarShortcutProps): TUINode {
  const { keys, action, keyColor = 'yellow' } = props;

  return Box({
    style: { flexDirection: 'row' },
    children: [
      Text({ children: keys, style: { color: keyColor, bold: true } }),
      Text({ children: `:${action} `, style: { dim: true } }),
    ],
  });
}

/**
 * StatusBar.Separator - Vertical separator between items
 */
export function StatusBarSeparator(): TUINode {
  return Text({
    children: ' │ ',
    style: { dim: true },
  });
}
