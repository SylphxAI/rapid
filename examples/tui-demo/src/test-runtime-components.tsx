/** @jsxImportSource @zen/tui */
/**
 * Test Runtime Components (For/Show)
 */

import { For, Show } from '@zen/runtime';
import { signal, renderApp} from '@zen/tui';
import { Box, Text } from '@zen/tui';

const items = signal(['Apple', 'Banana', 'Cherry']);
const showList = signal(true);

// Toggle visibility every 3 seconds
setInterval(() => {
  showList.value = !showList.value;
}, 3000);

// Add item every 2 seconds when visible
setInterval(() => {
  if (showList.value) {
    const fruits = ['Durian', 'Elderberry', 'Fig', 'Grape'];
    const newItem = fruits[Math.floor(Math.random() * fruits.length)];
    items.value = [...items.value, newItem];
  }
}, 2000);

function App() {
  return (
    <Box style={{ width: 40, height: 12, padding: 1, flexDirection: 'column' }}>
      <Text bold>Runtime Components Test</Text>

      <Show when={() => showList.value}>
        <Box style={{ flexDirection: 'column', marginTop: 1 }}>
          <Text>Items:</Text>
          <For each={() => items.value}>{(item) => <Text>• {item}</Text>}</For>
        </Box>
      </Show>

      <Show when={() => !showList.value}>
        <Text dim>(List hidden)</Text>
      </Show>
    </Box>
  );
}

await renderApp(() => App(), { fps: 10 });
