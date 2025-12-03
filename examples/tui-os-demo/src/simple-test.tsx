import { executeDescriptor, isDescriptor } from '@rapid/runtime';
import { Box, Text, render } from '@rapid/tui';

const Demo = () => (
  <Box flexDirection="column" padding={1}>
    <Text color="cyan" bold>
      🍎 ZenOS Test
    </Text>
    <Text color="green">This should render!</Text>
  </Box>
);

import type { TUINode } from '@rapid/tui';

// Execute descriptor to get TUINode
let node: TUINode | ReturnType<typeof Demo> = <Demo />;
if (isDescriptor(node)) {
  node = executeDescriptor(node);
}

const _output = render(node);
