/** @jsxImportSource @zen/tui */
/**
 * Minimal TUI Test - Fullscreen
 */

import { renderToTerminalReactive } from '@zen/tui';
import { Box, Text } from '@zen/tui';

function App() {
  return (
    <Box style={{ width: 30, height: 5, padding: 1 }}>
      <Text>Hello Fullscreen!</Text>
    </Box>
  );
}

await renderToTerminalReactive(() => App(), { fps: 10, fullscreen: true });
