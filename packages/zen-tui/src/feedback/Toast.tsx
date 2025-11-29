/** @jsxImportSource @zen/tui */
/**
 * Toast/Notification Component
 *
 * Displays temporary notifications that auto-dismiss.
 * Supports different types (success, error, warning, info).
 */

import { For, Show, createUniqueId } from '@zen/runtime';
import { effect, onCleanup, signal } from '@zen/signal';
import { useTerminalSize } from '../hooks/useTerminalSize.js';
import { Box } from '../primitives/Box.js';
import { Text } from '../primitives/Text.js';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
  /** Duration in milliseconds (default: 3000) */
  duration?: number;
}

export interface ToastProps {
  /** Position on screen */
  position?:
    | 'top-right'
    | 'top-left'
    | 'bottom-right'
    | 'bottom-left'
    | 'top-center'
    | 'bottom-center';
  /** Maximum width of toast (default: 40) */
  maxWidth?: number;
}

// Global toast store
const toastStore = signal<ToastMessage[]>([]);

/**
 * Show a toast notification
 *
 * @example
 * ```tsx
 * toast.success('File saved successfully!');
 * toast.error('Failed to save file');
 * toast.warning('Unsaved changes');
 * toast.info('Press Ctrl+S to save');
 * ```
 */
export const toast = {
  /**
   * Show a toast message
   */
  show(type: ToastType, message: string, duration = 3000): string {
    const id = `toast-${createUniqueId()}`;
    const newToast: ToastMessage = { id, type, message, duration };

    toastStore.value = [...toastStore.value, newToast];

    // Auto dismiss
    if (duration > 0) {
      setTimeout(() => {
        toast.dismiss(id);
      }, duration);
    }

    return id;
  },

  success(message: string, duration = 3000): string {
    return toast.show('success', message, duration);
  },

  error(message: string, duration = 5000): string {
    return toast.show('error', message, duration);
  },

  warning(message: string, duration = 4000): string {
    return toast.show('warning', message, duration);
  },

  info(message: string, duration = 3000): string {
    return toast.show('info', message, duration);
  },

  /**
   * Dismiss a specific toast
   */
  dismiss(id: string): void {
    toastStore.value = toastStore.value.filter((t) => t.id !== id);
  },

  /**
   * Dismiss all toasts
   */
  dismissAll(): void {
    toastStore.value = [];
  },
};

/**
 * Get icon for toast type
 */
function getToastIcon(type: ToastType): string {
  switch (type) {
    case 'success':
      return '✓';
    case 'error':
      return '✗';
    case 'warning':
      return '⚠';
    case 'info':
      return 'ℹ';
  }
}

/**
 * Get color for toast type
 */
function getToastColor(type: ToastType): string {
  switch (type) {
    case 'success':
      return 'green';
    case 'error':
      return 'red';
    case 'warning':
      return 'yellow';
    case 'info':
      return 'cyan';
  }
}

/**
 * Toast Container Component
 *
 * Place this at the root of your app to display toasts.
 *
 * @example
 * ```tsx
 * function App() {
 *   return (
 *     <Box>
 *       <YourContent />
 *       <ToastContainer position="top-right" />
 *     </Box>
 *   );
 * }
 * ```
 */
export function ToastContainer(props: ToastProps) {
  const { position = 'top-right', maxWidth = 40 } = props;

  const { width: termWidth, height: termHeight } = useTerminalSize();

  // Determine alignment based on position
  const alignItems = position.includes('right')
    ? 'flex-end'
    : position.includes('left')
      ? 'flex-start'
      : 'center';
  const justifyContent = position.includes('top') ? 'flex-start' : 'flex-end';

  return (
    <Box
      style={{
        width: termWidth,
        height: termHeight,
        flexDirection: 'column',
        alignItems,
        justifyContent,
        padding: 1,
      }}
    >
      <For each={() => toastStore.value}>
        {(toastMsg) => {
          const color = getToastColor(toastMsg.type);
          const icon = getToastIcon(toastMsg.type);
          return (
            <Box
              style={{
                maxWidth,
                borderStyle: 'round',
                borderColor: color,
                paddingX: 1,
                marginY: 0,
              }}
            >
              <Box style={{ flexDirection: 'row', gap: 1 }}>
                <Text style={{ color, bold: true }}>{icon}</Text>
                <Text>{toastMsg.message}</Text>
              </Box>
            </Box>
          );
        }}
      </For>
    </Box>
  );
}

/**
 * Single Toast Component (for manual placement)
 */
export interface SingleToastProps {
  type: ToastType;
  message: string;
  onDismiss?: () => void;
}

export function Toast(props: SingleToastProps) {
  const { type, message, onDismiss } = props;
  const color = getToastColor(type);
  const icon = getToastIcon(type);

  return (
    <Box
      style={{
        borderStyle: 'round',
        borderColor: color,
        paddingX: 1,
      }}
      onClick={onDismiss}
    >
      <Box style={{ flexDirection: 'row', gap: 1 }}>
        <Text style={{ color, bold: true }}>{icon}</Text>
        <Text>{message}</Text>
        <Show when={onDismiss}>
          <Text style={{ dim: true }}> [x]</Text>
        </Show>
      </Box>
    </Box>
  );
}
