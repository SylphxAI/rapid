/**
 * Simplest possible inline test (no fullscreen)
 */

import { Text, renderApp} from '@zen/tui';

// Simplest possible component
function App() {
  return <Text color="cyan">Hello Inline Mode!</Text>;
}

//Without fullscreen
await renderApp(() => <App />);

// Keep alive
await new Promise(() => {});
