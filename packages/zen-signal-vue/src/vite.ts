/**
 * Vite plugin for @zen/signal-vue
 *
 * Re-exports unplugin-zen-signal with Vue preset
 */

import { unplugin } from 'unplugin-zen-signal';
import type { Options } from 'unplugin-zen-signal';

/**
 * Vite plugin for Zen Signals in Vue
 *
 * @example
 * ```ts
 * // vite.config.ts
 * import { zenSignal } from '@zen/signal-vue/vite';
 *
 * export default {
 *   plugins: [zenSignal()]
 * };
 * ```
 */
export const zenSignal = (options: Omit<Options, 'framework'> = {}) =>
  unplugin.vite({ framework: 'vue', ...options });

export default zenSignal;
