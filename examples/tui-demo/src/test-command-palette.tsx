/** @jsxImportSource @zen/tui */
/**
 * Command Palette Test
 *
 * Test command palette with search and keyboard navigation.
 * Run with: bun run src/test-command-palette.tsx
 */

import { signal } from '@zen/signal';
import {
  Box, type Command, CommandPalette, Text, useInput, renderApp, FullscreenLayout} from '@zen/tui';

function CommandPaletteTest() {
  const showPalette = signal(false);
  const lastCommand = signal('None');

  const commands: Command[] = [
    {
      id: 'new', label: 'New File', description: 'Create a new file', shortcut: 'Ctrl+N', handler: () => {
        lastCommand.value = 'New File';
      }}, {
      id: 'open', label: 'Open File', description: 'Open an existing file', shortcut: 'Ctrl+O', handler: () => {
        lastCommand.value = 'Open File';
      }}, {
      id: 'save', label: 'Save', description: 'Save current file', shortcut: 'Ctrl+S', handler: () => {
        lastCommand.value = 'Save';
      }}, {
      id: 'saveas', label: 'Save As...', description: 'Save with a new name', shortcut: 'Ctrl+Shift+S', handler: () => {
        lastCommand.value = 'Save As';
      }}, {
      id: 'find', label: 'Find', description: 'Search in current file', shortcut: 'Ctrl+F', handler: () => {
        lastCommand.value = 'Find';
      }}, {
      id: 'replace', label: 'Find and Replace', description: 'Search and replace text', shortcut: 'Ctrl+H', handler: () => {
        lastCommand.value = 'Find and Replace';
      }}, {
      id: 'goto', label: 'Go to Line', description: 'Jump to a specific line', shortcut: 'Ctrl+G', handler: () => {
        lastCommand.value = 'Go to Line';
      }}, {
      id: 'format', label: 'Format Document', description: 'Auto-format the document', shortcut: 'Shift+Alt+F', handler: () => {
        lastCommand.value = 'Format Document';
      }}, {
      id: 'settings', label: 'Settings', description: 'Open settings', shortcut: 'Ctrl+,', handler: () => {
        lastCommand.value = 'Settings';
      }}, {
      id: 'quit', label: 'Quit', description: 'Exit the application', shortcut: 'Ctrl+Q', handler: () => {
        lastCommand.value = 'Quit';
      }}, ];

  // Ctrl+P to open palette
  useInput((input, _key) => {
    if (showPalette.value) return;
    if (input === 'p' || input === 'P') {
      showPalette.value = true;
    }
  });

  return (
    <Box style={{ flexDirection: 'column', padding: 1 }}>
      <Text style={{ bold: true, color: 'cyan' }}>Command Palette Test</Text>
      <Text> </Text>
      <Text>Press [P] to open command palette</Text>
      <Text> </Text>
      <Text>Last executed: {() => lastCommand.value}</Text>
      <Text> </Text>
      <Text style={{ dim: true }}>Press 'q' to quit</Text>

      {() =>
        showPalette.value && (
          <CommandPalette
            open={true}
            commands={commands}
            onClose={() => {
              showPalette.value = false;
            }}
            placeholder="Search commands..."
          />
        )
      }
    </Box>
  );
}

await renderApp(() => (
  <FullscreenLayout>
    <CommandPaletteTest />
  </FullscreenLayout>
));
