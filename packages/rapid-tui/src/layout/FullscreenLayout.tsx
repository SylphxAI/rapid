/**
 * FullscreenLayout Component
 *
 * Enters alternate screen buffer and fills the terminal.
 * Use this component to create fullscreen TUI apps.
 *
 * @example
 * ```tsx
 * <FullscreenLayout>
 *   <Box style={{ flex: 1 }}>
 *     <Text>Fullscreen app!</Text>
 *   </Box>
 * </FullscreenLayout>
 * ```
 */

import { onCleanup, onMount } from '@rapid/runtime';
import { appendChild } from '../core/jsx-runtime.js';
import type { TUINode } from '../core/types.js';
import { terminalHeightSignal, terminalWidthSignal } from '../hooks/useTerminalSize.js';

export interface FullscreenLayoutProps {
  children?: unknown;
}

// Track fullscreen state globally
let fullscreenActive = false;

export function FullscreenLayout(props: FullscreenLayoutProps): TUINode {
  // Enter fullscreen mode directly
  onMount(() => {
    if (!fullscreenActive) {
      process.stdout.write('\x1b[?1049h'); // Enter alternate screen
      process.stdout.write('\x1b[2J'); // Clear screen
      process.stdout.write('\x1b[H'); // Move to top-left
      fullscreenActive = true;
    }
  });

  onCleanup(() => {
    if (fullscreenActive) {
      process.stdout.write('\x1b[?1049l'); // Exit alternate screen
      fullscreenActive = false;
    }
  });

  // Create a box that fills the terminal
  // Use reactive functions so layout updates on terminal resize
  const node: TUINode = {
    type: 'box',
    tagName: 'fullscreen-layout',
    props: {}, // Don't spread props - it includes children!
    children: [],
    style: {
      // Reactive width/height - triggers layout recalc on resize
      width: () => terminalWidthSignal.value,
      height: () => terminalHeightSignal.value,
      flexDirection: 'column',
    },
  };

  if (props?.children !== undefined) {
    appendChild(node, props.children);
  }

  return node;
}

/** Check if fullscreen is currently active */
export function isFullscreenActive(): boolean {
  return fullscreenActive;
}
