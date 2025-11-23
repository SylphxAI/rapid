#!/usr/bin/env bun
/**
 * Test Radio Component
 */

import { signal } from '@zen/tui';
import { Box, Text, Radio, type RadioOption, FocusProvider } from '@zen/tui';
import { render } from '@zen/tui';

const themeOptions: RadioOption[] = [
  { label: 'Dark Mode', value: 'dark' },
  { label: 'Light Mode', value: 'light' },
  { label: 'Auto (System)', value: 'auto' },
];

const selectedTheme = signal<string | undefined>('dark');

function App() {
  const handleChange = (value: string) => {
    console.log(`Theme changed to: ${value}`);
  };

  return (
    <FocusProvider>
      <Box style={{ flexDirection: 'column', padding: 1 }}>
        <Text bold color="cyan" style={{ marginBottom: 1 }}>
          Select Theme
        </Text>
        <Text dim style={{ marginBottom: 1 }}>
          Use ↑↓/jk to navigate, Enter/Space to select
        </Text>

        <Radio
          id="theme"
          options={themeOptions}
          value={selectedTheme}
          onChange={handleChange}
          style={{ marginBottom: 1 }}
        />

        <Text style={{ marginTop: 1 }}>
          Selected: <Text color="green">{() => selectedTheme.value || 'None'}</Text>
        </Text>

        <Text dim style={{ marginTop: 1 }}>
          Press Ctrl+C to exit
        </Text>
      </Box>
    </FocusProvider>
  );
}

render(<App />);
