/** @jsxImportSource @rapid/tui */
/**
 * Notepad App - Simple text editor using TextArea
 *
 * Uses TextArea component (simple text input, no line numbers by default)
 * For code editing with line numbers, see TextEditor which uses CodeEditor.
 */

import { Box, Text, signal } from '@rapid/tui';
import { TextArea } from '@rapid/tui-advanced';

export function Notepad() {
  const content = signal(`Welcome to ZenOS Notepad!

This is a simple text editor using TextArea.

Features:
- Multi-line text editing
- Soft text wrapping
- Cursor navigation
- No line numbers (simple notepad style)

Try typing and see soft wrapping in action with a very long line that should wrap automatically to the next visual line when it exceeds the column width.`);

  const lineCount = () => content.value.split('\n').length;
  const charCount = () => content.value.length;

  return (
    <Box style={{ flexDirection: 'column', width: '100%', height: '100%' }}>
      {/* Toolbar */}
      <Box style={{ backgroundColor: 'gray', paddingLeft: 1, paddingRight: 1, gap: 2 }}>
        <Text style={{ color: 'white' }}>File</Text>
        <Text style={{ color: 'white' }}>Edit</Text>
        <Text style={{ color: 'white' }}>View</Text>
        <Text style={{ color: 'white' }}>Help</Text>
      </Box>

      {/* Editor Area - TextArea component */}
      <Box style={{ flexGrow: 1, padding: 1 }}>
        <TextArea
          value={content.value}
          onChange={(v) => {
            content.value = v;
          }}
          rows={12}
          cols={45}
          wrap={true}
          border={true}
          placeholder="Start typing..."
        />
      </Box>

      {/* Status Bar */}
      <Box
        style={{
          backgroundColor: 'blue',
          paddingLeft: 1,
          paddingRight: 1,
          justifyContent: 'space-between',
        }}
      >
        <Text style={{ color: 'white' }}>Notepad (TextArea)</Text>
        <Text style={{ color: 'white' }}>
          {() => `Lines: ${lineCount()} | Chars: ${charCount()}`}
        </Text>
      </Box>
    </Box>
  );
}
