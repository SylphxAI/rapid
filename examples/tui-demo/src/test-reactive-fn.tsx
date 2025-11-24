/** @jsxImportSource @zen/tui */
/**
 * Test Reactive Function Rendering (like questionnaire)
 */

import { signal, renderApp} from '@zen/tui';
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
        }
        return <Text>Showing B</Text>;
      }}
    </Box>
  );
}

await renderApp(() => App(), { fps: 10 });
