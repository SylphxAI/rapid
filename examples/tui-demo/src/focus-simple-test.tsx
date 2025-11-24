/** @jsxImportSource @zen/tui */
import { signal } from '@zen/signal';
import { FocusProvider, useFocus, useInput, renderApp} from '@zen/tui';
import { Box, Text } from '@zen/tui';

const keyLog = signal('No keys pressed yet');

const TestComponent = () => {
  const { isFocused } = useFocus({ id: 'test', autoFocus: true });

  useInput((input, _key) => {
    if (!isFocused.value) {
      return;
    }
    keyLog.value = `Key: "${input}" at ${new Date().toLocaleTimeString()}`;
  });

  return (
    <Box flexDirection="column">
      <Text bold>Focus Simple Test</Text>
      <Box marginTop={1}>
        <Text>Focus state: </Text>
        <Text color="yellow" bold>
          {() => (isFocused.value ? 'FOCUSED ✓' : 'not focused ✗')}
        </Text>
      </Box>
      <Box marginTop={1}>
        <Text>Last key: </Text>
        <Text color="cyan">{() => keyLog.value}</Text>
      </Box>
      <Box marginTop={1} dimColor>
        <Text>• Check console for debug output</Text>
      </Box>
      <Box dimColor>
        <Text>• Press any key to test</Text>
      </Box>
    </Box>
  );
};

const cleanup = await renderApp(() => (
  <FocusProvider>
    <TestComponent />
  </FocusProvider>
));

process.on('SIGINT', () => {
  cleanup();
  process.exit(0);
});
