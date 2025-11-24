/** @jsxImportSource @zen/tui */
import { signal } from '@zen/signal';
import { Box, ScrollBox, Scrollbar, Text, renderApp} from '@zen/tui';

function ScrollbarCorrectDemo() {
  const items = Array.from({ length: 30 }, (_, i) => `Line ${i + 1}`);
  const viewportHeight = 8;
  const scrollOffset = signal(0);

  return (
    <Box style={{ flexDirection: 'column', padding: 1 }}>
      <Text style={{ bold: true, color: 'cyan' }}>Scrollbar Correct Design</Text>
      <Text style={{ color: 'gray' }}>外層 Box 有 border 包住兩個組件</Text>
      <Text> </Text>

      {/* 外層 Box 有 border，包住 ScrollBox + Scrollbar */}
      <Box
        style={{
          borderStyle: 'single', width: 32, height: viewportHeight, flexDirection: 'row'  // 直接用 row layout
        }}
      >
        {/* ScrollBox 無 border */}
        <ScrollBox
          height={viewportHeight - 2}  // 減去 border (top + bottom)
          scrollOffset={scrollOffset}
          contentHeight={items.length}
          style={{ width: 30 }}  // 無 border
        >
          <Box style={{ flexDirection: 'column' }}>
            {items.map((item) => (
              <Text key={item}>{item}</Text>
            ))}
          </Box>
        </ScrollBox>

        {/* Scrollbar 喺右邊 */}
        <Scrollbar
          scrollOffset={scrollOffset}
          contentHeight={items.length}
          viewportHeight={viewportHeight - 2}
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

await renderApp(() => <ScrollbarCorrectDemo />, {
  fullscreen: false, mouse: true});
