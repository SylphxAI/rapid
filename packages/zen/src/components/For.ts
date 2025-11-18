/**
 * ZenJS For Component
 *
 * High-performance keyed list rendering with fine-grained updates
 *
 * Features:
 * - Keyed reconciliation (only updates changed items)
 * - Efficient DOM operations (minimal moves)
 * - Memory efficient (reuses nodes)
 */

import { effect } from '@zen/signal';
import type { AnyZen } from '@zen/signal';
import { disposeNode, onCleanup } from '../lifecycle.js';

interface ForProps<T, U extends Node> {
  each: T[] | AnyZen;
  children: (item: T, index: () => number) => U;
  fallback?: Node;
  key?: (item: T, index: number) => any;
}

/**
 * For component - Keyed list rendering
 *
 * @example
 * // Default: item-based keying
 * <For each={items}>
 *   {(item, index) => <div>{item.name}</div>}
 * </For>
 *
 * // Custom key function
 * <For each={items} key={(item) => item.id}>
 *   {(item, index) => <div>{item.name}</div>}
 * </For>
 */
export function For<T, U extends Node>(props: ForProps<T, U>): Node {
  const { each, children, fallback, key: keyFn } = props;

  // Anchor comment node to mark position
  const marker = document.createComment('for');

  // Track rendered items by key
  const items = new Map<any, { node: U; index: number; item: T }>();

  // Get parent for DOM operations
  let parent: Node | null = null;

  // Effect to update list
  const dispose = effect(() => {
    // Handle signal, function, or plain array
    let array: T[];
    if (typeof each === 'function') {
      array = each();
    } else if (each && typeof each === 'object' && '_value' in each && '_kind' in each) {
      // It's a signal
      array = (each as any).value;
    } else {
      array = each as T[];
    }

    // Show fallback if empty
    if (array.length === 0 && fallback) {
      // Clear existing items
      for (const [, entry] of items) {
        if (entry.node.parentNode) {
          entry.node.parentNode.removeChild(entry.node);
        }
        disposeNode(entry.node);
      }
      items.clear();

      // Insert fallback
      if (!parent) parent = marker.parentNode;
      if (parent) {
        parent.insertBefore(fallback, marker);
      }
      return;
    }

    // Remove fallback if present
    if (fallback?.parentNode) {
      fallback.parentNode.removeChild(fallback);
    }

    if (!parent) parent = marker.parentNode;
    if (!parent) return;

    // Build new items map
    const newItems = new Map<any, { node: U; index: number; item: T }>();
    const fragment = document.createDocumentFragment();

    for (let i = 0; i < array.length; i++) {
      const item = array[i];
      // Use custom key function or item itself as key
      const itemKey = keyFn ? keyFn(item, i) : item;
      let entry = items.get(itemKey);

      if (entry) {
        // Reuse existing node
        entry.index = i;
        entry.item = item;
        newItems.set(itemKey, entry);
      } else {
        // Create new node
        const node = children(item, () => {
          const entry = Array.from(newItems.values()).find(e => e.item === item);
          return entry ? entry.index : -1;
        });

        entry = { node, index: i, item };
        newItems.set(itemKey, entry);
      }

      fragment.appendChild(entry.node);
    }

    // Remove items no longer in array
    for (const [itemKey, entry] of items) {
      if (!newItems.has(itemKey)) {
        if (entry.node.parentNode) {
          entry.node.parentNode.removeChild(entry.node);
        }
        disposeNode(entry.node);
      }
    }

    // Update items map
    items.clear();
    for (const [itemKey, entry] of newItems) {
      items.set(itemKey, entry);
    }

    // Insert all nodes in correct order
    parent.insertBefore(fragment, marker);

    return undefined;
  });

  // Register cleanup via owner system
  onCleanup(() => {
    dispose();
    for (const [, entry] of items) {
      if (entry.node.parentNode) {
        entry.node.parentNode.removeChild(entry.node);
      }
      disposeNode(entry.node);
    }
    items.clear();
  });

  return marker;
}
