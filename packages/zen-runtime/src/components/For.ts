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
import { disposeNode, onCleanup } from '@zen/signal';
import { type MaybeReactive, resolve } from '../reactive-utils.js';
import { getPlatformOps } from '../platform-ops.js';

interface ForProps<T, U = any> {
  each: MaybeReactive<T[]>;
  children: (item: T, index: () => number) => U;
  fallback?: any;
  key?: (item: T, index: number) => any;
}

/**
 * For component - Keyed list rendering
 *
 * @example
 * // With signal
 * <For each={items}>
 *   {(item, index) => <div>{item.name}</div>}
 * </For>
 *
 * // With function (for filtering/mapping)
 * <For each={() => items.value.filter(i => i.active)}>
 *   {(item, index) => <div>{item.name}</div>}
 * </For>
 *
 * // With static array
 * <For each={[1, 2, 3]}>
 *   {(num) => <div>{num}</div>}
 * </For>
 *
 * // Custom key function
 * <For each={items} key={(item) => item.id}>
 *   {(item, index) => <div>{item.name}</div>}
 * </For>
 */
export function For<T, U = any>(props: ForProps<T, U>): any {
  const { each, children, fallback, key: keyFn } = props;

  // Get platform operations
  const ops = getPlatformOps();

  // Anchor node to mark position
  const marker = ops.createMarker('for');

  // Track rendered items by key
  const items = new Map<any, { node: U; index: number; item: T }>();

  // Get parent for operations
  let parent: any = null;
  let dispose: (() => void) | undefined;

  // Defer effect until marker is in DOM (same fix as Router and Show components)
  queueMicrotask(() => {
    dispose = effect(() => {
      // Resolve array - automatically tracks reactive dependencies
      const array = resolve(each) as T[];

      // Show fallback if empty
      if (array.length === 0 && fallback) {
        // Clear existing items
        for (const [, entry] of items) {
          const entryParent = ops.getParent(entry.node as any);
          if (entryParent) {
            ops.removeChild(entryParent, entry.node as any);
          }
          disposeNode(entry.node as any);
        }
        items.clear();

        // Insert fallback
        if (!parent) parent = ops.getParent(marker);
        if (parent) {
          ops.insertBefore(parent, fallback, marker);
        }
        return;
      }

      // Remove fallback if present
      const fallbackParent = fallback ? ops.getParent(fallback) : null;
      if (fallbackParent) {
        ops.removeChild(fallbackParent, fallback);
      }

      if (!parent) parent = ops.getParent(marker);
      if (!parent) return;

      // Build new items map
      const newItems = new Map<any, { node: U; index: number; item: T }>();
      const fragment = ops.createFragment();

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
            const entry = Array.from(newItems.values()).find((e) => e.item === item);
            return entry ? entry.index : -1;
          });

          entry = { node, index: i, item };
          newItems.set(itemKey, entry);
        }

        ops.appendToFragment(fragment, entry.node as any);
      }

      // Remove items no longer in array
      for (const [itemKey, entry] of items) {
        if (!newItems.has(itemKey)) {
          const entryParent = ops.getParent(entry.node as any);
          if (entryParent) {
            ops.removeChild(entryParent, entry.node as any);
          }
          disposeNode(entry.node as any);
        }
      }

      // Update items map
      items.clear();
      for (const [itemKey, entry] of newItems) {
        items.set(itemKey, entry);
      }

      // Insert all nodes in correct order
      ops.insertBefore(parent, fragment, marker);

      return undefined;
    });
  });

  // Register cleanup via owner system
  onCleanup(() => {
    if (dispose) {
      dispose();
    }
    for (const [, entry] of items) {
      const entryParent = ops.getParent(entry.node as any);
      if (entryParent) {
        ops.removeChild(entryParent, entry.node as any);
      }
      disposeNode(entry.node as any);
    }
    items.clear();
  });

  return marker;
}
