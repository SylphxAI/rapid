#!/usr/bin/env bun
/** @jsxImportSource @zen/tui */
/**
 * Test Persistent Renderer - New Architecture
 *
 * This tests the new fine-grained persistent rendering system.
 * Should support natural children syntax without workarounds.
 */

import { signal } from '@zen/signal';
import { Box, Text, renderToTerminalPersistent } from '@zen/tui';

const count = signal(0);

function App() {
  // ✅ Natural syntax - children as static array
  // No need for `children: () => [...]` workaround
  return Box({
    style: {
      flexDirection: 'column' as const,
      padding: 1,
    },
    children: [
      Text({
        children: 'Persistent Renderer Test',
        bold: true,
        color: 'cyan',
      }),
      Text({
        children: () => `Count: ${count.value}`, // Reactive text
        color: () => (count.value % 2 === 0 ? 'green' : 'magenta'),
      }),
      Text({
        children: 'Press Space to increment • Ctrl+C to exit',
        dim: true,
        style: { marginTop: 1 },
      }),
    ],
  });
}

await renderToTerminalPersistent(() => App(), {
  fps: 10,
  onKeyPress: (key) => {
    if (key === ' ') {
      count.value++;
      console.log('Count:', count.value);
    }
  },
});
