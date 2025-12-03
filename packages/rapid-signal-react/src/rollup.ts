/**
 * Rollup plugin for @rapid/signal-react
 *
 * Re-exports unplugin-rapid-signal with React preset
 */

import { unplugin } from 'unplugin-rapid-signal';
import type { Options } from 'unplugin-rapid-signal';

/**
 * Rollup plugin for Zen Signals in React
 *
 * @example
 * ```ts
 * // rollup.config.js
 * import { zenSignal } from '@rapid/signal-react/rollup';
 *
 * export default {
 *   plugins: [zenSignal()]
 * };
 * ```
 */
export const zenSignal = (options: Omit<Options, 'framework'> = {}) =>
  unplugin.rollup({ framework: 'react', ...options });

export default zenSignal;
