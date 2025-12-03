/**
 * @rapid/tui-router - Router components for @rapid/tui
 *
 * Client-side routing for terminal UIs powered by @rapid/router-core.
 */

export { Router, type TUIRoute, type RouterProps } from './Router.js';
export { RouterLink, type RouterLinkProps } from './RouterLink.js';

// Re-export @rapid/router-core primitives for convenience
export {
  $router,
  defineRoutes,
  startHistoryListener,
  stopHistoryListener,
  open,
  back,
  forward,
  replace,
  type RouteConfig,
  type RouterState,
} from '@rapid/router-core';
