/**
 * Debug context owner setup
 */

import { createRoot, getOwner } from '@zen/signal';
import { createContext, useContext } from '@zen/tui';

const TestContext = createContext('default');

function Child() {
  const owner = getOwner();
  console.log('[Child] owner:', owner);
  console.log('[Child] owner.parent:', owner?.parent);
  const value = useContext(TestContext);
  console.log('[Child] useContext result:', value);
  return { type: 'text', children: [value] };
}

function App() {
  const appOwner = getOwner();
  console.log('[App] owner:', appOwner);

  return TestContext.Provider({
    value: 'provided value',
    children: () => {
      const childFnOwner = getOwner();
      console.log('[Children function] owner:', childFnOwner);
      console.log('[Children function] parent is App?', childFnOwner?.parent === appOwner);
      return Child();
    }
  });
}

console.log('=== Test 1: With createRoot ===');
const result1 = createRoot(() => {
  console.log('[createRoot fn] getOwner():', getOwner());
  return App();
});

console.log('\nResult:', result1);
