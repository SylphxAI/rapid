// Export public API

// Types
export type { Patch } from './types';

// Primary API: Update Zen stores with draft-style mutations
export { craftZen as craft } from './zen';

// Re-export nothing symbol for property deletion
export { nothing } from '@sylphx/craft';

// Backward compatibility (deprecated, will be removed in v2.0)
/** @deprecated Use `craft` instead. Will be removed in v2.0 */
export { craftZen } from './zen';
/** @deprecated Use `craft` instead. Will be removed in v2.0 */
export { craftZen as update } from './zen';

// Note: Internal utilities are not exported
