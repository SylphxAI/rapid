/**
 * Dynamic Layout Demo
 *
 * Tests:
 * - Adding/removing elements
 * - Layout changes (flexDirection toggle)
 * - Fine-grained reactivity
 * - Buffer diff updates
 */

import {
  Box,
  Button,
  FocusProvider,
  For,
  Show,
  Text,
  renderToTerminalReactive,
  signal,
  useFocusManager,
  useInput,
} from '@zen/tui';

function DynamicLayoutDemo() {
  const { focusNext, focusPrevious } = useFocusManager();

  // Counter state
  const count = signal(0);

  // List of items (dynamic add/remove)
  const items = signal<string[]>(['Item 1', 'Item 2', 'Item 3']);

  // Layout direction toggle
  const isRow = signal(false);

  // Show/hide panel
  const showPanel = signal(true);

  // Handlers
  const increment = () => {
    count.value = count.value + 1;
  };

  const decrement = () => {
    count.value = count.value - 1;
  };

  const addItem = () => {
    items.value = [...items.value, `Item ${items.value.length + 1}`];
  };

  const removeItem = () => {
    if (items.value.length > 0) {
      items.value = items.value.slice(0, -1);
    }
  };

  const toggleLayout = () => {
    isRow.value = !isRow.value;
  };

  const togglePanel = () => {
    showPanel.value = !showPanel.value;
  };

  // Keyboard input
  useInput((input, key) => {
    if (key.tab) {
      if (key.shift) {
        focusPrevious();
      } else {
        focusNext();
      }
    } else if (input === '+' || input === '=') {
      increment();
    } else if (input === '-' || input === '_') {
      decrement();
    } else if (input === 'a' || input === 'A') {
      addItem();
    } else if (input === 'r' || input === 'R') {
      removeItem();
    } else if (input === 'l' || input === 'L') {
      toggleLayout();
    } else if (input === 'p' || input === 'P') {
      togglePanel();
    }
  });

  return (
    <Box
      style={{
        borderStyle: 'double',
        borderColor: 'cyan',
        padding: 1,
      }}
    >
      <Text bold color="cyan">
        Dynamic Layout Demo
      </Text>
      <Text dim>
        Tab: navigate | +/-: counter | a/r: add/remove | l: layout | p: panel | q: quit
      </Text>

      <Box style={{ marginY: 1 }}>
        <Text>
          Counter:{' '}
          <Text bold color="green">
            {count}
          </Text>
        </Text>
        <Text>
          Items:{' '}
          <Text bold color="yellow">
            {() => items.value.length}
          </Text>
        </Text>
        <Text>
          Layout:{' '}
          <Text bold color="magenta">
            {() => (isRow.value ? 'Row' : 'Column')}
          </Text>
        </Text>
      </Box>

      {/* Control Buttons */}
      <Box
        style={{
          flexDirection: () => (isRow.value ? 'row' : 'column'),
          marginY: 1,
          borderStyle: 'single',
          padding: 1,
        }}
      >
        <Text bold>Controls:</Text>

        <Button id="inc-btn" label="+" onPress={increment} style={{ marginX: 1 }} />

        <Button id="dec-btn" label="-" onPress={decrement} style={{ marginX: 1 }} />

        <Button id="add-btn" label="Add Item" onPress={addItem} style={{ marginX: 1 }} />

        <Button id="remove-btn" label="Remove Item" onPress={removeItem} style={{ marginX: 1 }} />

        <Button
          id="layout-btn"
          label="Toggle Layout"
          onPress={toggleLayout}
          style={{ marginX: 1 }}
        />

        <Button id="panel-btn" label="Toggle Panel" onPress={togglePanel} style={{ marginX: 1 }} />
      </Box>

      {/* Dynamic Items List */}
      <Box
        style={{
          marginY: 1,
          borderStyle: 'round',
          borderColor: 'yellow',
          padding: 1,
        }}
      >
        <Text bold color="yellow">
          Items List:
        </Text>

        <For each={items}>
          {(item, index) => (
            <Box style={{ marginX: 1 }}>
              <Text>
                {() => `${index() + 1}.`} <Text color="cyan">{item}</Text>
              </Text>
            </Box>
          )}
        </For>

        {() =>
          items.value.length === 0 && (
            <Text dim italic>
              No items. Press 'a' or click "Add Item" to add.
            </Text>
          )
        }
      </Box>

      {/* Conditional Panel */}
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
            Dynamic Panel
          </Text>
          <Text>This panel appears and disappears!</Text>
          <Text>
            Current count: <Text bold>{count}</Text>
          </Text>
        </Box>
      </Show>

      {/* Status Bar */}
      <Box
        style={{
          marginY: 1,
          borderStyle: 'single',
          padding: 1,
        }}
      >
        <Text dim>Press 'q' to quit | Layout updates are fine-grained and batched</Text>
      </Box>
    </Box>
  );
}

function App() {
  return <FocusProvider>{() => <DynamicLayoutDemo />}</FocusProvider>;
}

// Run with keyboard shortcuts
const _cleanup = await renderToTerminalReactive(() => App(), {
  onKeyPress: (key) => {
    if (key === '+' || key === '=') {
      // Increment handled by focus
    } else if (key === '-') {
      // Decrement handled by focus
    }
  },
});
