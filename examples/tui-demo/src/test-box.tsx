/**
 * Test Box rendering
 */

import { Box, Text, renderToTerminalReactive } from '@zen/tui';

function App() {
  return (
    <Box flexDirection="column">
      <Text color="cyan">Line 1</Text>
      <Text color="yellow">Line 2</Text>
    </Box>
  );
}

await renderToTerminalReactive(() => <App />);

// Keep alive
await new Promise(() => {});
