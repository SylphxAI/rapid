/** @jsxImportSource @zen/tui */
/**
 * TreeView Component Test
 *
 * Test tree view with expand/collapse and navigation.
 * Run with: bun run src/test-treeview.tsx
 */

import { signal } from '@zen/signal';
import {
  Box, FocusProvider, Text, type TreeNode, TreeView, renderApp, FullscreenLayout} from '@zen/tui';

// Sample file tree structure
const fileTree: TreeNode[] = [
  {
    id: 'src', label: 'src', icon: '📁', defaultExpanded: true, children: [
      {
        id: 'components', label: 'components', icon: '📁', defaultExpanded: true, children: [
          { id: 'box', label: 'Box.tsx', icon: '📄' }, { id: 'text', label: 'Text.tsx', icon: '📄' }, { id: 'button', label: 'Button.tsx', icon: '📄' }, { id: 'treeview', label: 'TreeView.tsx', icon: '📄' }, ]}, {
        id: 'hooks', label: 'hooks', icon: '📁', children: [
          { id: 'useFocus', label: 'useFocus.ts', icon: '📄' }, { id: 'useInput', label: 'useInput.ts', icon: '📄' }, { id: 'useMouse', label: 'useMouse.ts', icon: '📄' }, ]}, { id: 'index', label: 'index.ts', icon: '📄' }, { id: 'types', label: 'types.ts', icon: '📄' }, ]}, {
    id: 'tests', label: 'tests', icon: '📁', children: [
      { id: 'test1', label: 'Box.test.tsx', icon: '🧪' }, { id: 'test2', label: 'Text.test.tsx', icon: '🧪' }, ]}, {
    id: 'config', label: 'config', icon: '⚙️', children: [
      { id: 'tsconfig', label: 'tsconfig.json', icon: '📋' }, { id: 'package', label: 'package.json', icon: '📋' }, ]}, { id: 'readme', label: 'README.md', icon: '📝' }, ];

function TreeViewDemo() {
  const selectedNode = signal<string>('(none)');
  const lastAction = signal<string>('');

  return (
    <FocusProvider>
      <Box style={{ flexDirection: 'column', padding: 1, gap: 1 }}>
        <Text style={{ bold: true, color: 'cyan' }}>TreeView Component Demo</Text>
        <Text style={{ dim: true }}>
          Arrow keys: navigate | Space/Enter: expand/collapse | Enter on leaf: select
        </Text>
        <Text> </Text>

        <Box style={{ flexDirection: 'row', gap: 2 }}>
          {/* Tree View */}
          <Box style={{ flexDirection: 'column', borderStyle: 'single', padding: 1 }}>
            <TreeView
              nodes={fileTree}
              onSelect={(node) => {
                selectedNode.value = node.label;
                lastAction.value = `Selected: ${node.label}`;
              }}
              onToggle={(node, expanded) => {
                lastAction.value = `${expanded ? 'Expanded' : 'Collapsed'}: ${node.label}`;
              }}
              showLines={true}
            />
          </Box>

          {/* Info panel */}
          <Box style={{ flexDirection: 'column', width: 30 }}>
            <Text style={{ bold: true }}>Info:</Text>
            <Text>Selected: {() => selectedNode.value}</Text>
            <Text>Action: {() => lastAction.value}</Text>
          </Box>
        </Box>

        <Text> </Text>
        <Text style={{ dim: true }}>Press 'q' to quit</Text>
      </Box>
    </FocusProvider>
  );
}

await renderApp(() => (
  <FullscreenLayout>
    <TreeViewDemo />
  </FullscreenLayout>
));
