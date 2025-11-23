/**
 * Test Box rendering with interval
 */

import { Box, Text, renderToTerminalReactive } from '@zen/tui';
import { signal } from '@zen/signal';

function App() {
  const counter = signal(0);

  setInterval(() => {
    counter.value += 1;
  }, 1000);

  return (
    <Box flexDirection="column" padding={1}>
      <Text color="cyan">Counter: {() => counter.value}</Text>
      <Text color="yellow">Press q to quit</Text>
    </Box>
  );
}

await renderToTerminalReactive(() => <App />);
