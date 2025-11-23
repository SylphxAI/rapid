/**
 * Simplest possible fullscreen test
 */

import { Text, renderToTerminalReactive } from '@zen/tui';

// Simplest possible component
function App() {
  return <Text color="cyan">Hello Fullscreen!</Text>;
}

// Without fullscreen
// await renderToTerminalReactive(() => <App />);

// With fullscreen
await renderToTerminalReactive(() => <App />, { fullscreen: true });

// Keep alive
await new Promise(() => {});
