#!/usr/bin/env bun
/** @jsxImportSource @zen/tui */
/**
 * Test Radio Component
 */

import { signal } from '@zen/signal';
import {
  Box,
  FocusProvider,
  Radio,
  type RadioOption,
  Text,
  renderToTerminalReactive,
} from '@zen/tui';

const themeOptions: RadioOption[] = [
  { label: 'Dark Mode', value: 'dark' },
  { label: 'Light Mode', value: 'light' },
  { label: 'Auto (System)', value: 'auto' },
];

const selectedTheme = signal<string | undefined>('dark');

function App() {
  const handleChange = (_value: string) => {};

  return (
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
