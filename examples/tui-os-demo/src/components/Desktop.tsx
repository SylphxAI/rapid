/**
 * Desktop component - Background with icons
 */

import { Box, For, Text, useMouseClick, useTerminalSize } from '@rapid/tui';
import { $desktopIcons, openWindow } from '../window-manager.js';

export function Desktop() {
  const size = useTerminalSize();

  // Handle double-click on icons (simulated with single click for TUI)
  useMouseClick((event) => {
    const icons = $desktopIcons.value;
    for (const icon of icons) {
      // Check if click is on icon (2x3 area for icon + name)
      if (event.x >= icon.x && event.x < icon.x + 12 && event.y >= icon.y && event.y < icon.y + 2) {
        openWindow(icon.app);
        return;
      }
    }
  });

  return (
    <Box width={size.columns} height={size.rows - 2} backgroundColor="black" position="relative">
      {/* Desktop Pattern/Wallpaper */}
      <Box position="absolute" left={0} top={0} width="100%" height="100%">
        <For each={$desktopIcons.value}>
          {(icon) => (
            <Box
              position="absolute"
              left={icon.x}
              top={icon.y}
              flexDirection="column"
              alignItems="center"
            >
              <Text>{icon.icon}</Text>
              <Text color="white" dimColor>
                {icon.name}
              </Text>
            </Box>
          )}
        </For>
      </Box>

      {/* Decorative wallpaper elements */}
      <Box position="absolute" right={3} bottom={2}>
        <Text color="gray" dimColor>
          ZenOS v1.0
        </Text>
      </Box>
    </Box>
  );
}
