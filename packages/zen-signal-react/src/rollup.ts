/**
 * Rollup plugin for @zen/signal-react
 *
 * Re-exports unplugin-zen-signal with React preset
 */

import { unplugin } from 'unplugin-zen-signal';
import type { Options } from 'unplugin-zen-signal';

/**
 * Rollup plugin for Zen Signals in React
 *
 * @example
 * ```ts
 * // rollup.config.js
 * import { zenSignal } from '@zen/signal-react/rollup';
 *
 * export default {
 *   plugins: [zenSignal()]
 * };
 * ```
 */
export const zenSignal = (options: Omit<Options, 'framework'> = {}) =>
  unplugin.rollup({ framework: 'react', ...options });

export default zenSignal;
