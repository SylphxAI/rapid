#!/usr/bin/env bun
/** @jsxImportSource @zen/tui */
/**
 * Test Password Input (TextInput with mask)
 */

import { signal } from '@zen/signal';
import {
  Box,
  Button,
  FocusProvider,
  StatusMessage,
  Text,
  TextInput,
  renderToTerminalReactive,
} from '@zen/tui';

const username = signal('');
const password = signal('');
const result = signal<string | null>(null);

function App() {
  const handleLogin = () => {
    if (username.value.length === 0 || password.value.length === 0) {
      result.value = 'error';
      return;
    }
    result.value = 'success';
  };

  return (
    <Box style={{ flexDirection: 'column', padding: 1 }}>
      <Text bold color="cyan" style={{ marginBottom: 2 }}>
        Login Form
      </Text>

      <Text style={{ marginBottom: 0 }}>Username:</Text>
      <TextInput
        id="username"
        value={username}
        placeholder="Enter username..."
        width={40}
        style={{ marginBottom: 1 }}
      />

      <Text style={{ marginBottom: 0 }}>Password:</Text>
      <TextInput
        id="password"
        value={password}
        placeholder="Enter password..."
        mask="*"
        width={40}
        style={{ marginBottom: 2 }}
      />

      <Button id="login-btn" label="Login" onPress={handleLogin} />

      {() => {
        if (result.value === 'success') {
          return (
            <StatusMessage type="success" style={{ marginTop: 1 }}>
              Login successful! Welcome, {username.value}
            </StatusMessage>
          );
        }
        if (result.value === 'error') {
          return (
            <StatusMessage type="error" style={{ marginTop: 1 }}>
              Please enter both username and password
            </StatusMessage>
          );
        }
        return null;
      }}

      <Text dim style={{ marginTop: 2 }}>
        Use Tab to switch fields • Enter to submit • Ctrl+C to exit
      </Text>
    </Box>
  );
}

await renderToTerminalReactive(
  () => (
    <FocusProvider>
      <App />
    </FocusProvider>
  ),
  { fps: 10 },
);
