/**
 * lazy - Code splitting utility
 *
 * Dynamically import components for code splitting.
 * Works with Suspense to show fallback during loading.
 *
 * @example
 * ```tsx
 * const Heavy = lazy(() => import('./HeavyComponent'));
 *
 * <Suspense fallback={<Loading />}>
 *   <Heavy />
 * </Suspense>
 * ```
 */

import { signal } from '@zen/signal';

type Component<P = any> = (props: P) => Node;
type ComponentModule<P = any> = { default: Component<P> };

/**
 * Lazy load a component
 */
export function lazy<P = any>(
  loader: () => Promise<ComponentModule<P>>
): Component<P> {
  // Track loading state
  const module = signal<ComponentModule<P> | null>(null);
  const loading = signal(true);
  const error = signal<Error | null>(null);

  // Start loading immediately
  loader()
    .then((mod) => {
      module.value = mod;
      loading.value = false;
    })
    .catch((err) => {
      error.value = err instanceof Error ? err : new Error(String(err));
      loading.value = false;
    });

  // Return a component that renders the loaded module
  return (props: P) => {
    // If still loading, return placeholder comment
    // Suspense will handle showing fallback
    if (loading.value) {
      const comment = document.createComment('lazy-loading');
      // Attach loading state for Suspense to detect
      (comment as any)._zenLazyLoading = true;
      return comment;
    }

    // If error, throw for ErrorBoundary
    if (error.value) {
      throw error.value;
    }

    // Render loaded component
    const mod = module.value;
    if (!mod) {
      throw new Error('Lazy component failed to load');
    }

    return mod.default(props);
  };
}
