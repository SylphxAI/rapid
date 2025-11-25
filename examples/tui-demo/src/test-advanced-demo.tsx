/** @jsxImportSource @zen/tui */
/**
 * Advanced Components Demo
 *
 * Demonstrates all P0 components from @zen/tui-advanced:
 * - MenuBar (top navigation)
 * - Splitter (3-pane layout)
 * - List (file browser)
 * - TextArea (editor)
 */

import { FullscreenLayout, Text, renderApp, signal } from '@zen/tui';
import {
  List,
  MenuBar,
  Pane,
  Splitter,
  TextArea,
  type MenuItemConfig,
} from '@zen/tui-advanced';

function AdvancedDemo() {
  // State
  const files = [
    'README.md',
    'package.json',
    'tsconfig.json',
    'src/index.ts',
    'src/utils.ts',
    'src/types.ts',
    'tests/app.test.ts',
    'docs/API.md',
  ];

  const selectedFileIndex = signal(0);
  const fileContent = signal('# README.md\n\nWelcome to the demo!\n\nThis is a file editor.');
  const statusMessage = signal('Ready');

  // Menu bar items
  const menuItems: MenuItemConfig[] = [
    {
      label: 'File',
      key: 'F1',
      onSelect: () => {
        statusMessage.value = 'File menu opened';
      },
    },
    {
      label: 'Edit',
      key: 'F2',
      onSelect: () => {
        statusMessage.value = 'Edit menu opened';
      },
    },
    {
      label: 'View',
      key: 'F3',
      onSelect: () => {
        statusMessage.value = 'View menu opened';
      },
      separator: true,
    },
    {
      label: 'Help',
      key: 'F4',
      onSelect: () => {
        statusMessage.value = 'Help: Use ←→ to navigate menu, F1-F4 for shortcuts';
      },
    },
  ];

  return (
    <FullscreenLayout>
      {/* Menu Bar */}
      <MenuBar items={menuItems} />

      {/* Main Content - Splitter with 3 panes */}
      <Splitter orientation="horizontal" sizes={[20, 50, 30]} resizable>
        {/* Left Pane - File Browser */}
        <Pane minSize={15}>
          <Text bold color="cyan">
            Files
          </Text>
          <List
            items={files}
            selectedIndex={selectedFileIndex.value}
            onSelect={(file, index) => {
              selectedFileIndex.value = index;
              statusMessage.value = `Selected: ${file}`;
              fileContent.value = `# ${file}\n\nContent of ${file}...\n\nEdit this file!`;
            }}
            limit={20}
          />
        </Pane>

        {/* Middle Pane - Text Editor */}
        <Pane minSize={30}>
          <Text bold color="cyan">
            Editor
          </Text>
          <TextArea
            value={fileContent.value}
            onChange={(newValue) => {
              fileContent.value = newValue;
              statusMessage.value = 'File modified';
            }}
            rows={20}
            cols={60}
            showLineNumbers
            placeholder="Select a file to edit..."
          />
        </Pane>

        {/* Right Pane - Preview/Info */}
        <Pane minSize={20}>
          <Text bold color="cyan">
            Preview
          </Text>
          <Text>
            {() => `File: ${files[selectedFileIndex.value]}`}
          </Text>
          <Text dimColor>
            {() => `Lines: ${fileContent.value.split('\n').length}`}
          </Text>
          <Text dimColor>
            {() => `Chars: ${fileContent.value.length}`}
          </Text>

          <Text marginTop={2}>Keyboard Shortcuts:</Text>
          <Text dimColor>F1-F4: Menu items</Text>
          <Text dimColor>↑↓: Navigate list</Text>
          <Text dimColor>[]: Resize panes</Text>
          <Text dimColor>Tab: Switch focus</Text>
        </Pane>
      </Splitter>

      {/* Status Bar */}
      <Text backgroundColor="blue" color="white">
        {() => ` ${statusMessage.value} `}
      </Text>
    </FullscreenLayout>
  );
}

await renderApp(() => AdvancedDemo(), {
  fps: 10,
  fullscreen: true,
  mouse: true,
});
