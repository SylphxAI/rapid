/** @jsxImportSource @zen/tui */
/**
 * Component Test - Simple test for each @zen/tui-advanced component
 */

import { Box, MouseProvider, Text, renderApp, signal, useInput } from '@zen/tui';
import { List, MenuBar, Pane, Splitter, TextArea } from '@zen/tui-advanced';

function ComponentTest() {
  const activeTab = signal(0);
  const tabs = ['List', 'Splitter', 'TextArea', 'MenuBar', 'All'];

  useInput((input, key) => {
    // Use number keys 1-5 to switch tabs (avoid conflict with TextArea arrow keys)
    if (input >= '1' && input <= '5') {
      activeTab.value = Number.parseInt(input, 10) - 1;
    } else if (key.tab && !key.shift) {
      // Tab to go forward
      activeTab.value = (activeTab.value + 1) % tabs.length;
    } else if (key.tab && key.shift) {
      // Shift+Tab to go backward
      activeTab.value = (activeTab.value - 1 + tabs.length) % tabs.length;
    }
  });

  return (
    <MouseProvider>
      <Box style={{ flexDirection: 'column', width: '100%', height: '100%' }}>
        {/* Header */}
        <Box style={{ backgroundColor: 'blue', height: 1, paddingLeft: 1 }}>
          <Text style={{ color: 'white', bold: true }}>
            @zen/tui-advanced Component Test - Use 1-5 or Tab to switch tabs
          </Text>
        </Box>

        {/* Tab Bar */}
        <Box
          style={{
            flexDirection: 'row',
            backgroundColor: 'gray',
            height: 1,
            gap: 2,
            paddingLeft: 1,
          }}
        >
          {tabs.map((tab, i) => (
            <Text
              key={tab}
              style={{
                color: activeTab.value === i ? 'yellow' : 'white',
                bold: activeTab.value === i,
              }}
            >
              [{i + 1}] {tab}
            </Text>
          ))}
        </Box>

        {/* Content */}
        <Box style={{ flex: 1, padding: 1 }}>
          {() => {
            switch (activeTab.value) {
              case 0:
                return <ListTest />;
              case 1:
                return <SplitterTest />;
              case 2:
                return <TextAreaTest />;
              case 3:
                return <MenuBarTest />;
              case 4:
                return <AllTest />;
              default:
                return <Text>Select a tab</Text>;
            }
          }}
        </Box>

        {/* Footer */}
        <Box style={{ backgroundColor: 'blue', height: 1, paddingLeft: 1 }}>
          <Text style={{ color: 'white' }}>Press q to quit | 1-5 or Tab to switch tabs</Text>
        </Box>
      </Box>
    </MouseProvider>
  );
}

// Test 1: List
function ListTest() {
  const items = ['Apple', 'Banana', 'Cherry', 'Date', 'Elderberry'];
  const selectedIndex = signal(0);

  return (
    <Box style={{ flexDirection: 'column', gap: 1 }}>
      <Text style={{ bold: true, color: 'cyan' }}>List Component Test:</Text>
      <List
        items={items}
        selectedIndex={selectedIndex.value}
        onSelect={(_item, index) => {
          selectedIndex.value = index;
        }}
      />
      <Text style={{ dim: true }}>Use ↑↓ to navigate, Enter to select</Text>
    </Box>
  );
}

// Test 2: Splitter
function SplitterTest() {
  return (
    <Box style={{ flexDirection: 'column', gap: 1 }}>
      <Text style={{ bold: true, color: 'cyan' }}>Splitter Component Test:</Text>
      <Box style={{ height: 10 }}>
        <Splitter orientation="horizontal" sizes={[30, 70]}>
          <Pane minSize={10}>
            <Text style={{ color: 'green' }}>Left Pane (30%)</Text>
            <Text>Content A</Text>
          </Pane>
          <Pane minSize={20}>
            <Text style={{ color: 'yellow' }}>Right Pane (70%)</Text>
            <Text>Content B</Text>
          </Pane>
        </Splitter>
      </Box>
      <Text style={{ dim: true }}>Use [ and ] to resize panes</Text>
    </Box>
  );
}

// Test 3: TextArea
function TextAreaTest() {
  const text = signal('Hello World!\nThis is a multi-line\ntext editor test.');

  return (
    <Box style={{ flexDirection: 'column', gap: 1 }}>
      <Text style={{ bold: true, color: 'cyan' }}>TextArea Component Test:</Text>
      <TextArea
        value={text.value}
        onChange={(v) => {
          text.value = v;
        }}
        rows={8}
        cols={50}
        showLineNumbers
      />
      <Text style={{ dim: true }}>Type to edit, arrows to move cursor</Text>
    </Box>
  );
}

// Test 4: MenuBar
function MenuBarTest() {
  const status = signal('Ready');

  // Use arrow keys + Enter for menu navigation (F-keys need Fn on macOS)
  const menuItems = [
    {
      label: 'File',
      onSelect: () => {
        status.value = 'File clicked!';
      },
    },
    {
      label: 'Edit',
      onSelect: () => {
        status.value = 'Edit clicked!';
      },
    },
    {
      label: 'View',
      onSelect: () => {
        status.value = 'View clicked!';
      },
    },
    {
      label: 'Help',
      onSelect: () => {
        status.value = 'Help clicked!';
      },
    },
  ];

  return (
    <Box style={{ flexDirection: 'column', gap: 1 }}>
      <Text style={{ bold: true, color: 'cyan' }}>MenuBar Component Test:</Text>
      <MenuBar items={menuItems} />
      <Text>
        Status: <Text style={{ color: 'green' }}>{() => status.value}</Text>
      </Text>
      <Text style={{ dim: true }}>Use ←/→ arrows to navigate, Enter to select</Text>
    </Box>
  );
}

// Test 5: All Together with focus switching
function AllTest() {
  const files = ['index.ts', 'app.tsx', 'utils.ts', 'config.json'];
  const selectedFile = signal(0);
  const content = signal('// Select a file to edit\n');
  // Focus: 0 = List, 1 = TextArea
  const focusedPane = signal(0);

  // Handle focus switching with [ ] keys or Escape
  useInput((input, key) => {
    // [ to focus file list, ] to focus editor
    if (input === '[') {
      focusedPane.value = 0;
      return true;
    }
    if (input === ']') {
      focusedPane.value = 1;
      return true;
    }
    // Escape to focus List (file browser)
    if (key.escape) {
      focusedPane.value = 0;
      return true;
    }
    // Enter on List focuses TextArea
    if (key.return && focusedPane.value === 0) {
      focusedPane.value = 1;
      // Don't consume - let List also handle Enter
    }
    return false;
  });

  return (
    <Box style={{ flexDirection: 'column', height: '100%' }}>
      <MenuBar
        items={[{ label: 'New' }, { label: 'Open' }, { label: 'Save' }, { label: 'Quit' }]}
      />
      <Box style={{ flex: 1 }}>
        <Splitter orientation="horizontal" sizes={[25, 75]}>
          <Pane minSize={15}>
            <Box style={{ flexDirection: 'column' }}>
              {() => (
                <Text style={{ bold: true, color: focusedPane.value === 0 ? 'cyan' : 'gray' }}>
                  Files: {focusedPane.value === 0 ? '(focused)' : ''}
                </Text>
              )}
              {() => (
                <List
                  items={files}
                  selectedIndex={selectedFile.value}
                  isFocused={focusedPane.value === 0}
                  onSelect={(_, i) => {
                    selectedFile.value = i;
                    content.value = `// Content of ${files[i]}\n\nfunction example() {\n  return "Hello";\n}\n`;
                  }}
                />
              )}
            </Box>
          </Pane>
          <Pane minSize={30}>
            <Box style={{ flexDirection: 'column' }}>
              {() => (
                <Text style={{ bold: true, color: focusedPane.value === 1 ? 'cyan' : 'gray' }}>
                  Editor: {focusedPane.value === 1 ? '(focused)' : ''}
                </Text>
              )}
              {() => (
                <TextArea
                  value={content.value}
                  onChange={(v) => {
                    content.value = v;
                  }}
                  rows={12}
                  cols={50}
                  showLineNumbers
                  isFocused={focusedPane.value === 1}
                />
              )}
            </Box>
          </Pane>
        </Splitter>
      </Box>
      <Box style={{ height: 1, backgroundColor: 'gray' }}>
        <Text style={{ dim: true }}>[ file list | ] editor | Esc back | Enter to edit</Text>
      </Box>
    </Box>
  );
}

await renderApp(() => ComponentTest(), {
  fps: 10,
  fullscreen: true,
  mouse: true,
});
