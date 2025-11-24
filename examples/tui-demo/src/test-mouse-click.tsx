/** @jsxImportSource @zen/tui */
/**
 * Mouse Click Test
 *
 * Test hit testing and onClick handlers for Box/Text components.
 * Run with: bun run src/test-mouse-click.tsx
 */

import { signal } from '@zen/signal';
import { Box, type MouseClickEvent, Text, renderApp} from '@zen/tui';

function MouseClickTest() {
  const clickCount = signal(0);
  const lastClick = signal('None');
  const button1Clicks = signal(0);
  const button2Clicks = signal(0);
  const button3Clicks = signal(0);

  return (
    <Box style={{ flexDirection: 'column', padding: 1 }}>
      <Text style={{ bold: true, color: 'cyan' }}>Mouse Click Test</Text>
      <Text style={{ dim: true }}>Click on the buttons below!</Text>
      <Text> </Text>

      <Box style={{ flexDirection: 'row', gap: 2 }}>
        <Box
          style={{
            borderStyle: 'round', padding: 1, paddingX: 2, backgroundColor: 'blue'}}
          onClick={(e: MouseClickEvent) => {
            clickCount.value++;
            button1Clicks.value++;
            lastClick.value = `Button 1 at (${e.localX}, ${e.localY})`;
          }}
        >
          <Text style={{ color: 'white', bold: true }}>Button 1</Text>
          <Text style={{ color: 'white' }}>Clicks: {() => button1Clicks.value}</Text>
        </Box>

        <Box
          style={{
            borderStyle: 'round', padding: 1, paddingX: 2, backgroundColor: 'green'}}
          onClick={(e: MouseClickEvent) => {
            clickCount.value++;
            button2Clicks.value++;
            lastClick.value = `Button 2 at (${e.localX}, ${e.localY})`;
          }}
        >
          <Text style={{ color: 'white', bold: true }}>Button 2</Text>
          <Text style={{ color: 'white' }}>Clicks: {() => button2Clicks.value}</Text>
        </Box>

        <Box
          style={{
            borderStyle: 'round', padding: 1, paddingX: 2, backgroundColor: 'red'}}
          onClick={(e: MouseClickEvent) => {
            clickCount.value++;
            button3Clicks.value++;
            lastClick.value = `Button 3 at (${e.localX}, ${e.localY})`;
          }}
        >
          <Text style={{ color: 'white', bold: true }}>Button 3</Text>
          <Text style={{ color: 'white' }}>Clicks: {() => button3Clicks.value}</Text>
        </Box>
      </Box>

      <Text> </Text>
      <Text>Total clicks: {() => clickCount.value}</Text>
      <Text>Last click: {() => lastClick.value}</Text>
      <Text> </Text>
      <Text style={{ dim: true }}>Press 'q' to quit</Text>
    </Box>
  );
}

await renderApp(() => <MouseClickTest />, {
  fullscreen: false, mouse: true, // Enable mouse tracking
});
