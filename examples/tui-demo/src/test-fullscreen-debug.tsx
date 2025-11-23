/**
 * Full-Screen Mode Debug
 */

import { signal } from '@zen/signal';
import { Box, Text, renderToTerminalReactive } from '@zen/tui';

console.log('Starting fullscreen app...');

function FullScreenApp() {
  console.log('FullScreenApp component called');
  const counter = signal(0);

  // Increment counter every second
  setInterval(() => {
    console.log('Counter incrementing:', counter.value + 1);
    counter.value += 1;
  }, 1000);

  console.log('Returning JSX');
  return (
    <Box flexDirection="column" padding={1} borderStyle="double">
      <Text bold color="cyan">
        Full-Screen TUI Demo
      </Text>
      <Text>─────────────────────</Text>
      <Text>This app runs in alternate screen buffer mode.</Text>
      <Text>When you quit, terminal returns to previous state.</Text>
      <Text />
      <Text color="yellow">Counter: {() => counter.value}</Text>
      <Text />
      <Text dim>Press 'q' or Ctrl+C to exit</Text>
    </Box>
  );
}

console.log('Calling renderToTerminalReactive...');
await renderToTerminalReactive(() => <FullScreenApp />, { fullscreen: true });
console.log('renderToTerminalReactive returned');
