/**
 * Rollup plugin for @zen/signal-vue
 *
 * Re-exports unplugin-zen-signal with Vue preset
 */

import { unplugin } from 'unplugin-zen-signal';
import type { Options } from 'unplugin-zen-signal';

/**
 * Rollup plugin for Zen Signals in Vue
 */
export const zenSignal = (options: Omit<Options, 'framework'> = {}) =>
  unplugin.rollup({ framework: 'vue', ...options });

export default zenSignal;
