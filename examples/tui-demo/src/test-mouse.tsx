/**
 * Mouse Tracking Demo
 *
 * Tests mouse click and scroll events.
 * Displays click coordinates and scroll direction.
 */

import { signal } from '@zen/signal';
import { Box, Text, renderToTerminalReactive, useMouseClick, useMouseScroll } from '@zen/tui';

function MouseDemo() {
  const lastClick = signal<string>('None');
  const lastScroll = signal<string>('None');
  const clickCount = signal(0);
  const scrollCount = signal(0);

  // Handle mouse clicks
  useMouseClick((x, y, button, modifiers) => {
    clickCount.value += 1;
    const mods = [];
    if (modifiers?.ctrl) mods.push('Ctrl');
    if (modifiers?.shift) mods.push('Shift');
    if (modifiers?.meta) mods.push('Meta');
    const modsStr = mods.length > 0 ? ` (${mods.join('+')})` : '';
    lastClick.value = `${button} at (${x}, ${y})${modsStr}`;
  });

  // Handle mouse scroll
  useMouseScroll((direction, x, y) => {
    scrollCount.value += 1;
    lastScroll.value = `${direction} at (${x}, ${y})`;
  });

  return (
    <Box flexDirection="column" padding={1} borderStyle="round">
      <Text bold color="cyan">
        Mouse Tracking Demo
      </Text>
      <Text>───────────────────────</Text>
      <Text />
      <Text color="yellow">Click anywhere in the terminal</Text>
      <Text color="yellow">Scroll up/down to test scroll events</Text>
      <Text />
      <Text>
        Last Click: <Text color="green">{() => lastClick.value}</Text>
      </Text>
      <Text>
        Click Count: <Text color="green">{() => clickCount.value}</Text>
      </Text>
      <Text />
      <Text>
        Last Scroll: <Text color="magenta">{() => lastScroll.value}</Text>
      </Text>
      <Text>
        Scroll Count: <Text color="magenta">{() => scrollCount.value}</Text>
      </Text>
      <Text />
      <Text dim>Press 'q' or Ctrl+C to exit</Text>
    </Box>
  );
}

await renderToTerminalReactive(() => MouseDemo(), {
  fullscreen: true,
  mouse: true,
});
