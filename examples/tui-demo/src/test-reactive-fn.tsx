/** @jsxImportSource @zen/tui */
/**
 * Test Reactive Function Rendering (like questionnaire)
 */

import { renderToTerminalReactive, signal } from '@zen/tui';
import { Box, Text } from '@zen/tui';

const showA = signal(true);

// Toggle every 2 seconds
setInterval(() => {
  showA.value = !showA.value;
}, 2000);

function App() {
  return (
    <Box style={{ width: 30, height: 7, padding: 1 }}>
      {() => {
        if (showA.value) {
          return <Text>Showing A</Text>;
        } else {
          return <Text>Showing B</Text>;
        }
      }}
    </Box>
  );
}

await renderToTerminalReactive(() => App(), { fps: 10 });
