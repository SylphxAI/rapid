/** @jsxImportSource @zen/tui */
/**
 * TextInput Autocomplete Test
 *
 * Test autocomplete suggestions with TextInput.
 * Run with: bun run src/test-autocomplete.tsx
 */

import { signal } from '@zen/signal';
import { Box, FocusProvider, Text, TextInput, renderApp, FullscreenLayout} from '@zen/tui';

// Sample suggestions for different categories
const CITIES = [
  'Hong Kong', 'Tokyo', 'Singapore', 'London', 'New York', 'Paris', 'Berlin', 'Sydney', 'Toronto', 'Seoul', 'Shanghai', 'Beijing', 'Bangkok', 'Dubai', 'Mumbai', ];

const COMMANDS = [
  'help', 'list', 'create', 'delete', 'update', 'search', 'export', 'import', 'configure', 'status', ];

function AutocompleteDemo() {
  const cityValue = signal('');
  const commandValue = signal('');
  const asyncValue = signal('');
  const lastSelected = signal('(none)');

  // Async suggestion provider (simulates API call)
  const asyncSuggestionProvider = async (value: string): Promise<string[]> => {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 100));

    const allSuggestions = [
      'async-option-1', 'async-option-2', 'async-option-3', 'async-result-a', 'async-result-b', 'async-data-x', 'async-data-y', ];

    return allSuggestions.filter((s) => s.toLowerCase().includes(value.toLowerCase()));
  };

  return (
    <FocusProvider>
      <Box style={{ flexDirection: 'column', padding: 1, gap: 1 }}>
        <Text style={{ bold: true, color: 'cyan' }}>TextInput Autocomplete Demo</Text>
        <Text style={{ dim: true }}>
          Tab to switch between inputs, Up/Down to navigate suggestions
        </Text>
        <Text> </Text>

        {/* City Input with Static Suggestions */}
        <Box style={{ flexDirection: 'column', gap: 0 }}>
          <Text>City (static suggestions):</Text>
          <TextInput
            id="city-input"
            value={cityValue}
            placeholder="Type a city name..."
            suggestions={CITIES}
            maxSuggestions={5}
            onChange={(v) => {
              cityValue.value = v;
            }}
            onSuggestionSelect={(s) => {
              lastSelected.value = `City: ${s}`;
            }}
            width={40}
          />
        </Box>

        <Text> </Text>

        {/* Command Input with Static Suggestions */}
        <Box style={{ flexDirection: 'column', gap: 0 }}>
          <Text>Command (static suggestions):</Text>
          <TextInput
            id="command-input"
            value={commandValue}
            placeholder="Type a command..."
            suggestions={COMMANDS}
            maxSuggestions={5}
            onChange={(v) => {
              commandValue.value = v;
            }}
            onSuggestionSelect={(s) => {
              lastSelected.value = `Command: ${s}`;
            }}
            width={40}
          />
        </Box>

        <Text> </Text>

        {/* Async Suggestions */}
        <Box style={{ flexDirection: 'column', gap: 0 }}>
          <Text>Async (function provider):</Text>
          <TextInput
            id="async-input"
            value={asyncValue}
            placeholder="Type to search async..."
            suggestions={asyncSuggestionProvider}
            maxSuggestions={5}
            onChange={(v) => {
              asyncValue.value = v;
            }}
            onSuggestionSelect={(s) => {
              lastSelected.value = `Async: ${s}`;
            }}
            width={40}
          />
        </Box>

        <Text> </Text>
        <Text>Last selected: {() => lastSelected.value}</Text>
        <Text> </Text>
        <Text style={{ dim: true }}>Press 'q' to quit</Text>
      </Box>
    </FocusProvider>
  );
}

await renderApp(() => (
  <FullscreenLayout>
    <AutocompleteDemo />
  </FullscreenLayout>
));
