#!/usr/bin/env bun
/**
 * Test Context value propagation with lazy children
 */

import { createContext, useContext } from '@zen/runtime';
import { renderToTerminal } from '@zen/tui';

const TestContext = createContext({ value: 'default' });

function TestChild() {
  const ctx = useContext(TestContext);
  console.log('Context value in child:', ctx.value);
  return <box>Child sees: {ctx.value}</box>;
}

function TestProvider(props: { children: any }) {
  return (
    <TestContext.Provider value={{ value: 'provided' }}>{props.children}</TestContext.Provider>
  );
}

function App() {
  return (
    <box>
      <TestProvider>
        <TestChild />
      </TestProvider>
    </box>
  );
}

// Render
const output = renderToTerminal(<App />);
console.log('Output:', output);

// Verify success
if (output.includes('provided')) {
  console.log('✅ SUCCESS: Context propagated correctly!');
  process.exit(0);
} else {
  console.log('❌ FAILURE: Context value not found in output');
  process.exit(1);
}
