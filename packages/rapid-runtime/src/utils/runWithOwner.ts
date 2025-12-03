/**
 * runWithOwner - Run code within specific owner context
 *
 * Useful for running lifecycle hooks in async callbacks
 * where the owner context is lost.
 *
 * @example
 * ```tsx
 * function Component() {
 *   const owner = getOwner();
 *
 *   setTimeout(() => {
 *     runWithOwner(owner, () => {
 *       onCleanup(() => console.log('cleanup'));
 *       // Now onCleanup works inside setTimeout
 *     });
 *   }, 1000);
 * }
 * ```
 */

import { getOwner, setOwner } from '@rapid/signal';
import type { Owner } from '@rapid/signal';

// Export Owner type for convenience
export type { Owner } from '@rapid/signal';

/**
 * Run function within owner context
 */
export function runWithOwner<T>(owner: Owner | null, fn: () => T): T {
  const prev = getOwner();
  setOwner(owner);
  try {
    return fn();
  } finally {
    setOwner(prev);
  }
}
