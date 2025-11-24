#!/usr/bin/env node
/**
 * Test TerminalBuffer with emoji to understand the issue
 */

import { TerminalBuffer } from './packages/zen-tui/dist/index.js';
import stripAnsi from 'strip-ansi';
import stringWidth from 'string-width';

const buffer = new TerminalBuffer(60, 10);

// Simulate the window rendering:
// 1. Draw borders at x=5, width=45
//    Left border at x=5, right border at x=49 (5 + 45 - 1)

// Draw left and right borders for line 1
buffer.writeAt(5, 1, '│', 1);
buffer.writeAt(49, 1, '│', 1);

// Write content with emoji at x=6 (inside the borders)
const content = '$ neofetch 🖥️';
console.log('Content:', content);
console.log('Content string length:', content.length);
console.log('Content visual width:', stringWidth(content));

// Write the content
buffer.writeAt(6, 1, content, 43);

// Get the rendered line
const line = buffer.getLine(1);
console.log('\nRendered line (with ANSI):');
console.log(JSON.stringify(line));

// Strip ANSI and check
const stripped = stripAnsi(line);
console.log('\nStripped line:');
console.log(JSON.stringify(stripped));
console.log('Stripped length:', stripped.length);

// Find borders
const leftBorder = stripped.indexOf('│');
const rightBorder = stripped.lastIndexOf('│');
const distance = rightBorder - leftBorder;

console.log('\nBorder positions:');
console.log('Left border at index:', leftBorder);
console.log('Right border at index:', rightBorder);
console.log('Distance:', distance);

// Now test WITHOUT emoji
console.log('\n\n=== TEST WITHOUT EMOJI ===');
const buffer2 = new TerminalBuffer(60, 10);
buffer2.writeAt(5, 1, '│', 1);
buffer2.writeAt(49, 1, '│', 1);
const content2 = '$ neofetch';
console.log('Content:', content2);
console.log('Content string length:', content2.length);
console.log('Content visual width:', stringWidth(content2));

buffer2.writeAt(6, 1, content2, 43);
const line2 = buffer2.getLine(1);
const stripped2 = stripAnsi(line2);
console.log('\nStripped line:');
console.log(JSON.stringify(stripped2));
const left2 = stripped2.indexOf('│');
const right2 = stripped2.lastIndexOf('│');
const dist2 = right2 - left2;
console.log('Border distance:', dist2);
console.log('Difference from emoji version:', distance - dist2);
