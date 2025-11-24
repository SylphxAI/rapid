/** @jsxImportSource @zen/tui */
/**
 * StatusBar Demo
 *
 * Demonstrates the StatusBar component for fullscreen apps.
 * Like vim, tmux, or htop status bars.
 */

import { signal } from '@zen/signal';
import {
  Box, StatusBarMode, StatusBarShortcut, Text, useInput, renderApp, FullscreenLayout} from '@zen/tui';

type Mode = 'NORMAL' | 'INSERT' | 'VISUAL' | 'COMMAND';

function StatusBarDemo() {
  const mode = signal<Mode>('NORMAL');
  const lineNumber = signal(1);
  const colNumber = signal(1);
  const filename = signal('untitled.txt');
  const modified = signal(false);

  // Handle mode switching
  useInput((input, key) => {
    if (mode.value === 'NORMAL') {
      if (input === 'i') {
        mode.value = 'INSERT';
      } else if (input === 'v') {
        mode.value = 'VISUAL';
      } else if (input === ':') {
        mode.value = 'COMMAND';
      } else if (key.upArrow) {
        lineNumber.value = Math.max(1, lineNumber.value - 1);
      } else if (key.downArrow) {
        lineNumber.value += 1;
      } else if (key.leftArrow) {
        colNumber.value = Math.max(1, colNumber.value - 1);
      } else if (key.rightArrow) {
        colNumber.value += 1;
      }
    } else {
      // ESC returns to NORMAL mode
      if (key.escape) {
        mode.value = 'NORMAL';
      } else if (mode.value === 'INSERT') {
        modified.value = true;
      }
    }
  });

  return (
    <Box style={{ flexDirection: 'column', padding: 1 }}>
      <Text style={{ bold: true, color: 'cyan' }}>StatusBar Demo</Text>
      <Text style={{ dim: true }}>A vim-like editor simulation</Text>
      <Text> </Text>
      <Text>Current Mode: {() => mode.value}</Text>
      <Text>
        Position: Line {() => lineNumber.value}, Column {() => colNumber.value}
      </Text>
      <Text>
        File: {() => filename.value}
        {() => (modified.value ? ' [+]' : '')}
      </Text>
      <Text> </Text>
      <Text style={{ color: 'yellow' }}>Controls:</Text>
      <Text> i - Enter INSERT mode</Text>
      <Text> v - Enter VISUAL mode</Text>
      <Text> : - Enter COMMAND mode</Text>
      <Text> ESC - Return to NORMAL mode</Text>
      <Text> Arrow keys - Move cursor (in NORMAL mode)</Text>
      <Text> q - Quit</Text>
      <Text> </Text>

      {/* Simple status bar - uses Box with background */}
      <Box style={{ flexDirection: 'row', backgroundColor: 'blue', width: 80 }}>
        <StatusBarMode mode={mode.value} />
        <Text style={{ color: 'white' }}> {() => filename.value}</Text>
        <Text style={{ color: 'red' }}>{() => (modified.value ? ' [+]' : '')}</Text>
        <Text style={{ color: 'white' }}> </Text>
        <StatusBarShortcut keys="q" action="quit" />
        <StatusBarShortcut keys="ESC" action="normal" />
        <Text style={{ color: 'white', flexGrow: 1 }}> </Text>
        <Text style={{ color: 'white' }}>
          Ln {() => lineNumber.value}, Col {() => colNumber.value}{' '}
        </Text>
      </Box>
    </Box>
  );
}

await renderApp(() => (
  <FullscreenLayout>
    <StatusBarDemo />
  </FullscreenLayout>
));
