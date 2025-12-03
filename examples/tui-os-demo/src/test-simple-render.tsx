/** @jsxImportSource @rapid/tui */
/**
 * Simple render test - non-interactive, just renders once
 */

import { Box, Text, render } from '@rapid/tui';

const _output = render(
  <Box style={{ width: 60, height: 15, flexDirection: 'column' }}>
    <Text style={{ bold: true }}>Simple Window Test</Text>

    <Box
      style={{
        width: 50,
        height: 10,
        flexDirection: 'column',
        borderStyle: 'single',
        borderColor: 'cyan',
      }}
    >
      {/* Title bar */}
      <Box
        style={{
          backgroundColor: 'blue',
          paddingLeft: 1,
          paddingRight: 1,
          justifyContent: 'space-between',
          flexDirection: 'row',
        }}
      >
        <Text style={{ color: 'white', bold: true }}>Terminal</Text>
        <Text style={{ color: 'red' }}>X</Text>
      </Box>

      {/* Content */}
      <Box style={{ padding: 1, flex: 1 }}>
        <Box style={{ flexDirection: 'column' }}>
          <Text style={{ color: 'green' }}>Line 1: Hello World</Text>
          <Text style={{ color: 'cyan' }}>Line 2: Test</Text>
        </Box>
      </Box>
    </Box>
  </Box>,
);
