/** @jsxImportSource @zen/tui */
/**
 * Simple reactive test - no complex components
 */

import { effect, signal } from '@zen/signal';
import { Box, FocusProvider, Text, TextInput, useInput, renderApp, FullscreenLayout} from '@zen/tui';

function TestApp() {
  const inputValue = signal('');
  const displayText = signal('Initial text');
  const counter = signal(0);

  // Debug: log when displayText changes
  effect(() => {});

  // Debug: log when counter changes
  effect(() => {});

  const handleSubmit = (value: string) => {
    counter.value++;
    displayText.value = `Submitted: ${value} (count: ${counter.value})`;
    inputValue.value = '';
  };

  const handleChange = (value: string) => {
    inputValue.value = value;
  };

  // Also listen for Enter key directly
  useInput((_input, key) => {
    if (key.return) {
    }
  });

  return (
    <FocusProvider>
      <Box style={{ flexDirection: 'column', padding: 1 }}>
        <Text style={{ bold: true, color: 'cyan' }}>Reactive Test</Text>

        <Box style={{ marginTop: 1 }}>
          <Text>Counter: </Text>
          <Text style={{ color: 'yellow' }}>{() => String(counter.value)}</Text>
        </Box>

        <Box
          style={{
            borderStyle: 'single', borderColor: 'gray', padding: 1, width: 50, marginTop: 1}}
        >
          <Text>{() => displayText.value}</Text>
        </Box>

        <Box style={{ marginTop: 1 }}>
          <TextInput
            id="test-input"
            value={inputValue}
            placeholder="Type and press Enter..."
            onChange={handleChange}
            onSubmit={handleSubmit}
            width={50}
          />
        </Box>

        <Text style={{ dim: true, marginTop: 1 }}>Press Enter to submit, Ctrl+C to exit</Text>
      </Box>
    </FocusProvider>
  );
}
await renderApp(() => (
  <FullscreenLayout>
    <TestApp />
  </FullscreenLayout>
));
