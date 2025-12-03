/**
 * TaskBar component - Bottom bar showing open windows
 */

import { Box, For, Text, computed, useTerminalSize } from '@rapid/tui';
import {
  $focusedWindowId,
  $taskbarItems,
  $windows,
  focusWindow,
  minimizeWindow,
} from '../window-manager.js';

export function TaskBar() {
  const size = useTerminalSize();

  // Current time
  const time = computed(() => {
    const now = new Date();
    return now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  });

  const _date = computed(() => {
    const now = new Date();
    return now.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  });

  // Handle taskbar item click
  const handleItemClick = (id: string, isMinimized: boolean) => {
    if (isMinimized) {
      focusWindow(id);
    } else if ($focusedWindowId.value === id) {
      minimizeWindow(id);
    } else {
      focusWindow(id);
    }
  };

  return (
    <Box
      width={size.columns}
      height={2}
      backgroundColor="gray"
      borderStyle="single"
      borderTop
      borderLeft={false}
      borderRight={false}
      borderBottom={false}
      borderColor="white"
      justifyContent="space-between"
      paddingX={1}
    >
      {/* Start Menu Button */}
      <Box gap={1} alignItems="center">
        <Box paddingX={1} backgroundColor="blue">
          <Text color="white" bold>
            🚀 Start
          </Text>
        </Box>

        {/* Separator */}
        <Text color="white">│</Text>

        {/* Open Windows */}
        <Box gap={1}>
          <For each={$taskbarItems.value}>
            {(item) => (
              <Box
                paddingX={1}
                backgroundColor={() =>
                  item.isFocused ? 'blue' : item.isMinimized ? 'black' : 'gray'
                }
                onClick={() => handleItemClick(item.id, item.isMinimized)}
              >
                <Text
                  color={() => (item.isFocused ? 'white' : 'white')}
                  dimColor={() => item.isMinimized}
                >
                  {item.icon} {item.title.slice(0, 12)}
                </Text>
              </Box>
            )}
          </For>
        </Box>
      </Box>

      {/* System Tray */}
      <Box gap={2} alignItems="center">
        <Text color="white">🔊</Text>
        <Text color="white">🔋</Text>
        <Text color="white">📶</Text>
        <Text color="white">│</Text>
        <Box flexDirection="column" alignItems="flex-end">
          <Text color="white">{time}</Text>
        </Box>
      </Box>
    </Box>
  );
}
