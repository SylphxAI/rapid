/**
 * Webpack plugin for @rapid/signal-preact
 */

import { unplugin } from 'unplugin-rapid-signal';
import type { Options } from 'unplugin-rapid-signal';

export const zenSignal = (options: Omit<Options, 'framework'> = {}) =>
  unplugin.webpack({ framework: 'preact', ...options });

export default zenSignal;
