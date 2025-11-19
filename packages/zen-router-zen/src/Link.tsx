/**
 * Link component for Zen framework
 * Powered by @zen/router
 */

import { open } from '@zen/router';

export interface LinkProps {
  href: string;
  children: Node | Node[] | string;
  class?: string;
  [key: string]: string | Node | Node[] | undefined;
}

/**
 * Link component - Navigation link with client-side routing
 *
 * @example
 * ```tsx
 * <Link href="/about">About Us</Link>
 * <Link href="/users/123" class="active">User Profile</Link>
 * ```
 */
export function Link(props: LinkProps): Node {
  const { href, children, ...restProps } = props;

  const a = document.createElement('a');
  a.href = href;

  // Set attributes
  for (const [key, value] of Object.entries(restProps)) {
    if (key === 'class') {
      a.className = String(value);
    } else {
      a.setAttribute(key, String(value));
    }
  }

  // Append children
  if (typeof children === 'string') {
    a.textContent = children;
  } else if (Array.isArray(children)) {
    for (const child of children) {
      if (child instanceof Node) {
        a.appendChild(child);
      }
    }
  } else if (children instanceof Node) {
    a.appendChild(children);
  }

  // Prevent default and use client-side navigation
  a.addEventListener('click', (e) => {
    // Allow modified clicks to open in new tab
    if (e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0) {
      return;
    }

    e.preventDefault();
    open(href);
  });

  return a;
}
