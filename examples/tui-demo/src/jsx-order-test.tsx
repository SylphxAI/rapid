/** @jsxImportSource @zen/tui */
import { FocusProvider, renderApp} from '@zen/tui';
import { Box, Text } from '@zen/tui';

const Parent = (props: { children?: unknown }) => {
  return Box({ children: props.children });
};

const Child = () => {
  return Text({ children: 'Child content' });
};

const App = () => {
  return (
    <Parent>
      <Child />
    </Parent>
  );
};

await renderApp(() => <App />);

process.on('SIGINT', () => {
  process.exit(0);
});
