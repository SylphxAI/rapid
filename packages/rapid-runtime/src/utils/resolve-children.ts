/**
 * Unified Children Resolution
 *
 * Resolves children through all possible forms:
 * - Functions (lazy children): () => <Component />
 * - Descriptors (deferred components): { _jsx: true, type, props }
 * - Arrays (multiple children): [child1, child2, ...]
 * - Primitives (strings, numbers, etc.)
 *
 * ## Why This Exists
 *
 * Children can arrive in multiple forms:
 *
 * 1. **Function** - Lazy evaluation for Context propagation
 *    ```tsx
 *    <Provider>{() => <Child />}</Provider>
 *    ```
 *
 * 2. **Descriptor** - Deferred component from JSX
 *    ```tsx
 *    <Provider><Child /></Provider>
 *    // children = { _jsx: true, type: Child, props: {} }
 *    ```
 *
 * 3. **Array** - Multiple children
 *    ```tsx
 *    <Provider>
 *      <Child1 />
 *      <Child2 />
 *    </Provider>
 *    ```
 *
 * 4. **Function returning Descriptor** - Lazy component
 *    ```tsx
 *    <Provider>{() => <Child />}</Provider>
 *    // children = () => { _jsx: true, type: Child, props: {} }
 *    ```
 *
 * This utility handles all cases uniformly.
 *
 * @module
 */

import { attachNodeToOwner } from '@rapid/signal';
import { executeDescriptor, isDescriptor } from '../descriptor.js';
import { executeComponent } from '../reactive-utils.js';

/**
 * Fully resolve children to their final form
 *
 * Handles:
 * - Functions → executes with owner context
 * - Descriptors → executes to get nodes
 * - Arrays → recursively resolves each item
 * - Nested combinations of above
 *
 * @param children - The children to resolve (any form)
 * @returns Fully resolved children (nodes/primitives)
 *
 * @example
 * ```ts
 * // In a Provider component:
 * const c = children(() => props.children);
 * let resolved = c();
 * resolved = resolveChildren(resolved);
 * // Now `resolved` is guaranteed to be a node/primitive, not a function or descriptor
 * ```
 */
export function resolveChildren(children: unknown): unknown {
  // 1. Handle null/undefined
  if (children == null) {
    return children;
  }

  // 2. Handle functions (lazy children pattern)
  //    Execute the function to get the actual children
  //    This is used for: <Provider>{() => <Child />}</Provider>
  if (typeof children === 'function') {
    const result = executeComponent(children as () => any, (node: any, owner: any) => {
      // Only attach objects to owner (primitives can't be WeakMap keys)
      if (node !== null && typeof node === 'object' && !Array.isArray(node)) {
        attachNodeToOwner(node, owner);
      }
    });
    // Recursively resolve - the function might return a descriptor or array
    return resolveChildren(result);
  }

  // 3. Handle descriptors (deferred components)
  //    Execute the descriptor to get the actual node
  if (isDescriptor(children)) {
    return executeDescriptor(children);
  }

  // 4. Handle arrays (multiple children)
  //    Recursively resolve each child
  if (Array.isArray(children)) {
    return children.map(resolveChildren);
  }

  // 5. Primitives and already-resolved nodes pass through
  return children;
}

/**
 * Check if a value needs resolution
 *
 * Returns true if the value is a function, descriptor, or array containing them.
 * Useful for short-circuiting when resolution isn't needed.
 */
export function needsResolution(children: unknown): boolean {
  if (children == null) return false;
  if (typeof children === 'function') return true;
  if (isDescriptor(children)) return true;
  if (Array.isArray(children)) {
    return children.some(needsResolution);
  }
  return false;
}
