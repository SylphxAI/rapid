/** @jsxImportSource @zen/tui */
/**
 * File Manager App
 *
 * Browse files and folders with keyboard navigation
 * Uses FocusProvider for proper focus management between panes
 *
 * Focus navigation: Tab/Shift+Tab to switch between panes
 */

import { Box, FocusProvider, Text, signal } from '@zen/tui';
import { List, Pane, Splitter } from '@zen/tui-advanced';

interface FileItem {
  name: string;
  type: 'file' | 'folder';
  size?: string;
  modified?: string;
}

function FileManagerContent() {
  const currentPath = signal('/home/user');
  const files = signal<FileItem[]>([
    { name: '..', type: 'folder' },
    { name: 'Documents', type: 'folder' },
    { name: 'Downloads', type: 'folder' },
    { name: 'Pictures', type: 'folder' },
    { name: 'Music', type: 'folder' },
    { name: 'Videos', type: 'folder' },
    { name: 'README.md', type: 'file', size: '2.5 KB', modified: '2024-01-15' },
    { name: 'package.json', type: 'file', size: '1.2 KB', modified: '2024-01-14' },
    { name: 'tsconfig.json', type: 'file', size: '856 B', modified: '2024-01-13' },
  ]);

  const selectedFile = signal<FileItem>(files.value[0]);

  return (
    <Box flexDirection="column" padding={1}>
      {/* Path bar */}
      <Box borderStyle="single" borderColor="cyan" paddingX={1} marginBottom={1}>
        <Text color="cyan">{() => `📁 ${currentPath.value}`}</Text>
      </Box>

      {/* Content */}
      <Splitter orientation="horizontal" sizes={[60, 40]}>
        {/* File list - uses focusId for FocusProvider integration */}
        <Pane minSize={30}>
          <List
            items={files.value}
            onSelect={(file) => {
              selectedFile.value = file;
            }}
            renderItem={(file, _index, isSelected) => (
              <Box gap={1}>
                <Text color={isSelected ? 'cyan' : 'white'}>
                  {file.type === 'folder' ? '📁' : '📄'}
                </Text>
                <Text color={isSelected ? 'cyan' : 'white'} bold={isSelected}>
                  {file.name}
                </Text>
              </Box>
            )}
            limit={12}
            focusId="file-list"
            autoFocus
          />
        </Pane>

        {/* File info */}
        <Pane minSize={20}>
          <Box flexDirection="column" gap={1} padding={1}>
            <Text bold color="yellow">
              File Details
            </Text>
            <Text>─────────────</Text>
            <Text>{() => `Name: ${selectedFile.value?.name || 'N/A'}`}</Text>
            <Text>{() => `Type: ${selectedFile.value?.type || 'N/A'}`}</Text>
            {() => selectedFile.value?.size && <Text>{`Size: ${selectedFile.value.size}`}</Text>}
            {() =>
              selectedFile.value?.modified && (
                <Text>{`Modified: ${selectedFile.value.modified}`}</Text>
              )
            }
          </Box>
        </Pane>
      </Splitter>

      {/* Status bar */}
      <Box marginTop={1} borderStyle="single" paddingX={1}>
        <Text dimColor>
          {() => `${files.value.length} items | ↑↓: Navigate | Tab: Switch pane | Enter: Open`}
        </Text>
      </Box>
    </Box>
  );
}

export function FileManager() {
  return (
    <FocusProvider>
      <FileManagerContent />
    </FocusProvider>
  );
}
