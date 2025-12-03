/**
 * useStderr hook - Ink-compatible stderr access
 *
 * Provides access to the stderr stream for error output.
 */

import process from 'node:process';

export interface StderrContext {
  /** The stderr stream (process.stderr by default) */
  readonly stderr: NodeJS.WriteStream;

  /**
   * Write any string to stderr.
   * Useful for error logging that shouldn't interfere with stdout.
   */
  readonly write: (data: string) => void;
}

/**
 * Hook to access stderr stream (Ink-compatible API)
 *
 * Use this when you need to write error output separately from
 * the normal TUI rendering.
 *
 * @example
 * ```tsx
 * import { useStderr } from '@rapid/tui';
 *
 * function MyComponent() {
 *   const { write } = useStderr();
 *
 *   const handleError = (err: Error) => {
 *     write(`Error: ${err.message}\n`);
 *   };
 *
 *   return <ErrorBoundary onError={handleError}>...</ErrorBoundary>;
 * }
 * ```
 */
export function useStderr(): StderrContext {
  const stderr = process.stderr;

  return {
    stderr,
    write: (data: string) => {
      stderr.write(data);
    },
  };
}
