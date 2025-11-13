// Main entry point for the functional zen state management library.
// Minimal core - only essential features

// Core Types
export type { Listener, Unsubscribe, AnyZen, ZenValue } from './types';
import type { Zen as _Zen } from './zen';
export type Zen<T = unknown> = _Zen<T>;

// Other Types
export type { ReadonlyZen, ComputedZen } from './zen';

// Core Factories
import { computed as _computed, effect as _effect, zen as _zen } from './zen';
export const zen: typeof _zen = _zen;
export const computed: typeof _computed = _computed;
export const effect: typeof _effect = _effect;

// Core Functions
import {
  batch as _batch,
  batchDepth as _batchDepth,
  queueZenForBatch as _queueZenForBatch,
  subscribe as _subscribe,
} from './zen';
export const subscribe: typeof _subscribe = _subscribe;
export const batch: typeof _batch = _batch;
export const queueZenForBatch: typeof _queueZenForBatch = _queueZenForBatch;
export const batchDepth: typeof _batchDepth = _batchDepth;
