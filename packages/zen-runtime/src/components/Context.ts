/**
 * ZenJS Context API
 *
 * Provides a way to pass data through the component tree
 * without having to pass props down manually at every level.
 *
 * Similar to React's Context API and SolidJS's Context API.
 */

import { getNodeOwner, getOwner } from '@zen/signal';
import { getPlatformOps } from '../platform-ops.js';

/**
 * Context object that holds the default value
 */
export interface Context<T> {
  id: symbol;
  defaultValue: T;
  Provider: (props: { value: T; children: any | any[] }) => any;
}

/**
 * Internal storage for context values
 * Maps context ID to value, stored per owner
 */
const contextMap = new WeakMap<any, Map<symbol, any>>();

/**
 * Creates a new context with an optional default value
 *
 * @example
 * ```tsx
 * const ThemeContext = createContext({ color: 'blue' });
 *
 * function App() {
 *   return (
 *     <ThemeContext.Provider value={{ color: 'red' }}>
 *       <Child />
 *     </ThemeContext.Provider>
 *   );
 * }
 *
 * function Child() {
 *   const theme = useContext(ThemeContext);
 *   return <div style={{ color: theme.color }}>Hello</div>;
 * }
 * ```
 */
export function createContext<T>(defaultValue: T): Context<T> {
  const context: Context<T> = {
    id: Symbol('context'),
    defaultValue,
    Provider: (props: { value: T; children: any | any[] }) => {
      return Provider(context, props);
    },
  };
  return context;
}

/**
 * Retrieves the value of a context from the nearest Provider
 *
 * @param context The context object created by createContext
 * @returns The context value, or the default value if no Provider is found
 *
 * @example
 * ```tsx
 * function Component() {
 *   const theme = useContext(ThemeContext);
 *   return <div style={{ color: theme.color }}>Hello</div>;
 * }
 * ```
 */
export function useContext<T>(context: Context<T>): T {
  let owner = getOwner();

  // Walk up the owner tree to find the context value
  while (owner) {
    const values = contextMap.get(owner);
    if (values?.has(context.id)) {
      return values.get(context.id) as T;
    }
    owner = owner.parent;
  }

  // No provider found, return default value
  return context.defaultValue;
}

/**
 * Provider component that makes a context value available to descendants
 *
 * @example
 * ```tsx
 * const ThemeContext = createContext({ color: 'blue' });
 *
 * function App() {
 *   return (
 *     <ThemeContext.Provider value={{ color: 'red' }}>
 *       <Child />
 *     </ThemeContext.Provider>
 *   );
 * }
 * ```
 */
export function Provider<T>(context: Context<T>, props: { value: T; children: any | any[] }): any {
  const owner = getOwner();

  if (!owner) {
    throw new Error('Provider must be used within a component');
  }

  // Store context in Provider's own owner FIRST, before accessing children.
  // With lazy children (via Babel transform getter), children evaluate ONLY
  // when accessed. We must store the context before accessing props.children
  // so that when children evaluate, they can find the context value.
  //
  // Owner tree (with lazy children):
  //   App (owner)
  //   └─ Provider (owner, parent: App) <- stores context HERE
  //      └─ Children (owner, parent: Provider) <- searches up to Provider, finds context!
  let values = contextMap.get(owner);
  if (!values) {
    values = new Map();
    contextMap.set(owner, values);
  }
  values.set(context.id, props.value);

  // NOW access children (triggers lazy evaluation)
  const children = props.children;

  // Get platform operations
  const ops = getPlatformOps();

  // Return children as a fragment
  const childArray = Array.isArray(children) ? children : [children];
  const fragment = ops.createFragment();
  for (const child of childArray) {
    if (child) {
      ops.appendToFragment(fragment, child);
    }
  }

  return fragment;
}
