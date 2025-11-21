/**
 * Automated Layout Demo
 *
 * Automatically adds/removes items and changes layout
 * Tests fine-grained reactivity + Yoga layout + buffer diff
 * No user interaction needed
 */

import { Box, For, Show, Text, renderToTerminalReactive, signal } from '@zen/tui';

function AutoLayoutDemo() {
  // Counter - auto increment
  const count = signal(0);

  // Items list - auto add/remove
  const items = signal<string[]>(['Item 1', 'Item 2', 'Item 3']);

  // Layout direction - auto toggle
  const isRow = signal(false);

  // Panel visibility - auto toggle
  const showPanel = signal(true);

  // Auto increment counter every 1 second
  setInterval(() => {
    count.value = count.value + 1;
  }, 1000);

  // Auto add/remove items every 2 seconds
  let adding = true;
  setInterval(() => {
    if (adding) {
      // Add item
      items.value = [...items.value, `Item ${items.value.length + 1}`];
      if (items.value.length >= 8) {
        adding = false;
      }
    } else {
      // Remove item
      if (items.value.length > 1) {
        items.value = items.value.slice(0, -1);
      }
      if (items.value.length <= 2) {
        adding = true;
      }
    }
  }, 2000);

  // Auto toggle layout every 4 seconds
  setInterval(() => {
    isRow.value = !isRow.value;
  }, 4000);

  // Auto toggle panel every 3 seconds
  setInterval(() => {
    showPanel.value = !showPanel.value;
  }, 3000);

  return (
    <Box
      style={{
        borderStyle: 'double',
        borderColor: 'cyan',
        padding: 1,
      }}
    >
      <Text bold color="cyan">
        🤖 Automated Layout Demo
      </Text>
      <Text dim>Automatically testing layout changes, add/remove, show/hide</Text>

      <Box style={{ marginY: 1 }}>
        <Text>
          Counter (auto +1/s):{' '}
          <Text bold color="green">
            {count}
          </Text>
        </Text>
        <Text>
          Items (auto ±/2s):{' '}
          <Text bold color="yellow">
            {() => items.value.length}
          </Text>
        </Text>
        <Text>
          Layout (toggle/4s):{' '}
          <Text bold color="magenta">
            {() => (isRow.value ? '→ Row' : '↓ Column')}
          </Text>
        </Text>
        <Text>
          Panel (toggle/3s):{' '}
          <Text bold color="blue">
            {() => (showPanel.value ? '✓ Visible' : '✗ Hidden')}
          </Text>
        </Text>
      </Box>

      {/* Dynamic Items List with changing layout */}
      <Box
        style={{
          marginY: 1,
          borderStyle: 'round',
          borderColor: 'yellow',
          padding: 1,
          flexDirection: () => (isRow.value ? 'row' : 'column'),
        }}
      >
        <Text bold color="yellow">
          Items [{() => (isRow.value ? 'Row' : 'Col')}]:
        </Text>

        {() =>
          items.value.map((item, index) => (
            <Text key={index} color="yellow">{`${index + 1}. ${item}`}</Text>
          ))
        }
      </Box>

      {/* Conditional Panel - auto show/hide */}
      <Show when={showPanel}>
        <Box
          style={{
            borderStyle: 'single',
            borderColor: 'green',
            padding: 1,
            marginY: 1,
          }}
        >
          <Text bold color="green">
            🟢 Dynamic Panel (appears/disappears every 3s)
          </Text>
          <Text>Current count: {count}</Text>
          <Text>Current items: {() => items.value.join(', ')}</Text>
        </Box>
      </Show>

      {/* Another dynamic box to show layout changes */}
      <Box
        style={{
          marginY: 1,
          borderStyle: 'single',
          borderColor: 'magenta',
          padding: 1,
          flexDirection: () => (isRow.value ? 'row' : 'column'),
        }}
      >
        <Text bold>Stats:</Text>
        <Box style={{ marginX: () => (isRow.value ? 1 : 0) }}>
          <Text>Total: {() => count.value * items.value.length}</Text>
        </Box>
        <Box style={{ marginX: () => (isRow.value ? 1 : 0) }}>
          <Text>Average: {() => Math.floor(count.value / Math.max(1, items.value.length))}</Text>
        </Box>
      </Box>

      {/* Status */}
      <Box
        style={{
          marginY: 1,
          borderStyle: 'single',
          padding: 1,
        }}
      >
        <Text dim>
          ⚡ Fine-grained updates | 📐 Yoga layout | 🔄 Buffer diff | Press Ctrl+C or 'q' to quit
        </Text>
      </Box>
    </Box>
  );
}

// Run without keyboard input (automated)
const _cleanup = await renderToTerminalReactive(() => <AutoLayoutDemo />);
