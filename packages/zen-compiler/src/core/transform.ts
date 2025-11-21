/**
 * Core JSX transformer for Zen
 *
 * Transforms:
 * 1. Universal lazy children: jsx(Parent, { children: jsx(Child, {}) })
 *    → jsx(Parent, { get children() { return jsx(Child, {}) } })
 * 2. Signal.value auto-unwrap: {signal.value} → {() => signal.value}
 *
 * Note: {signal} is NOT transformed - runtime handles it via isSignal()
 */

import * as babel from '@babel/core';
import type { NodePath } from '@babel/traverse';
import * as t from '@babel/types';
import type { CompilerOptions } from './types.js';

export function transformZenJSX(
  code: string,
  filename: string,
  options: CompilerOptions = {},
  // biome-ignore lint/suspicious/noExplicitAny: Babel's source map type
): { code: string; map: any } | null {
  const { autoUnwrap = true, universalLazyChildren = true } = options;

  const result = babel.transformSync(code, {
    filename,
    sourceMaps: true,
    plugins: [
      '@babel/plugin-syntax-jsx',
      ['@babel/plugin-syntax-typescript', { isTSX: true }],

      // Phase 1: Transform JSX to jsx() calls
      // importSource must be set to use platform-specific jsx-runtime (@zen/web, @zen/tui, etc)
      [
        '@babel/plugin-transform-react-jsx',
        {
          runtime: 'automatic',
          importSource: options.importSource,
        },
      ],

      // Phase 2: Universal lazy children transform (on jsx() calls)
      ...(universalLazyChildren
        ? [
            (): babel.PluginObj => ({
              name: 'zen-lazy-children',
              visitor: {
                // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Babel transform requires checking multiple conditions
                CallExpression(path: NodePath<t.CallExpression>) {
                  const callee = path.node.callee;

                  // Check if this is a jsx/jsxs/jsxDEV/_jsx/_jsxs call
                  if (!t.isIdentifier(callee)) return;
                  if (!['jsx', 'jsxs', 'jsxDEV', '_jsx', '_jsxs'].includes(callee.name)) return;

                  // jsx(type, props)
                  const [_type, propsArg] = path.node.arguments;
                  if (!propsArg || !t.isObjectExpression(propsArg)) return;

                  // Find the children property
                  const childrenPropIndex = propsArg.properties.findIndex(
                    (prop) =>
                      t.isObjectProperty(prop) &&
                      t.isIdentifier(prop.key) &&
                      prop.key.name === 'children',
                  );

                  if (childrenPropIndex === -1) return;

                  const childrenProp = propsArg.properties[childrenPropIndex];
                  if (!t.isObjectProperty(childrenProp)) return;

                  // Skip if children is already a function
                  if (
                    t.isArrowFunctionExpression(childrenProp.value) ||
                    t.isFunctionExpression(childrenProp.value)
                  ) {
                    return;
                  }

                  // Transform: children: value
                  // Into: get children() { return value }
                  const getter = t.objectMethod(
                    'get',
                    t.identifier('children'),
                    [],
                    t.blockStatement([t.returnStatement(childrenProp.value as t.Expression)]),
                  );

                  // Replace the property with the getter
                  propsArg.properties[childrenPropIndex] = getter;
                },
              },
            }),
          ]
        : []),

      // Phase 3: Custom transforms (signal.value auto-unwrap)
      (): babel.PluginObj => ({
        name: 'zen-jsx-transform',
        visitor: {
          // Transform signal.value expressions to auto-unwrap
          JSXExpressionContainer(path: NodePath<t.JSXExpressionContainer>) {
            if (!autoUnwrap) return;

            const expression = path.node.expression;

            // Skip if already a function
            if (
              t.isArrowFunctionExpression(expression) ||
              t.isFunctionExpression(expression) ||
              t.isJSXEmptyExpression(expression)
            ) {
              return;
            }

            // Transform expressions containing .value access
            // Examples: {signal.value}, {signal.value + 2}, {foo(signal.value)}
            // Do NOT transform {signal} - runtime handles it with isSignal()
            const containsValueAccess = hasValueAccess(expression);

            if (!containsValueAccess) return;

            // Wrap in arrow function for reactivity
            path.node.expression = t.arrowFunctionExpression([], expression);
          },
        },
      }),
    ],
  });

  if (!result || !result.code) {
    return null;
  }

  return {
    code: result.code,
    map: result.map,
  };
}

/**
 * Recursively check if an expression contains .value member access
 * Examples: signal.value, count.value + 2, foo(bar.value)
 */
function hasValueAccess(node: t.Node): boolean {
  // Direct .value access
  if (
    t.isMemberExpression(node) &&
    t.isIdentifier(node.property) &&
    node.property.name === 'value'
  ) {
    return true;
  }

  // Recursively check all child nodes
  if (t.isBinaryExpression(node)) {
    return hasValueAccess(node.left) || hasValueAccess(node.right);
  }

  if (t.isUnaryExpression(node)) {
    return hasValueAccess(node.argument);
  }

  if (t.isCallExpression(node)) {
    return (
      node.arguments.some((arg) => t.isExpression(arg) && hasValueAccess(arg)) ||
      (t.isExpression(node.callee) && hasValueAccess(node.callee))
    );
  }

  if (t.isConditionalExpression(node)) {
    return (
      hasValueAccess(node.test) || hasValueAccess(node.consequent) || hasValueAccess(node.alternate)
    );
  }

  if (t.isMemberExpression(node)) {
    return hasValueAccess(node.object) || hasValueAccess(node.property);
  }

  if (t.isLogicalExpression(node)) {
    return hasValueAccess(node.left) || hasValueAccess(node.right);
  }

  if (t.isArrayExpression(node)) {
    return node.elements.some((el) => el && t.isExpression(el) && hasValueAccess(el));
  }

  if (t.isObjectExpression(node)) {
    return node.properties.some((prop) => {
      if (t.isObjectProperty(prop) && t.isExpression(prop.value)) {
        return hasValueAccess(prop.value);
      }
      return false;
    });
  }

  return false;
}
