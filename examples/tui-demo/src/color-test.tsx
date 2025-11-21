import { Box, Text, renderToTerminal } from '@zen/tui';

const Demo = () => (
  <Box style={{ padding: 1 }}>
    <Text color="cyan" bold>
      Cyan Bold Text
    </Text>
    <Text color="green">Green Text</Text>
    <Text color="yellow">Yellow Text</Text>
    <Text color="red" dim>
      Red Dim Text
    </Text>
  </Box>
);

await renderToTerminal(<Demo />);
