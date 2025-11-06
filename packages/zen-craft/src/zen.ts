import { get, set } from '@sylphx/zen';
import type { Zen } from '@sylphx/zen';
import { produce } from './produce';
import type { Patch, CraftOptions } from './types';
import { deepEqual } from './utils';

/**
 * Craft-powered immutable updates for Zen atoms.
 * Applies a recipe function to a draft version of the atom's current state,
 * automatically updating the atom with structural sharing.
 * Returns the generated patches and inverse patches.
 *
 * @param targetZen The Zen atom to update.
 * @param recipe A function that receives a draft state and can mutate it.
 * @param options Options to enable patch generation.
 * @returns A tuple containing the generated patches and inverse patches: [Patch[], Patch[]]
 */
export function craftZen<T>(
  targetZen: Zen<T>,
  recipe: (draft: T) => undefined,
  options?: CraftOptions,
): [Patch[], Patch[]] {
  const currentState = get(targetZen); // Use get() function
  const [nextState, patches, inversePatches] = produce(currentState, recipe, options);

  // Only set the zen if the state value actually changed (use deep equality)
  if (!deepEqual(nextState, currentState)) {
    set(targetZen, nextState); // Use set() function
  }

  return [patches, inversePatches];
}
