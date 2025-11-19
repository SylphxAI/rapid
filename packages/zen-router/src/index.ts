// Entry point for @zen/zen-router

// TODO: Implement router logic inspired by @nanostores/router
// Goals: Tiny size, high performance, zen/FP principles

import { map } from '@zen/zen-patterns';
import type { MapStore } from '@zen/zen-patterns';

/** Route type placeholder (extend as needed) */
export type Route = string;
/** Params type placeholder (mapping of route params) */
export type Params<
  P extends Record<string, string | undefined> = Record<string, string | undefined>,
> = P;
/** Search type placeholder (mapping of query params) */
export type Search<
  S extends Record<string, string | undefined> = Record<string, string | undefined>,
> = S;

/** Represents the state of the router */
export interface RouterState {
  path: string;
  params: Params;
  search: Search;
}

// --- Public API ---

// Store
export const $router: MapStore<RouterState> = map({
  path: '',
  params: {},
  search: {},
});
// Functions
export { defineRoutes } from './routes';
export { open, redirect, startHistoryListener, stopHistoryListener } from './history';

// Types (already exported above)
// Types are exported via their declarations above
