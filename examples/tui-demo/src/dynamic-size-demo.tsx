/**
 * Dynamic Size Demo
 *
 * 測試當 content size (包括高度) 不停變化時，fine-grained updates 係咪仍然有效
 */

import { signal, renderApp} from '@zen/tui';
import { Box, Text } from '@zen/tui';

// 不同數量的行（會改變高度）
const contentVariants = [
  ['單行內容'], ['第一行', '第二行'], ['第一行', '第二行', '第三行'], ['Line 1', 'Line 2', 'Line 3', 'Line 4', 'Line 5'], ['A'], ['Row 1', 'Row 2'], ];

const currentContent = signal(contentVariants[0]);
const counter = signal(0);
let variantIndex = 0;

// 每秒換內容（不同行數，改變高度）
setInterval(() => {
  variantIndex = (variantIndex + 1) % contentVariants.length;
  currentContent.value = contentVariants[variantIndex];
  counter.value++;
}, 1000);

function App() {
  return (
    <Box
      style={{
        width: 70, padding: 2, borderStyle: 'double', borderColor: 'cyan'}}
    >
      <Text style={{ bold: true, color: 'green' }}>🧪 動態大小測試 (Dynamic Size Test)</Text>

      <Box style={{ padding: 1 }}>
        <Text style={{ dim: true }}>觀察：訊息長度不停變化，但只重繪變化的行！</Text>
      </Box>

      <Box
        style={{
          padding: 1, borderStyle: 'single', borderColor: 'blue'}}
      >
        <Text style={{ bold: true }}>動態內容 (高度會變): </Text>
        {currentContent.value.map((line) => (
          <Text key={line} style={{ color: 'yellow' }}>
            {line}
          </Text>
        ))}
      </Box>

      <Box
        style={{
          padding: 1, borderStyle: 'single', borderColor: 'green'}}
      >
        <Text style={{ bold: true }}>更新次數: </Text>
        <Text style={{ color: 'cyan' }}>{counter}</Text>
      </Box>

      <Box style={{ padding: 1 }}>
        <Text style={{ dim: true }}>提示：藍色框會由 1 行變到 5 行，再變返 1 行。</Text>
        <Text style={{ dim: true }}>觀察：只有變化的行會重繪，唔係成個畫面！</Text>
      </Box>

      <Box>
        <Text style={{ dim: true }}>按 q 或 Ctrl+C 退出</Text>
      </Box>
    </Box>
  );
}

// 啟動 reactive 渲染
await renderApp(() => <App />, {
  fps: 10});
