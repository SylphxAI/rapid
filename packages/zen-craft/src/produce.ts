import { craft } from '@sylphx/craft';
import type { ProduceOptions, ProduceResult } from './types';
import { isDraftable } from './utils';

// Note: Patch generation is not currently supported by @sylphx/craft
// This implementation provides basic produce functionality without patches
// Patches will always be empty arrays

export function produce<T>(
  baseState: T,
  recipe: (draft: T) => undefined | void,
  options?: ProduceOptions,
): ProduceResult<T> {
  // Handle non-draftable state directly (no patches)
  if (!isDraftable(baseState)) {
    recipe(baseState as T);
    return [baseState as T, [], []];
  }

  // Use craft for the actual immutable update
  const finalState = craft(baseState, recipe as (draft: T) => T | void);

  // Note: Patch generation is not supported yet
  // If patches are requested, we return empty arrays
  // Future: Implement patch generation or use a plugin
  if (options?.patches || options?.inversePatches) {
    console.warn(
      'Patch generation is not currently supported. Returning empty patch arrays.',
    );
  }

  return [finalState as T, [], []];
}
