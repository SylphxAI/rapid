/**
 * @zen/compiler - Optional JSX transformer for Zen
 *
 * Transforms JSX to enable:
 * 1. Auto-lazy children: <Show><Child /></Show> → <Show>{() => <Child />}</Show>
 * 2. Signal auto-unwrap: {signal} → {() => signal.value}
 *
 * Platform-agnostic - works with @zen/web, @zen/native, @zen/tui
 */

export { default as vitePlugin } from './vite/index.js';
// export { default as webpackPlugin } from './webpack/index.js';
// export { default as metroPlugin } from './metro/index.js';

export type { CompilerOptions } from './core/types.js';
