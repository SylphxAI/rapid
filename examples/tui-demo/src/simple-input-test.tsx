import { signal } from '@zen/signal';
import { renderApp} from '@zen/tui';
import { Box, FocusProvider, Text, TextInput } from '@zen/tui';

const name = signal('');

const SimpleInputTest = () => {
  return (
    <Box style={{ flexDirection: 'column', gap: 1 }}>
      <Text bold color="cyan">
        Simple Input Test
      </Text>
      <Text>Type something in the input below:</Text>

      <TextInput
        id="test-input"
        value={name}
        placeholder="Type here..."
        width={40}
        onChange={(value) => {
          name.value = value;
        }}
      />

      <Text>Current value: {() => name.value || '(empty)'}</Text>
      <Text dim>Press Ctrl+C to exit</Text>
    </Box>
  );
};

await renderApp(() => (
  <FocusProvider>
    <SimpleInputTest />
  </FocusProvider>
));
