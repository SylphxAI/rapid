#!/usr/bin/env bun
/** @jsxImportSource @zen/tui */
/**
 * Demo: Stale Closure Bug - The REAL Problem
 *
 * This shows the ACTUAL bug we had in Radio/Tabs.
 */

import { signal } from '@zen/signal';
import { Box, Text, renderToTerminalReactive } from '@zen/tui';

const count = signal(0);

function WrongVersion() {
  // ❌ WRONG: Create nodes ONCE with reactive functions
  // This creates STALE CLOSURES
  const textNode = Text({
    children: () => `Count: ${count.value}`,  // Reactive function
    color: () => (count.value % 2 === 0 ? 'cyan' : 'magenta'),  // Reactive function
    bold: true,
  });

  const hintNode = Text({
    children: 'Press Space to increment - THIS WON\'T UPDATE!',
    dim: true,
    style: { marginTop: 1 },
  });

  // Static array created once
  const staticChildren = [textNode, hintNode];

  return Box({
    style: {
      flexDirection: 'column' as const,
      padding: 1,
      borderStyle: 'round',
      borderColor: 'red',
    },
    children: staticChildren,  // ❌ Static array with stale closures
  });
}

function CorrectVersion() {
  // ✅ CORRECT: Create nodes FRESH on each render via function
  return Box({
    style: {
      flexDirection: 'column' as const,
      padding: 1,
      borderStyle: 'round',
      borderColor: 'green',
    },
    children: () => {
      // Fresh nodes created on each render
      return [
        Text({
          children: `Count: ${count.value}`,  // Direct value read
          color: count.value % 2 === 0 ? 'cyan' : 'magenta',
          bold: true,
        }),
        Text({
          children: 'Press Space to increment - THIS UPDATES!',
          dim: true,
          style: { marginTop: 1 },
        }),
      ];
    },
  });
}

const showWrong = signal(true);

function App() {
  return Box({
    style: {
      flexDirection: 'column' as const,
      padding: 1,
    },
    children: () => [
      Text({
        children: 'Stale Closure Bug Demo - Press W to switch versions',
        bold: true,
        color: 'yellow',
        style: { marginBottom: 1 },
      }),
      Text({
        children: showWrong.value ? '❌ WRONG VERSION (Stale Closures)' : '✅ CORRECT VERSION (Fresh Nodes)',
        color: showWrong.value ? 'red' : 'green',
        style: { marginBottom: 1 },
      }),
      showWrong.value ? WrongVersion() : CorrectVersion(),
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
      } else if (key === 'w' || key === 'W') {
        showWrong.value = !showWrong.value;
      }
    },
  },
);
