/**
 * Simplest possible fullscreen test
 */

import { Text, renderApp, FullscreenLayout} from '@zen/tui';

// Simplest possible component
function App() {
  return <Text color="cyan">Hello Fullscreen!</Text>;
}

// Without fullscreen
// await renderApp(() => (
  <FullscreenLayout>
    <App />);

// With fullscreen
await renderApp(() => <App />
  </FullscreenLayout>
));

// Keep alive
await new Promise(() => {});
