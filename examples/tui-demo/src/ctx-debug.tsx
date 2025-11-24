import { createContext, useContext } from '@zen/runtime';
/** @jsxImportSource @zen/tui */
import { signal } from '@zen/signal';
import { FocusProvider, useFocusManager, renderApp} from '@zen/tui';
import { Box, Text } from '@zen/tui';

const log = signal<string[]>([]);

function addLog(msg: string) {
  log.value = [...log.value, msg];
}

// Try to access the focus context directly
const _FocusContext = createContext(null);

const TestComponent = () => {
  addLog('[TestComponent] Starting...');

  try {
    const manager = useFocusManager();
    addLog('[TestComponent] useFocusManager success!');
    addLog(`[TestComponent] manager keys: ${Object.keys(manager).join(', ')}`);
  } catch (error) {
    addLog(`[TestComponent] useFocusManager ERROR: ${error.message}`);
  }

  return (
    <Box flexDirection="column">
      <Text bold>Context Debug</Text>
      {() =>
        log.value.slice(-10).map((msg) => (
          <Text key={msg} dim>
            {msg}
          </Text>
        ))
      }
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
