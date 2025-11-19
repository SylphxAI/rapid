/**
 * Router component for Zen framework
 * Powered by @zen/router
 */

import { $router, defineRoutes, startHistoryListener, stopHistoryListener } from '@zen/router';
import type { RouteConfig } from '@zen/router';
import { effect, untrack } from '@zen/signal';
import { disposeNode } from '../lifecycle.js';
import { onCleanup, onMount } from '../lifecycle.js';

export interface ZenRoute {
  path: string;
  component: () => Node;
}

interface RouterProps {
  routes: ZenRoute[];
  fallback?: () => Node;
}

/**
 * Router component - Client-side routing powered by @zen/router
 *
 * @example
 * ```tsx
 * <Router routes={[
 *   { path: '/', component: () => <Home /> },
 *   { path: '/users/:id', component: () => <UserProfile /> },
 *   { path: '/about', component: () => <About /> },
 * ]} fallback={() => <NotFound />} />
 * ```
 */
export function Router(props: RouterProps): Node {
  const { routes, fallback } = props;

  const marker = document.createComment('router');
  let currentNode: Node | null = null;
  let effectDispose: (() => void) | undefined;

  // Initialize router
  onMount(() => {
    // Convert ZenRoute to RouteConfig
    const routeConfigs: RouteConfig[] = routes.map((r) => ({
      path: r.path,
      component: r.component,
    }));

    defineRoutes(routeConfigs);
    startHistoryListener();

    // Set up effect after mount to ensure marker is in DOM
    effectDispose = effect(() => {
      const { path } = $router.value;

      // Cleanup previous node
      if (currentNode) {
        if (currentNode.parentNode) {
          currentNode.parentNode.removeChild(currentNode);
        }
        disposeNode(currentNode);
        currentNode = null;
      }

      // Find matching route
      const route = routes.find((r) => {
        // Simple path matching - @zen/router handles this internally
        // We just need to find the component for the matched route
        return r.path === path;
      });

      // Render new route
      currentNode = untrack(() => {
        if (route) {
          return route.component();
        }
        if (fallback) {
          return fallback();
        }
        return document.createTextNode('404 Not Found');
      });

      // Insert into DOM
      if (currentNode && marker.parentNode) {
        marker.parentNode.insertBefore(currentNode, marker);
      }

      return undefined;
    });

    // Cleanup on unmount
    onCleanup(() => {
      stopHistoryListener();
    });

    return undefined;
  });

  // Register cleanup via owner system
  onCleanup(() => {
    if (effectDispose) {
      effectDispose();
    }
    if (currentNode) {
      if (currentNode.parentNode) {
        currentNode.parentNode.removeChild(currentNode);
      }
      disposeNode(currentNode);
    }
  });

  return marker;
}
