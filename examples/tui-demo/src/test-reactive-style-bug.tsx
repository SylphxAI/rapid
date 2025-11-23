#!/usr/bin/env bun
/** @jsxImportSource @zen/tui */
/**
 * Demo: Reactive Style Functions Bug
 *
 * This demonstrates WHY reactive style functions break rendering.
 */

import { signal } from '@zen/signal';
import { Box, FocusProvider, Text, renderToTerminalReactive } from '@zen/tui';

const count = signal(0);
const isFocused = signal(true);

// ❌ WRONG VERSION: Reactive style functions
function WrongVersion() {
  return (
    <Box
      style={{
        flexDirection: 'column',
        padding: 1,
        // ❌ BAD: Reactive functions in style
        borderStyle: () => (isFocused.value ? 'round' : 'single'),
        borderColor: () => (count.value % 2 === 0 ? 'cyan' : 'magenta'),
      }}
    >
      {/* Static children - won't update properly */}
      <Text>Count: {count.value}</Text>
      <Text>Focused: {isFocused.value ? 'Yes' : 'No'}</Text>
      <Text dim style={{ marginTop: 1 }}>
        Press Space to increment • F to toggle focus
      </Text>
    </Box>
  );
}

// ✅ CORRECT VERSION: Reactive children function
function CorrectVersion() {
  return (
    <Box
      style={{
        flexDirection: 'column',
        padding: 1,
        // ✅ GOOD: Static styles
        borderStyle: 'round',
        borderColor: 'cyan',
      }}
    >
      {/* ✅ GOOD: Reactive children function */}
      {() => (
        <>
          <Text color={count.value % 2 === 0 ? 'cyan' : 'magenta'} bold>
            Count: {count.value}
          </Text>
          <Text color={isFocused.value ? 'green' : 'red'}>
            Focused: {isFocused.value ? 'Yes' : 'No'}
          </Text>
          <Text dim style={{ marginTop: 1 }}>
            Press Space to increment • F to toggle focus
          </Text>
        </>
      )}
    </Box>
  );
}

const showWrong = signal(true);

function App() {
  return (
    <Box style={{ flexDirection: 'column', padding: 1 }}>
      <Text bold color="yellow" style={{ marginBottom: 1 }}>
        Reactive Style Bug Demo - Press W to switch versions
      </Text>

      {() => (
        <>
          <Text color="red" style={{ marginBottom: 1 }}>
            Currently showing: {showWrong.value ? '❌ WRONG VERSION' : '✅ CORRECT VERSION'}
          </Text>

          {showWrong.value ? <WrongVersion /> : <CorrectVersion />}
        </>
      )}
    </Box>
  );
}

await renderToTerminalReactive(
  () => (
    <FocusProvider>
      <App />
    </FocusProvider>
  ),
  {
    fps: 10,
    onKeyPress: (key) => {
      if (key === ' ') {
        count.value++;
      } else if (key === 'f' || key === 'F') {
        isFocused.value = !isFocused.value;
      } else if (key === 'w' || key === 'W') {
        showWrong.value = !showWrong.value;
      }
    },
  },
);
