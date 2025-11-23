/**
 * Link component for TUI
 *
 * Clickable terminal link using OSC 8 escape sequences.
 * Matches ink-link behavior with fallback for unsupported terminals.
 */

import type { TUINode } from '../types';
import { Text } from './Text';

export interface LinkProps {
  url: string;
  children: string;
  fallback?: boolean; // Show URL in parentheses if true (default: false)
  style?: any;
}

/**
 * Link component with terminal hyperlink support
 *
 * Uses OSC 8 escape sequences for clickable links.
 * Supported in: iTerm2, Terminal.app (macOS 10.15+), VSCode, Windows Terminal
 */
export function Link(props: LinkProps): TUINode {
  const fallback = props.fallback ?? false;

  // OSC 8 format: \x1b]8;;URL\x1b\\TEXT\x1b]8;;\x1b\\
  // See: https://gist.github.com/egmontkob/eb114294efbcd5adb1944c9f3cb5feda
  const linkText = fallback
    ? `${props.children} (${props.url})`
    : `\x1b]8;;${props.url}\x1b\\${props.children}\x1b]8;;\x1b\\`;

  return Text({
    children: linkText,
    color: 'cyan',
    underline: true,
    ...props.style,
  });
}
