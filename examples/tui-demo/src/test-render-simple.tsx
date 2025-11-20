/**
 * Test simple render to debug white page issue
 */

import { Box, Text, renderToTerminal } from '@zen/tui';

const tree = (
  <Box style={{ padding: 1 }}>
    <Text color="cyan">Hello World!</Text>
    <Text>This is a test.</Text>
  </Box>
);
const _output = renderToTerminal(tree);
