/**
 * ZenJS Switch/Match Components
 *
 * Multi-branch conditional rendering
 *
 * Features:
 * - Only renders first matching branch
 * - Efficient branch switching
 * - Supports fallback
 */

import { effect, untrack } from '@zen/signal';
import type { AnyZen } from '@zen/signal';
import { disposeNode, onCleanup } from '@zen/signal';
import { getPlatformOps } from '../platform-ops.js';

interface SwitchProps {
  fallback?: any | (() => any);
  children: any[];
}

interface MatchProps<T> {
  when: T | AnyZen | (() => T);
  children: any | ((value: T) => any);
}

/**
 * Match component - Single branch in Switch
 *
 * @example
 * <Match when={route === 'home'}>
 *   <Home />
 * </Match>
 */
export function Match<T>(props: MatchProps<T>): any {
  const ops = getPlatformOps();
  const marker = ops.createMarker('match');

  // Store props for Switch to access
  (marker as any)._matchProps = props;

  return marker;
}

/**
 * Switch component - Multi-branch conditional
 *
 * @example
 * <Switch fallback={<NotFound />}>
 *   <Match when={route === 'home'}><Home /></Match>
 *   <Match when={route === 'about'}><About /></Match>
 * </Switch>
 */
export function Switch(props: SwitchProps): any {
  const { fallback, children } = props;

  // Get platform operations
  const ops = getPlatformOps();

  // Anchor
  const marker = ops.createMarker('switch');

  // Track current node
  let currentNode: any = null;

  // Effect to evaluate conditions
  const dispose = effect(() => {
    // Cleanup previous
    if (currentNode) {
      const parent = ops.getParent(marker);
      if (parent) {
        ops.removeChild(parent, currentNode);
      }
      disposeNode(currentNode);
      currentNode = null;
    }

    // Find first matching branch
    for (const child of children) {
      const matchProps = (child as any)._matchProps;

      if (matchProps) {
        const { when, children: matchChildren } = matchProps;

        // Evaluate condition
        const condition = typeof when === 'function' ? when() : when;

        if (condition) {
          // Found match - render
          currentNode = untrack(() => {
            if (typeof matchChildren === 'function') {
              return matchChildren(condition);
            }
            return matchChildren;
          });

          break;
        }
      }
    }

    // No match - render fallback
    if (!currentNode && fallback) {
      currentNode = untrack(() => {
        if (typeof fallback === 'function') {
          return fallback();
        }
        return fallback;
      });
    }

    // Insert into tree
    if (currentNode) {
      const parent = ops.getParent(marker);
      if (parent) {
        ops.insertBefore(parent, currentNode, marker);
      }
    }

    return undefined;
  });

  // Register cleanup via owner system
  onCleanup(() => {
    dispose();
    if (currentNode) {
      const parent = ops.getParent(marker);
      if (parent) {
        ops.removeChild(parent, currentNode);
      }
      disposeNode(currentNode);
    }
  });

  return marker;
}
