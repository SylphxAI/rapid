#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import stringWidth from 'string-width';
import stripAnsi from 'strip-ansi';

const line = readFileSync('/tmp/emoji-line.txt', 'utf8');
const stripped = stripAnsi(line);

// Find borders
let visualPos = 0;
let leftBorderPos = -1;
let rightBorderPos = -1;

for (const char of stripped) {
  if (char === '│') {
    if (leftBorderPos === -1) {
      leftBorderPos = visualPos;
    } else {
      rightBorderPos = visualPos;
    }
  }
  visualPos += stringWidth(char);
}

const distance = rightBorderPos - leftBorderPos;

if (distance === 44) {
} else {
}

// Also check content width
const leftIdx = stripped.indexOf('│');
const rightIdx = stripped.lastIndexOf('│');
const _content = stripped.substring(leftIdx + 1, rightIdx);
