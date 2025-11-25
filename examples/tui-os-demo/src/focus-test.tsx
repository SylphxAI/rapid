/** @jsxImportSource @zen/tui */
import { Box, FocusProvider, Text, renderApp, signal, useFocus, useInput } from '@zen/tui';

function TestList({ id, autoFocus = false }: { id: string; autoFocus?: boolean }) {
  const { isFocused } = useFocus({ id, autoFocus });
  const selectedIndex = signal(0);

  useInput(
    (_input, key) => {
      if (key.upArrow) {
        selectedIndex.value = Math.max(0, selectedIndex.value - 1);
        return true;
      }
      if (key.downArrow) {
        selectedIndex.value = Math.min(2, selectedIndex.value + 1);
        return true;
      }
      return false;
    },
    { isActive: isFocused },
  );

  const items = ['Option A', 'Option B', 'Option C'];
  const borderColor = () => (isFocused.value ? 'green' : 'gray');

  return (
    <Box flexDirection="column" borderStyle="single" borderColor={borderColor} padding={1}>
      <Text bold color={borderColor}>
        {id} {() => (isFocused.value ? '(FOCUSED)' : '')}
      </Text>
      <Box marginTop={1} flexDirection="column">
        {items.map((item, i) => (
          <Text key={item} color={() => (selectedIndex.value === i ? 'cyan' : 'white')}>
            {() => (selectedIndex.value === i ? '> ' : '  ')}
            {item}
          </Text>
        ))}
      </Box>
    </Box>
  );
}

function App() {
  return (
    <FocusProvider>
      <Box flexDirection="column" padding={1}>
        <Text bold>Focus Test - Press Tab to switch focus</Text>
        <Text dimColor>Arrow keys only work in focused (green) list</Text>
        <Text dimColor>Press q to quit</Text>

        <Box marginTop={1} gap={2}>
          <TestList id="List-1" autoFocus />
          <TestList id="List-2" />
        </Box>
      </Box>
    </FocusProvider>
  );
}

await renderApp(() => <App />, { fps: 10, fullscreen: false });
