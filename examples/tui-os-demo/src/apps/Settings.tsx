/**
 * Settings App
 */

import { Box, Checkbox, For, Text, signal, useInput } from '@rapid/tui';

interface Setting {
  id: string;
  label: string;
  type: 'toggle' | 'select';
  value: boolean | string;
  options?: string[];
}

export function Settings() {
  const selectedIndex = signal(0);

  const settings = signal<Setting[]>([
    { id: 'darkMode', label: 'Dark Mode', type: 'toggle', value: true },
    { id: 'sounds', label: 'System Sounds', type: 'toggle', value: true },
    { id: 'animations', label: 'Animations', type: 'toggle', value: true },
    { id: 'autoUpdate', label: 'Auto Update', type: 'toggle', value: false },
    { id: 'notifications', label: 'Notifications', type: 'toggle', value: true },
    { id: 'bluetooth', label: 'Bluetooth', type: 'toggle', value: false },
    { id: 'wifi', label: 'WiFi', type: 'toggle', value: true },
    { id: 'accessibility', label: 'Accessibility', type: 'toggle', value: false },
  ]);

  useInput((input, key) => {
    if (key.upArrow) {
      selectedIndex.value = Math.max(0, selectedIndex.value - 1);
    } else if (key.downArrow) {
      selectedIndex.value = Math.min(settings.value.length - 1, selectedIndex.value + 1);
    } else if (key.return || input === ' ') {
      const current = settings.value[selectedIndex.value];
      if (current.type === 'toggle') {
        settings.value = settings.value.map((s, i) =>
          i === selectedIndex.value ? { ...s, value: !s.value } : s,
        );
      }
    }
  });

  return (
    <Box flexDirection="column" width="100%" height="100%">
      {/* Header */}
      <Box paddingX={1} paddingY={1}>
        <Text color="white" bold>
          ⚙️ System Settings
        </Text>
      </Box>

      {/* Settings List */}
      <Box flexDirection="column" flex={1} paddingX={1}>
        <For each={settings.value}>
          {(setting, index) => (
            <Box
              paddingX={1}
              paddingY={0}
              backgroundColor={() => (index() === selectedIndex.value ? 'blue' : 'black')}
              justifyContent="space-between"
            >
              <Text color="white">{setting.label}</Text>
              {setting.type === 'toggle' && (
                <Text color={() => (setting.value ? 'green' : 'red')}>
                  {setting.value ? '● ON' : '○ OFF'}
                </Text>
              )}
            </Box>
          )}
        </For>
      </Box>

      {/* Footer */}
      <Box backgroundColor="gray" paddingX={1} justifyContent="space-between">
        <Text color="white">↑↓ Navigate</Text>
        <Text color="white">Space/Enter: Toggle</Text>
      </Box>
    </Box>
  );
}
