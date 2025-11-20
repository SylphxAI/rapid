#!/usr/bin/env bun
/**
 * Debug test for Context re-parenting
 */

import { createContext, getNodeOwner, getOwner, signal, useContext } from '@zen/runtime';

const TestContext = createContext({ value: 'default' });

function TestProvider(props: { children: any }) {
  const _owner = getOwner();

  return (
    <TestContext.Provider value={{ value: 'provided' }}>{props.children}</TestContext.Provider>
  );
}

function TestChild() {
  const _owner = getOwner();

  const _ctx = useContext(TestContext);

  return <box>Child</box>;
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
import { renderToTerminal } from '@zen/tui';
const _output = renderToTerminal(<App />);
