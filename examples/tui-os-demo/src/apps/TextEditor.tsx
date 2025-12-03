/** @jsxImportSource @rapid/tui */
/**
 * Text Editor App
 *
 * Simple text editor with file operations
 */

import { Box, Text, signal } from '@rapid/tui';
import { CodeEditor, MenuBar, type MenuItemConfig } from '@rapid/tui-advanced';

export function TextEditor() {
  const content = signal('# Untitled Document\n\nStart typing...\n');
  const filename = signal('untitled.txt');
  const saved = signal(true);
  const statusMessage = signal('Ready');

  const menuItems: MenuItemConfig[] = [
    {
      label: 'File',
      key: 'F1',
      onSelect: () => {
        statusMessage.value = 'File menu: New | Open | Save | Exit';
      },
    },
    {
      label: 'Edit',
      key: 'F2',
      onSelect: () => {
        statusMessage.value = 'Edit menu: Cut | Copy | Paste | Find';
      },
    },
    {
      label: 'View',
      key: 'F3',
      onSelect: () => {
        statusMessage.value = 'View menu: Zoom In | Zoom Out | Fullscreen';
      },
    },
  ];

  return (
    <Box flexDirection="column">
      {/* Menu Bar */}
      <MenuBar items={menuItems} bgColor="blue" />

      {/* Editor */}
      <Box padding={1} flexGrow={1}>
        <CodeEditor
          value={content.value}
          onChange={(val) => {
            content.value = val;
            saved.value = false;
            statusMessage.value = 'Modified';
          }}
          rows={15}
          cols={50}
          language="markdown"
        />
      </Box>

      {/* Status Bar */}
      <Box backgroundColor="blue" height={1} paddingX={1} justifyContent="space-between">
        <Text color="white">{() => `${filename.value}${saved.value ? '' : ' *'}`}</Text>
        <Text color="white">{() => statusMessage.value}</Text>
        <Text color="white">{() => `Lines: ${content.value.split('\n').length}`}</Text>
      </Box>
    </Box>
  );
}
