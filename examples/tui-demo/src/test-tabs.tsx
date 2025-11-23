#!/usr/bin/env bun
/**
 * Test Tabs Component
 */

import { signal } from '@zen/tui';
import { Box, Text, Tabs, Tab, FocusProvider } from '@zen/tui';
import { render } from '@zen/tui';

const activeTab = signal(0);

function App() {
  const handleTabChange = (index: number) => {
    console.log(`Tab changed to: ${index}`);
  };

  return (
    <FocusProvider>
      <Box style={{ flexDirection: 'column', padding: 1 }}>
        <Text bold color="cyan" style={{ marginBottom: 1 }}>
          Zen TUI Documentation
        </Text>

        <Tabs
          id="docs"
          activeTab={activeTab}
          onChange={handleTabChange}
          style={{ marginBottom: 1 }}
        >
          <Tab name="Overview">
            <Box style={{ flexDirection: 'column', padding: 1 }}>
              <Text bold>Overview</Text>
              <Text>Zen TUI is a terminal UI framework built on fine-grained reactivity.</Text>
              <Text>• Component-based architecture</Text>
              <Text>• Reactive signal system</Text>
              <Text>• Ink-compatible API</Text>
            </Box>
          </Tab>

          <Tab name="Components">
            <Box style={{ flexDirection: 'column', padding: 1 }}>
              <Text bold>Available Components</Text>
              <Text>• Box, Text, Static</Text>
              <Text>• TextInput, SelectInput, MultiSelect</Text>
              <Text>• Radio, Checkbox, Button</Text>
              <Text>• Tabs, Table, Badge</Text>
              <Text>• Spinner, ProgressBar</Text>
            </Box>
          </Tab>

          <Tab name="Examples">
            <Box style={{ flexDirection: 'column', padding: 1 }}>
              <Text bold>Examples</Text>
              <Text color="cyan">$ bun examples/tui-demo/src/test-radio.tsx</Text>
              <Text color="cyan">$ bun examples/tui-demo/src/test-multiselect.tsx</Text>
              <Text color="cyan">$ bun examples/tui-demo/src/test-tabs.tsx</Text>
            </Box>
          </Tab>

          <Tab name="API">
            <Box style={{ flexDirection: 'column', padding: 1 }}>
              <Text bold>API Reference</Text>
              <Text>import {'{ signal, computed, effect }'} from '@zen/tui';</Text>
              <Text>import {'{ Box, Text, Tabs }'} from '@zen/tui';</Text>
              <Text>import {'{ render }'} from '@zen/tui';</Text>
            </Box>
          </Tab>
        </Tabs>

        <Text dim style={{ marginTop: 1 }}>
          Use ←→/hl or 1-4 to switch tabs • Press Ctrl+C to exit
        </Text>
      </Box>
    </FocusProvider>
  );
}

render(<App />);
