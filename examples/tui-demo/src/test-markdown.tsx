/** @jsxImportSource @zen/tui */
/**
 * Markdown Renderer Test
 *
 * Test markdown rendering with various elements.
 * Run with: bun run src/test-markdown.tsx
 */

import { Box, Markdown, Text, renderApp, FullscreenLayout} from '@zen/tui';

const sampleMarkdown = `# Welcome to Zen TUI

This is a **Markdown renderer** for terminal user interfaces.

## Features

Here are the supported features:

- **Bold text** with double asterisks
- *Italic text* with single asterisks
- \`inline code\` with backticks
- [Links](https://github.com) with brackets

### Code Blocks

\`\`\`typescript
function hello() {
  console.log("Hello, World!");
}
\`\`\`

### Lists

Ordered list:
1. First item
2. Second item
3. Third item

Unordered list:
- Apple
- Banana
- Cherry

### Blockquotes

> This is a blockquote.
> It can span multiple lines.

---

## More Examples

This paragraph contains **bold**, *italic*, and \`code\`.

Check out the [documentation](https://example.com/docs) for more information.
`;

function MarkdownDemo() {
  return (
    <Box style={{ flexDirection: 'column', padding: 1 }}>
      <Markdown content={sampleMarkdown} />
      <Text> </Text>
      <Text style={{ dim: true }}>Press 'q' to quit</Text>
    </Box>
  );
}

await renderApp(() => (
  <FullscreenLayout>
    <MarkdownDemo />
  </FullscreenLayout>
));
