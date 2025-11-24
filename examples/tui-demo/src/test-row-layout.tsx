/** @jsxImportSource @zen/tui */
/**
 * Row Layout Debug
 *
 * Test row layout rendering
 */

import { Box, Text, renderApp} from '@zen/tui';

function RowLayoutTest() {
  return (
    <Box style={{ flexDirection: 'column', padding: 1 }}>
      <Text style={{ bold: true }}>Row Layout Test</Text>
      <Text> </Text>

      {/* Simple row */}
      <Text>Test 1: Simple row</Text>
      <Box style={{ flexDirection: 'row' }}>
        <Text>AAA</Text>
        <Text>BBB</Text>
        <Text>CCC</Text>
      </Box>
      <Text> </Text>

      {/* Row with colors */}
      <Text>Test 2: Row with colors</Text>
      <Box style={{ flexDirection: 'row' }}>
        <Text style={{ color: 'red' }}>RED</Text>
        <Text style={{ color: 'green' }}>GREEN</Text>
        <Text style={{ color: 'blue' }}>BLUE</Text>
      </Box>
      <Text> </Text>

      {/* Row with longer text */}
      <Text>Test 3: Longer text</Text>
      <Box style={{ flexDirection: 'row' }}>
        <Text>Label: </Text>
        <Text style={{ color: 'cyan' }}>Value</Text>
      </Box>
      <Text> </Text>

      {/* Row with gap */}
      <Text>Test 4: Row with gap</Text>
      <Box style={{ flexDirection: 'row', gap: 2 }}>
        <Text>[A]</Text>
        <Text>[B]</Text>
        <Text>[C]</Text>
      </Box>

      <Text> </Text>
      <Text style={{ dim: true }}>Press q to quit</Text>
    </Box>
  );
}

await renderApp(() => <RowLayoutTest />, {
  fullscreen: false});
