import { craft, craftWithPatches } from '@sylphx/craft';
import type { CraftOptions, CraftResult } from './types';
import { isDraftable } from './utils';

export function produce<T>(
  baseState: T,
  recipe: (draft: T) => undefined | undefined,
  options?: CraftOptions,
): CraftResult<T> {
  // Handle non-draftable state directly (no patches)
  if (!isDraftable(baseState)) {
    recipe(baseState as T);
    return [baseState as T, [], []];
  }

  // Use craftWithPatches if patches are requested
  if (options?.patches || options?.inversePatches) {
    const [finalState, patches, inversePatches] = craftWithPatches(
      baseState,
      recipe as (draft: T) => T | undefined,
    );
    return [finalState as T, patches, inversePatches];
  }

  // Otherwise use craft for basic immutable update (faster)
  const finalState = craft(baseState, recipe as (draft: T) => T | undefined);
  return [finalState as T, [], []];
}
