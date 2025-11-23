#!/usr/bin/env bun
/**
 * Test Confirmation Component
 */

import { signal } from '@zen/tui';
import { Box, Text, Confirmation, FocusProvider, StatusMessage } from '@zen/tui';
import { render } from '@zen/tui';

const result = signal<string | null>(null);

function App() {
  const handleConfirm = () => {
    result.value = 'confirmed';
    console.log('User confirmed!');
    setTimeout(() => process.exit(0), 1000);
  };

  const handleCancel = () => {
    result.value = 'cancelled';
    console.log('User cancelled.');
    setTimeout(() => process.exit(0), 1000);
  };

  return (
    <FocusProvider>
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
    </FocusProvider>
  );
}

render(<App />);
