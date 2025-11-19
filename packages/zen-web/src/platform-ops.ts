/**
 * Web Platform Operations
 *
 * DOM-specific implementation of platform operations.
 * Registered during @zen/web initialization.
 */

import type { PlatformOps } from '@zen/runtime';

/**
 * Web platform operations using native DOM APIs
 */
export const webPlatformOps: PlatformOps<Node, Comment, DocumentFragment> = {
  createMarker(name: string): Comment {
    return document.createComment(name);
  },

  createFragment(): DocumentFragment {
    return document.createDocumentFragment();
  },

  insertBefore(parent: Node, child: Node | DocumentFragment, reference: Node | Comment): void {
    parent.insertBefore(child, reference);
  },

  removeChild(parent: Node, child: Node): void {
    parent.removeChild(child);
  },

  getParent(node: Node | Comment): Node | null {
    return node.parentNode;
  },

  appendToFragment(fragment: DocumentFragment, child: Node): void {
    fragment.appendChild(child);
  },
};
