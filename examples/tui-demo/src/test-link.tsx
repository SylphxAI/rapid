#!/usr/bin/env bun
/** @jsxImportSource @zen/tui */
/**
 * Test Link Component
 */

import { Box, Divider, Link, Text, renderToTerminalReactive } from '@zen/tui';

function App() {
  return (
    <Box style={{ flexDirection: 'column', padding: 1 }}>
      <Text bold color="cyan" style={{ marginBottom: 1 }}>
        Terminal Hyperlinks Demo
      </Text>

      <Text dim style={{ marginBottom: 1 }}>
        Click the links below (if your terminal supports OSC 8)
      </Text>

      <Divider padding={1} />

      <Box style={{ flexDirection: 'column', paddingLeft: 2 }}>
        <Text style={{ marginBottom: 1 }}>
          • <Link url="https://github.com/zenui/zen">GitHub Repository</Link>
        </Text>

        <Text style={{ marginBottom: 1 }}>
          • <Link url="https://zen.dev/docs">Documentation</Link>
        </Text>

        <Text style={{ marginBottom: 1 }}>
          • <Link url="https://www.npmjs.com/package/@zen/tui">NPM Package</Link>
        </Text>

        <Text style={{ marginBottom: 1 }}>
          •{' '}
          <Link url="https://discord.gg/zen" fallback={true}>
            Discord Community
          </Link>
        </Text>
      </Box>

      <Divider padding={1} />

      <Text dim style={{ marginTop: 1 }}>
        Supported terminals: iTerm2, Terminal.app (macOS 10.15+), VSCode, Windows Terminal
      </Text>

      <Text dim>Press Ctrl+C to exit</Text>
    </Box>
  );
}

await renderToTerminalReactive(() => <App />, { fps: 10 });
