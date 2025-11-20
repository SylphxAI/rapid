/**
 * Test interactive demo rendering by taking a screenshot
 */

import { createRoot } from '@zen/signal';
import { render } from '@zen/tui';
import { App } from './interactive-demo-app.tsx';
const tree = createRoot(() => App());
const _output = render(tree);
