#!/usr/bin/env node
/**
 * Test TerminalBuffer with emoji to understand the issue
 */

import stringWidth from 'string-width';
import stripAnsi from 'strip-ansi';
import { TerminalBuffer } from './packages/zen-tui/dist/index.js';

const buffer = new TerminalBuffer(60, 10);

// Simulate the window rendering:
// 1. Draw borders at x=5, width=45
//    Left border at x=5, right border at x=49 (5 + 45 - 1)

// Draw left and right borders for line 1
buffer.writeAt(5, 1, '│', 1);
buffer.writeAt(49, 1, '│', 1);

// Write content with emoji at x=6 (inside the borders)
const content = '$ neofetch 🖥️';

// Write the content
buffer.writeAt(6, 1, content, 43);

// Get the rendered line
const line = buffer.getLine(1);

// Strip ANSI and check
const stripped = stripAnsi(line);

// Find borders
const leftBorder = stripped.indexOf('│');
const rightBorder = stripped.lastIndexOf('│');
const _distance = rightBorder - leftBorder;
const buffer2 = new TerminalBuffer(60, 10);
buffer2.writeAt(5, 1, '│', 1);
buffer2.writeAt(49, 1, '│', 1);
const content2 = '$ neofetch';

buffer2.writeAt(6, 1, content2, 43);
const line2 = buffer2.getLine(1);
const stripped2 = stripAnsi(line2);
const left2 = stripped2.indexOf('│');
const right2 = stripped2.lastIndexOf('│');
const _dist2 = right2 - left2;
