/**
 * Vite plugin for @rapid/signal-preact
 *
 * Re-exports unplugin-rapid-signal with Preact preset
 */

import { unplugin } from 'unplugin-rapid-signal';
import type { Options } from 'unplugin-rapid-signal';

/**
 * Vite plugin for Rapid Signals in Preact
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
export const zenSignal = (
  options: Omit<Options, 'framework'> = {},
): ReturnType<typeof unplugin.vite> => unplugin.vite({ framework: 'preact', ...options });

export default zenSignal;
