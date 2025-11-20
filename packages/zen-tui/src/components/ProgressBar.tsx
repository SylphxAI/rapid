/**
 * ProgressBar component for TUI
 *
 * Visual progress indicator with percentage display.
 */

import { type Signal, signal } from '@zen/runtime';
import type { TUINode } from '../types';
import { Box } from './Box';
import { Text } from './Text';

export interface ProgressBarProps {
  value: Signal<number> | number; // 0-100
  width?: number;
  showPercentage?: boolean;
  color?: string;
  completedColor?: string;
  label?: string | (() => string); // Support reactive labels
  char?: string; // Character to use for filled portion
}

export function ProgressBar(props: ProgressBarProps): TUINode {
  // Value management
  const valueSignal =
    typeof props.value === 'object' && 'value' in props.value
      ? props.value
      : signal(typeof props.value === 'number' ? props.value : 0);

  const width = props.width || 40;
  const showPercentage = props.showPercentage !== false; // default true
  const color = props.color || 'cyan';
  const completedColor = props.completedColor || 'green';
  const char = props.char || '█';

  const value = Math.min(100, Math.max(0, valueSignal.value)); // Clamp 0-100
  const isComplete = value >= 100;

  // Calculate bar segments
  const barWidth = showPercentage ? width - 7 : width - 2; // Account for borders and percentage
  const filledWidth = Math.round((value / 100) * barWidth);
  const emptyWidth = barWidth - filledWidth;

  const filledBar = char.repeat(filledWidth);
  const emptyBar = '░'.repeat(emptyWidth);

  const percentageText = showPercentage ? ` ${value.toFixed(0)}%` : '';

  const barContent = `${filledBar}${emptyBar}${percentageText}`;

  // Resolve label (support reactive functions)
  const labelText = typeof props.label === 'function' ? props.label() : props.label;

  return Box({
    style: {
      flexDirection: 'column',
      width: width,
    },
    children: [
      // Label (if provided)
      labelText
        ? Text({
            children: labelText,
            color: isComplete ? completedColor : color,
            bold: true,
          })
        : null,

      // Progress bar
      Box({
        style: {
          borderStyle: 'single',
          borderColor: isComplete ? completedColor : color,
          width: width,
        },
        children: Text({
          children: barContent,
          color: isComplete ? completedColor : color,
        }),
      }),
    ].filter(Boolean),
  });
}

/**
 * Increment progress value
 * Helper function to update progress
 */
export function incrementProgress(valueSignal: Signal<number>, amount = 1): void {
  valueSignal.value = Math.min(100, valueSignal.value + amount);
}

/**
 * Set progress value
 * Helper function to set progress to a specific value
 */
export function setProgress(valueSignal: Signal<number>, value: number): void {
  valueSignal.value = Math.min(100, Math.max(0, value));
}

/**
 * Reset progress to zero
 */
export function resetProgress(valueSignal: Signal<number>): void {
  valueSignal.value = 0;
}
