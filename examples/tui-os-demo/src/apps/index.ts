/**
 * App registry - Maps app names to components
 */

import { About } from './About.js';
import { Calculator } from './Calculator.js';
import { Files } from './Files.js';
import { Notepad } from './Notepad.js';
import { Settings } from './Settings.js';
import { Terminal } from './Terminal.js';

import type { TUINode } from '@rapid/tui';

export const apps: Record<string, () => TUINode> = {
  terminal: Terminal,
  calculator: Calculator,
  about: About,
  files: Files,
  settings: Settings,
  notepad: Notepad,
};

export { Terminal, Calculator, About, Files, Settings, Notepad };
