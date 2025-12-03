/**
 * Compiler configuration options
 */
export interface CompilerOptions {
  /**
   * Enable auto-lazy children transformation (deprecated - use universalLazyChildren)
   * <Show><Child /></Show> → <Show>{() => <Child />}</Show>
   * @default true
   * @deprecated Use universalLazyChildren for all components
   */
  autoLazy?: boolean;

  /**
   * Enable universal lazy children transformation
   * Transforms ALL component children to lazy getters:
   * jsx(Parent, { children: jsx(Child, {}) })
   * → jsx(Parent, { get children() { return jsx(Child, {}) } })
   *
   * This enables correct Context propagation without manual children() helper.
   * @default true
   */
  universalLazyChildren?: boolean;

  /**
   * Enable signal auto-unwrap transformation
   * {signal.value} → {() => signal.value}
   * @default true
   */
  autoUnwrap?: boolean;

  /**
   * Components that should have lazy children (deprecated)
   * @default ['Show', 'For', 'Switch', 'Match', 'Suspense', 'ErrorBoundary']
   * @deprecated Use universalLazyChildren instead
   */
  lazyComponents?: string[];

  /**
   * Custom signal detection (for custom signal implementations)
   * @default (name) => name.endsWith('Signal') || name === 'signal'
   */
  isSignal?: (name: string) => boolean;

  /**
   * JSX importSource for platform-specific jsx-runtime
   * @example '@rapid/web', '@rapid/tui', '@rapid/native'
   */
  importSource?: string;
}
