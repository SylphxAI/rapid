/**
 * ZenJS - Ultra-fast, ultra-lightweight reactive framework
 *
 * Beyond SolidJS in performance and simplicity.
 * Powered by @zen/signal reactive core.
 */

// Import JSX types (global augmentation)
import './jsx-types.js';

// Import raw primitives from @zen/signal
import {
  signal as rawSignal,
  computed as rawComputed,
  effect as rawEffect,
  batch,
  untrack,
  peek,
  subscribe,
} from '@zen/signal';
import type { Signal, Computed } from '@zen/signal';
import { getOwner, onCleanup } from './lifecycle.js';

// ============================================================================
// LIFECYCLE-AWARE EFFECT
// ============================================================================

/**
 * Lifecycle-aware effect that automatically registers cleanup with owner system.
 *
 * When used inside a Zen component, cleanup is automatic.
 * When used outside components, behaves like raw effect.
 *
 * @example
 * ```tsx
 * function Component() {
 *   effect(() => {
 *     console.log('Effect running');
 *     return () => console.log('Cleanup automatically registered');
 *   });
 * }
 * ```
 */
export function effect(callback: () => undefined | (() => void)): () => void {
  const dispose = rawEffect(callback);

  // If we have an owner context, register cleanup automatically
  const owner = getOwner();
  if (owner) {
    onCleanup(dispose);
  }

  return dispose;
}

// Re-export primitives (signal and computed don't need lifecycle awareness)
export const signal = rawSignal;
export const computed = rawComputed;
export { batch, untrack, peek, subscribe };

// Export raw effect for advanced users who want manual control
export { rawEffect };

// Components
export { For } from './components/For.js';
export { Show } from './components/Show.js';
export { Switch, Match } from './components/Switch.js';
export { Portal } from './components/Portal.js';
export { ErrorBoundary } from './components/ErrorBoundary.js';
export { Suspense } from './components/Suspense.js';
export { Dynamic } from './components/Dynamic.js';

// Context API
export { createContext, useContext } from './components/Context.js';
export type { Context } from './components/Context.js';

// JSX
export { render, Fragment } from './jsx-runtime.js';

// Lifecycle
export {
  onMount,
  onCleanup,
  createRoot,
  disposeNode,
  getOwner,
} from './lifecycle.js';
export type { Owner } from './lifecycle.js';

// createEffect removed - use effect() instead which auto-registers cleanup

// Utilities
export { lazy } from './lazy.js';

// Reactive utilities
export { resolve, isSignal } from './reactive-utils.js';
export type { Reactive, MaybeReactive } from './reactive-utils.js';
export { mergeProps, splitProps } from './utils/props.js';
export { selector } from './utils/selector.js';
export { runWithOwner } from './utils/runWithOwner.js';

// Server utilities
export { isServer, createUniqueId, setServerIdPrefix, resetIdCounter } from './server-utils.js';

// Types
export type { Signal, Computed } from '@zen/signal';
