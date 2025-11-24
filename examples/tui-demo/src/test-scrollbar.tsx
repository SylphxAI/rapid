/** @jsxImportSource @zen/tui */
import { signal } from '@zen/signal';
import { Box, ScrollBox, Scrollbar, Text, renderApp} from '@zen/tui';

function ScrollbarDemo() {
  // Create scrollable content (30 lines)
  const items = Array.from({ length: 30 }, (_, i) => `Line ${i + 1}`);
  const viewportHeight = 8;

  // Shared scroll offset signal
  const scrollOffset = signal(0);

  return (
    <Box style={{ flexDirection: 'column', padding: 1 }}>
      <Text style={{ bold: true, color: 'cyan' }}>Scrollbar Demo</Text>
      <Text style={{ color: 'gray' }}>
        Use mouse wheel or arrow keys to scroll. Scrollbar shows position.
      </Text>
      <Text> </Text>

      {/* ScrollBox with Scrollbar side-by-side */}
      <Box style={{ flexDirection: 'row', gap: 1 }}>
        {/* Content area with ScrollBox */}
        <ScrollBox
          height={viewportHeight}
          scrollOffset={scrollOffset}
          contentHeight={items.length}
          style={{ borderStyle: 'single', width: 30 }}
        >
          <Box style={{ flexDirection: 'column' }}>
            {items.map((item) => (
              <Text key={item}>{item}</Text>
            ))}
          </Box>
        </ScrollBox>

        {/* Scrollbar indicator */}
        <Scrollbar
          scrollOffset={scrollOffset}
          contentHeight={items.length}
          viewportHeight={viewportHeight}
          thumbColor="cyan"
          trackColor="gray"
        />
      </Box>

      <Text> </Text>
      <Text style={{ color: 'gray', dim: true }}>
        Lines: {items.length} | Viewport: {viewportHeight} | Offset: {() => scrollOffset.value}
      </Text>
    </Box>
  );
}

await renderApp(() => <ScrollbarDemo />, {
  fullscreen: false, mouse: true});
