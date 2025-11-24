/** @jsxImportSource @zen/tui */
/**
 * Toast/Notification Test
 *
 * Test toast notifications with auto-dismiss.
 * Run with: bun run src/test-toast.tsx
 */

import { signal } from '@zen/signal';
import { Box, Text, ToastContainer, toast, useInput, renderApp, FullscreenLayout} from '@zen/tui';

function ToastTest() {
  const count = signal(0);

  // Keyboard shortcuts to trigger toasts
  useInput((input, _key) => {
    if (input === '1') {
      count.value++;
      toast.success(`Success message #${count.value}`);
    }
    if (input === '2') {
      count.value++;
      toast.error(`Error message #${count.value}`);
    }
    if (input === '3') {
      count.value++;
      toast.warning(`Warning message #${count.value}`);
    }
    if (input === '4') {
      count.value++;
      toast.info(`Info message #${count.value}`);
    }
    if (input === 'c' || input === 'C') {
      toast.dismissAll();
    }
  });

  return (
    <Box style={{ flexDirection: 'column', padding: 1 }}>
      <Text style={{ bold: true, color: 'cyan' }}>Toast Notification Test</Text>
      <Text> </Text>
      <Text>Press keys to show toasts:</Text>
      <Text> [1] Success toast</Text>
      <Text> [2] Error toast</Text>
      <Text> [3] Warning toast</Text>
      <Text> [4] Info toast</Text>
      <Text> [C] Clear all toasts</Text>
      <Text> </Text>
      <Text>Toasts shown: {() => count.value}</Text>
      <Text> </Text>
      <Text style={{ dim: true }}>Press 'q' to quit</Text>

      <ToastContainer position="top-right" />
    </Box>
  );
}

await renderApp(() => (
  <FullscreenLayout>
    <ToastTest />
  </FullscreenLayout>
));
