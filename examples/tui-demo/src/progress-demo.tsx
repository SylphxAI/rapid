import { signal } from '@zen/signal';
import { renderToTerminalReactive } from '@zen/tui';
import { Box, Text } from '@zen/tui';

// Simple progress bar demo: 0 to 100%
const progress = signal(0);

const ProgressBar = () => {
  return (
    <Box borderStyle="single" borderColor="cyan" padding={1}>
      <Text bold>Progress Demo</Text>
      <Text>
        {() => {
          const percent = progress.value;
          const barWidth = 50;
          const filled = Math.floor((percent / 100) * barWidth);
          const empty = barWidth - filled;
          return '█'.repeat(filled) + '░'.repeat(empty);
        }}
      </Text>
      <Text color="green">{() => progress.value}% Complete</Text>
    </Box>
  );
};

// Render
await renderToTerminalReactive(() => <ProgressBar />);

// Update progress from 0 to 100
const interval = setInterval(() => {
  const current = progress.value;
  if (current >= 100) {
    clearInterval(interval);
    process.exit(0);
  } else {
    progress.value = current + 1;
  }
}, 50); // Update every 50ms
