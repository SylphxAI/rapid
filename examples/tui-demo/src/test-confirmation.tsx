#!/usr/bin/env bun
/** @jsxImportSource @zen/tui */
/**
 * Test Confirmation Component
 */

import { signal } from '@zen/signal';
import {
  Box,
  Confirmation,
  FocusProvider,
  StatusMessage,
  Text,
  renderToTerminalReactive,
} from '@zen/tui';

const result = signal<string | null>(null);

function App() {
  const handleConfirm = () => {
    result.value = 'confirmed';
    setTimeout(() => process.exit(0), 1000);
  };

  const handleCancel = () => {
    result.value = 'cancelled';
    setTimeout(() => process.exit(0), 1000);
  };

  return (
    <Box style={{ flexDirection: 'column', padding: 1 }}>
      <Text bold color="cyan" style={{ marginBottom: 2 }}>
        File Deletion Confirmation
      </Text>

      {() => {
        if (result.value === 'confirmed') {
          return <StatusMessage type="success">File deleted successfully!</StatusMessage>;
        }
        if (result.value === 'cancelled') {
          return <StatusMessage type="info">Operation cancelled.</StatusMessage>;
        }
        return (
          <Confirmation
            id="delete-confirm"
            message="Are you sure you want to delete this file? This action cannot be undone."
            onConfirm={handleConfirm}
            onCancel={handleCancel}
            yesLabel="Delete"
            noLabel="Cancel"
            defaultYes={false}
          />
        );
      }}

      <Text dim style={{ marginTop: 2 }}>
        Use Y/N or ←→/hl to choose • Enter to confirm • Ctrl+C to exit
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
