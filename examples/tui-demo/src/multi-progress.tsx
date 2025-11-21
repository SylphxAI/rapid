import { signal } from '@zen/signal';
import { renderToTerminalReactive } from '@zen/tui';
import { Box, Text } from '@zen/tui';

// Download items with progress
interface Download {
  id: number;
  name: string;
  progress: { value: number };
  speed: number; // Update interval in ms
}

const downloads = signal<Download[]>([]);
let nextId = 1;

// Add a new download
function addDownload() {
  const speeds = [30, 50, 70, 100, 120]; // Different speeds
  const speed = speeds[Math.floor(Math.random() * speeds.length)];

  const newDownload: Download = {
    id: nextId++,
    name: `file-${nextId - 1}.zip`,
    progress: signal(0),
    speed,
  };

  downloads.value = [...downloads.value, newDownload];

  // Start updating this download's progress
  const interval = setInterval(() => {
    const current = newDownload.progress.value;
    if (current >= 100) {
      clearInterval(interval);
    } else {
      newDownload.progress.value = Math.min(100, current + 1);
    }
  }, speed);
}

const MultiProgress = () => {
  return (
    <Box>
      <Text bold color="cyan">
        📥 Download Manager
      </Text>
      <Text dim>─────────────────────────────────────────────</Text>

      {() => {
        const items = downloads.value;
        if (items.length === 0) {
          return <Text dim>No active downloads...</Text>;
        }

        return items.map((download) => (
          <Box key={download.id}>
            <Text>
              {() => {
                const percent = download.progress.value;
                const fileName = download.name.padEnd(20);
                const barWidth = 30;
                const filled = Math.floor((percent / 100) * barWidth);
                const empty = barWidth - filled;
                const bar = '█'.repeat(filled) + '░'.repeat(empty);
                const status = percent === 100 ? '✓' : '↓';
                const _color = percent === 100 ? 'green' : 'yellow';

                return `${status} ${fileName} ${bar} ${percent}%`;
              }}
            </Text>
          </Box>
        ));
      }}

      <Text dim>─────────────────────────────────────────────</Text>
      <Text>
        Active: {() => downloads.value.filter((d) => d.progress.value < 100).length} | Completed:{' '}
        {() => downloads.value.filter((d) => d.progress.value === 100).length}
      </Text>
    </Box>
  );
};

// Render
await renderToTerminalReactive(() => <MultiProgress />);

// Start with one download
addDownload();

// Add new downloads at random intervals
const addInterval = setInterval(
  () => {
    const currentDownloads = downloads.value;

    // Stop adding after 5 downloads
    if (currentDownloads.length >= 5) {
      clearInterval(addInterval);

      // Exit when all are complete
      const checkComplete = setInterval(() => {
        const allComplete = downloads.value.every((d) => d.progress.value === 100);
        if (allComplete) {
          clearInterval(checkComplete);
          setTimeout(() => process.exit(0), 1000);
        }
      }, 500);

      return;
    }

    addDownload();
  },
  Math.random() * 2000 + 1000,
); // Random interval 1-3 seconds
