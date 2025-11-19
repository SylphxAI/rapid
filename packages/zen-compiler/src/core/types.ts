/**
 * Compiler configuration options
 */
export interface CompilerOptions {
  /**
   * Enable auto-lazy children transformation
   * <Show><Child /></Show> → <Show>{() => <Child />}</Show>
   * @default true
   */
  autoLazy?: boolean;

  /**
   * Enable signal auto-unwrap transformation
   * {signal} → {() => signal.value}
   * @default true
   */
  autoUnwrap?: boolean;

  /**
   * Components that should have lazy children
   * @default ['Show', 'For', 'Switch', 'Match', 'Suspense', 'ErrorBoundary']
   */
  lazyComponents?: string[];

  /**
   * Custom signal detection (for custom signal implementations)
   * @default (name) => name.endsWith('Signal') || name === 'signal'
   */
  isSignal?: (name: string) => boolean;
}
