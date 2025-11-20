/**
 * Verify signal syntax behavior without TUI rendering
 */

import { effect, signal } from '@zen/tui';

const count = signal(0);

// Test 1: Direct access to count.value
const _initialValue = count.value;

// Test 2: In effect with direct signal
effect(() => {});

// Test 3: In effect with function
effect(() => {});
count.value = 5;
