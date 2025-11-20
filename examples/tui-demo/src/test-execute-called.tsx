#!/usr/bin/env bun
/**
 * Test if executeComponent is actually being called
 */

import { getOwner } from '@zen/runtime';

function TestComponent() {
  return <box>Test</box>;
}

function App() {
  return (
    <box>
      <TestComponent />
    </box>
  );
}

// Render
import { renderToTerminal } from '@zen/tui';
const _output = renderToTerminal(<App />);
