/**
 * File Manager App
 */

import { Box, For, Text, signal, useInput } from '@rapid/tui';

interface FileItem {
  name: string;
  type: 'folder' | 'file';
  size?: string;
  modified?: string;
}

export function Files() {
  const currentPath = signal('/home/user');
  const selectedIndex = signal(0);

  const files = signal<FileItem[]>([
    { name: '..', type: 'folder' },
    { name: 'Desktop', type: 'folder' },
    { name: 'Documents', type: 'folder' },
    { name: 'Downloads', type: 'folder' },
    { name: 'Music', type: 'folder' },
    { name: 'Pictures', type: 'folder' },
    { name: 'Videos', type: 'folder' },
    { name: '.bashrc', type: 'file', size: '3.2 KB' },
    { name: '.zshrc', type: 'file', size: '4.1 KB' },
    { name: 'notes.txt', type: 'file', size: '1.5 KB' },
    { name: 'readme.md', type: 'file', size: '2.8 KB' },
  ]);

  useInput((_input, key) => {
    if (key.upArrow) {
      selectedIndex.value = Math.max(0, selectedIndex.value - 1);
    } else if (key.downArrow) {
      selectedIndex.value = Math.min(files.value.length - 1, selectedIndex.value + 1);
    } else if (key.return) {
      const selected = files.value[selectedIndex.value];
      if (selected.type === 'folder') {
        if (selected.name === '..') {
          const parts = currentPath.value.split('/');
          parts.pop();
          currentPath.value = parts.join('/') || '/';
        } else {
          currentPath.value = `${currentPath.value}/${selected.name}`;
        }
        selectedIndex.value = 0;
      }
    }
  });

  return (
    <Box flexDirection="column" width="100%" height="100%">
      {/* Path Bar */}
      <Box backgroundColor="gray" paddingX={1}>
        <Text color="white">📍 {currentPath}</Text>
      </Box>

      {/* Column Headers */}
      <Box paddingX={1} backgroundColor="black">
        <Box width={20}>
          <Text color="yellow" bold>
            Name
          </Text>
        </Box>
        <Box width={10}>
          <Text color="yellow" bold>
            Size
          </Text>
        </Box>
        <Box width={12}>
          <Text color="yellow" bold>
            Type
          </Text>
        </Box>
      </Box>

      {/* File List */}
      <Box flexDirection="column" flex={1}>
        <For each={files.value}>
          {(file, index) => (
            <Box
              paddingX={1}
              backgroundColor={() => (index() === selectedIndex.value ? 'blue' : 'black')}
            >
              <Box width={20}>
                <Text color={() => (file.type === 'folder' ? 'cyan' : 'white')}>
                  {file.type === 'folder' ? '📁' : '📄'} {file.name}
                </Text>
              </Box>
              <Box width={10}>
                <Text color="gray">{file.size || '-'}</Text>
              </Box>
              <Box width={12}>
                <Text color="gray">{file.type}</Text>
              </Box>
            </Box>
          )}
        </For>
      </Box>

      {/* Status Bar */}
      <Box backgroundColor="gray" paddingX={1} justifyContent="space-between">
        <Text color="white">{files.value.length} items</Text>
        <Text color="white">↑↓ Navigate | Enter: Open</Text>
      </Box>
    </Box>
  );
}
