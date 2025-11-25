#!/usr/bin/env node

const emojis = [
  { emoji: '🖥', desc: 'Desktop (no VS-16)', codepoints: 'U+1F5A5' },
  { emoji: '🖥️', desc: 'Desktop (with VS-16)', codepoints: 'U+1F5A5 U+FE0F' },
  { emoji: '⚛', desc: 'Atom (no VS-16)', codepoints: 'U+269B' },
  { emoji: '⚛️', desc: 'Atom (with VS-16)', codepoints: 'U+269B U+FE0F' },
  { emoji: '☢', desc: 'Radioactive (no VS-16)', codepoints: 'U+2622' },
  { emoji: '☢️', desc: 'Radioactive (with VS-16)', codepoints: 'U+2622 U+FE0F' },
];

for (const { emoji, desc, codepoints } of emojis) {
  // Create a line with emoji and right border at column 40
  const content = `${emoji} ${desc}`;
  const _padding = ' '.repeat(Math.max(0, 35 - content.length));
}
