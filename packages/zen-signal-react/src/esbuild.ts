/**
 * esbuild plugin for @zen/signal-react
 *
 * Re-exports unplugin-zen-signal with React preset
 */

import { unplugin } from 'unplugin-zen-signal';
import type { Options } from 'unplugin-zen-signal';

/**
 * esbuild plugin for Zen Signals in React
 *
 * @example
 * ```ts
 * // esbuild.config.js
 * import { zenSignal } from '@zen/signal-react/esbuild';
 *
 * build({
 *   plugins: [zenSignal()]
 * });
 * ```
 */
export const zenSignal = (options: Omit<Options, 'framework'> = {}) =>
  unplugin.esbuild({ framework: 'react', ...options });

export default zenSignal;
