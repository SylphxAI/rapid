/**
 * @zen/signal-vue
 *
 * Vue integration for Zen Signals
 * Provides signal primitives with Vue lifecycle integration
 */

// Re-export all signal primitives from core
export {
  signal,
  computed,
  effect,
  batch,
  untrack,
  peek,
  subscribe,
} from '@zen/signal';

// Re-export types
export type { Signal, Computed } from '@zen/signal';
