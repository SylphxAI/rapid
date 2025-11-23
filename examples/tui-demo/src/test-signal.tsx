/** @jsxImportSource @zen/tui */
/**
 * Test Signal Rendering
 */

import { renderToTerminalReactive, signal } from '@zen/tui';
import { Box, Text } from '@zen/tui';

const count = signal(0);

// Update every second
setInterval(() => {
  count.value++;
}, 1000);

function App() {
  return (
    <Box style={{ width: 30, height: 5, padding: 1 }}>
      <Text>Count: {count}</Text>
    </Box>
  );
}

await renderToTerminalReactive(() => App(), { fps: 10 });
