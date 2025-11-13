// Main entry point for the functional zen state management library.
// Minimal core - only essential features

// Core Types
export type { Listener, Unsubscribe, AnyZen, ZenValue } from './types';
import type { Zen as _Zen } from './zen';
export type Zen<T = unknown> = _Zen<T>;

// Other Types - From optimized version
import type { AnyZen, ZenValue } from './zen-optimized';
export type { ReadonlyZen, ComputedZen } from './computed';

// Core Factories - ULTRA OPTIMIZED
import { zen as _zen, computed as _computed, effect as _effect, batch as _batch, subscribe as _subscribe } from './zen-optimized';
export const zen: typeof _zen = _zen;
export { computed } from './zen-optimized';
export { effect } from './zen-optimized';

// Core Functions - ULTRA OPTIMIZED
export const subscribe: typeof _subscribe = _subscribe;
export const batch: typeof _batch = _batch;

// Other Functions - Keep for compatibility
export { batchedUpdate } from './batchedUpdate';
export { batched } from './batched';
