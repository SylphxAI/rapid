#!/usr/bin/env node
/**
 * Test automatic emoji width detection
 */

import { terminalWidth } from './packages/zen-tui/dist/index.js';
import { getEmojiWidthProfile } from './packages/zen-tui/dist/utils/emoji-width-detector.js';

// Get detected profile
const profile = getEmojiWidthProfile();

const testCases = [
  { emoji: '🖥', desc: 'Desktop (no VS-16)' },
  { emoji: '🖥️', desc: 'Desktop (with VS-16)' },
  { emoji: '⚛', desc: 'Atom (no VS-16)' },
  { emoji: '⚛️', desc: 'Atom (with VS-16)' },
  { emoji: '$ neofetch 🖥️', desc: 'Full text with emoji' },
];

for (const { emoji, desc } of testCases) {
  const _width = terminalWidth(emoji);
}

if (!profile.vs16Supported) {
} else {
}
