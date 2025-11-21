import { Text, renderToTerminal } from '@zen/tui';

const Demo = () => (
  <>
    <Text color="cyan" bold>
      This should be cyan and bold
    </Text>
    <Text color="green">This should be green</Text>
    <Text color="yellow">This should be yellow</Text>
  </>
);

await renderToTerminal(<Demo />);
