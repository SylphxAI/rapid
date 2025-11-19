/**
 * TUI Platform Operations
 *
 * Virtual node implementation of platform operations for terminal UI.
 * Registered during @zen/tui initialization.
 */

import type { PlatformOps } from '@zen/runtime';
import type { TUINode } from './types.js';

/**
 * Marker node for TUI (virtual placeholder)
 */
export interface TUIMarker {
  _type: 'marker';
  _name: string;
  parentNode?: TUINode;
}

/**
 * Fragment for TUI (array of nodes)
 */
export type TUIFragment = (TUINode | string)[];

/**
 * TUI platform operations using virtual node tree
 */
export const tuiPlatformOps: PlatformOps<TUINode, TUIMarker, TUIFragment> = {
  createMarker(name: string): TUIMarker {
    return {
      _type: 'marker',
      _name: name,
    };
  },

  createFragment(): TUIFragment {
    return [];
  },

  insertBefore(parent: TUINode, child: TUINode | TUIFragment, reference: TUINode | TUIMarker): void {
    // Find reference index
    const refIndex = parent.children.findIndex((c) => c === reference);

    if (refIndex === -1) {
      // Reference not found, append to end
      if (Array.isArray(child)) {
        parent.children.push(...child);
      } else {
        parent.children.push(child);
        child.parentNode = parent;
      }
    } else {
      // Insert before reference
      if (Array.isArray(child)) {
        parent.children.splice(refIndex, 0, ...child);
        // Set parent for all nodes in fragment
        for (const node of child) {
          if (typeof node !== 'string') {
            node.parentNode = parent;
          }
        }
      } else {
        parent.children.splice(refIndex, 0, child);
        child.parentNode = parent;
      }
    }
  },

  removeChild(parent: TUINode, child: TUINode): void {
    const index = parent.children.findIndex((c) => c === child);
    if (index !== -1) {
      parent.children.splice(index, 1);
      child.parentNode = undefined;
    }
  },

  getParent(node: TUINode | TUIMarker): TUINode | null {
    return node.parentNode || null;
  },

  appendToFragment(fragment: TUIFragment, child: TUINode): void {
    fragment.push(child);
  },
};
