/** @jsxImportSource @zen/tui */
/**
 * Modal Component Test
 *
 * Test modal dialogs with keyboard navigation.
 * Run with: bun run src/test-modal.tsx
 */

import { signal } from '@zen/signal';
import {
  AlertDialog, Box, ConfirmDialog, Modal, Text, useInput, renderApp, FullscreenLayout} from '@zen/tui';

function ModalTest() {
  const showModal = signal(false);
  const showConfirm = signal(false);
  const showAlert = signal(false);
  const lastAction = signal('None');

  // Keyboard shortcuts
  useInput((input, _key) => {
    if (showModal.value || showConfirm.value || showAlert.value) return;
    if (input === '1') showModal.value = true;
    if (input === '2') showConfirm.value = true;
    if (input === '3') showAlert.value = true;
  });

  return (
    <Box style={{ flexDirection: 'column', padding: 1 }}>
      <Text style={{ bold: true, color: 'cyan' }}>Modal Component Test</Text>
      <Text> </Text>
      <Text>Press keys to open modals:</Text>
      <Text> [1] Custom Modal</Text>
      <Text> [2] Confirm Dialog</Text>
      <Text> [3] Alert Dialog</Text>
      <Text> </Text>
      <Text>Last action: {() => lastAction.value}</Text>
      <Text> </Text>
      <Text style={{ dim: true }}>Press 'q' to quit</Text>

      {/* Custom Modal */}
      {() =>
        showModal.value && (
          <Modal
            open={true}
            title="Custom Modal"
            onClose={() => {
              showModal.value = false;
              lastAction.value = 'Modal closed';
            }}
          >
            <Text>This is a custom modal dialog.</Text>
            <Text> </Text>
            <Text style={{ dim: true }}>Press ESC to close.</Text>
          </Modal>
        )
      }

      {/* Confirm Dialog */}
      {() =>
        showConfirm.value && (
          <ConfirmDialog
            open={true}
            title="Confirm Delete"
            message="Are you sure you want to delete this item?"
            onConfirm={() => {
              showConfirm.value = false;
              lastAction.value = 'Confirm: YES clicked';
            }}
            onCancel={() => {
              showConfirm.value = false;
              lastAction.value = 'Confirm: NO clicked';
            }}
          />
        )
      }

      {/* Alert Dialog */}
      {() =>
        showAlert.value && (
          <AlertDialog
            open={true}
            title="Success"
            message="Operation completed successfully!"
            onClose={() => {
              showAlert.value = false;
              lastAction.value = 'Alert: OK clicked';
            }}
          />
        )
      }
    </Box>
  );
}

await renderApp(() => (
  <FullscreenLayout>
    <ModalTest />
  </FullscreenLayout>
));
