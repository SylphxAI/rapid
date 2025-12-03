/**
 * Common utilities shared across transformers
 * Eliminates code duplication and provides consistent behavior
 */

/**
 * Information about a signal variable with its position
 */
export interface SignalInfo {
  name: string;
  start: number;
  end: number;
}

/**
 * Signal usage tracking
 */
export interface SignalUsage {
  name: string;
  positions: number[];
  declarationEnd?: number;
}

/**
 * Find all signal variables in code
 * Matches: const variableName = signal(...)
 */
export function findSignalVariables(code: string): Set<string> {
  const signals = new Set<string>();
  const regex = /const\s+(\w+)\s*=\s*signal\(/g;
  const matches = code.matchAll(regex);

  for (const match of matches) {
    if (match[1]) signals.add(match[1]);
  }

  return signals;
}

/**
 * Find signal variables with their positions in code
 * Returns Map of signal name to position info
 */
export function findSignalVariablesWithPositions(code: string): Map<string, SignalInfo> {
  const signals = new Map<string, SignalInfo>();
  const regex = /const\s+(\w+)\s*=\s*signal\(/g;
  const matches = code.matchAll(regex);

  for (const match of matches) {
    const name = match[1];
    if (!name) continue;
    const start = match.index ?? 0;
    const end = start + match[0].length;
    signals.set(name, { name, start, end });
  }

  return signals;
}

/**
 * Create a logger function for debug mode
 */
export function createLogger(enabled: boolean) {
  return (_message: string, ..._args: unknown[]) => {
    if (enabled) {
    }
  };
}

/**
 * Check if a string is a valid signal variable name
 */
export function isValidSignalName(name: string): boolean {
  return /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(name);
}
