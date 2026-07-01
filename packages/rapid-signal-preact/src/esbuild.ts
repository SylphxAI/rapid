/**
 * esbuild plugin for @rapid/signal-preact
 */

import { unplugin } from 'unplugin-rapid-signal';
import type { Options } from 'unplugin-rapid-signal';

export const zenSignal = (
  options: Omit<Options, 'framework'> = {},
): ReturnType<typeof unplugin.esbuild> => unplugin.esbuild({ framework: 'preact', ...options });

export default zenSignal;
