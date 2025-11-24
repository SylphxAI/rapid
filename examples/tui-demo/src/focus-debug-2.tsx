import { onMount } from '@zen/runtime';
/** @jsxImportSource @zen/tui */
import { signal } from '@zen/signal';
import { FocusProvider, useFocus, useInput, renderApp} from '@zen/tui';
import { Box, Text } from '@zen/tui';

const log = signal<string[]>([]);

function addLog(msg: string) {
  log.value = [...log.value, msg];
}

const TestComponent = () => {
  addLog('[TestComponent] Rendering...');

  const focusResult = useFocus({ id: 'test', autoFocus: true });
  addLog(`[TestComponent] useFocus returned: ${JSON.stringify(Object.keys(focusResult))}`);

  const { isFocused } = focusResult;
  addLog(`[TestComponent] isFocused type: ${typeof isFocused}`);
  addLog(`[TestComponent] isFocused.value: ${isFocused.value}`);

  onMount(() => {
    addLog('[onMount] Running...');
    addLog(`[onMount] isFocused.value: ${isFocused.value}`);
  });

  useInput((input, _key) => {
    addLog(`[useInput] input: "${input}", isFocused.value: ${isFocused.value}`);

    if (!isFocused.value) {
      addLog('[useInput] Blocked by focus check');
      return;
    }

    addLog('[useInput] Passed focus check!');
  });

  return (
    <Box flexDirection="column">
      <Text bold>Focus Debug 2</Text>
      <Box marginTop={1}>
        <Text>isFocused.value: </Text>
        <Text color="yellow">{() => String(isFocused.value)}</Text>
      </Box>
      <Box marginTop={1} flexDirection="column">
        {() =>
          log.value.slice(-10).map((msg) => (
            <Text key={msg} dim>
              {msg}
            </Text>
          ))
        }
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
