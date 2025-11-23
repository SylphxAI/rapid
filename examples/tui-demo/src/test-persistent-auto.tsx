#!/usr/bin/env bun
/** @jsxImportSource @zen/tui */
/**
 * Test Persistent Renderer - Auto Increment
 *
 * Auto-increments to test reactive updates without keyboard input.
 */

import { signal } from '@zen/signal';
import { Box, Text, renderToTerminalPersistent } from '@zen/tui';

const count = signal(0);

// Auto increment every 500ms
setInterval(() => {
  count.value++;
  if (count.value > 5) {
    process.exit(0); // Exit after 5 updates
  }
}, 500);

function App() {
  return Box({
    style: {
      flexDirection: 'column' as const,
      padding: 1,
    },
    children: [
      Text({
        children: 'Persistent Renderer Auto Test',
        bold: true,
        color: 'cyan',
      }),
      Text({
        children: () => `Count: ${count.value}`, // Reactive text
        color: () => (count.value % 2 === 0 ? 'green' : 'magenta'),
      }),
      Text({
        children: 'Auto-incrementing every 500ms...',
        dim: true,
        style: { marginTop: 1 },
      }),
    ],
  });
}

await renderToTerminalPersistent(() => App(), {
  fps: 10,
});
