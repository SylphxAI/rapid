/**
 * Fragment component for grouping children - with descriptor support
 */

import { executeDescriptor, isDescriptor } from '@rapid/runtime';

export function Fragment(props: { children?: any }): DocumentFragment {
  const fragment = document.createDocumentFragment();

  if (props.children) {
    const children = Array.isArray(props.children) ? props.children : [props.children];

    for (let child of children) {
      // Handle descriptor (Phase 2)
      if (isDescriptor(child)) {
        child = executeDescriptor(child);
      }

      if (child instanceof Node) {
        fragment.appendChild(child);
      } else if (child) {
        fragment.appendChild(document.createTextNode(String(child)));
      }
    }
  }

  return fragment;
}
