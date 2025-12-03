/**
 * useStdin hook - Ink-compatible stdin access
 *
 * Provides access to the stdin stream for advanced use cases.
 * Most applications should use useInput() instead.
 */

import process from 'node:process';

export interface StdinContext {
  /** The stdin stream (process.stdin by default) */
  readonly stdin: NodeJS.ReadStream;

  /**
   * Enable or disable raw mode on stdin.
   * Raw mode is automatically managed by useInput(), so you typically
   * don't need to call this directly.
   */
  readonly setRawMode: (value: boolean) => void;

  /**
   * Whether the current stdin supports raw mode.
   * When false, keyboard input handling may be limited.
   */
  readonly isRawModeSupported: boolean;
}

/**
 * Hook to access stdin stream (Ink-compatible API)
 *
 * Most applications should use useInput() for keyboard handling.
 * This hook is for advanced use cases that need direct stdin access.
 *
 * @example
 * ```tsx
 * import { useStdin } from '@rapid/tui';
 *
 * function MyComponent() {
 *   const { stdin, isRawModeSupported, setRawMode } = useStdin();
 *
 *   if (!isRawModeSupported) {
 *     return <Text>Raw mode not supported</Text>;
 *   }
 *
 *   // Direct stdin access for advanced use cases
 *   stdin.on('data', (data) => {
 *     // Handle raw data
 *   });
 * }
 * ```
 */
export function useStdin(): StdinContext {
  const stdin = process.stdin;

  return {
    stdin,
    isRawModeSupported: Boolean(stdin.isTTY),
    setRawMode: (value: boolean) => {
      if (stdin.isTTY && stdin.setRawMode) {
        stdin.setRawMode(value);
      }
    },
  };
}
