/**
 * Debug context owner setup
 */

import { createRoot, getOwner } from '@zen/signal';
import { createContext, useContext } from '@zen/tui';

const TestContext = createContext('default');

function Child() {
  const _owner = getOwner();
  const value = useContext(TestContext);
  return { type: 'text', children: [value] };
}

function App() {
  const _appOwner = getOwner();

  return TestContext.Provider({
    value: 'provided value',
    children: () => {
      const _childFnOwner = getOwner();
      return Child();
    },
  });
}
const _result1 = createRoot(() => {
  return App();
});
