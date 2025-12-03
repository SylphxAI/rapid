import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { useApp } from './useApp';

describe('useApp', () => {
  let exitSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Mock process.exit to prevent actually exiting during tests
    exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {}) as any);
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    exitSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it('should return exit function', () => {
    const { exit } = useApp();

    expect(exit).toBeDefined();
    expect(typeof exit).toBe('function');
  });

  it('should exit with code 0 when no error provided', () => {
    const { exit } = useApp();

    exit();

    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  it('should exit with code 1 when error provided', () => {
    const { exit } = useApp();
    const error = new Error('Test error');

    exit(error);

    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('should log error message to stderr when error provided', () => {
    const { exit } = useApp();
    const error = new Error('Test error message');

    exit(error);

    expect(consoleErrorSpy).toHaveBeenCalledWith('Test error message');
  });

  it('should not log anything when exiting normally', () => {
    const { exit } = useApp();

    exit();

    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it('should handle error without message', () => {
    const { exit } = useApp();
    const error = new Error();

    exit(error);

    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it('should be callable multiple times (returns new instance)', () => {
    const app1 = useApp();
    const app2 = useApp();

    expect(app1.exit).toBeDefined();
    expect(app2.exit).toBeDefined();
  });
});
