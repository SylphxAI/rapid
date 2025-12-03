/**
 * Vite plugin for @rapid/signal-preact
 *
 * Re-exports unplugin-rapid-signal with Preact preset
 */

import { unplugin } from 'unplugin-rapid-signal';
import type { Options } from 'unplugin-rapid-signal';

/**
 * Vite plugin for Zen Signals in Preact
 *
 * @example
 * ```ts
 * // vite.config.ts
 * import { zenSignal } from '@rapid/signal-preact/vite';
 *
 * export default {
 *   plugins: [zenSignal()]
 * };
 * ```
 */
export const zenSignal = (options: Omit<Options, 'framework'> = {}) =>
  unplugin.vite({ framework: 'preact', ...options });

export default zenSignal;
