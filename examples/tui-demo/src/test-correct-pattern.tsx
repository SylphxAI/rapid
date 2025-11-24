#!/usr/bin/env bun
/** @jsxImportSource @zen/tui */
/**
 * Demo: Correct Pattern - Static Style with Reactive Children
 * This shows what WORKS
 */

import { signal } from '@zen/signal';
import { Box, Text, renderApp} from '@zen/tui';

const count = signal(0);

function App() {
  // ✅ CORRECT: Static style + reactive children function
  return Box({
    style: {
      flexDirection: 'column' as const, padding: 1, // Static style values
      borderStyle: 'round', borderColor: 'cyan'}, // Reactive children function - THIS IS KEY
    children: () => {
      // Read signals inside the function
      const currentCount = count.value;

      return [
        Text({
          children: `Count: ${currentCount}`, color: currentCount % 2 === 0 ? 'cyan' : 'magenta', bold: true}), Text({
          children: 'Press Space to increment - Watch the count update!', style: { marginTop: 1 }, dim: true}), ];
    }});
}

await renderApp(() => App(), {
  fps: 10, onKeyPress: (key) => {
    if (key === ' ') {
      count.value++;
    }
  }});
