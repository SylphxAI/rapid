/**
 * Simple Demo - No Colors
 * 測試基本渲染，唔用顏色
 */

import { signal, renderApp} from '@zen/tui';
import { Box, Text } from '@zen/tui';

const count = signal(0);

// 每秒更新
setInterval(() => {
  count.value++;
}, 1000);

function App() {
  return (
    <Box
      style={{
        width: 50, height: 10, padding: 1, borderStyle: 'single'}}
    >
      <Text>Zen TUI Demo</Text>
      <Text>Counter: {count}</Text>
      <Text>Press q to quit</Text>
    </Box>
  );
}

await renderApp(() => <App />, { fps: 10 });
