/**
 * TUI Demo - Testing cross-platform architecture
 *
 * Demonstrates TUI rendering with the platform abstraction layer.
 * Now supports both TUI-specific components (Box, Text) and
 * @zen/runtime components (For, Show, Switch) thanks to platform ops!
 */

import { renderToTerminal, signal } from '@zen/tui';
import { Box } from '@zen/tui';
import { Text } from '@zen/tui';

function App() {
  const count = signal(0);

  return (
    <Box
      style={{
        width: 60,
        height: 15,
        padding: 2,
        borderStyle: 'round',
        borderColor: 'cyan',
      }}
    >
      <Text style={{ bold: true, color: 'green' }}>🎯 Zen TUI Demo</Text>

      <Box>
        <Text>Counter: </Text>
        <Text style={{ bold: true, color: 'yellow' }}>{count}</Text>
      </Box>

      <Box>
        <Text style={{ underline: true }}>Feature Test:</Text>
      </Box>

      <Box>
        <Text style={{ color: 'blue' }}>• Box component ✓</Text>
      </Box>

      <Box>
        <Text style={{ color: 'blue' }}>• Text styling ✓</Text>
      </Box>

      <Box>
        <Text style={{ color: 'blue' }}>• Signal integration ✓</Text>
      </Box>

      <Box>
        <Text style={{ dim: true, italic: true }}>Platform: Terminal UI</Text>
      </Box>
    </Box>
  );
}

// Render to terminal
renderToTerminal(<App />);
