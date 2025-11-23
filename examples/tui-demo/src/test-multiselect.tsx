/** @jsxImportSource @zen/tui */
/**
 * Test MultiSelect Component
 */

import { signal } from '@zen/signal';
import { renderToTerminalReactive } from '@zen/tui';
import {
  Box,
  Button,
  FocusProvider,
  MultiSelect,
  type MultiSelectOption,
  Text,
  useFocusManager,
} from '@zen/tui';

// Sample items
const interests: MultiSelectOption[] = [
  { label: 'Programming', value: 'programming' },
  { label: 'Design', value: 'design' },
  { label: 'Writing', value: 'writing' },
  { label: 'Music', value: 'music' },
  { label: 'Gaming', value: 'gaming' },
  { label: 'Reading', value: 'reading' },
  { label: 'Sports', value: 'sports' },
  { label: 'Cooking', value: 'cooking' },
];

// Selected interests
const selected = signal<string[]>([]);
const submitted = signal(false);

// Handle submit
function handleSubmit(_selectedValues: string[]) {
  submitted.value = true;

  // Exit after 2 seconds
  setTimeout(() => {
    process.exit(0);
  }, 2000);
}

// Summary component
const Summary = () => {
  const selectedLabels = selected.value
    .map((val) => interests.find((i) => i.value === val)?.label)
    .filter(Boolean);

  return (
    <Box style={{ flexDirection: 'column', marginTop: 1 }}>
      <Text bold>Selected Interests ({selected.value.length}):</Text>
      {selectedLabels.length > 0 ? (
        selectedLabels.map((label) => (
          <Text key={label} color="cyan" style={{ paddingLeft: 2 }}>
            • {label}
          </Text>
        ))
      ) : (
        <Text dim style={{ paddingLeft: 2 }}>
          None selected
        </Text>
      )}
    </Box>
  );
};

// App component
function App() {
  useFocusManager();

  // Show result if submitted
  if (submitted.value) {
    return (
      <Box style={{ flexDirection: 'column', padding: 1 }}>
        <Text color="green" bold>
          ✓ Submitted!
        </Text>
        <Summary />
      </Box>
    );
  }

  return (
    <Box style={{ flexDirection: 'column', padding: 1, width: 50 }}>
      <Text bold color="cyan">
        Select Your Interests
      </Text>
      <Text dim>Use ↑/↓ to navigate, Space to toggle, Enter to submit</Text>
      <Text dim style={{ marginBottom: 1 }}>
        Shortcuts: a=select all, c=clear all
      </Text>

      <MultiSelect
        id="interests"
        items={interests}
        selected={selected}
        limit={5}
        onSubmit={handleSubmit}
      />

      <Summary />

      <Box style={{ marginTop: 1 }}>
        <Button
          id="submit-btn"
          label="Submit"
          onPress={() => {
            handleSubmit(selected.value);
          }}
        />
      </Box>

      <Text dim style={{ marginTop: 1 }}>
        Tip: Use Tab to switch between list and button
      </Text>
    </Box>
  );
}

await renderToTerminalReactive(
  () => (
    <FocusProvider>
      <App />
    </FocusProvider>
  ),
  { fps: 10 },
);
