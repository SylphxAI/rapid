/** @jsxImportSource @rapid/tui */
/**
 * Simplified window test without emoji
 */

import { Box, FullscreenLayout, Text, renderApp, useInput, useTerminalSize } from '@rapid/tui';

function App() {
  const { width, height } = useTerminalSize();

  useInput((_input, key) => {
    if (key.escape) process.exit(0);
  });

  return (
    <FullscreenLayout>
      <Box style={{ flexDirection: 'column', width, height }}>
        <Text style={{ bold: true }}>Simple Window Test - ESC to exit</Text>

        <Box style={{ position: 'relative', flex: 1 }}>
          {/* Window without emoji */}
          <Box
            style={{
              position: 'absolute',
              left: 5,
              top: 2,
              width: 50,
              height: 10,
              flexDirection: 'column',
              borderStyle: 'single',
              borderColor: 'cyan',
            }}
          >
            {/* Title bar */}
            <Box
              style={{
                backgroundColor: 'blue',
                paddingLeft: 1,
                paddingRight: 1,
                justifyContent: 'space-between',
                flexDirection: 'row',
              }}
            >
              <Text style={{ color: 'white', bold: true }}>Terminal</Text>
              <Text style={{ color: 'red' }}>X</Text>
            </Box>

            {/* Content */}
            <Box style={{ padding: 1, flex: 1 }}>
              <Box style={{ flexDirection: 'column' }}>
                <Text style={{ color: 'green' }}>Line 1: Hello World</Text>
                <Text style={{ color: 'cyan' }}>Line 2: ABCDEFGHIJKLMNOPQRSTUVWXYZ</Text>
                <Text style={{ color: 'yellow' }}>Line 3: 0123456789</Text>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    </FullscreenLayout>
  );
}

await renderApp(() => <App />);
