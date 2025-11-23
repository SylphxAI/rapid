#!/usr/bin/env bun
/** @jsxImportSource @zen/tui */
/**
 * Demo: Wrong Pattern - Reactive Style with Static Children
 * This shows what BREAKS
 */

import { signal } from '@zen/signal';
import { Box, Text, renderToTerminalReactive } from '@zen/tui';

const count = signal(0);

function App() {
  // ❌ WRONG: Reactive style function + static children array
  // This is what we had in Radio/Tabs before
  return Box({
    style: {
      flexDirection: 'column' as const,
      padding: 1,
      // Reactive style function
      borderStyle: (() => (count.value > 5 ? 'round' : 'single')) as any,
      borderColor: (() => (count.value % 2 === 0 ? 'cyan' : 'magenta')) as any,
    },
    // Static children array - THIS IS THE PROBLEM
    children: [
      Text({ children: `Count: ${count.value}` }),
      Text({
        children: 'Press Space to increment',
        style: { marginTop: 1 },
        dim: true,
      }),
    ],
  });
}

await renderToTerminalReactive(
  () => App(),
  {
    fps: 10,
    onKeyPress: (key) => {
      if (key === ' ') {
        count.value++;
        console.log('Count:', count.value);
      }
    },
  },
);
