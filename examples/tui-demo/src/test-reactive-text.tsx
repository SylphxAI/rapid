/** @jsxImportSource @zen/tui */
/**
 * Simple reactive text test - no Markdown, no Dynamic
 */

import { effect, signal } from '@zen/signal';
import { Box, FocusProvider, Text, TextInput, renderApp, FullscreenLayout} from '@zen/tui';

function TestApp() {
  const inputValue = signal('');
  const messages = signal<string[]>(['Welcome! Type a message and press Enter.']);

  effect(() => {});

  const handleSubmit = (value: string) => {
    if (value.trim()) {
      messages.value = [...messages.value, `You: ${value}`];
    }
    inputValue.value = '';
  };

  return (
    <FocusProvider>
      <Box style={{ flexDirection: 'column', padding: 1, width: 60 }}>
        <Text style={{ bold: true, color: 'cyan' }}>Simple Reactive Test</Text>

        <Box
          style={{
            flexDirection: 'column', borderStyle: 'single', borderColor: 'cyan', padding: 1, height: 10, marginTop: 1}}
        >
          {/* Render messages using inline reactive function */}
          {() => messages.value.map((msg, i) => <Text key={i}>{msg}</Text>)}
        </Box>

        <Box style={{ marginTop: 1 }}>
          <TextInput
            id="input"
            value={inputValue}
            placeholder="Type here..."
            onChange={(v) => {
              inputValue.value = v;
            }}
            onSubmit={handleSubmit}
            width={58}
          />
        </Box>

        <Text style={{ dim: true, marginTop: 1 }}>Ctrl+C to exit</Text>
      </Box>
    </FocusProvider>
  );
}
await renderApp(() => (
  <FullscreenLayout>
    <TestApp />
  </FullscreenLayout>
));
