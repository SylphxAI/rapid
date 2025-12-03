/**
 * About App - System information
 */

import { Box, Spinner, Text } from '@rapid/tui';

export function About() {
  return (
    <Box flexDirection="column" gap={1} alignItems="center" padding={1}>
      {/* Logo */}
      <Box flexDirection="column" alignItems="center">
        <Text color="cyan" bold>
          ███████╗███████╗███╗ ██╗
        </Text>
        <Text color="cyan" bold>
          ╚══███╔╝██╔════╝████╗ ██║
        </Text>
        <Text color="cyan" bold>
          {'  '}███╔╝ █████╗ ██╔██╗ ██║
        </Text>
        <Text color="cyan" bold>
          {' '}
          ███╔╝ ██╔══╝ ██║╚██╗██║
        </Text>
        <Text color="cyan" bold>
          ███████╗███████╗██║ ╚████║
        </Text>
        <Text color="cyan" bold>
          ╚══════╝╚══════╝╚═╝ ╚═══╝
        </Text>
      </Box>

      <Box height={1} />

      <Text color="white" bold>
        ZenOS
      </Text>
      <Text color="gray">Version 1.0.0</Text>

      <Box height={1} />

      <Box flexDirection="column" gap={0}>
        <Text color="white">
          A terminal UI demo built with <Text color="cyan">@rapid/tui</Text>
        </Text>
        <Text color="gray">Powered by fine-grained reactivity</Text>
      </Box>

      <Box height={1} />

      <Box flexDirection="column" alignItems="center">
        <Text color="yellow">Features:</Text>
        <Text color="white">• Draggable windows</Text>
        <Text color="white">• Multiple apps</Text>
        <Text color="white">• Real-time updates</Text>
        <Text color="white">• Keyboard shortcuts</Text>
      </Box>

      <Box height={1} />

      <Box gap={1}>
        <Spinner type="dots" />
        <Text color="green">System running smoothly</Text>
      </Box>
    </Box>
  );
}
