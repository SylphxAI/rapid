/**
 * Webpack plugin for @zen/signal-react
 *
 * Re-exports unplugin-zen-signal with React preset
 */

import { unplugin } from 'unplugin-zen-signal';
import type { Options } from 'unplugin-zen-signal';

/**
 * Webpack plugin for Zen Signals in React
 *
 * @example
 * ```ts
 * // webpack.config.js
 * const { zenSignal } = require('@zen/signal-react/webpack');
 *
 * module.exports = {
 *   plugins: [zenSignal()]
 * };
 * ```
 */
export const zenSignal = (options: Omit<Options, 'framework'> = {}) =>
  unplugin.webpack({ framework: 'react', ...options });

export default zenSignal;
