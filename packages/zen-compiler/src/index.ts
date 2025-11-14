/**
 * Zen Compiler Plugin for Babel
 *
 * Performs static dependency analysis and optimizations:
 * 1. Detects zen() and computed() calls
 * 2. Builds dependency graph at compile time
 * 3. Generates optimized runtime code
 *
 * Example transformation:
 *
 * // Before (user code):
 * const a = zen(1);
 * const b = zen(2);
 * const c = computed(() => a.value + b.value);
 *
 * // After (optimized):
 * const __zenGraph = {
 *   signals: [1, 2],
 *   computed: [{ deps: [0, 1], fn: (a, b) => a + b }]
 * };
 * const a = __zenGraph.signals[0];
 * const b = __zenGraph.signals[1];
 * const c = __zenGraph.computed[0];
 */

import type { PluginObj, PluginPass } from '@babel/core';
import * as t from '@babel/types';

interface ZenCompilerOptions {
  /**
   * Enable static dependency analysis
   * @default true
   */
  staticAnalysis?: boolean;

  /**
   * Inline pure computed values
   * @default true
   */
  inlineComputed?: boolean;

  /**
   * Generate dev-time warnings for non-optimizable patterns
   * @default true
   */
  warnings?: boolean;

  /**
   * Module name to detect zen imports from
   * @default '@sylphx/zen'
   */
  moduleName?: string;
}

interface SignalInfo {
  id: number;
  name: string;
  node: t.VariableDeclarator;
  initialValue: t.Expression;
}

interface ComputedInfo {
  id: number;
  name: string;
  node: t.VariableDeclarator;
  deps: Set<string>;
  fn: t.ArrowFunctionExpression | t.FunctionExpression;
}

interface GraphState {
  signals: Map<string, SignalInfo>;
  computed: Map<string, ComputedInfo>;
  nextId: number;
}

export default function zenCompilerPlugin(
  _babel: any,
  options: ZenCompilerOptions = {}
): PluginObj<PluginPass & { zenGraph: GraphState }> {
  const {
    staticAnalysis = true,
    inlineComputed = true,
    warnings = true,
    moduleName = '@sylphx/zen',
  } = options;

  return {
    name: 'zen-compiler',

    visitor: {
      Program: {
        enter(path, state) {
          // Initialize graph state
          state.zenGraph = {
            signals: new Map(),
            computed: new Map(),
            nextId: 0,
          };
        },

        exit(path, state) {
          if (!staticAnalysis) return;

          const { signals, computed } = state.zenGraph;

          // Skip if no zen calls detected
          if (signals.size === 0 && computed.size === 0) return;

          // TODO: Generate optimized graph
          // This is where we would inject the optimized runtime code
          // For now, we just log the analysis results

          if (warnings && process.env.NODE_ENV === 'development') {
            console.log('[zen-compiler] Analysis results:');
            console.log(`  Signals: ${signals.size}`);
            console.log(`  Computed: ${computed.size}`);
          }
        },
      },

      // Detect: import { zen, computed } from '@sylphx/zen'
      ImportDeclaration(path, state) {
        if (path.node.source.value !== moduleName) return;

        // Track imported identifiers (zen, computed, etc.)
        // This helps us identify zen() and computed() calls later
      },

      // Detect: const x = zen(value)
      VariableDeclarator(path, state) {
        if (!staticAnalysis) return;

        const { init, id } = path.node;

        // Must be: const name = ...
        if (!t.isIdentifier(id)) return;
        if (!init) return;

        // Check if it's a zen() call
        if (t.isCallExpression(init) && t.isIdentifier(init.callee)) {
          const funcName = init.callee.name;

          if (funcName === 'zen') {
            // Register signal
            const signalInfo: SignalInfo = {
              id: state.zenGraph.nextId++,
              name: id.name,
              node: path.node,
              initialValue: init.arguments[0] as t.Expression,
            };

            state.zenGraph.signals.set(id.name, signalInfo);

            if (warnings && process.env.NODE_ENV === 'development') {
              console.log(`[zen-compiler] Detected signal: ${id.name}`);
            }
          } else if (funcName === 'computed') {
            // Analyze computed function to detect dependencies
            const computedFn = init.arguments[0];

            if (
              !t.isArrowFunctionExpression(computedFn) &&
              !t.isFunctionExpression(computedFn)
            ) {
              if (warnings) {
                console.warn(
                  `[zen-compiler] Warning: computed() with non-function argument at ${id.name}`
                );
              }
              return;
            }

            // TODO: Analyze function body to detect .value accesses
            // This would build the dependency graph

            const computedInfo: ComputedInfo = {
              id: state.zenGraph.nextId++,
              name: id.name,
              node: path.node,
              deps: new Set(),
              fn: computedFn,
            };

            state.zenGraph.computed.set(id.name, computedInfo);

            if (warnings && process.env.NODE_ENV === 'development') {
              console.log(`[zen-compiler] Detected computed: ${id.name}`);
            }
          }
        }
      },

      // Detect: signal.value accesses within computed functions
      MemberExpression(path, state) {
        if (!staticAnalysis) return;

        // Check if this is a .value access
        if (!t.isIdentifier(path.node.property)) return;
        if (path.node.property.name !== 'value') return;

        // Check if the object is a known signal
        if (!t.isIdentifier(path.node.object)) return;

        const signalName = path.node.object.name;

        // TODO: Track this dependency in the current computed context
        // This requires traversing up to find which computed we're inside
      },
    },
  };
}
