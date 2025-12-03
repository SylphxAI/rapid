/**
 * Children helper for resolving lazy children
 *
 * Similar to SolidJS's children() helper. Use this in components that need
 * to resolve children AFTER performing setup (e.g., Context providers).
 *
 * @example
 * ```tsx
 * function Provider(props) {
 *   const c = children(() => props.children);
 *
 *   // Setup happens first
 *   setupContext(props.value);
 *
 *   // Then resolve children
 *   return <div>{c()}</div>;
 * }
 * ```
 */

import { computed } from '@rapid/signal';

/**
 * Resolve children from a lazy accessor function
 *
 * Wraps the children accessor in a computed signal for efficient memoization.
 * The children are only evaluated when accessed, and re-evaluated only when
 * the accessor's dependencies change.
 *
 * @param fn - Function that returns the children (usually () => props.children)
 * @returns A function that returns the resolved children
 */
export function children<T = unknown>(fn: () => T): () => T {
  const memo = computed(fn);
  return () => memo.value;
}
