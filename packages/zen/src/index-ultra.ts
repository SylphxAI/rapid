/**
 * Zen Ultra - Maximum Performance Reactivity
 * BREAKING: No auto-batching, manual batch() required for glitch-free updates
 * BENEFIT: 10-60x faster than regular Zen
 */

// Core Types
export type { Listener, Unsubscribe, AnyZen } from './zen-ultra';

// Core Primitives
export {
  zen,
  computed,
  batch,
  subscribe,
  effect,
  notifyListeners,
  queueZenForBatch,
  batchDepth,
} from './zen-ultra';

export type { Zen, ReadonlyZen, ComputedZen } from './zen-ultra';
