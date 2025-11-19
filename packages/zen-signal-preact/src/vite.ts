/**
 * Vite plugin for @zen/signal-preact
 *
 * Re-exports unplugin-zen-signal with Preact preset
 */

import { unplugin } from 'unplugin-zen-signal';
import type { Options } from 'unplugin-zen-signal';

/**
 * Vite plugin for Zen Signals in Preact
 *
 * @example
 * ```ts
 * // vite.config.ts
 * import { zenSignal } from '@zen/signal-preact/vite';
 *
 * export default {
 *   plugins: [zenSignal()]
 * };
 * ```
 */
export const zenSignal = (options: Omit<Options, 'framework'> = {}) =>
  unplugin.vite({ framework: 'preact', ...options });

export default zenSignal;
