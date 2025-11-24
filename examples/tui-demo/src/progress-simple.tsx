import { signal } from '@zen/signal';
import { renderApp} from '@zen/tui';
import { Box, Text } from '@zen/tui';

// Simpler progress bar without border
const progress = signal(0);

const ProgressBar = () => {
  return (
    <Box>
      <Text bold>Progress:</Text>
      <Text>
        {() => {
          const percent = progress.value;
          const barWidth = 30;
          const filled = Math.floor((percent / 100) * barWidth);
          const empty = barWidth - filled;
          return `${'█'.repeat(filled) + '░'.repeat(empty)} ${percent}%`;
        }}
      </Text>
    </Box>
  );
};

// Render
await renderApp(() => <ProgressBar />);

// Update progress from 0 to 100
const interval = setInterval(() => {
  const current = progress.value;
  if (current >= 100) {
    clearInterval(interval);
    process.exit(0);
  } else {
    progress.value = current + 1;
  }
}, 50);
