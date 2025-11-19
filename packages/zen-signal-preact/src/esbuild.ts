/**
 * esbuild plugin for @zen/signal-preact
 */

import { unplugin } from 'unplugin-zen-signal';
import type { Options } from 'unplugin-zen-signal';

export const zenSignal = (options: Omit<Options, 'framework'> = {}) =>
  unplugin.esbuild({ framework: 'preact', ...options });

export default zenSignal;
