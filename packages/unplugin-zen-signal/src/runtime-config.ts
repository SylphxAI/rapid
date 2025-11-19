/**
 * Runtime mode configuration for each framework
 *
 * In runtime mode, the plugin configures the build tool to use
 * custom JSX runtimes or preprocessors that auto-unwrap signals.
 */

import type { Framework } from './auto-detect';
import type { UnpluginFactory } from 'unplugin';

export interface RuntimeConfig {
  name: string;
  vite?: () => any;
  webpack?: () => any;
  rollup?: () => any;
  esbuild?: () => any;
}

/**
 * Get runtime configuration for a framework
 */
export function getRuntimeConfig(framework: Framework, debug: boolean): RuntimeConfig {
  switch (framework) {
    case 'react':
      return getReactRuntimeConfig(debug);
    case 'vue':
      return getVueRuntimeConfig(debug);
    case 'svelte':
      return getSvelteRuntimeConfig(debug);
    case 'zen':
      return getZenRuntimeConfig(debug);
    default:
      throw new Error(`Unsupported framework: ${framework}`);
  }
}

/**
 * React runtime configuration
 * Sets up custom JSX runtime
 */
function getReactRuntimeConfig(debug: boolean): RuntimeConfig {
  return {
    name: 'zen-signal-runtime:react',

    vite() {
      if (debug) {
        console.log('[zen-signal] Configuring React runtime mode (Vite)');
      }

      return {
        esbuild: {
          jsxImportSource: 'unplugin-zen-signal/jsx-runtime/react',
        },
      };
    },

    webpack() {
      if (debug) {
        console.log('[zen-signal] Configuring React runtime mode (Webpack)');
      }

      // Webpack requires babel or swc configuration
      // Return loader configuration
      return {
        module: {
          rules: [
            {
              test: /\.[jt]sx?$/,
              exclude: /node_modules/,
              use: {
                loader: 'babel-loader',
                options: {
                  presets: [
                    [
                      '@babel/preset-react',
                      {
                        runtime: 'automatic',
                        importSource: 'unplugin-zen-signal/jsx-runtime/react',
                      },
                    ],
                  ],
                },
              },
            },
          ],
        },
      };
    },

    rollup() {
      if (debug) {
        console.log('[zen-signal] Configuring React runtime mode (Rollup)');
      }

      // Rollup uses esbuild plugin
      return {
        esbuild: {
          jsxImportSource: 'unplugin-zen-signal/jsx-runtime/react',
        },
      };
    },

    esbuild() {
      if (debug) {
        console.log('[zen-signal] Configuring React runtime mode (esbuild)');
      }

      return {
        jsxImportSource: 'unplugin-zen-signal/jsx-runtime/react',
      };
    },
  };
}

/**
 * Vue runtime configuration
 * Templates work natively, JSX needs alias
 */
function getVueRuntimeConfig(debug: boolean): RuntimeConfig {
  return {
    name: 'zen-signal-runtime:vue',

    vite() {
      if (debug) {
        console.log('[zen-signal] Configuring Vue runtime mode (Vite)');
        console.log('[zen-signal] Vue templates work natively, no config needed');
      }

      // Vue templates work natively
      // Only configure if using JSX
      return {
        resolve: {
          alias: {
            // Only alias for JSX usage (optional)
            // Templates work without this
          },
        },
      };
    },

    webpack() {
      if (debug) {
        console.log('[zen-signal] Configuring Vue runtime mode (Webpack)');
      }

      return {};
    },

    rollup() {
      if (debug) {
        console.log('[zen-signal] Configuring Vue runtime mode (Rollup)');
      }

      return {};
    },

    esbuild() {
      if (debug) {
        console.log('[zen-signal] Configuring Vue runtime mode (esbuild)');
      }

      return {};
    },
  };
}

/**
 * Svelte runtime configuration
 * Injects preprocessor
 */
function getSvelteRuntimeConfig(debug: boolean): RuntimeConfig {
  return {
    name: 'zen-signal-runtime:svelte',

    vite() {
      if (debug) {
        console.log('[zen-signal] Configuring Svelte runtime mode (Vite)');
        console.log('[zen-signal] Note: Svelte preprocessor should be added to svelte.config.js');
      }

      // Svelte preprocessor is configured in svelte.config.js
      // We can't inject it from here, so just log a warning
      return {};
    },

    webpack() {
      if (debug) {
        console.log('[zen-signal] Configuring Svelte runtime mode (Webpack)');
        console.log('[zen-signal] Note: Svelte preprocessor should be added to svelte.config.js');
      }

      return {};
    },

    rollup() {
      if (debug) {
        console.log('[zen-signal] Configuring Svelte runtime mode (Rollup)');
        console.log('[zen-signal] Note: Svelte preprocessor should be added to svelte.config.js');
      }

      return {};
    },

    esbuild() {
      if (debug) {
        console.log('[zen-signal] Configuring Svelte runtime mode (esbuild)');
        console.log('[zen-signal] Note: Svelte preprocessor should be added to svelte.config.js');
      }

      return {};
    },
  };
}

/**
 * Zen runtime configuration
 * Native support, no configuration needed
 */
function getZenRuntimeConfig(debug: boolean): RuntimeConfig {
  return {
    name: 'zen-signal-runtime:zen',

    vite() {
      if (debug) {
        console.log('[zen-signal] Zen framework has native signal support');
        console.log('[zen-signal] No runtime configuration needed');
      }

      return {};
    },

    webpack() {
      if (debug) {
        console.log('[zen-signal] Zen framework has native signal support');
      }

      return {};
    },

    rollup() {
      if (debug) {
        console.log('[zen-signal] Zen framework has native signal support');
      }

      return {};
    },

    esbuild() {
      if (debug) {
        console.log('[zen-signal] Zen framework has native signal support');
      }

      return {};
    },
  };
}
