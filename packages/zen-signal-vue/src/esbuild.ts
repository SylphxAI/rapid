/**
 * esbuild plugin for @zen/signal-vue
 *
 * Re-exports unplugin-zen-signal with Vue preset
 */

import { unplugin } from 'unplugin-zen-signal';
import type { Options } from 'unplugin-zen-signal';

/**
 * esbuild plugin for Zen Signals in Vue
 */
export const zenSignal = (options: Omit<Options, 'framework'> = {}) =>
  unplugin.esbuild({ framework: 'vue', ...options });

export default zenSignal;
