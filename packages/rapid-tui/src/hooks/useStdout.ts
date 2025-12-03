/**
 * useStdout hook - Ink-compatible stdout access
 *
 * Provides access to the stdout stream for advanced use cases.
 */

import process from 'node:process';

export interface StdoutContext {
  /** The stdout stream (process.stdout by default) */
  readonly stdout: NodeJS.WriteStream;

  /**
   * Write any string to stdout while preserving the TUI output.
   * Useful for logging or displaying information outside of the
   * normal rendering flow.
   */
  readonly write: (data: string) => void;
}

/**
 * Hook to access stdout stream (Ink-compatible API)
 *
 * Use this when you need to write directly to stdout outside of
 * the normal rendering flow.
 *
 * @example
 * ```tsx
 * import { useStdout } from '@rapid/tui';
 *
 * function MyComponent() {
 *   const { write } = useStdout();
 *
 *   const handleExport = () => {
 *     // Write directly to stdout (useful for piping)
 *     write(JSON.stringify(data));
 *   };
 *
 *   return <Button onPress={handleExport}>Export</Button>;
 * }
 * ```
 */
export function useStdout(): StdoutContext {
  const stdout = process.stdout;

  return {
    stdout,
    write: (data: string) => {
      stdout.write(data);
    },
  };
}
