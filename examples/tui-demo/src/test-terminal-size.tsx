/** @jsxImportSource @zen/tui */
/**
 * Terminal Size Demo
 *
 * Demonstrates useTerminalSize and useTerminalResize hooks.
 * Try resizing your terminal window to see the values update!
 */

import { signal } from '@zen/signal';
import { Box, Text, useTerminalResize, useTerminalSize, renderApp, FullscreenLayout} from '@zen/tui';

function TerminalSizeDemo() {
  const { width, height } = useTerminalSize();
  const resizeCount = signal(0);
  const lastResize = signal('Never');

  // Track resize events
  useTerminalResize((w, h) => {
    resizeCount.value += 1;
    lastResize.value = `${w}x${h} at ${new Date().toLocaleTimeString()}`;
  });

  return (
    <Box style={{ flexDirection: 'column', padding: 1, borderStyle: 'round' }}>
      <Text style={{ bold: true, color: 'cyan' }}>Terminal Size Demo</Text>
      <Text style={{ dim: true }}>Resize your terminal window to see updates!</Text>
      <Text> </Text>

      <Box style={{ flexDirection: 'row' }}>
        <Text style={{ color: 'yellow' }}>Current Size: </Text>
        <Text style={{ color: 'green', bold: true }}>{() => width}</Text>
        <Text style={{ color: 'white' }}> x </Text>
        <Text style={{ color: 'green', bold: true }}>{() => height}</Text>
      </Box>

      <Text> </Text>
      <Text style={{ color: 'gray' }}>Resize Events: {() => resizeCount.value}</Text>
      <Text style={{ color: 'gray' }}>Last Resize: {() => lastResize.value}</Text>
      <Text> </Text>

      <Text style={{ dim: true }}>Press 'q' to quit</Text>
    </Box>
  );
}

await renderApp(() => (
  <FullscreenLayout>
    <TerminalSizeDemo />
  </FullscreenLayout>
));
