/**
 * ZenJS Show Component
 *
 * Conditional rendering with fine-grained reactivity
 *
 * Features:
 * - Only renders active branch
 * - Destroys inactive branch (cleanup)
 * - Supports fallback
 */

import { computed, effect, untrack } from '@zen/signal';
import { disposeNode, onCleanup } from '@zen/signal';
import { getPlatformOps } from '../platform-ops.js';
import { type Reactive, resolve } from '../reactive-utils.js';
import { children } from '../utils/children.js';

interface ShowProps<T> {
  when: Reactive<T>;
  fallback?: any | (() => any);
  children: any | ((value: T) => any);
}

/**
 * Show component - Conditional rendering
 *
 * @example
 * // With function
 * <Show when={() => isLoggedIn.value} fallback={<Login />}>
 *   <Dashboard />
 * </Show>
 *
 * // With signal directly
 * <Show when={computed(() => user.value !== null)}>
 *   {(u) => <div>Hello {u.name}</div>}
 * </Show>
 */
export function Show<T>(props: ShowProps<T>): any {
  // IMPORTANT: Don't destructure props.children here!
  // Descriptor pattern provides lazy getter - only read when needed
  // Use children() helper to delay reading until condition is true
  const c = children(() => props.children);
  const f = children(() => props.fallback);

  // Get platform operations
  const ops = getPlatformOps();

  // Anchor to mark position
  const marker = ops.createMarker('show');

  // Track current node and condition
  let currentNode: any = null;
  let previousCondition = false;

  // ARCHITECTURE: Effects are immediate sync (not deferred)
  // Parent check happens inside effect - if no parent yet, insertBefore is no-op
  const dispose = effect(() => {
    const condition = resolve(props.when);
    const conditionBool = !!condition;

    // Only cleanup if condition changed
    if (currentNode && previousCondition !== conditionBool) {
      const parent = ops.getParent(marker);
      if (parent) {
        ops.removeChild(parent, currentNode);
      }
      // Dispose child component's owner
      disposeNode(currentNode);
      currentNode = null;
    }

    previousCondition = conditionBool;

    // Render appropriate branch (only if no current node)
    if (conditionBool && !currentNode) {
      // Truthy - render children
      // Only now do we read props.children (via c())
      // This triggers the lazy getter from descriptor pattern
      currentNode = untrack(() => {
        const child = c();
        if (typeof child === 'function') {
          return child(condition as T);
        }
        return child;
      });
    } else if (!conditionBool && !currentNode) {
      // Falsy - render fallback (only if no current node)
      // Only read fallback if condition is false
      const fb = f();
      if (fb) {
        currentNode = untrack(() => {
          if (typeof fb === 'function') {
            return fb();
          }
          return fb;
        });
      }
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
