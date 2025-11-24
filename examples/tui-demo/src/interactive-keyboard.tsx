/**
 * Interactive Demo with Keyboard Support
 *
 * Demonstrates useInput hook for Tab navigation and button activation
 */

import {
  Box, Button, FocusProvider, Text, handleButton, signal, useFocusManager, useInput, renderApp} from '@zen/tui';

// State
const count = signal(0);
const message = signal('Press Tab to navigate, Enter/Space to activate');

function AppContent() {
  const { focusNext, focusPrev, focusedId } = useFocusManager();

  // Handle keyboard input
  useInput((input, key) => {
    // Tab navigation
    if (key.tab) {
      if (key.shift) {
        focusPrev();
      } else {
        focusNext();
      }
      return;
    }

    // Button activation (Enter or Space)
    if (key.return || input === ' ') {
      const focused = focusedId.value;

      if (focused === 'increment') {
        count.value++;
        message.value = `Incremented! Count: ${count.value}`;
      } else if (focused === 'decrement') {
        count.value--;
        message.value = `Decremented! Count: ${count.value}`;
      } else if (focused === 'reset') {
        count.value = 0;
        message.value = 'Reset to 0!';
      }
    }
  });

  return (
    <Box
      style={{
        flexDirection: 'column', padding: 2, borderStyle: 'double', borderColor: 'cyan', width: 60, gap: 1}}
    >
      {/* Header */}
      <Text color="cyan" bold={true}>
        Keyboard Navigation Demo
      </Text>
      <Text color="gray">{message}</Text>

      <Box style={{ height: 1 }} />

      {/* Counter Display */}
      <Box
        style={{
          borderStyle: 'single', padding: 1, justifyContent: 'center'}}
      >
        <Text color="yellow" bold={true}>
          Count: {() => count.value}
        </Text>
      </Box>

      <Box style={{ height: 1 }} />

      {/* Buttons */}
      <Box style={{ flexDirection: 'row', gap: 2, justifyContent: 'center' }}>
        <Button id="increment" label="+" variant="primary" width={10} />
        <Button id="decrement" label="-" variant="secondary" width={10} />
        <Button id="reset" label="Reset" variant="danger" width={12} />
      </Box>

      <Box style={{ height: 1 }} />

      {/* Instructions */}
      <Text color="gray">Tab: Navigate | Enter/Space: Activate | Ctrl+C: Exit</Text>
    </Box>
  );
}

function App() {
  return (
    <FocusProvider>
      <AppContent />
    </FocusProvider>
  );
}

renderToTerminalReactive(App, { fps: 30 });
