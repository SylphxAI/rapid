/**
 * Vite plugin for @zen/signal-react
 *
 * Re-exports unplugin-zen-signal with React preset
 */

import { unplugin } from 'unplugin-zen-signal';
import type { Options } from 'unplugin-zen-signal';

/**
 * Vite plugin for Zen Signals in React
 *
 * @example
 * ```ts
 * // vite.config.ts
 * import { zenSignal } from '@zen/signal-react/vite';
 *
 * export default {
 *   plugins: [zenSignal()]
 * };
 * ```
 */
export const zenSignal = (options: Omit<Options, 'framework'> = {}) =>
  unplugin.vite({ framework: 'react', ...options });

export default zenSignal;
